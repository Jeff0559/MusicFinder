import { json, error } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getReviewsCollection } from '$lib/server/mongo';
import type { RequestHandler } from './$types';

const toResponse = (doc: any) => ({
	id: doc._id?.toString?.() ?? '',
	trackName: doc.trackName,
	artist: doc.artist,
	album: doc.album,
	rating: doc.rating,
	notes: doc.notes,
	createdAt:
		doc.createdAt instanceof Date
			? doc.createdAt.toISOString()
			: new Date(doc.createdAt ?? Date.now()).toISOString()
});

const MOCK_REVIEWS = [
	{
		id: 'mock-1',
		trackName: 'Mock Track',
		artist: 'Mock Artist',
		album: 'Mock Album',
		rating: 4,
		notes: 'Lokaler Mock, da DB nicht erreichbar.',
		createdAt: new Date().toISOString()
	}
];

async function tryGetCollection() {
	try {
		return await getReviewsCollection();
	} catch (err) {
		console.error('[user-reviews] DB connection failed', err);
		return null;
	}
}

export const GET: RequestHandler = async () => {
	const col = await tryGetCollection();
	if (!col) {
		return json({ reviews: MOCK_REVIEWS, note: 'DB nicht erreichbar (Mock-Fallback)' });
	}

	const docs = await col.find().sort({ createdAt: -1 }).limit(200).toArray();
	return json({ reviews: docs.map(toResponse) });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const trackName = body?.trackName?.trim?.();
	const artist = body?.artist?.trim?.();
	const album = body?.album?.trim?.();
	const ratingValue = Number(body?.rating ?? 0);
	const notes = (body?.notes ?? '').toString().trim();

	if (!trackName || !artist || !album) {
		return json({ error: 'trackName, artist und album sind erforderlich' }, { status: 400 });
	}

	const col = await tryGetCollection();
	if (!col) {
		return json({ error: 'DB nicht erreichbar, Review nicht gespeichert (Mock-Fallback aktiv).' });
	}

	const rating = Number.isFinite(ratingValue) ? Math.max(0, Math.min(5, ratingValue)) : 0;

	const doc = {
		trackName,
		artist,
		album,
		rating,
		notes,
		createdAt: new Date()
	};

	const res = await col.insertOne(doc);

	return json({ review: { ...toResponse(doc), id: res.insertedId.toString() } }, { status: 201 });
};

export const DELETE: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) {
		return json({ error: 'id fehlt' }, { status: 400 });
	}

	let objectId: ObjectId;
	try {
		objectId = new ObjectId(id);
	} catch {
		throw error(400, 'ungueltige id');
	}

	const col = await tryGetCollection();
	if (!col) {
		return json({ error: 'DB nicht erreichbar, nichts geloescht (Mock-Fallback aktiv).' });
	}

	const res = await col.deleteOne({ _id: objectId });

	if (!res.acknowledged) {
		throw error(500, 'Loeschen fehlgeschlagen');
	}

	return json({ ok: true });
};
