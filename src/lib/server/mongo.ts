import { env } from '$env/dynamic/private';
import { MongoClient, type Collection } from 'mongodb';

type ReviewDocument = {
  trackName: string;
  artist: string;
  album: string;
  rating: number;
  notes: string;
  createdAt: Date;
};

const DB_NAME = env.DB_NAME || 'musicfinder';
const COLLECTION_NAME = 'reviews';

let cachedClient: MongoClient | null = null;

async function getClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = env.DB_URI;
  if (!uri) {
    throw new Error('DB_URI ist nicht gesetzt');
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    cachedClient = client;
    return client;
  } catch (err) {
    try {
      await client.close();
    } catch {
      // ignore
    }
    throw err;
  }
}

export async function getReviewsCollection(): Promise<Collection<ReviewDocument>> {
  const client = await getClient();
  return client.db(DB_NAME).collection<ReviewDocument>(COLLECTION_NAME);
}
