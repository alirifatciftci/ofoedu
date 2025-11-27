-- ============================================
-- Football Trivia App - Database Setup
-- ============================================
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın
-- Tüm tabloları oluşturur ve örnek veriler ekler
-- ============================================

-- 1. TABLOLARI OLUŞTUR
-- ============================================

-- Clubs tablosu
CREATE TABLE IF NOT EXISTS clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name text NOT NULL,
    short_name text,
    country text NOT NULL,
    logo_url text,
    created_at timestamptz DEFAULT now()
);

-- Players tablosu
CREATE TABLE IF NOT EXISTS players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    name text NOT NULL,
    nationality text NOT NULL,
    "position" text NOT NULL,
    birth_year integer,
    photo_url text,
    created_at timestamptz DEFAULT now()
);

-- Player Career History tablosu
CREATE TABLE IF NOT EXISTS player_career_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    player_id uuid NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    club_id uuid NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
    year_from integer NOT NULL,
    year_to integer,
    created_at timestamptz DEFAULT now()
);

-- Guess Player Games tablosu
CREATE TABLE IF NOT EXISTS guess_player_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    player_id uuid NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    difficulty text DEFAULT 'medium',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Common Link Games tablosu
CREATE TABLE IF NOT EXISTS common_link_games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    club_1_id uuid NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
    club_2_id uuid NOT NULL REFERENCES clubs (id) ON DELETE CASCADE,
    difficulty text DEFAULT 'medium',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- User Game Stats tablosu (user_id text olarak - 'anonymous' için)
CREATE TABLE IF NOT EXISTS user_game_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id text NOT NULL,
    game_type text NOT NULL,
    game_id text NOT NULL,
    completed boolean DEFAULT false,
    attempts integer DEFAULT 0,
    time_taken integer,
    score integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 2. INDEX'LERİ OLUŞTUR
-- ============================================

CREATE INDEX IF NOT EXISTS idx_player_career_player_id ON player_career_history (player_id);

