// Shared RA GraphQL client. Results are cached per process so all RA-based
// scrapers share a single batch of API calls during one scrape run.

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000;

async function fetchPage(page, dateFrom, dateTo) {
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
	return (data?.eventListings?.data || []).map(e => e.event);
}

async function getEvents() {
	if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

	const today = new Date();
	const dateFrom = today.toISOString().slice(0, 10);
	const dateTo = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

	const events = [];
	for (let page = 1; page <= 5; page++) {
		const batch = await fetchPage(page, dateFrom, dateTo);
		events.push(...batch);
		if (batch.length < 100) break;
	}

	_cache = events;
	_cacheTime = Date.now();
	return events;
}

function makeRAScraper(promoterId) {
	const id = String(promoterId);
	const fetchEvents = async () => {
		const events = await getEvents();
		return events
			.filter(e => (e.promoters || []).some(p => p.id === id))
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

module.exports = { makeRAScraper };
