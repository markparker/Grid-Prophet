-- Fix 2026 F1 race calendar to match the official F1 schedule
-- Source: formula1.com/en/racing/2026
-- Official race dates confirmed: 24 rounds

-- Remove races that don't exist in the 2026 calendar
DELETE FROM races WHERE id IN ('emilia_romagna_2026', 'saudi_winter_2026');

-- Upsert all 24 correct races
INSERT INTO races (id, round, race_name, country, city, race_date, qualifying_date, is_sprint) VALUES
  ('australia_2026',    1,  'Australian Grand Prix',      'Australia',   'Melbourne',    '2026-03-08', '2026-03-07T05:00:00Z', false),
  ('china_2026',        2,  'Chinese Grand Prix',         'China',        'Shanghai',     '2026-03-15', '2026-03-14T06:00:00Z', false),
  ('japan_2026',        3,  'Japanese Grand Prix',        'Japan',        'Suzuka',       '2026-03-29', '2026-03-28T05:00:00Z', false),
  ('bahrain_2026',      4,  'Bahrain Grand Prix',         'Bahrain',      'Sakhir',       '2026-04-12', '2026-04-11T12:00:00Z', false),
  ('saudi_arabia_2026', 5,  'Saudi Arabian Grand Prix',   'Saudi Arabia', 'Jeddah',       '2026-04-19', '2026-04-18T14:00:00Z', false),
  ('miami_2026',        6,  'Miami Grand Prix',           'USA',          'Miami',        '2026-05-03', '2026-05-02T18:00:00Z', false),
  ('canada_2026',       7,  'Canadian Grand Prix',        'Canada',       'Montreal',     '2026-05-24', '2026-05-23T18:00:00Z', false),
  ('monaco_2026',       8,  'Monaco Grand Prix',          'Monaco',       'Monte Carlo',  '2026-06-07', '2026-06-06T13:00:00Z', false),
  ('spain_2026',        9,  'Spanish Grand Prix',         'Spain',        'Barcelona',    '2026-06-14', '2026-06-13T13:00:00Z', false),
  ('austria_2026',      10, 'Austrian Grand Prix',        'Austria',      'Spielberg',    '2026-06-28', '2026-06-27T13:00:00Z', false),
  ('great_britain_2026',11, 'British Grand Prix',         'Great Britain','Silverstone',  '2026-07-05', '2026-07-04T13:00:00Z', false),
  ('belgium_2026',      12, 'Belgian Grand Prix',         'Belgium',      'Spa',          '2026-07-19', '2026-07-18T13:00:00Z', false),
  ('hungary_2026',      13, 'Hungarian Grand Prix',       'Hungary',      'Budapest',     '2026-07-26', '2026-07-25T13:00:00Z', false),
  ('netherlands_2026',  14, 'Dutch Grand Prix',           'Netherlands',  'Zandvoort',    '2026-08-23', '2026-08-22T12:00:00Z', false),
  ('italy_2026',        15, 'Italian Grand Prix',         'Italy',        'Monza',        '2026-09-06', '2026-09-05T13:00:00Z', false),
  ('spain2_2026',       16, 'Spanish Grand Prix',         'Spain',        'Madrid',       '2026-09-13', '2026-09-12T13:00:00Z', false),
  ('azerbaijan_2026',   17, 'Azerbaijan Grand Prix',      'Azerbaijan',   'Baku',         '2026-09-27', '2026-09-26T10:00:00Z', false),
  ('singapore_2026',    18, 'Singapore Grand Prix',       'Singapore',    'Marina Bay',   '2026-10-11', '2026-10-10T10:00:00Z', false),
  ('usa_2026',          19, 'United States Grand Prix',   'USA',          'Austin',       '2026-10-25', '2026-10-24T18:00:00Z', false),
  ('mexico_2026',       20, 'Mexico City Grand Prix',     'Mexico',       'Mexico City',  '2026-11-01', '2026-10-31T18:00:00Z', false),
  ('brazil_2026',       21, 'Brazilian Grand Prix',       'Brazil',       'Sao Paulo',    '2026-11-08', '2026-11-07T16:00:00Z', false),
  ('las_vegas_2026',    22, 'Las Vegas Grand Prix',       'USA',          'Las Vegas',    '2026-11-21', '2026-11-20T22:00:00Z', false),
  ('qatar_2026',        23, 'Qatar Grand Prix',           'Qatar',        'Lusail',       '2026-11-29', '2026-11-28T13:00:00Z', false),
  ('abu_dhabi_2026',    24, 'Abu Dhabi Grand Prix',       'UAE',          'Abu Dhabi',    '2026-12-06', '2026-12-05T10:00:00Z', false)
ON CONFLICT (id) DO UPDATE SET
  round          = EXCLUDED.round,
  race_name      = EXCLUDED.race_name,
  country        = EXCLUDED.country,
  city           = EXCLUDED.city,
  race_date      = EXCLUDED.race_date,
  qualifying_date = EXCLUDED.qualifying_date,
  is_sprint      = EXCLUDED.is_sprint;
