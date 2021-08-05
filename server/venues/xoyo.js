module.exports = (document) => {
	let eventHolders = document.querySelector('#content').querySelectorAll('.event-holder');

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const imageLink = eventHolder.querySelector('.photo').querySelector('.value-title').getAttribute('title');
		const link = eventHolder.querySelector('.url').getAttribute('href').replace('/whats-on/London/Lightbox/', '');

		return {
			date: new Date(eventHolder.querySelector('.dtstart').querySelector('span').getAttribute('title')),
			image: eventHolder.querySelector('.url').outerHTML,
			image: `<a target="_blank" href=${process.env.FIRE_URL}${link}><img src="${imageLink}"></a>`,
			title: eventHolder.querySelector('.summary').querySelector('a').innerHTML,
			time: null,
			description: eventHolder.querySelector('.desc_row').innerHTML
		};
	});

	return eventHolders;
}