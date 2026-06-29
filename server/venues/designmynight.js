const makeGetAllEvents = (baseUrl) => (document) => {
	return Array.from(document.querySelectorAll('article a.event-card')).map(card => {
		const date = new Date(card.getAttribute('data-date'));
		const title = card.querySelector('.event-title')?.innerHTML?.trim() || '';
		const timeText = card.querySelector('.event-time')?.innerHTML?.trim() || '';
		const time = timeText.split(' - ')[0];
		const href = card.getAttribute('href');
		const link = href.startsWith('http') ? href : baseUrl + href;
		return { date, title, time, link, image_url: '' };
	});
};

module.exports = { makeGetAllEvents };
