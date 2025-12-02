import { json } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';
import type { SpotifyTrack } from '$lib/types';

interface SpotifyTopTracksResponse {
	tracks: SpotifyTrack[];
}

export async function GET({ params, url }) {
	const artistId = params.id;
	const market = url.searchParams.get('market') ?? 'US';

	if (!artistId) {
		return json({ error: 'artistId required' }, { status: 400 });
	}

	try {
		const response = await spotifyGet<SpotifyTopTracksResponse>(
			`/artists/${artistId}/top-tracks?market=${market}`
		);

		const tracks = response?.tracks ?? [];
		return json(tracks, { status: 200 });
	} catch (err: any) {
		console.error('Failed to fetch artist top tracks:', err);
		return json({ error: err.message }, { status: 500 });
	}
}
