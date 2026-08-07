require('dotenv').config({ quiet: true });
const createApp = require('./app');
const pool = require('../public/js/utils/db');
const app = createApp(pool);
const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
	console.log(`Running on 0.0.0.0:${port}`);
});