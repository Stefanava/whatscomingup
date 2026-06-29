const getEventDetails = () => ({});

const getAllEvents = (document) => {
	const seen = new Set();
	const events = [];

	document.querySelectorAll('a.event-card').forEach(card => {
		const href = card.getAttribute('href');
		if (seen.has(href)) return;
		seen.add(href);

		const date = new Date(card.getAttribute('data-date'));
		const title = card.querySelector('.event-title')?.innerHTML?.trim() || '';
		const time = card.querySelector('.event-time')?.innerHTML?.trim() || '';
		const link = 'https://www.the2brewers.com' + href;
		const imageEl = card.parentElement?.querySelector('a.event-image img');
		const image_url = imageEl?.getAttribute('data-src') || imageEl?.getAttribute('src') || '';

		events.push({ date, title, time, image_url, link });
	});

	return events;
};

module.exports = { getAllEvents, getEventDetails };
