const { makeGetAllEvents } = require('./designmynight');

const getAllEvents = makeGetAllEvents('https://www.dukeofwellingtonsoho.co.uk');
const getEventDetails = () => ({});

module.exports = { getAllEvents, getEventDetails };
