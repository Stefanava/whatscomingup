// Generic "fetch a JSON array, map its fields" provider. Generalizes what
// used to be a bespoke coven.ts — any venue whose events come from a plain
// JSON REST endpoint can use this via provider = 'rest-json', with a
// provider_config shaped like:
//
//   {
//     url: "https://.../events?...",
//     headerName: "apikey",           // optional — omit if no auth needed
//     headerSecret: "COVEN_API_KEY",  // name of the Deno env var holding the header value
//     fields: { title: "name", date: "date", image_url: "media_url" },
//     linkTemplate: "https://example.com/events/{id}"  // {field} substituted from the raw item
//   }

type RestJsonConfig = {
	url: string;
	headerName?: string;
	headerSecret?: string;
	fields: { title: string; date: string; image_url?: string; time?: string; cost?: string; description?: string };
	linkTemplate: string;
};

const get = (obj: any, path: string) => path.split('.').reduce((v, k) => v?.[k], obj);

const fillTemplate = (template: string, item: any) =>
	template.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(get(item, key) ?? ''));

export function makeRestJsonScraper(config: RestJsonConfig) {
	const fetchEvents = async () => {
		const headers: Record<string, string> = {};
		if (config.headerName && config.headerSecret) {
			headers[config.headerName] = Deno.env.get(config.headerSecret) ?? '';
		}

		const response = await fetch(config.url, { headers });
		const items = await response.json();
		if (!Array.isArray(items)) throw new Error('rest-json provider: response was not an array');

		return items.map((item: any) => {
			const date = get(item, config.fields.date);
			return {
				title: get(item, config.fields.title),
				date: new Date(date),
				time: config.fields.time
					? get(item, config.fields.time)
					: new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
				image_url: config.fields.image_url ? get(item, config.fields.image_url) : '',
				cost: config.fields.cost ? get(item, config.fields.cost) : null,
				description: config.fields.description ? get(item, config.fields.description) : '',
				link: fillTemplate(config.linkTemplate, item),
			};
		});
	};

	const getEventDetails = () => ({});

	return { fetchEvents, getEventDetails };
}
