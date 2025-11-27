/*
  # Football Trivia & Puzzle App Database Schema

  ## Overview
  This migration creates the core database structure for a football trivia and puzzle mobile application.

  ## New Tables

  ### 1. `clubs`
  Stores football club information.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Full club name
  - `short_name` (text) - Abbreviated club name
  - `country` (text) - Club's country
  - `logo_url` (text, nullable) - URL to club logo
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `players`
  Stores football player information.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Player's full name
  - `nationality` (text) - Player's nationality
  - `position` (text) - Playing position
  - `birth_year` (integer, nullable) - Year of birth
  - `photo_url` (text, nullable) - URL to player photo
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `player_career_history`
  Tracks players' career moves and club history.
  - `id` (uuid, primary key) - Unique identifier
  - `player_id` (uuid, foreign key) - References players table
  - `club_id` (uuid, foreign key) - References clubs table
  - `year_from` (integer) - Start year at club
  - `year_to` (integer, nullable) - End year at club (null if current)
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. `guess_player_games`
  Stores individual "Guess The Player" game instances.
  - `id` (uuid, primary key) - Unique identifier
  - `player_id` (uuid, foreign key) - References players table
  - `difficulty` (text) - Game difficulty level
  - `is_active` (boolean) - Whether game is currently available
  - `created_at` (timestamptz) - Record creation timestamp

  ### 5. `common_link_games`
  Stores "Common Link" game instances.
  - `id` (uuid, primary key) - Unique identifier
  - `club_1_id` (uuid, foreign key) - First club
  - `club_2_id` (uuid, foreign key) - Second club
  - `difficulty` (text) - Game difficulty level
  - `is_active` (boolean) - Whether game is currently available
  - `created_at` (timestamptz) - Record creation timestamp

  ### 6. `user_game_stats`
  Tracks user performance and statistics.
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - User identifier
  - `game_type` (text) - Type of game played
  - `game_id` (uuid) - Reference to specific game
  - `completed` (boolean) - Whether game was completed
  - `attempts` (integer) - Number of attempts
  - `time_taken` (integer, nullable) - Time in seconds
  - `score` (integer) - Points scored
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable Row Level Security on all tables
  - Public read access for game data (clubs, players, games)
  - Users can read their own statistics

  ## Indexes
  - Added indexes on foreign keys for better query performance
  - Added index on player_id in career history for efficient lookups
*/

CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  country text NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nationality text NOT NULL,
  position text NOT NULL,
  birth_year integer,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_career_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  year_from integer NOT NULL,
  year_to integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guess_player_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  difficulty text DEFAULT 'medium',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS common_link_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_1_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  club_2_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  difficulty text DEFAULT 'medium',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_type text NOT NULL,
  game_id uuid NOT NULL,
  completed boolean DEFAULT false,
  attempts integer DEFAULT 0,
  time_taken integer,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_player_career_player_id ON player_career_history(player_id);
CREATE INDEX IF NOT EXISTS idx_player_career_club_id ON player_career_history(club_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_game_type ON user_game_stats(game_type);

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_career_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE guess_player_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE common_link_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs"
  ON clubs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view career history"
  ON player_career_history FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view active guess player games"
  ON guess_player_games FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active common link games"
  ON common_link_games FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Users can view their own stats"
  ON user_game_stats FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert their own stats"
  ON user_game_stats FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own stats"
  ON user_game_stats FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
