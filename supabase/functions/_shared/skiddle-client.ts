// Deno port of server/venues/skiddle-client.js.

type SkiddleConfig = {
	mode: 'bid' | 'geo';
	bid?: number;
	lat?: number;
	lon?: number;
	radius?: number;
	venueId?: number;
	limit?: number;
};

const SKIDDLE_BASE = 'https://www.skiddle.com/api/v1/events/search/';

export function makeSkiddleScraper(config: SkiddleConfig) {
	const fetchEvents = async () => {
		const params = new URLSearchParams({
			api_key: Deno.env.get('SKIDDLE_API_KEY')!,
			order: 'date',
			limit: String(config.limit || (config.mode === 'geo' ? 100 : 50)),
		});

		if (config.mode === 'geo') {
			params.set('latitude', String(config.lat));
			params.set('longitude', String(config.lon));
			params.set('radius', String(config.radius));
		} else {
			params.set('b', String(config.bid));
		}

		const { results = [] } = await fetch(`${SKIDDLE_BASE}?${params}`).then(r => r.json());
		const filtered = config.venueId ? results.filter((e: any) => e.venue?.id === config.venueId) : results;

		return filtered.map(({ eventname, startdate, xlargeimageurl, link }: any) => ({
			title: eventname,
			date: new Date(startdate),
			time: new Date(startdate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
			image_url: xlargeimageurl,
			link,
		}));
	};

	const getEventDetails = () => ({});

	return { fetchEvents, getEventDetails };
}
