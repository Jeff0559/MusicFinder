import { json } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';

interface SpotifyArtistResponse {
	id: string;
	name: string;
	genres: string[];
	popularity: number;
	followers?: {
		total: number;
	};
	images?: Array<{
		url: string;
		height?: number;
		width?: number;
	}>;
}

export async function GET({ params }) {
	const artistId = params.id;

	if (!artistId) {
		return json({ error: 'artistId required' }, { status: 400 });
	}

	try {
		const artist = await spotifyGet<SpotifyArtistResponse>(
			`/artists/${artistId}`
		);

		return json(artist, { status: 200 });
	} catch (err: any) {
		console.error('Failed to fetch artist info:', err);
		return json({ error: err.message }, { status: 500 });
	}
}
