import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { CommonLinkGame as CommonLinkGameType, Club } from '@/types/database';
import { Link2, CheckCircle, XCircle } from 'lucide-react-native';

interface PlayerWithClubs {
  id: string;
  name: string;
  position: string;
  nationality: string;
}

export default function CommonLinkGame() {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<CommonLinkGameType | null>(null);
  const [club1, setClub1] = useState<Club | null>(null);
  const [club2, setClub2] = useState<Club | null>(null);
  const [validPlayers, setValidPlayers] = useState<PlayerWithClubs[]>([]);
  const [foundPlayers, setFoundPlayers] = useState<Set<string>>(new Set());
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGame();
  }, []);

  async function loadGame() {
    try {
      setLoading(true);

      const { data: games, error: gamesError } = await supabase
        .from('common_link_games')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (gamesError) throw gamesError;
      if (!games) {
        setLoading(false);
        return;
      }

      setGame(games);

      const { data: club1Data, error: club1Error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', games.club_1_id)
        .maybeSingle();

      const { data: club2Data, error: club2Error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', games.club_2_id)
        .maybeSingle();

      if (club1Error || club2Error) throw club1Error || club2Error;

      setClub1(club1Data);
      setClub2(club2Data);

      const { data: playersData, error: playersError } = await supabase.rpc(
        'get_common_players',
        {
          club1_id: games.club_1_id,
          club2_id: games.club_2_id,
        }
      );

      if (playersError) {
        const { data: allHistory } = await supabase
          .from('player_career_history')
          .select('player_id, club_id');

        const club1Players = new Set(
          allHistory
            ?.filter((h) => h.club_id === games.club_1_id)
            .map((h) => h.player_id)
        );

        const club2Players = new Set(
          allHistory
            ?.filter((h) => h.club_id === games.club_2_id)
            .map((h) => h.player_id)
        );

        const commonPlayerIds = Array.from(club1Players).filter((id) =>
          club2Players.has(id)
        );

        const { data: players } = await supabase
          .from('players')
          .select('id, name, position, nationality')
          .in('id', commonPlayerIds);

        setValidPlayers(players || []);
      } else {
        setValidPlayers(playersData || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  }

  function checkGuess() {
    const normalizedGuess = guess.trim().toLowerCase();
    setAttempts(attempts + 1);

    const matchedPlayer = validPlayers.find(
      (p) => p.name.toLowerCase() === normalizedGuess
    );

    if (matchedPlayer && !foundPlayers.has(matchedPlayer.id)) {
      setFoundPlayers(new Set([...foundPlayers, matchedPlayer.id]));
      setMessage('Correct!');
      setGuess('');

      if (foundPlayers.size + 1 === validPlayers.length) {
        saveStats(true);
      }

      setTimeout(() => setMessage(''), 2000);
    } else if (matchedPlayer && foundPlayers.has(matchedPlayer.id)) {
      setMessage('Already found!');
      setTimeout(() => setMessage(''), 2000);
    } else {
      setMessage('Not correct. Try again!');
      setTimeout(() => setMessage(''), 2000);
    }
  }

  async function saveStats(completed: boolean) {
    if (!game) return;

    try {
      const score = completed
        ? Math.max(0, 100 - Math.floor(attempts / foundPlayers.size) * 5)
        : foundPlayers.size * 10;

      await supabase.from('user_game_stats').insert({
        user_id: 'anonymous',
        game_type: 'common_link',
        game_id: game.id,
        completed: completed,
        attempts: attempts,
        score: score,
      });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  function giveUp() {
    saveStats(false);
    setFoundPlayers(new Set(validPlayers.map((p) => p.id)));
  }

  function resetGame() {
    setFoundPlayers(new Set());
    setGuess('');
    setAttempts(0);
    setMessage('');
    loadGame();
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!game || !club1 || !club2) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No games available</Text>
      </View>
    );
  }

  const isComplete = foundPlayers.size === validPlayers.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Common Link</Text>
        <Text style={styles.subtitle}>Find the connection</Text>
      </View>

      <View style={styles.clubsContainer}>
        <View style={styles.clubCard}>
          <Text style={styles.clubName}>{club1.name}</Text>
          <Text style={styles.clubCountry}>{club1.country}</Text>
        </View>

        <View style={styles.linkIcon}>
          <Link2 size={32} color="#10b981" />
        </View>

        <View style={styles.clubCard}>
          <Text style={styles.clubName}>{club2.name}</Text>
          <Text style={styles.clubCountry}>{club2.country}</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Found: {foundPlayers.size} / {validPlayers.length}
        </Text>
        <Text style={styles.attemptsText}>Attempts: {attempts}</Text>
      </View>

      {!isComplete && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter player name..."
            value={guess}
            onChangeText={setGuess}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !guess.trim() && styles.submitButtonDisabled,
              ]}
              onPress={checkGuess}
              disabled={!guess.trim()}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.giveUpButton} onPress={giveUp}>
              <Text style={styles.giveUpButtonText}>Give Up</Text>
            </TouchableOpacity>
          </View>

          {message && (
            <View
              style={[
                styles.messageContainer,
                message.includes('Correct') && styles.messageSuccess,
                message.includes('Not') && styles.messageError,
              ]}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.foundPlayersContainer}>
        <Text style={styles.sectionTitle}>
          {isComplete ? 'All Players' : 'Found Players'}
        </Text>

        {validPlayers
          .filter((p) => foundPlayers.has(p.id))
          .map((player) => (
            <View key={player.id} style={styles.playerCard}>
              <CheckCircle size={20} color="#10b981" />
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerDetails}>
                  {player.position} • {player.nationality}
                </Text>
              </View>
            </View>
          ))}
      </View>

      {isComplete && (
        <View style={styles.resultContainer}>
          <CheckCircle size={48} color="#10b981" />
          <Text style={styles.resultTitle}>Complete!</Text>
          <Text style={styles.resultText}>
            You found all {validPlayers.length} players
          </Text>
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  clubsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  clubCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  clubCountry: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  linkIcon: {
    marginHorizontal: 12,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  attemptsText: {
    fontSize: 16,
    color: '#6b7280',
  },
  inputContainer: {
    padding: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  giveUpButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  giveUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  messageSuccess: {
    backgroundColor: '#d1fae5',
  },
  messageError: {
    backgroundColor: '#fee2e2',
  },
  messageText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  foundPlayersContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  playerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  playerDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  resultContainer: {
    padding: 24,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 12,
  },
  resultText: {
    fontSize: 18,
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  playAgainButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  playAgainButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
