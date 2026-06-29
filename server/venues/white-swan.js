const VENUE_ID = 110203;
const LAT = 51.512659;
const LON = -0.041129;

const fetchEvents = async () => {
	const url = `https://www.skiddle.com/api/v1/events/search/?api_key=${process.env.SKIDDLE_API_KEY}&latitude=${LAT}&longitude=${LON}&radius=0.3&order=date&limit=100`;
	const { results = [] } = await fetch(url).then(r => r.json());
	return results
		.filter(e => e.venue?.id === VENUE_ID)
		.map(({ eventname, startdate, xlargeimageurl, link }) => ({
			title: eventname,
			date: new Date(startdate),
			time: new Date(startdate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
			image_url: xlargeimageurl,
			link,
		}));
};

const getEventDetails = () => ({});

module.exports = { fetchEvents, getEventDetails };
