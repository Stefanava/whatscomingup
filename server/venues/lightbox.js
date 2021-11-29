const getEventDetails = () => {
	return {};
};

const getAllEvents = (document) => {
	let eventHolders = document.querySelector('#content').querySelectorAll('.event-holder');

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const imageLink = eventHolder.querySelector('.photo').querySelector('.value-title').getAttribute('title');
		const link = `${process.env.LIGHTBOX_URL}${eventHolder.querySelector('.url').getAttribute('href').replace('/whats-on/London/Lightbox/', '')}`;

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(eventHolder.querySelector('.dtstart').querySelector('span').getAttribute('title')),
			image_url: imageLink,
			link,
			title: eventHolder.querySelector('.summary').querySelector('a').innerHTML,
			description: eventHolder.querySelector('.desc_row').innerHTML
		};
	});

	return eventHolders;
}

module.exports = {
	getAllEvents,
	getEventDetails
}