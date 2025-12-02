// API endpoint: Find a YouTube video ID for a given song/artist.
// No API key needed – scrapes YouTube search results.
// GET /api/youtube?q=TRACK+ARTIST

import { json } from "@sveltejs/kit";

export async function GET({ url }) {
    const query = url.searchParams.get("q");
    if (!query) return json({ error: "Missing ?q" }, { status: 400 });

    const encoded = encodeURIComponent(query);

    const html = await fetch(`https://www.youtube.com/results?search_query=${encoded}`)
        .then(r => r.text())
        .catch(() => null);

    if (!html) return json({ videoId: null });

    const match = html.match(/"videoId":"([^"]+)"/);

    return json({ videoId: match ? match[1] : null });
}
