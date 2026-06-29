const { makeGetAllEvents } = require('./designmynight');

const getAllEvents = makeGetAllEvents('https://www.halfway2heaven.net');
const getEventDetails = () => ({});

module.exports = { getAllEvents, getEventDetails };
