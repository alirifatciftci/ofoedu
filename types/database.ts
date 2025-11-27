export interface Club {
  id: string;
  name: string;
  short_name: string | null;
  country: string;
  logo_url: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  nationality: string;
  position: string;
  birth_year: number | null;
  photo_url: string | null;
  created_at: string;
}

export interface PlayerCareerHistory {
  id: string;
  player_id: string;
  club_id: string;
  year_from: number;
  year_to: number | null;
  created_at: string;
  clubs?: Club;
}

export interface GuessPlayerGame {
  id: string;
  player_id: string;
  difficulty: string;
  is_active: boolean;
  created_at: string;
  players?: Player;
}

export interface CommonLinkGame {
  id: string;
  club_1_id: string;
  club_2_id: string;
  difficulty: string;
  is_active: boolean;
  created_at: string;
}

export interface UserGameStats {
  id: string;
  user_id: string;
  game_type: string;
  game_id: string;
  completed: boolean;
  attempts: number;
  time_taken: number | null;
  score: number;
  created_at: string;
}
