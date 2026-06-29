const SKIDDLE_BID = 10454;

const fetchEvents = async () => {
	const url = `https://www.skiddle.com/api/v1/events/search/?api_key=${process.env.SKIDDLE_API_KEY}&b=${SKIDDLE_BID}&order=date&limit=50`;
	const { results } = await fetch(url).then(r => r.json());
	return results.map(({ eventname, startdate, xlargeimageurl, link }) => ({
		title: eventname,
		date: new Date(startdate),
		time: new Date(startdate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
		image_url: xlargeimageurl,
		link,
	}));
};

const getEventDetails = () => ({});

module.exports = { fetchEvents, getEventDetails };
