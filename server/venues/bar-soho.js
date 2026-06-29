const { makeGetAllEvents } = require('./designmynight');

const getAllEvents = makeGetAllEvents('https://www.barsoho.co.uk');
const getEventDetails = () => ({});

module.exports = { getAllEvents, getEventDetails };