CREATE INDEX IF NOT EXISTS idx_player_career_club_id ON player_career_history (club_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_game_stats (user_id);

CREATE INDEX IF NOT EXISTS idx_user_stats_game_type ON user_game_stats (game_type);

-- 3. ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

ALTER TABLE player_career_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE guess_player_games ENABLE ROW LEVEL SECURITY;

ALTER TABLE common_link_games ENABLE ROW LEVEL SECURITY;

ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle (varsa)
DROP POLICY IF EXISTS "Anyone can view clubs" ON clubs;

DROP POLICY IF EXISTS "Anyone can view players" ON players;

DROP POLICY IF EXISTS "Anyone can view career history" ON player_career_history;

DROP POLICY IF EXISTS "Anyone can view active guess player games" ON guess_player_games;

DROP POLICY IF EXISTS "Anyone can view active common link games" ON common_link_games;

DROP POLICY IF EXISTS "Users can view their own stats" ON user_game_stats;

DROP POLICY IF EXISTS "Users can insert their own stats" ON user_game_stats;

DROP POLICY IF EXISTS "Users can update their own stats" ON user_game_stats;

-- Yeni politikaları oluştur
CREATE POLICY "Anyone can view clubs" ON clubs FOR
SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view players" ON players FOR
SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view career history" ON player_career_history FOR
SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view active guess player games" ON guess_player_games FOR
SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Anyone can view active common link games" ON common_link_games FOR
SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Users can view their own stats" ON user_game_stats FOR
SELECT TO anon, authenticated USING (true);

CREATE POLICY "Users can insert their own stats" ON user_game_stats FOR
INSERT
    TO anon,
    authenticated
WITH
    CHECK (true);

CREATE POLICY "Users can update their own stats" ON user_game_stats FOR
UPDATE TO anon,
authenticated USING (true)
WITH
    CHECK (true);

-- 4. RPC FUNCTION - get_common_players
-- ============================================

CREATE OR REPLACE FUNCTION get_common_players(
  club1_id uuid,
  club2_id uuid
)
RETURNS TABLE (
  id uuid,
  name text,
  "position" text,
  nationality text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.name,
    p."position",
    p.nationality
  FROM players p
  WHERE p.id IN (
    SELECT pch1.player_id
    FROM player_career_history pch1
    WHERE pch1.club_id = club1_id
    INTERSECT
    SELECT pch2.player_id
    FROM player_career_history pch2
    WHERE pch2.club_id = club2_id
  )
  ORDER BY p.name;
END;
$$;

-- 5. ÖRNEK VERİLER
-- ============================================

-- Kulüpler
INSERT INTO
    clubs (name, short_name, country)
VALUES ('Galatasaray', 'GS', 'Turkey'),
    ('Fenerbahçe', 'FB', 'Turkey'),
    ('Beşiktaş', 'BJK', 'Turkey'),
    ('Başakşehir', 'BAS', 'Turkey'),
    ('Real Madrid', 'RM', 'Spain'),
    ('Barcelona', 'BAR', 'Spain'),
    (
        'Atletico Madrid',
        'ATM',
        'Spain'
    ),
    ('Mallorca', 'MAL', 'Spain'),
    (
        'Manchester United',
        'MU',
        'England'
    ),
    ('Liverpool', 'LIV', 'England'),
    ('Chelsea', 'CHE', 'England'),
    ('Arsenal', 'ARS', 'England'),
    (
        'Paris Saint-Germain',
        'PSG',
        'France'
    ),
    ('Marseille', 'MAR', 'France'),
    (
        'Bayern Munich',
        'BAY',
        'Germany'
    ),
    ('Hamburg', 'HAM', 'Germany'),
    (
        'Werder Bremen',
        'WB',
        'Germany'
    ),
    (
        'Bayer Leverkusen',
        'BL',
        'Germany'
    ),
    ('Juventus', 'JUV', 'Italy'),
    ('AC Milan', 'ACM', 'Italy'),
    ('Inter Milan', 'INT', 'Italy'),
    ('Roma', 'ROM', 'Italy');

-- Oyuncular
INSERT INTO
    players (
        name,
        nationality,
        "position",
        birth_year
    )
VALUES (
        'Arda Güler',
        'Turkey',
        'Midfielder',
        2005
    ),
    (
        'Hakan Çalhanoğlu',
        'Turkey',
        'Midfielder',
        1994
    ),
    (
        'Cengiz Ünder',
        'Turkey',
        'Forward',
        1997
    ),
    (
        'Mesut Özil',
        'Germany',
        'Midfielder',
        1988
    ),
    (
        'Cristiano Ronaldo',
        'Portugal',
        'Forward',
        1985
    ),
    (
        'Lionel Messi',
        'Argentina',
        'Forward',
        1987
    ),
    (
        'Zlatan Ibrahimović',
        'Sweden',
        'Forward',
        1981
    ),
    (
        'Didier Drogba',
        'Ivory Coast',
        'Forward',
        1978
    ),
    (
        'Fernando Torres',
        'Spain',
        'Forward',
        1984
    ),
    (
        'David Beckham',
        'England',
        'Midfielder',
        1975
    ),
    (
        'Ronaldinho',
        'Brazil',
        'Midfielder',
        1980
    ),
    (
        'Kaká',
        'Brazil',
        'Midfielder',
        1982
    ),
    (
        'Samuel Eto''o',
        'Cameroon',
        'Forward',
        1981
    ),
    (
        'Thierry Henry',
        'France',
        'Forward',
        1977
    ),
    (
        'Alexis Sánchez',
        'Chile',
        'Forward',
        1988
    );

-- Kariyer Geçmişi
-- Arda Güler
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2021, 2023
FROM players p, clubs c
WHERE
    p.name = 'Arda Güler'
    AND c.name = 'Fenerbahçe';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2023, NULL
FROM players p, clubs c
WHERE
    p.name = 'Arda Güler'
    AND c.name = 'Real Madrid';

-- Hakan Çalhanoğlu
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2011, 2013
FROM players p, clubs c
WHERE
    p.name = 'Hakan Çalhanoğlu'
    AND c.name = 'Hamburg';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2013, 2017
FROM players p, clubs c
WHERE
    p.name = 'Hakan Çalhanoğlu'
    AND c.name = 'Bayer Leverkusen';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2017, 2021
FROM players p, clubs c
WHERE
    p.name = 'Hakan Çalhanoğlu'
    AND c.name = 'AC Milan';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2021, NULL
FROM players p, clubs c
WHERE
    p.name = 'Hakan Çalhanoğlu'
    AND c.name = 'Inter Milan';

-- Cengiz Ünder
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2016, 2017
FROM players p, clubs c
WHERE
    p.name = 'Cengiz Ünder'
    AND c.name = 'Başakşehir';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2017, 2021
FROM players p, clubs c
WHERE
    p.name = 'Cengiz Ünder'
    AND c.name = 'Roma';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2021, 2022
FROM players p, clubs c
WHERE
    p.name = 'Cengiz Ünder'
    AND c.name = 'Marseille';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2022, NULL
FROM players p, clubs c
WHERE
    p.name = 'Cengiz Ünder'
    AND c.name = 'Fenerbahçe';

-- Mesut Özil
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2008, 2010
FROM players p, clubs c
WHERE
    p.name = 'Mesut Özil'
    AND c.name = 'Werder Bremen';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2010, 2013
FROM players p, clubs c
WHERE
    p.name = 'Mesut Özil'
    AND c.name = 'Real Madrid';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2013, 2021
FROM players p, clubs c
WHERE
    p.name = 'Mesut Özil'
    AND c.name = 'Arsenal';

-- Cristiano Ronaldo
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2003, 2009
FROM players p, clubs c
WHERE
    p.name = 'Cristiano Ronaldo'
    AND c.name = 'Manchester United';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2009, 2018
FROM players p, clubs c
WHERE
    p.name = 'Cristiano Ronaldo'
    AND c.name = 'Real Madrid';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2018, 2021
FROM players p, clubs c
WHERE
    p.name = 'Cristiano Ronaldo'
    AND c.name = 'Juventus';

-- Lionel Messi
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2004, 2021
FROM players p, clubs c
WHERE
    p.name = 'Lionel Messi'
    AND c.name = 'Barcelona';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2021, 2023
FROM players p, clubs c
WHERE
    p.name = 'Lionel Messi'
    AND c.name = 'Paris Saint-Germain';

-- Zlatan Ibrahimović
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2009, 2011
FROM players p, clubs c
WHERE
    p.name = 'Zlatan Ibrahimović'
    AND c.name = 'Barcelona';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2010, 2012
FROM players p, clubs c
WHERE
    p.name = 'Zlatan Ibrahimović'
    AND c.name = 'AC Milan';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2012, 2016
FROM players p, clubs c
WHERE
    p.name = 'Zlatan Ibrahimović'
    AND c.name = 'Paris Saint-Germain';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2016, 2018
FROM players p, clubs c
WHERE
    p.name = 'Zlatan Ibrahimović'
    AND c.name = 'Manchester United';

-- Didier Drogba
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2004, 2012
FROM players p, clubs c
WHERE
    p.name = 'Didier Drogba'
    AND c.name = 'Chelsea';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2013, 2014
FROM players p, clubs c
WHERE
    p.name = 'Didier Drogba'
    AND c.name = 'Galatasaray';

-- Fernando Torres
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2001, 2007
FROM players p, clubs c
WHERE
    p.name = 'Fernando Torres'
    AND c.name = 'Atletico Madrid';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2007, 2011
FROM players p, clubs c
WHERE
    p.name = 'Fernando Torres'
    AND c.name = 'Liverpool';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2011, 2015
FROM players p, clubs c
WHERE
    p.name = 'Fernando Torres'
    AND c.name = 'Chelsea';

-- David Beckham
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 1992, 2003
FROM players p, clubs c
WHERE
    p.name = 'David Beckham'
    AND c.name = 'Manchester United';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2003, 2007
FROM players p, clubs c
WHERE
    p.name = 'David Beckham'
    AND c.name = 'Real Madrid';

-- Ronaldinho
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2001, 2003
FROM players p, clubs c
WHERE
    p.name = 'Ronaldinho'
    AND c.name = 'Paris Saint-Germain';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2003, 2008
FROM players p, clubs c
WHERE
    p.name = 'Ronaldinho'
    AND c.name = 'Barcelona';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2008, 2011
FROM players p, clubs c
WHERE
    p.name = 'Ronaldinho'
    AND c.name = 'AC Milan';

-- Kaká
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2003, 2009
FROM players p, clubs c
WHERE
    p.name = 'Kaká'
    AND c.name = 'AC Milan';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2009, 2013
FROM players p, clubs c
WHERE
    p.name = 'Kaká'
    AND c.name = 'Real Madrid';

-- Samuel Eto'o
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2000, 2004
FROM players p, clubs c
WHERE
    p.name = 'Samuel Eto''o'
    AND c.name = 'Mallorca';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2004, 2009
FROM players p, clubs c
WHERE
    p.name = 'Samuel Eto''o'
    AND c.name = 'Barcelona';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2009, 2011
FROM players p, clubs c
WHERE
    p.name = 'Samuel Eto''o'
    AND c.name = 'Inter Milan';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2013, 2014
FROM players p, clubs c
WHERE
    p.name = 'Samuel Eto''o'
    AND c.name = 'Chelsea';

-- Thierry Henry
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 1999, 2007
FROM players p, clubs c
WHERE
    p.name = 'Thierry Henry'
    AND c.name = 'Arsenal';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2007, 2010
FROM players p, clubs c
WHERE
    p.name = 'Thierry Henry'
    AND c.name = 'Barcelona';

-- Alexis Sánchez
INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2011, 2014
FROM players p, clubs c
WHERE
    p.name = 'Alexis Sánchez'
    AND c.name = 'Barcelona';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2014, 2018
FROM players p, clubs c
WHERE
    p.name = 'Alexis Sánchez'
    AND c.name = 'Arsenal';

INSERT INTO
    player_career_history (
        player_id,
        club_id,
        year_from,
        year_to
    )
SELECT p.id, c.id, 2018, 2019
FROM players p, clubs c
WHERE
    p.name = 'Alexis Sánchez'
    AND c.name = 'Manchester United';

-- 6. OYUNLARI OLUŞTUR
-- ============================================

-- Guess Player Games
INSERT INTO
    guess_player_games (
        player_id,
        difficulty,
        is_active
    )
SELECT p.id, 'medium', true
FROM players p
WHERE
    p.name IN (
        'Arda Güler',
        'Hakan Çalhanoğlu',
        'Cristiano Ronaldo',
        'Lionel Messi',
        'Zlatan Ibrahimović'
    );

-- Common Link Games
INSERT INTO
    common_link_games (
        club_1_id,
        club_2_id,
        difficulty,
        is_active
    )
SELECT c1.id, c2.id, 'medium', true
FROM clubs c1, clubs c2
WHERE (
        c1.name = 'Real Madrid'
        AND c2.name = 'Barcelona'
    )
    OR (
        c1.name = 'Barcelona'
        AND c2.name = 'AC Milan'
    )
    OR (
        c1.name = 'Arsenal'
        AND c2.name = 'Chelsea'
    )
    OR (
        c1.name = 'Manchester United'
        AND c2.name = 'Real Madrid'
    )
    OR (
        c1.name = 'AC Milan'
        AND c2.name = 'Real Madrid'
    );

-- ============================================
-- TAMAMLANDI!
-- ============================================
-- Tablolar oluşturuldu ve örnek veriler eklendi.
-- Artık uygulamanızı test edebilirsiniz!
-- ============================================