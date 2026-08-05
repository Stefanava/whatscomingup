-- Corrects the venue_type classification from migration 005: Club Are is a
-- touring night, not a fixed venue; Coven is a fixed venue, not a promoter.
UPDATE venues SET venue_type = 'promoter' WHERE slug = 'club-are';
UPDATE venues SET venue_type = 'venue' WHERE slug = 'coven';
