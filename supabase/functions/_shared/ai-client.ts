// The AI-extraction provider. Used two ways:
//   - No provider set at all (just a `url`) — plain page scrape, no config needed.
//   - provider = 'ai' with a provider_config — same idea, but for a page where
//     the useful data isn't the visible HTML (e.g. eagle: a JSON blob Wix
//     embeds in a <script> tag for SSR). `extractPattern` is a regex whose
//     first capture group is pulled out and handed to the LLM instead of the
//     raw page; `extraInstructions` is appended to the extraction prompt for
//     quirks the model needs telling about (e.g. how to build a link from a
//     `slug` field that has no obvious "this is a link" shape).

import { extractEventsWithLLM, extractEventDetailsWithLLM } from './llm-extract.ts';

type AIConfig = {
	extractPattern?: string;
	extraInstructions?: string;
};

export function makeAIScraper(url: string, config: AIConfig = {}) {
	const preprocess = (html: string) => {
		if (!config.extractPattern) return html;
		const match = html.match(new RegExp(config.extractPattern));
		return match ? match[1] : html;
	};

	const fetchEvents = async () => {
		const html = await fetch(url).then(r => r.text());
		return extractEventsWithLLM(preprocess(html), url, config.extraInstructions || '');
	};

	// Provider-backed venues never need a detail-page fetch (their listing
	// data is already complete), so this is the only scraper type where
	// getEventDetails does real work — callers pass the specific event's link.
	const getEventDetails = async (detailUrl: string) => {
		const html = await fetch(detailUrl).then(r => r.text());
		return extractEventDetailsWithLLM(html, detailUrl);
	};

	return { fetchEvents, getEventDetails };
}
