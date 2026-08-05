ALTER TABLE venues ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE venues ADD COLUMN IF NOT EXISTS provider_config JSONB;

UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 123751}' WHERE slug = 'howl';
UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 179175}' WHERE slug = 'sextou';
UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 95007}'  WHERE slug = 'tech-couture';
UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 135718}' WHERE slug = 'smut';
UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 82084}'  WHERE slug = 'fold';
UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 86582}'  WHERE slug = 'maiden-voyage';
UPDATE venues SET provider = 'ra', provider_config = '{"promoterId": 99776}'  WHERE slug = 'body-movements';

UPDATE venues SET provider = 'skiddle', provider_config = '{"mode":"bid","bid":10453}' WHERE slug = 'fire';
UPDATE venues SET provider = 'skiddle', provider_config = '{"mode":"bid","bid":10454}' WHERE slug = 'lightbox';
UPDATE venues SET provider = 'skiddle', provider_config = '{"mode":"geo","lat":51.512659,"lon":-0.041129,"radius":0.3,"venueId":110203}' WHERE slug = 'white-swan';
