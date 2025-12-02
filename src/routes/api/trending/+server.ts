import { json } from '@sveltejs/kit';
import { spotifyGet } from '$lib/server/spotify';

export async function GET() {
	try {
		// Fetch popular/featured playlists to get trending content
		const featured = await spotifyGet<any>(
			'/browse/featured-playlists?limit=5&market=US'
		);

		// Get new releases (trending albums)
		const newReleases = await spotifyGet<any>(
			'/browse/new-releases?limit=20&market=US'
		);

		const albums = newReleases?.albums?.items ?? [];

		// Get a list of popular artists by searching for trending genres
		const popularArtists = await spotifyGet<any>(
			'/search?q=genre:pop&type=artist&limit=20&market=US'
		);

		const artists = popularArtists?.artists?.items ?? [];

		// Combine and shuffle to make it feel fresh
		const trendingAlbums = albums.slice(0, 15);
		const trendingArtists = artists.slice(0, 15);

		return json({
			albums: trendingAlbums,
			artists: trendingArtists,
			featured: featured?.playlists?.items ?? []
		});
	} catch (error) {
		console.error('Trending API error:', error);
		return json({ error: 'Failed to fetch trending', albums: [], artists: [], featured: [] }, { status: 500 });
	}
}
