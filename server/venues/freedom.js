const getAllEvents = (document) => {
	return Array.from(document.querySelectorAll('article[class*="tribe_events"]')).map(article => {
		const titleEl = article.querySelector('.tribe-events-calendar-list__event-title-link');
		const title = titleEl?.innerHTML?.trim() || '';
		const link = titleEl?.getAttribute('href') || '';
		const dateAttr = article.querySelector('.tribe-events-calendar-list__event-datetime')?.getAttribute('datetime') || '';
		const date = new Date(dateAttr);
		const timeText = article.querySelector('.tribe-event-date-start')?.innerHTML?.trim() || '';
		const timeMatch = timeText.match(/@\s*([\d:]+\s*[ap]m)/i);
		const time = timeMatch ? timeMatch[1].trim() : '';
		return { date, title, time, link, image_url: '' };
	});
};

const getEventDetails = () => ({});

module.exports = { getAllEvents, getEventDetails };
