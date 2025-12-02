import { json } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';
import type { AlbumDetailsResponse } from '$lib/types';

export async function GET({ params }) {
	const albumId = params.id;

	if (!albumId) {
		return json({ error: 'albumId required' }, { status: 400 });
	}

	try {
		const album = await spotifyGet<AlbumDetailsResponse>(
			`/albums/${albumId}`
		);

		return json(album, { status: 200 });
	} catch (err: any) {
		console.error('Failed to fetch album details:', err);
		return json({ error: err.message }, { status: 500 });
	}
}
