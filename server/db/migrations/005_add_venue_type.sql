-- Distinguishes fixed physical venues from promoters/club nights that host
-- at rotating locations, so the frontend can filter between them.
ALTER TABLE venues ADD COLUMN IF NOT EXISTS venue_type TEXT NOT NULL DEFAULT 'venue'
	CHECK (venue_type IN ('venue', 'promoter'));

UPDATE venues SET venue_type = 'promoter' WHERE slug IN (
	'coven', 'howl', 'sextou', 'tech-couture', 'smut', 'maiden-voyage', 'body-movements'
);
