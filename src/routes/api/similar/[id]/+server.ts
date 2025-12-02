// GET /api/similar/:id

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spotifyGet } from '$lib/server/spotify';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Track ID is required' }, { status: 400 });
		}

		// Get recommendations based on the seed track
		console.log("SIMILAR ID =", id);
		const recommendations = await spotifyGet(
			`/recommendations?seed_tracks=${id}&limit=20&market=US`
		);

		return json(recommendations);
	} catch (error) {
		console.error('Similar tracks error:', error);
		return json({ error: 'Failed to get similar tracks' }, { status: 500 });
	}
};
