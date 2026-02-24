-- Seed 2026 F1 Drivers (22 drivers, 11 teams)
INSERT INTO drivers (id, name, surname, short_name, number, team_id, team_name) VALUES
  ('max_verstappen', 'Max', 'Verstappen', 'VER', 1, 'red_bull', 'Red Bull Racing'),
  ('isack_hadjar', 'Isack', 'Hadjar', 'HAD', 6, 'red_bull', 'Red Bull Racing'),
  ('charles_leclerc', 'Charles', 'Leclerc', 'LEC', 16, 'ferrari', 'Ferrari'),
  ('lewis_hamilton', 'Lewis', 'Hamilton', 'HAM', 44, 'ferrari', 'Ferrari'),
  ('lando_norris', 'Lando', 'Norris', 'NOR', 4, 'mclaren', 'McLaren'),
  ('oscar_piastri', 'Oscar', 'Piastri', 'PIA', 81, 'mclaren', 'McLaren'),
  ('george_russell', 'George', 'Russell', 'RUS', 63, 'mercedes', 'Mercedes'),
  ('kimi_antonelli', 'Kimi', 'Antonelli', 'ANT', 12, 'mercedes', 'Mercedes'),
  ('fernando_alonso', 'Fernando', 'Alonso', 'ALO', 14, 'aston_martin', 'Aston Martin'),
  ('lance_stroll', 'Lance', 'Stroll', 'STR', 18, 'aston_martin', 'Aston Martin'),
  ('pierre_gasly', 'Pierre', 'Gasly', 'GAS', 10, 'alpine', 'Alpine'),
  ('franco_colapinto', 'Franco', 'Colapinto', 'COL', 43, 'alpine', 'Alpine'),
  ('oliver_bearman', 'Oliver', 'Bearman', 'BEA', 87, 'haas', 'Haas'),
  ('esteban_ocon', 'Esteban', 'Ocon', 'OCO', 31, 'haas', 'Haas'),
  ('liam_lawson', 'Liam', 'Lawson', 'LAW', 30, 'racing_bulls', 'Racing Bulls'),
  ('arvid_lindblad', 'Arvid', 'Lindblad', 'LIN', 2, 'racing_bulls', 'Racing Bulls'),
  ('alex_albon', 'Alex', 'Albon', 'ALB', 23, 'williams', 'Williams'),
  ('carlos_sainz', 'Carlos', 'Sainz', 'SAI', 55, 'williams', 'Williams'),
  ('nico_hulkenberg', 'Nico', 'Hulkenberg', 'HUL', 27, 'audi', 'Audi'),
  ('gabriel_bortoleto', 'Gabriel', 'Bortoleto', 'BOR', 5, 'audi', 'Audi'),
  ('sergio_perez', 'Sergio', 'Perez', 'PER', 11, 'cadillac', 'Cadillac'),
  ('valtteri_bottas', 'Valtteri', 'Bottas', 'BOT', 77, 'cadillac', 'Cadillac')
ON CONFLICT (id) DO NOTHING;

-- Seed 2026 F1 Race Calendar (24 races)
-- qualifying_date is set to Saturday before race day (approximate times in UTC)
INSERT INTO races (id, round, race_name, country, city, race_date, qualifying_date, is_sprint) VALUES
  ('australia_2026', 1, 'Australian Grand Prix', 'Australia', 'Melbourne', '2026-03-08', '2026-03-07T05:00:00Z', false),
  ('china_2026', 2, 'Chinese Grand Prix', 'China', 'Shanghai', '2026-03-22', '2026-03-21T06:00:00Z', true),
  ('japan_2026', 3, 'Japanese Grand Prix', 'Japan', 'Suzuka', '2026-04-05', '2026-04-04T05:00:00Z', false),
  ('bahrain_2026', 4, 'Bahrain Grand Prix', 'Bahrain', 'Sakhir', '2026-04-19', '2026-04-18T12:00:00Z', false),
  ('saudi_arabia_2026', 5, 'Saudi Arabian Grand Prix', 'Saudi Arabia', 'Jeddah', '2026-05-03', '2026-05-02T14:00:00Z', false),
  ('miami_2026', 6, 'Miami Grand Prix', 'USA', 'Miami', '2026-05-17', '2026-05-16T18:00:00Z', true),
  ('emilia_romagna_2026', 7, 'Emilia Romagna Grand Prix', 'Italy', 'Imola', '2026-05-31', '2026-05-30T13:00:00Z', false),
  ('monaco_2026', 8, 'Monaco Grand Prix', 'Monaco', 'Monte Carlo', '2026-06-07', '2026-06-06T13:00:00Z', false),
  ('spain_2026', 9, 'Spanish Grand Prix', 'Spain', 'Barcelona', '2026-06-21', '2026-06-20T13:00:00Z', false),
  ('canada_2026', 10, 'Canadian Grand Prix', 'Canada', 'Montreal', '2026-07-05', '2026-07-04T18:00:00Z', false),
  ('austria_2026', 11, 'Austrian Grand Prix', 'Austria', 'Spielberg', '2026-07-19', '2026-07-18T13:00:00Z', true),
  ('great_britain_2026', 12, 'British Grand Prix', 'Great Britain', 'Silverstone', '2026-08-02', '2026-08-01T13:00:00Z', false),
  ('belgium_2026', 13, 'Belgian Grand Prix', 'Belgium', 'Spa', '2026-08-30', '2026-08-29T13:00:00Z', true),
  ('netherlands_2026', 14, 'Dutch Grand Prix', 'Netherlands', 'Zandvoort', '2026-09-06', '2026-09-05T12:00:00Z', false),
  ('italy_2026', 15, 'Italian Grand Prix', 'Italy', 'Monza', '2026-09-13', '2026-09-12T13:00:00Z', false),
  ('azerbaijan_2026', 16, 'Azerbaijan Grand Prix', 'Azerbaijan', 'Baku', '2026-09-27', '2026-09-26T10:00:00Z', false),
  ('singapore_2026', 17, 'Singapore Grand Prix', 'Singapore', 'Marina Bay', '2026-10-04', '2026-10-03T10:00:00Z', false),
  ('usa_2026', 18, 'United States Grand Prix', 'USA', 'Austin', '2026-10-18', '2026-10-17T18:00:00Z', true),
  ('mexico_2026', 19, 'Mexico City Grand Prix', 'Mexico', 'Mexico City', '2026-10-25', '2026-10-24T18:00:00Z', false),
  ('brazil_2026', 20, 'Brazilian Grand Prix', 'Brazil', 'Sao Paulo', '2026-11-08', '2026-11-07T16:00:00Z', true),
  ('las_vegas_2026', 21, 'Las Vegas Grand Prix', 'USA', 'Las Vegas', '2026-11-15', '2026-11-14T22:00:00Z', false),
  ('qatar_2026', 22, 'Qatar Grand Prix', 'Qatar', 'Lusail', '2026-11-29', '2026-11-28T13:00:00Z', false),
  ('saudi_winter_2026', 23, 'Saudi Arabian Grand Prix', 'Saudi Arabia', 'Jeddah', '2026-12-06', '2026-12-05T14:00:00Z', false),
  ('abu_dhabi_2026', 24, 'Abu Dhabi Grand Prix', 'UAE', 'Abu Dhabi', '2026-12-13', '2026-12-12T10:00:00Z', false)
ON CONFLICT (id) DO NOTHING;
