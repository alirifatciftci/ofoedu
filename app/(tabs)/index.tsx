import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Trophy, Gamepad2 } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Football Trivia</Text>
        <Text style={styles.subtitle}>Test your football knowledge</Text>
      </View>

      <View style={styles.gamesGrid}>
        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => router.push('/games?mode=guess')}>
          <View style={styles.gameIcon}>
            <User size={40} color="#10b981" />
          </View>
          <Text style={styles.gameTitle}>Guess The Player</Text>
          <Text style={styles.gameDescription}>
            Identify players by their career history and club transfers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gameCard}
          onPress={() => router.push('/games?mode=link')}>
          <View style={styles.gameIcon}>
            <Gamepad2 size={40} color="#3b82f6" />
          </View>
          <Text style={styles.gameTitle}>Common Link</Text>
          <Text style={styles.gameDescription}>
            Name players who played for two specific clubs
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Features</Text>

        <View style={styles.featureCard}>
          <Trophy size={24} color="#f59e0b" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Daily Challenges</Text>
            <Text style={styles.featureDescription}>
              New puzzles added regularly to keep you engaged
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Gamepad2 size={24} color="#8b5cf6" />
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>Multiple Game Modes</Text>
            <Text style={styles.featureDescription}>
              Various puzzle types to test different aspects of your knowledge
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#10b981',
    padding: 32,
    paddingTop: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#d1fae5',
    textAlign: 'center',
    marginTop: 8,
  },
  gamesGrid: {
    padding: 16,
  },
  gameCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  gameIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  gameDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
