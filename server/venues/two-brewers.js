module.exports = (document) => {
	let events = document.querySelector('.events-inner').querySelectorAll('.event-details');

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	events = Array.from(events).map(event => {
		const image = event.querySelector('a');
		const imageUrl = image.getAttribute('href');
		const eventInfo = event.querySelector('article').querySelector('.event-info');
		const title = `<a target="_blank" href="${imageUrl}">${eventInfo.querySelector('.event-title').innerHTML}</a>`;
		const time = eventInfo.querySelector('.event-time').innerHTML;
		const dayString = eventInfo.querySelector('.day').innerHTML;
		const monthString = eventInfo.querySelector('.month').innerHTML;
		let month = months.indexOf(monthString);

		if(month.toString().length === 1) month = `0${month}`;
		const dateString = `${month}-${dayString}-${new Date().getFullYear()}`;		

		return {
			date: new Date(dateString),
			image: image.outerHTML,
			image_url: imageUrl,
			title: title,
			time: time,
		};
	});

	return(events);
}
