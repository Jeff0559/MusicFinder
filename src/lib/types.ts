/**
 * Type definitions for Spotify API, MusicBrainz, CritiqueBrainz and internal data
 */

// ============================================================================
// Spotify Types
// ============================================================================

export type SpotifyImage = {
	url: string;
	height?: number;
	width?: number;
};

export type SpotifyArtist = {
	id: string;
	name: string;
};

export type SpotifyAlbum = {
	id: string;
	name: string;
	images?: SpotifyImage[];
	release_date?: string;
	artists?: SpotifyArtist[];
	total_tracks?: number;
	album_group?: string;
	uri?: string;
};

export type SpotifyTrack = {
	id: string;
	name: string;
	artists: SpotifyArtist[];
	album: SpotifyAlbum;
	duration_ms?: number;
	preview_url?: string | null;
	external_urls?: { spotify?: string };
};

export type AudioFeatures = {
	tempo: number;
	energy: number;
	valence: number;
	danceability: number;
};

export type SpotifyArtistInfo = {
	id: string;
	name: string;
	genres: string[];
	popularity: number;
	followers?: {
		total: number;
	};
	images?: SpotifyImage[];
};

// ============================================================================
// MusicBrainz / CritiqueBrainz Types
// ============================================================================

export type Review = {
	author: string;
	rating: number | null;
	date: string | null;
	source: string;
	text: string;
};

// ============================================================================
// API Response Types
// ============================================================================

export type SearchResponse = {
	tracks: {
		items: SpotifyTrack[];
	};
};

export type AlbumsResponse = SpotifyAlbum[];

export type AlbumDetailsResponse = SpotifyAlbum & {
	tracks?: {
		items: SpotifyTrack[];
	};
};

export type ReviewsResponse = {
	reviews: Review[];
	mbid?: string;
	note?: string;
};
