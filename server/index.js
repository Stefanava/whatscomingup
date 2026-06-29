require('dotenv').config();
console.log(process.env.DATABASE_URL);
const app = require('./app');
const port = process.env.PORT || 1234;

app.listen(port, () => {
	console.log('Running on port:', port);
});