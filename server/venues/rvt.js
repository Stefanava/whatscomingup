module.exports = (document) => {
	const months = document.querySelector('#month').querySelectorAll('.month');
	let allBoxes = [];
	Array.from(months).forEach(month => {
		const boxes = month.querySelectorAll('.box');
		Array.from(boxes).forEach(box => {
			allBoxes.push(box);
		});
	})


	allBoxes = allBoxes.map(box => {
		const dateString = box.querySelector('.post-date').getAttribute('datetime');
		const eventTime = box.querySelector('.post-time').innerHTML;
		const postThumbNode = box.querySelector('.post-thumb')
		const imgNode = postThumbNode.querySelector('img');
		const aNode = document.createElement('a');
		aNode.setAttribute("href", box.querySelector('a'));
		aNode.appendChild(imgNode);
		return {
			date: new Date(dateString),
			image: aNode.outerHTML,
			title: box.querySelector('.post-title').querySelector('span').innerHTML,
			time: eventTime
		};
	});

	return(allBoxes);
}