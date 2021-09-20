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
		const imageUrl = box.querySelector('a');
		aNode.setAttribute("href", imageUrl);
		aNode.setAttribute("target", '_blank');
		aNode.appendChild(imgNode);
		return {
			date: new Date(dateString),
			image: aNode.outerHTML,
			title: `<a target="_blank" href="${imageUrl}">${box.querySelector('.post-title').querySelector('span').innerHTML}</a>`,
			time: eventTime
		};
	});

	return(allBoxes);
}