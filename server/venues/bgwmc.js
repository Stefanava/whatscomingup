module.exports = (document) => {

	let eventHolders = document.querySelectorAll('td[bgcolor="#FF0000"]');

	// console.log(eventHolders);

	eventHolders = Array.from(eventHolders).map(eventHolder => {
		const imageAddress = eventHolder.querySelector('img').getAttribute('src');
		// console.log(eventHolder.querySelector('a'));
		const link = eventHolder.querySelector('a').getAttribute('href');
		const title = eventHolder.getElementsByClassName('style331')[0].innerHTML;
		const time = eventHolder.getElementsByClassName('style125')[0].querySelectorAll('span')[1];

		return {
			date: new Date(eventHolder.querySelector('.dtstart').querySelector('span').getAttribute('title')),
			image: image,
			image: `<a target="_blank" href=${link}><img src="${imageAddress}"></a>`,
			title: title,
			time,
			// description: eventHolder.querySelector('.desc_row').innerHTML
		};
	});

	return eventHolders;
}