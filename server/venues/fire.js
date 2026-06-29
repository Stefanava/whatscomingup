const getEventDetails = () => ({});

const getAllEvents = () => {
	throw new Error('Fire uses a Skiddle JavaScript widget — events cannot be scraped via HTML');
};

module.exports = { getAllEvents, getEventDetails };
