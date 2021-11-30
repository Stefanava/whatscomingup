const getEventDetails = (document) => {
	return {
		time: document.querySelector('.top-info-cont').childNodes[3].childNodes[1].wholeText.trim()
	};
};

const getAllEvents = (document) => {
	let eventHolders = document.querySelector('#content').querySelectorAll('.event-holder');

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const imageLink = eventHolder.querySelector('.photo').querySelector('.value-title').getAttribute('title');
		const link = eventHolder.querySelector('.url').getAttribute('href').replace('/whats-on/London/XOYO/', '');

		// date, title, image_url, time, cost, description, venue_id, link
		return {
			date: new Date(eventHolder.querySelector('.dtstart').querySelector('span').getAttribute('title')),
			image_url: imageLink,
			link: `${process.env.XOYO_URL}/${link}`,
			title: eventHolder.querySelector('.summary').querySelector('a').innerHTML,
			description: eventHolder.querySelector('.desc_row').innerHTML
		};
	});

	return eventHolders;
};

module.exports = {
	getAllEvents,
	getEventDetails
}