require('dotenv').config();
require('@babel/polyfill');
const fetch = require('node-fetch');
const moment = require('moment');

const venues = {};

const getVenue = async (venueKey) => {
    const { color, slug, name } = venues[venueKey];
    const venueListItem = document.getElementById(`venue-list-item-${venueKey}`);
    const events = await fetch(`${process.env.APP_BASE_URL}/${slug}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    }).then((data) => data.json());

    // This indicates that the venue's events have loaded
    venueListItem.style.color = color;

    // Just adding them into the array in case I need them somewhere in future
    venues[venueKey].events = events;

    events.forEach(({ description, image, date, time, title }) => {
        let eventString = `<div class="event-grid-item" style="background: ${color}">
                            <div class="event-title">${name}: ${title} ${time ? `(${time})` : ''}</div>
                            <div class="event-description"><em>${description || ''}</em></div>
                            <br>
                            <div class="event-image">${image}</div>
                            </div>`;
        const dayGrid = document.querySelector(`#event-container-date-${new Date(date).toDateString().split(' ').join("-")}`);
        if (dayGrid) dayGrid.innerHTML = dayGrid.innerHTML + eventString;
    });
}

const run = async () => {
    try {
        const allVenues = await fetch(`${process.env.APP_BASE_URL}/get-venues`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }).then((data) => data.json());
        
        console.log(allVenues);
        
        allVenues.forEach(venue => {
            venues[venue.slug] = { ...venue }
        });
        
        console.log(venues);

        // Create a list of venues at the top of the page
        const venueListDiv = document.getElementById('venue-list');
        for (const venueKey in venues) {
            const { name } = venues[venueKey];
            const span = document.createElement('span');
            span.id = `venue-list-item-${venueKey}`;
            span.className = 'venue-list-item';
            span.innerHTML = `${name}`;
            venueListDiv.appendChild(span);
        }
        
        const eventGridContainer = document.getElementById('event-grid-container');
        
        const upcomingDays = [];
        
        for (let i = 0; i < 1000; i++) {
            let date = new Date();
            date.setDate(date.getDate() + i);
            upcomingDays.push(date);
        }
        
        // Generate the event containers by date
        upcomingDays.forEach(date => {
            const dayGrid = `<div class="event-container" id="event-container-date-${date.toDateString().split(' ').join("-")}"><h2>${moment(date).format('dddd Do MMMM')}</h2></div>`;
            eventGridContainer.innerHTML = eventGridContainer.innerHTML + dayGrid;
        });

        Object.keys(venues).forEach((key) => {
            getVenue(key);
        });

        // Once all venues and events added, hide the events containers with no events
        // const eventContainers = document.getElementsByClassName('event-container');
        // Array.from(eventContainers).forEach(container => {
        //     if(!container.querySelector('div')) {
        //         container.style.display = 'none';
        //     }
        // });
    } catch (error) {
        console.log(error);
    }
}


run();
