// GET /api/features/:id

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { spotifyGet } from '$lib/server/spotify';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Track ID is required' }, { status: 400 });
		}

		// Get audio features for the track
		console.log("FEATURE ID =", id);
		const features = await spotifyGet(`/audio-features/${id}`);

		return json(features);
	} catch (error) {
		console.error('Audio features error:', error);
		return json({ error: 'Failed to get audio features' }, { status: 500 });
	}
};
