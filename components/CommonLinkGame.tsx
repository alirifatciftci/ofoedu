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
import { Link2, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';

interface PlayerWithClubs {
  id: string;
  name: string;
  position: string;
  nationality: string;
}

interface Club {
  id: string;
  name: string;
  country: string;
}

export default function CommonLinkGame() {
  const [loading, setLoading] = useState(true);
  const [club1, setClub1] = useState<Club | null>(null);
  const [club2, setClub2] = useState<Club | null>(null);
  const [validPlayers, setValidPlayers] = useState<PlayerWithClubs[]>([]);
  const [foundPlayers, setFoundPlayers] = useState<Set<string>>(new Set());
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<PlayerWithClubs[]>([]);
  const [allPlayers, setAllPlayers] = useState<PlayerWithClubs[]>([]);
  const [currentClubPair, setCurrentClubPair] = useState<{
    club1Id: string;
    club2Id: string;
  } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadGame();
    loadAllPlayers();
  }, []);

  // allPlayers yüklendikten sonra, eğer kullanıcı bir şey yazmışsa suggestions'ı güncelle
  useEffect(() => {
    if (guess.trim().length > 0 && allPlayers.length > 0) {
      handleGuessChange(guess);
    }
  }, [allPlayers]);

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
        .select('id, name, position, nationality')
        .in('id', uniquePlayerIds);

      if (players) {
        setAllPlayers(players as PlayerWithClubs[]);
      }
    } catch (error) {
      console.error('Error loading all players:', error);
    }
  }

  async function loadGame(excludeClubPair: { club1Id: string; club2Id: string } | null = null) {
    try {
      setLoading(true);

      // Tüm kulüpleri çek
      const { data: allClubs, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, country');

      if (clubsError) throw clubsError;
      if (!allClubs || allClubs.length < 2) {
        setLoading(false);
        return;
      }

      // Tüm kariyer geçmişini çek
      const { data: allHistory, error: historyError } = await supabase
        .from('player_career_history')
        .select('player_id, club_id');

      if (historyError) throw historyError;
      if (!allHistory || allHistory.length === 0) {
        setLoading(false);
        return;
      }

      // Her kulüp için oyuncu setlerini oluştur
      const clubPlayersMap = new Map<string, Set<string>>();
      allClubs.forEach((club) => {
        clubPlayersMap.set(
          club.id,
          new Set(
            allHistory
              .filter((h) => h.club_id === club.id)
              .map((h) => h.player_id)
          )
        );
      });

      // Ortak oyuncuları olan kulüp çiftlerini bul
      const validPairs: Array<{ club1: Club; club2: Club; commonCount: number }> = [];

      for (let i = 0; i < allClubs.length; i++) {
        for (let j = i + 1; j < allClubs.length; j++) {
          const club1 = allClubs[i];
          const club2 = allClubs[j];

          // Aynı kulübün kendisiyle eşleşmesini engelle - ID kontrolü
          if (club1.id === club2.id) {
            continue;
          }

          // Aynı kulüp adına sahip farklı ID'leri de engelle
          if (club1.name.toLowerCase().trim() === club2.name.toLowerCase().trim()) {
            continue;
          }

          // Mevcut çifti hariç tut
          if (
            excludeClubPair &&
            ((club1.id === excludeClubPair.club1Id &&
              club2.id === excludeClubPair.club2Id) ||
              (club1.id === excludeClubPair.club2Id &&
                club2.id === excludeClubPair.club1Id))
          ) {
            continue;
          }

          const players1 = clubPlayersMap.get(club1.id) || new Set();
          const players2 = clubPlayersMap.get(club2.id) || new Set();

          // Ortak oyuncuları bul
          const commonPlayers = Array.from(players1).filter((id) =>
            players2.has(id)
          );

          if (commonPlayers.length > 0) {
            validPairs.push({
              club1,
              club2,
              commonCount: commonPlayers.length,
            });
          }
        }
      }

      if (validPairs.length === 0) {
        setLoading(false);
        return;
      }

      // Rastgele bir çift seç
      const randomIndex = Math.floor(Math.random() * validPairs.length);
      const selectedPair = validPairs[randomIndex];

      setClub1(selectedPair.club1);
      setClub2(selectedPair.club2);
      setCurrentClubPair({
        club1Id: selectedPair.club1.id,
        club2Id: selectedPair.club2.id,
      });

      // Ortak oyuncuları bul
      const players1 = clubPlayersMap.get(selectedPair.club1.id) || new Set();
      const players2 = clubPlayersMap.get(selectedPair.club2.id) || new Set();
      const commonPlayerIds = Array.from(players1).filter((id) =>
        players2.has(id)
      );

      // RPC function'ı dene
      const { data: playersData, error: playersError } = await supabase.rpc(
        'get_common_players',
        {
          club1_id: selectedPair.club1.id,
          club2_id: selectedPair.club2.id,
        }
      );

      if (playersError || !playersData || playersData.length === 0) {
        // Fallback: manuel olarak bul
        const { data: players } = await supabase
          .from('players')
          .select('id, name, "position", nationality')
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

  function changeClubs() {
    setFoundPlayers(new Set());
    setGuess('');
    setAttempts(0);
    setMessage('');
    loadGame(currentClubPair);
  }

  function handleInputFocus() {
    // Input focus olduğunda scroll yap
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  function handleGuessChange(text: string) {
    setGuess(text);
    
    if (text.trim().length > 0) {
      // Eğer allPlayers yüklenmişse, tüm oyuncular arasından filtrele
      // Değilse, validPlayers içinde arama yap
      let filtered: PlayerWithClubs[] = [];
      
      if (allPlayers.length > 0) {
        // Tüm oyuncular arasından filtrele (players tablosundan)
        filtered = allPlayers.filter((player) =>
          startsWithTurkish(player.name, text.trim())
        );
        
        // Sadece validPlayers içindekileri göster (doğru cevaplar)
        filtered = filtered.filter((player) =>
          validPlayers.some((vp) => vp.id === player.id)
        );
      } else if (validPlayers.length > 0) {
        // allPlayers henüz yüklenmemişse, validPlayers içinde arama yap
        filtered = validPlayers.filter((player) =>
          startsWithTurkish(player.name, text.trim())
        );
      }
      
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

  function checkGuess() {
    setSuggestions([]);
    setAttempts(attempts + 1);

    // Türkçe karakter toleransı ile eşleşen oyuncuyu bul
    const matchedPlayer = validPlayers.find((p) =>
      compareTurkish(guess.trim(), p.name)
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
    if (!club1 || !club2) return;

    try {
      const score = completed
        ? Math.max(0, 100 - Math.floor(attempts / (foundPlayers.size || 1)) * 5)
        : foundPlayers.size * 10;

      await supabase.from('user_game_stats').insert({
        user_id: 'anonymous',
        game_type: 'common_link',
        game_id: `${club1.id}-${club2.id}`,
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
    loadGame(currentClubPair);
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!club1 || !club2) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No games available</Text>
      </View>
    );
  }

  const isComplete = foundPlayers.size === validPlayers.length;

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
            <Text style={styles.title}>Common Link</Text>
            {!isComplete && (
              <TouchableOpacity
                style={styles.changeClubsButton}
                onPress={changeClubs}>
                <RefreshCw size={20} color="#3b82f6" />
                <Text style={styles.changeClubsText}>Change Clubs</Text>
              </TouchableOpacity>
            )}
          </View>
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
                      <Text style={styles.suggestionDetails}>
                        {item.position} • {item.nationality}
                      </Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                />
              </View>
            )}
          </View>

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
  changeClubsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  changeClubsText: {
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
    fontWeight: '600',
  },
  suggestionDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});
