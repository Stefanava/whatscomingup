module.exports = (document) => {
	let eventHolders = document.querySelector('#content').querySelectorAll('.event-holder');

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const imageLink = eventHolder.querySelector('.photo').querySelector('.value-title').getAttribute('title');
		const link = eventHolder.querySelector('.url').getAttribute('href').replace('/whats-on/London/Lightbox/', '');

		return {
			date: new Date(eventHolder.querySelector('.dtstart').querySelector('span').getAttribute('title')),
			image: `<a target="_blank" href=${process.env.FIRE_URL}${link}><img src="${imageLink}"></a>`,
			image_url: imageLink,
			title: `<a target="_blank" href=${process.env.FIRE_URL}${link}>${eventHolder.querySelector('.summary').querySelector('a').innerHTML}</a>`,
			time: null,
			description: eventHolder.querySelector('.desc_row').innerHTML
		};
	});

	return eventHolders;
}