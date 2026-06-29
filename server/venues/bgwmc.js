const getEventDetails = (document) => {
	return {
		description: ''
	};
};

const getAllEvents = (document) => {

	let eventHolders = document.querySelectorAll('td[bgcolor="#FF0000"]');

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const image_url = eventHolder.querySelector('img').getAttribute('src');
		const link = eventHolder.querySelector('a').getAttribute('href');
		const title = eventHolder.getElementsByClassName('style331')[0].innerHTML;
		const time = eventHolder.getElementsByClassName('style125')[0].querySelectorAll('span')[1];

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(eventHolder.querySelector('.dtstart').querySelector('span').getAttribute('title')),
			image_url,
			link,
			title,
			time
		};
	});

	return eventHolders;
};

module.exports = {
	getAllEvents,
	getEventDetails
}