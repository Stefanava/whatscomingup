module.exports = (document) => {
	let cards = document.querySelectorAll('.event-card');

	cards = Array.from(cards).map(card => {
		const imageAddress = card.querySelector('.d-img').getAttribute('data-url');
		const img = document.createElement('img');
		img.setAttribute('src', imageAddress);

		const aNode = card.querySelector('header').querySelector('a');
		aNode.innerHTML = img.outerHTML;
		
		const eventDetails = card.querySelector('.event-details');
		const date = eventDetails.querySelector('.datetime').getAttribute('content');
		let title = eventDetails.querySelector('.title').innerHTML;
		const support = eventDetails.querySelector('.support').innerHTML;
		title = `${title} ${support}`;

		return {
			date: new Date(date),
			image: aNode.outerHTML,
			title: title,
			time: new Date(date).toLocaleTimeString(),
		};
	});

	return(cards);
}
