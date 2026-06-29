const BRAND_ID = 'd41fda79-94e1-4bfc-b8ee-c7cc1bdbb9dc';
const API_URL = `https://hufsshvpourgdgeuofml.supabase.co/rest/v1/events?select=id,name,date,media_url&brand_id=eq.${BRAND_ID}&order=date.asc`;

const fetchEvents = async () => {
	const response = await fetch(API_URL, {
		headers: { apikey: process.env.COVEN_API_KEY }
	});
	const events = await response.json();
	return events.map(({ id, name, date, media_url }) => ({
		title: name,
		date: new Date(date),
		image_url: media_url,
		time: new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
		link: `https://worldwidecoven.net/events/${id}`,
	}));
};

const getEventDetails = () => ({});

module.exports = { fetchEvents, getEventDetails };
