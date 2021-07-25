const HealthCheck = require('@financial-times/health-check');
const UsageReporterHealthCheck = require('../middleware/usage-reporter-health');
const logger = require('@financial-times/n-logger');

const health = new HealthCheck({
	checks: [
		new UsageReporterHealthCheck({
			interval: 60000,
			id: 'ip-usage-reporter-status',
			name: 'IP Usage Reporter status',
			severity: 1,
			businessImpact: 'The IP Usage Reporter is unreachable',
			technicalSummary: 'The IP Usage Reporter is unreachable',
			panicGuide: 'Get in touch with the engineers in #ip-devx on Slack or email dev-x@ft.com',
			log: logger
		}),
		{
			type: 'memory',
			threshold: 75,
			interval: 60000,
			id: 'ip-usage-reporter-memory',
			name: 'IP Usage Reporter memory usage',
			severity: 2,
			businessImpact: 'The IP Usage Reporter is slow and possibly unreachable',
			technicalSummary: 'The IP Usage Reporter is inaccessible',
			panicGuide: 'Get in touch with the engineers in #ip-devx on Slack or email dev-x@ft.com',
			log: logger
		},
		{
			type: 'ping-url',
			url: 'http://ip-usage-reporter.herokuapp.com/__health',
			port: 80,
			interval: 60000,
			id: 'ip-usage-reporter',
			name: 'IP Usage Reporter availability',
			severity: 1,
			technicalSummary: 'The IP Usage Reporter is unreachable and thus renders as not functioning',
			businessImpact: 'The IP Usage Reporter is unreachable',
			panicGuide: 'Get in touch with the engineers in #ip-devx on Slack or email dev-x@ft.com',
			log: logger
		},
	]
});

module.exports = (req, res) => {
	res.json({
		schemaVersion: 1,
		systemCode: 'ip-usage-reporter',
		name: 'IP Usage Reporter',
		description: 'This system shows the AWS usage of the teams in internal products',
		checks: health.toJSON()
	});
};