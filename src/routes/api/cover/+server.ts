import { spotifyGet } from '$lib/server/spotify';

export const GET = async ({ url }) => {
  const q = url.searchParams.get('q');
  if (!q) return new Response(JSON.stringify({ image: null }));

  try {
    const params = new URLSearchParams({
      q,
      type: 'track,album,artist',
      limit: '1'
    });

    const data = await spotifyGet(`/search?${params.toString()}`);

    const track = data.tracks?.items?.[0];
    const album = data.albums?.items?.[0];
    const artist = data.artists?.items?.[0];

    const image =
      track?.album?.images?.[0]?.url ||
      album?.images?.[0]?.url ||
      artist?.images?.[0]?.url ||
      null;

    return new Response(JSON.stringify({ image }));
  } catch (e) {
    console.error('Cover API error', e);
    return new Response(JSON.stringify({ image: null }), { status: 500 });
  }
};
