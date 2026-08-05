// Deno port of server/venues/llm-extract.js — calls the Anthropic Messages API
// directly via fetch (no SDK) since the Node SDK isn't guaranteed to behave
// the same way in the Deno edge runtime.

const MAX_HTML_LENGTH = 120000;
const MODEL = () => Deno.env.get('LLM_EXTRACTION_MODEL') || 'claude-haiku-4-5';

const EVENTS_SCHEMA = {
	type: 'object',
	properties: {
		events: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					date: { type: ['string', 'null'], description: 'Event date (and time, if present) as an ISO 8601 string. Null if not found.' },
					title: { type: ['string', 'null'] },
					image_url: { type: ['string', 'null'], description: 'Absolute URL to the event image, resolved against the base URL.' },
					time: { type: ['string', 'null'], description: 'Event start time as displayed on the page, if separate from the date.' },
					cost: { type: ['string', 'null'] },
					description: { type: ['string', 'null'] },
					link: { type: ['string', 'null'], description: "Absolute URL to the event's own page, resolved against the base URL." }
				},
				required: ['date', 'title', 'image_url', 'time', 'cost', 'description', 'link'],
				additionalProperties: false
			}
		}
	},
	required: ['events'],
	additionalProperties: false
};

const EVENT_DETAILS_SCHEMA = {
	type: 'object',
	properties: {
		image_url: { type: ['string', 'null'], description: "Absolute URL to the event's main image, resolved against the base URL." },
		cost: { type: ['string', 'null'], description: 'Ticket price or cost as displayed on the page.' },
		description: { type: ['string', 'null'], description: "The event's description/blurb as displayed on the page." }
	},
	required: ['image_url', 'cost', 'description'],
	additionalProperties: false
};

const cleanHtml = (html: string) => html
	.replace(/<script[\s\S]*?<\/script>/gi, '')
	.replace(/<style[\s\S]*?<\/style>/gi, '')
	.replace(/\s+/g, ' ')
	.trim()
	.slice(0, MAX_HTML_LENGTH);

async function runExtraction(system: string, html: string, schema: object) {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
			'anthropic-version': '2023-06-01',
		},
		body: JSON.stringify({
			model: MODEL(),
			max_tokens: 8192,
			temperature: 0,
			system,
			messages: [{ role: 'user', content: cleanHtml(html) }],
			output_config: { format: { type: 'json_schema', schema } },
		}),
	});

	const data = await response.json();
	if (!response.ok) throw new Error(data?.error?.message || `Anthropic API error ${response.status}`);
	return JSON.parse(data.content[0].text);
}

export async function extractEventsWithLLM(html: string, baseUrl: string, extraInstructions = '') {
	const today = new Date().toISOString().slice(0, 10);
	const { events } = await runExtraction(
		`Extract every event listed on this venue page into structured data. The base URL for this page is ${baseUrl} — resolve any relative links or image URLs against it. Today's date is ${today}. If an event's date is shown without a year, assume the nearest occurrence on or after today (never a past date). Use null for any field that isn't present on the page. Do not invent events or data that aren't on the page.${extraInstructions ? ` ${extraInstructions}` : ''}`,
		html,
		EVENTS_SCHEMA
	);
	return events;
}

export const extractEventDetailsWithLLM = (html: string, baseUrl: string) => runExtraction(
	`Extract this event's image URL, cost, and description from its detail page. The base URL for this page is ${baseUrl} — resolve any relative image URL against it. Use null for any field that isn't present on the page. Do not invent data that isn't on the page.`,
	html,
	EVENT_DETAILS_SCHEMA
);
