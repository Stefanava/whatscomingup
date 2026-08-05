-- Generalizes the bespoke coven/club-are/eagle scrapers into DB-configured
-- provider types, matching the existing ra/skiddle pattern. See
-- supabase/functions/_shared/resolve-scraper.ts for how each provider is
-- interpreted — there is no venue-specific code left after this migration.

update venues set provider = 'rest-json', provider_config = $json${"url":"https://hufsshvpourgdgeuofml.supabase.co/rest/v1/events?select=id,name,date,media_url&brand_id=eq.d41fda79-94e1-4bfc-b8ee-c7cc1bdbb9dc&order=date.asc","headerName":"apikey","headerSecret":"COVEN_API_KEY","fields":{"title":"name","date":"date","image_url":"media_url"},"linkTemplate":"https://worldwidecoven.net/events/{id}"}$json$::jsonb where slug = 'coven';

update venues set provider = 'jsonld-sitemap', provider_config = $json${"sitemapUrl":"https://www.clubare.org/event-pages-sitemap.xml","urlPattern":"/events/","lookbackDays":90}$json$::jsonb where slug = 'club-are';

update venues set provider = 'ai', provider_config = $json${"extractPattern":"<script[^>]*id=\"wix-warmup-data\"[^>]*>([\\s\\S]*?)</script>","extraInstructions":"This is a JSON data blob, not HTML — each event object has a \"slug\" field; build its link as `https://www.eaglelondon.com/events/<slug>`."}$json$::jsonb where slug = 'eagle';

