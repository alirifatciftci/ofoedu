import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  GuessPlayerGame as GuessPlayerGameType,
  PlayerCareerHistory,
} from '@/types/database';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react-native';

interface CareerStep extends PlayerCareerHistory {
  clubs: { name: string; country: string };
}

export default function GuessPlayerGame() {
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GuessPlayerGameType | null>(null);
  const [careerHistory, setCareerHistory] = useState<CareerStep[]>([]);
  const [revealedSteps, setRevealedSteps] = useState<number[]>([0]);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>(
    'playing'
  );
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
    loadGame();
  }, []);

  async function loadGame() {
    try {
      setLoading(true);

      const { data: games, error: gamesError } = await supabase
        .from('guess_player_games')
        .select('*, players(*)')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (gamesError) throw gamesError;
      if (!games) {
        setLoading(false);
        return;
      }

      setGame(games);
      setPlayerName(games.players?.name || '');

      const { data: history, error: historyError } = await supabase
        .from('player_career_history')
        .select('*, clubs(name, country)')
        .eq('player_id', games.player_id)
        .order('year_from', { ascending: true });

      if (historyError) throw historyError;

      setCareerHistory((history as CareerStep[]) || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  }

  function revealNextClue() {
    if (revealedSteps.length < careerHistory.length) {
      setRevealedSteps([...revealedSteps, revealedSteps.length]);
    }
  }

  function checkGuess() {
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedAnswer = playerName.toLowerCase();

    setAttempts(attempts + 1);

    if (normalizedGuess === normalizedAnswer) {
      setGameState('won');
      saveStats(true);
    } else if (attempts >= 4) {
      setGameState('lost');
      saveStats(false);
    } else {
      if (revealedSteps.length < careerHistory.length) {
        revealNextClue();
      }
    }
  }

  async function saveStats(won: boolean) {
    if (!game) return;

    try {
      const score = won ? Math.max(0, 100 - attempts * 15) : 0;

      await supabase.from('user_game_stats').insert({
        user_id: 'anonymous',
        game_type: 'guess_player',
        game_id: game.id,
        completed: won,
        attempts: attempts + 1,
        score: score,
      });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  function resetGame() {
    setRevealedSteps([0]);
    setGuess('');
    setAttempts(0);
    setGameState('playing');
    loadGame();
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!game || careerHistory.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No games available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guess The Player</Text>
        <Text style={styles.subtitle}>Career Mode</Text>
      </View>

      <View style={styles.attemptsContainer}>
        <Text style={styles.attemptsText}>
          Attempts: {attempts} / 5
        </Text>
      </View>

      <View style={styles.careerContainer}>
        {careerHistory.map((step, index) => (
          <View key={step.id} style={styles.careerStep}>
            {revealedSteps.includes(index) ? (
              <>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearText}>
                    {step.year_from}
                    {step.year_to ? ` - ${step.year_to}` : ' - Present'}
                  </Text>
                </View>
                <View style={styles.clubInfo}>
                  <Text style={styles.clubName}>{step.clubs.name}</Text>
                  <Text style={styles.countryText}>{step.clubs.country}</Text>
                </View>
              </>
            ) : (
              <View style={styles.hiddenStep}>
                <EyeOff size={24} color="#9ca3af" />
                <Text style={styles.hiddenText}>Clue {index + 1} Hidden</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {gameState === 'playing' && (
        <View style={styles.inputContainer}>
          {revealedSteps.length < careerHistory.length && (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={revealNextClue}>
              <Eye size={20} color="#ffffff" />
              <Text style={styles.revealButtonText}>Reveal Next Clue</Text>
            </TouchableOpacity>
          )}

          <TextInput
            style={styles.input}
            placeholder="Enter player name..."
            value={guess}
            onChangeText={setGuess}
            autoCapitalize="words"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              !guess.trim() && styles.submitButtonDisabled,
            ]}
            onPress={checkGuess}
            disabled={!guess.trim()}>
            <Text style={styles.submitButtonText}>Submit Guess</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'won' && (
        <View style={styles.resultContainer}>
          <CheckCircle size={48} color="#10b981" />
          <Text style={styles.resultTitle}>Correct!</Text>
          <Text style={styles.resultText}>
            The player is {playerName}
          </Text>
          <Text style={styles.scoreText}>
            Score: {Math.max(0, 100 - attempts * 15)} points
          </Text>
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'lost' && (
        <View style={styles.resultContainer}>
          <XCircle size={48} color="#ef4444" />
          <Text style={styles.resultTitle}>Game Over</Text>
          <Text style={styles.resultText}>
            The correct answer was {playerName}
          </Text>
          <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
            <Text style={styles.playAgainButtonText}>Try Another</Text>
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
  attemptsContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  attemptsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  careerContainer: {
    padding: 16,
  },
  careerStep: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  yearBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  yearText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  clubInfo: {
    marginTop: 4,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  countryText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  hiddenStep: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  hiddenText: {
    fontSize: 16,
    color: '#9ca3af',
    marginLeft: 8,
  },
  inputContainer: {
    padding: 16,
  },
  revealButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  revealButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  submitButton: {
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
  scoreText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 12,
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
