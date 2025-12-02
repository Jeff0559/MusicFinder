import { json } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';
import type { SpotifyAlbum } from '$lib/types';

export async function GET({ params, url }) {
	const artistId = params.artistId;
	const limit = url.searchParams.get('limit') ?? '20';

	if (!artistId) {
		return json({ error: 'artistId required' }, { status: 400 });
	}

	try {
		const albums = await spotifyGet<{ items: SpotifyAlbum[] }>(
			`/artists/${artistId}/albums?include_groups=album,single,appears_on,compilation&market=US&limit=${limit}`
		);

		if (!albums || !Array.isArray(albums.items)) {
			return json([], { status: 200 });
		}

		// Duplikate nach Album-Name (case-insensitive) entfernen
		const seen = new Set<string>();
		const deduplicated = albums.items.filter((album: SpotifyAlbum) => {
			const key = (album.name || '').toLowerCase();
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});

		return json(deduplicated, { status: 200 });
	} catch (err: any) {
		console.error('Failed to fetch albums:', err);
		return json({ error: err.message }, { status: 500 });
	}
}
