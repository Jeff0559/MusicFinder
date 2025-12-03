import { env } from '$env/dynamic/private';

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAccessToken(): Promise<string> {
	if (cachedToken && Date.now() < tokenExpiry) {
		return cachedToken;
	}

	const clientId = env.SPOTIFY_CLIENT_ID;
	const clientSecret = env.SPOTIFY_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('Missing SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET environment variables');
	}

	const credentials = `${clientId}:${clientSecret}`;
	const auth = Buffer.from(credentials, 'utf-8').toString('base64');

	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: 'grant_type=client_credentials'
	});

	if (!response.ok) {
		console.error(await response.text());
		throw new Error(`Failed to get token: ${response.statusText}`);
	}

	const data = await response.json();
	cachedToken = data.access_token;
	tokenExpiry = Date.now() + (data.expires_in - 30) * 1000;

	return cachedToken!;
}

export async function spotifyGet<T>(endpoint: string): Promise<T> {
	const token = await getAccessToken();

	const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		console.error(await response.text());
		throw new Error(`Spotify API error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}
