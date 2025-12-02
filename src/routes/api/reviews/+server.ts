import type { RequestHandler } from '@sveltejs/kit';

const UA = 'MusicFinder/1.0 (info@musicfinder.example.com)';

async function mbFetch(path: string) {
  const r = await fetch(`https://musicbrainz.org${path}`, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const artist = url.searchParams.get('artist')?.trim();
    const album  = (url.searchParams.get('album') ?? url.searchParams.get('release'))?.trim();
    
    if (!artist || !album) {
      return new Response(JSON.stringify({ error: 'artist & album required' }), { status: 400 });
    }

    console.log(`[Reviews API] Searching: artist="${artist}", album="${album}"`);

    // 1) Release-Group query (exact)
    let mbid: string | null = null;
    try {
      const q1 = encodeURIComponent(`artist:"${artist}" AND release:"${album}"`);
      const mb1 = await mbFetch(`/ws/2/release-group/?query=${q1}&fmt=json&limit=1`);
      mbid = mb1?.['release-groups']?.[0]?.id ?? null;
      if (mbid) console.log(`[Reviews API] Found release-group MBID: ${mbid}`);
    } catch (e) {
      console.log(`[Reviews API] release-group query failed: ${(e as Error).message}`);
    }

    // 2) Fallback: releases (different spelling)
    if (!mbid) {
      try {
        const q2 = encodeURIComponent(`artist:"${artist}" AND release:"${album}"`);
        const mb2 = await mbFetch(`/ws/2/release/?query=${q2}&fmt=json&limit=1`);
        mbid = mb2?.releases?.[0]?.['release-group']?.id ?? null;
        if (mbid) console.log(`[Reviews API] Found release-group via release: ${mbid}`);
      } catch (e) {
        console.log(`[Reviews API] release query failed: ${(e as Error).message}`);
      }
    }

    // 3) Fallback: recording (song name instead of album)
    if (!mbid) {
      try {
        const q3 = encodeURIComponent(`artist:"${artist}" AND recording:"${album}"`);
        const mb3 = await mbFetch(`/ws/2/recording/?query=${q3}&fmt=json&limit=1`);
        mbid = mb3?.recordings?.[0]?.['release-group']?.id ?? null;
        if (mbid) console.log(`[Reviews API] Found release-group via recording: ${mbid}`);
      } catch (e) {
        console.log(`[Reviews API] recording query failed: ${(e as Error).message}`);
      }
    }

    if (!mbid) {
      console.log(`[Reviews API] No MBID found, falling back to mock reviews`);
      try {
        const mockResp = await fetch(`http://localhost:5173/mock/reviews.json`);
        const mock = await mockResp.json();
        return new Response(JSON.stringify({ 
          reviews: Array.isArray(mock) ? mock : mock.reviews ?? [], 
          note: 'no MBID found (mock fallback)', 
          mbid: null 
        }));
      } catch (e) {
        console.log(`[Reviews API] Mock fallback also failed: ${(e as Error).message}`);
        return new Response(JSON.stringify({ reviews: [], note: 'no MBID and mock failed' }));
      }
    }

    // Fetch CritiqueBrainz reviews
    console.log(`[Reviews API] Fetching reviews from CritiqueBrainz for MBID: ${mbid}`);
    const cbResp = await fetch(
      `https://reviews.critiquebrainz.org/ws/1/release-group/${mbid}/reviews?limit=10&fmt=json`,
      { headers: { 'User-Agent': UA } }
    );
    
    if (!cbResp.ok) {
      console.log(`[Reviews API] CritiqueBrainz returned ${cbResp.status}, falling back to mock`);
      try {
        const mockResp = await fetch(`http://localhost:5173/mock/reviews.json`);
        const mock = await mockResp.json();
        return new Response(JSON.stringify({ 
          reviews: Array.isArray(mock) ? mock : mock.reviews ?? [], 
          note: 'CritiqueBrainz failed (mock fallback)', 
          mbid 
        }));
      } catch (e) {
        return new Response(JSON.stringify({ reviews: [], note: 'CritiqueBrainz and mock failed', mbid }));
      }
    }

    const cb = await cbResp.json();
    const reviews = (cb?.reviews ?? []).map((r: any) => ({
      author: r.user?.name ?? 'Anonymous',
      rating: r.rating ?? null,
      date: r.created_on ?? r.updated_on ?? null,
      source: 'CritiqueBrainz',
      text: r.text ?? ''
    }));

    if (!reviews.length) {
      console.log(`[Reviews API] No CritiqueBrainz reviews found, using mock fallback`);
      try {
        const mockResp = await fetch(`http://localhost:5173/mock/reviews.json`);
        const mock = await mockResp.json();
        return new Response(JSON.stringify({ 
          reviews: Array.isArray(mock) ? mock : mock.reviews ?? [], 
          note: 'no CritiqueBrainz reviews (mock fallback)', 
          mbid 
        }));
      } catch (e) {
        return new Response(JSON.stringify({ reviews: [], note: 'no reviews found', mbid }));
      }
    }

    console.log(`[Reviews API] Found ${reviews.length} CritiqueBrainz reviews for MBID ${mbid}`);
    return new Response(JSON.stringify({ reviews, mbid }));
  } catch (e: any) {
    console.error('[Reviews API] ERROR:', e?.message ?? e);
    return new Response(
      JSON.stringify({ error: 'reviews failed', message: e?.message ?? 'unknown error' }), 
      { status: 500 }
    );
  }
};
