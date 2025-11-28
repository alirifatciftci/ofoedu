import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { compareTurkish, startsWithTurkish } from '@/lib/utils';
import { Eye, EyeOff, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';

interface CareerStep {
  id: string;
  year_from: number;
  year_to: number | null;
  club_id: string;
  clubs: { name: string; country: string };
}

interface Player {
  id: string;
  name: string;
}

export default function GuessPlayerGame() {
  const [loading, setLoading] = useState(true);
  const [careerHistory, setCareerHistory] = useState<CareerStep[]>([]);
  const [revealedSteps, setRevealedSteps] = useState<number[]>([0]);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>(
    'playing'
  );
  const [playerName, setPlayerName] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadGame();
    loadAllPlayers();
  }, []);

  async function loadAllPlayers() {
    try {
      const { data: playersWithHistory } = await supabase
        .from('player_career_history')
        .select('player_id')
        .limit(10000);

      if (!playersWithHistory) return;

      const uniquePlayerIds = [
        ...new Set(playersWithHistory.map((h) => h.player_id)),
      ];

      const { data: players } = await supabase
        .from('players')
        .select('id, name')
        .in('id', uniquePlayerIds);

      if (players) {
        setAllPlayers(players);
      }
    } catch (error) {
      console.error('Error loading all players:', error);
    }
  }

  function handleGuessChange(text: string) {
    setGuess(text);
    
    if (text.trim().length > 0) {
      const filtered = allPlayers.filter((player) =>
        startsWithTurkish(player.name, text.trim())
      );
      setSuggestions(filtered.slice(0, 5)); // İlk 5 öneri
    } else {
      setSuggestions([]);
    }
  }

  function selectSuggestion(playerName: string) {
    setGuess(playerName);
    setSuggestions([]);
    inputRef.current?.blur();
  }

  async function loadGame(excludePlayerId: string | null = null) {
    try {
      setLoading(true);

      // Kariyer geçmişi olan tüm oyuncuları çek
      // Önce kariyer geçmişi olan oyuncu ID'lerini bul
      const { data: playersWithHistory, error: historyError } = await supabase
        .from('player_career_history')
        .select('player_id')
        .limit(10000); // Tüm kayıtları çek

      if (historyError) throw historyError;
      if (!playersWithHistory || playersWithHistory.length === 0) {
        setLoading(false);
        return;
      }

      // Benzersiz oyuncu ID'lerini al
      const uniquePlayerIds = [
        ...new Set(playersWithHistory.map((h) => h.player_id)),
      ];

      // Mevcut oyuncuyu hariç tut
      let availablePlayerIds = uniquePlayerIds;
      if (excludePlayerId && uniquePlayerIds.length > 1) {
        availablePlayerIds = uniquePlayerIds.filter(
          (id) => id !== excludePlayerId
        );
      }

      if (availablePlayerIds.length === 0) {
        setLoading(false);
        return;
      }

      // Rastgele bir oyuncu seç
      const randomIndex = Math.floor(
        Math.random() * availablePlayerIds.length
      );
      const selectedPlayerId = availablePlayerIds[randomIndex];

      // Seçilen oyuncunun bilgilerini çek
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('id, name')
        .eq('id', selectedPlayerId)
        .maybeSingle();

      if (playerError) throw playerError;
      if (!player) {
        setLoading(false);
        return;
      }

      setCurrentPlayerId(player.id);
      setPlayerName(player.name || '');

      // Seçilen oyuncunun kariyer geçmişini çek
      const { data: history, error: historyError2 } = await supabase
        .from('player_career_history')
        .select('*, clubs(name, country)')
        .eq('player_id', selectedPlayerId)
        .order('year_from', { ascending: true });

      if (historyError2) throw historyError2;

      // Aynı kulüpte birden fazla dönem oynayan oyuncular için tekrar eden clue'ları kaldır
      // Her benzersiz kulüp için sadece bir clue göster (ilk dönem)
      // Kulüp adına göre filtrele (aynı kulüp adı = aynı kulüp, farklı club_id olsa bile)
      const uniqueClubsMap = new Map<string, CareerStep>();
      if (history) {
        history.forEach((step: CareerStep) => {
          const clubName = step.clubs.name.toLowerCase().trim();
          // Eğer bu kulüp adı daha önce eklenmemişse ekle
          if (!uniqueClubsMap.has(clubName)) {
            uniqueClubsMap.set(clubName, step);
          }
        });
      }

      // Benzersiz kulüpleri yıl sırasına göre sırala
      const uniqueCareerHistory = Array.from(uniqueClubsMap.values()).sort(
        (a, b) => a.year_from - b.year_from
      );

      setCareerHistory(uniqueCareerHistory);
      setLoading(false);
    } catch (error) {
      console.error('Error loading game:', error);
      setLoading(false);
    }
  }

  function changePlayer() {
    setRevealedSteps([0]);
    setGuess('');
    setAttempts(0);
    setGameState('playing');
    loadGame(currentPlayerId);
  }

  function revealNextClue() {
    if (revealedSteps.length < careerHistory.length) {
      setRevealedSteps([...revealedSteps, revealedSteps.length]);
    }
  }

  function checkGuess() {
    setSuggestions([]);
    setAttempts(attempts + 1);

    // Türkçe karakter toleransı ile karşılaştır
    if (compareTurkish(guess.trim(), playerName)) {
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
    if (!playerName) return;

    try {
      const score = won ? Math.max(0, 100 - attempts * 15) : 0;

      await supabase.from('user_game_stats').insert({
        user_id: 'anonymous',
        game_type: 'guess_player',
        game_id: playerName,
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
    loadGame(currentPlayerId);
  }

  function handleInputFocus() {
    // Input focus olduğunda scroll yap
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (careerHistory.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No games available</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Guess The Player</Text>
            {gameState === 'playing' && (
              <TouchableOpacity
                style={styles.changePlayerButton}
                onPress={changePlayer}>
                <RefreshCw size={20} color="#3b82f6" />
                <Text style={styles.changePlayerText}>Change Player</Text>
              </TouchableOpacity>
            )}
          </View>
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

          <View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Enter player name..."
              value={guess}
              onChangeText={handleGuessChange}
              autoCapitalize="words"
              autoCorrect={false}
              onFocus={handleInputFocus}
              returnKeyType="done"
              onSubmitEditing={checkGuess}
            />
            
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.suggestionItem}
                      onPress={() => selectSuggestion(item.name)}>
                      <Text style={styles.suggestionText}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  changePlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  changePlayerText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
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
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#111827',
  },
});
