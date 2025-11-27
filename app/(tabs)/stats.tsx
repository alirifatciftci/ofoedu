import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { UserGameStats } from '@/types/database';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react-native';

interface StatsData {
  totalGames: number;
  gamesWon: number;
  averageScore: number;
  bestScore: number;
  guessPlayerStats: {
    played: number;
    won: number;
  };
  commonLinkStats: {
    played: number;
    won: number;
  };
}

export default function StatsScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalGames: 0,
    gamesWon: 0,
    averageScore: 0,
    bestScore: 0,
    guessPlayerStats: { played: 0, won: 0 },
    commonLinkStats: { played: 0, won: 0 },
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_game_stats')
        .select('*')
        .eq('user_id', 'anonymous');

      if (error) throw error;

      const allStats = data as UserGameStats[];

      const guessPlayerGames = allStats.filter(
        (s) => s.game_type === 'guess_player'
      );
      const commonLinkGames = allStats.filter(
        (s) => s.game_type === 'common_link'
      );

      const totalGames = allStats.length;
      const gamesWon = allStats.filter((s) => s.completed).length;
      const scores = allStats.map((s) => s.score);
      const averageScore =
        scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

      setStats({
        totalGames,
        gamesWon,
        averageScore,
        bestScore,
        guessPlayerStats: {
          played: guessPlayerGames.length,
          won: guessPlayerGames.filter((s) => s.completed).length,
        },
        commonLinkStats: {
          played: commonLinkGames.length,
          won: commonLinkGames.filter((s) => s.completed).length,
        },
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const winRate =
    stats.totalGames > 0
      ? Math.round((stats.gamesWon / stats.totalGames) * 100)
      : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Stats</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Trophy size={32} color="#10b981" />
          </View>
          <Text style={styles.statValue}>{stats.totalGames}</Text>
          <Text style={styles.statLabel}>Games Played</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Target size={32} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>{winRate}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <TrendingUp size={32} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{stats.averageScore}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Award size={32} color="#8b5cf6" />
          </View>
          <Text style={styles.statValue}>{stats.bestScore}</Text>
          <Text style={styles.statLabel}>Best Score</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Mode Stats</Text>

        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Guess The Player</Text>
          <View style={styles.modeStats}>
            <Text style={styles.modeStatText}>
              Played: {stats.guessPlayerStats.played}
            </Text>
            <Text style={styles.modeStatText}>
              Won: {stats.guessPlayerStats.won}
            </Text>
            <Text style={styles.modeStatText}>
              Win Rate:{' '}
              {stats.guessPlayerStats.played > 0
                ? Math.round(
                    (stats.guessPlayerStats.won /
                      stats.guessPlayerStats.played) *
                      100
                  )
                : 0}
              %
            </Text>
          </View>
        </View>

        <View style={styles.modeCard}>
          <Text style={styles.modeTitle}>Common Link</Text>
          <View style={styles.modeStats}>
            <Text style={styles.modeStatText}>
              Played: {stats.commonLinkStats.played}
            </Text>
            <Text style={styles.modeStatText}>
              Won: {stats.commonLinkStats.won}
            </Text>
            <Text style={styles.modeStatText}>
              Win Rate:{' '}
              {stats.commonLinkStats.played > 0
                ? Math.round(
                    (stats.commonLinkStats.won /
                      stats.commonLinkStats.played) *
                      100
                  )
                : 0}
              %
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 32,
    paddingTop: 64,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 32,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeStatText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
