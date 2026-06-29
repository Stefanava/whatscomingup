const API_URL = 'https://www.eaglelondon.com/_api/wix-one-events-server/web/paginated-events/viewer';
const PAGE_SIZE = 18;

const fetchEvents = async () => {
	const events = [];
	let offset = 0;

	while (true) {
		const url = `${API_URL}?offset=${offset}&filter=1&byEventId=false&paidPlans=false&locale=en-gb&recurringFilter=2&filterType=2`;
		const data = await fetch(url, {
			headers: { authorization: process.env.EAGLE_AUTH_TOKEN }
		}).then(r => r.json());

		if (!data.events?.length) break;

		data.events.forEach(({ title, scheduling, mainImage, slug }) => {
			events.push({
				title,
				date: new Date(scheduling.config.startDate),
				time: scheduling.startTimeFormatted,
				image_url: mainImage?.url || '',
				link: `https://www.eaglelondon.com/events/${slug}`,
			});
		});

		if (data.events.length < PAGE_SIZE) break;
		offset += PAGE_SIZE;
	}

	return events;
};

const getEventDetails = () => ({});

module.exports = { fetchEvents, getEventDetails };
