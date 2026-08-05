// Deno port of server/venues/ra-client.js — shared RA GraphQL client.

let _cachePromise: Promise<any[]> | null = null;
let _cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000;

async function fetchPage(page: number, dateFrom: string, dateTo: string) {
	const query = `query { eventListings(filters: { areas: { eq: 13 }, listingDate: { gte: "${dateFrom}", lte: "${dateTo}" } }, pageSize: 100, page: ${page}) { data { event { id title date startTime venue { name } promoters { id name } images { filename } } } } }`;
	const res = await fetch('https://ra.co/graphql', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Referer': 'https://ra.co/events/uk/london',
			'User-Agent': 'Mozilla/5.0',
		},
		body: JSON.stringify({ query }),
	});
	const { data } = await res.json();
	return (data?.eventListings?.data || []).map((e: any) => e.event);
}

async function fetchAllEvents() {
	const today = new Date();
	const dateFrom = today.toISOString().slice(0, 10);
	const dateTo = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

	const events: any[] = [];
	for (let page = 1; page <= 5; page++) {
		const batch = await fetchPage(page, dateFrom, dateTo);
		events.push(...batch);
		if (batch.length < 100) break;
	}

	return events;
}

function getEvents() {
	if (_cachePromise && Date.now() - _cacheTime < CACHE_TTL) return _cachePromise;
	_cacheTime = Date.now();
	_cachePromise = fetchAllEvents().catch(err => { _cachePromise = null; throw err; });
	return _cachePromise;
}

export function makeRAScraper(promoterId: number | string) {
	const id = String(promoterId);
	const fetchEvents = async () => {
		const events = await getEvents();
		return events
			.filter(e => (e.promoters || []).some((p: any) => p.id === id))
			.map(e => ({
				title: e.title,
				date: new Date(e.date),
				time: new Date(e.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
				link: `https://ra.co/events/${e.id}`,
				image_url: e.images?.[0]?.filename || '',
			}));
	};
	const getEventDetails = () => ({});
	return { fetchEvents, getEventDetails };
}
