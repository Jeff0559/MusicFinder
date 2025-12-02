import { json } from '@sveltejs/kit';
import type { Review } from '$lib/types';

const mockReviews: Review[] = [
	{
		author: 'Alex Turner',
		rating: 5,
		date: '2024-01-15',
		source: 'Mock',
		text: 'Outstanding album! The production is immaculate and the compositions are incredibly well thought out. Every track flows into the next seamlessly. Highly recommended!',
	},
	{
		author: 'Jordan Smith',
		rating: 4,
		date: '2024-01-12',
		source: 'Mock',
		text: 'A solid piece of work. While not every track hits equally hard, the standout moments are truly memorable. Worth multiple listens to fully appreciate the depth.',
	},
	{
		author: 'Taylor Johnson',
		rating: 5,
		date: '2024-01-10',
		source: 'Mock',
		text: 'Pure brilliance! The album showcases remarkable artistry and innovation. Each song brings something unique to the table. This is modern music at its finest.',
	},
	{
		author: 'Morgan Hayes',
		rating: 3,
		date: '2024-01-08',
		source: 'Mock',
		text: 'Decent listen overall. Some tracks are exceptional while others feel a bit repetitive. The vocals are solid throughout, but the album could use a bit more variety.',
	},
	{
		author: 'Casey Roberts',
		rating: 4,
		date: '2024-01-05',
		source: 'Mock',
		text: 'Really enjoyed this! The instrumentation is top-notch and the artist\'s voice carries so much emotion. Looking forward to their next release.',
	},
];

export async function GET() {
	return json({ reviews: mockReviews }, { status: 200 });
}
