import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import GuessPlayerGame from '@/components/GuessPlayerGame';
import CommonLinkGame from '@/components/CommonLinkGame';
import { User, Gamepad2 } from 'lucide-react-native';

export default function GamesScreen() {
  const params = useLocalSearchParams();
  const [activeMode, setActiveMode] = useState<'guess' | 'link'>('guess');

  useEffect(() => {
    if (params.mode === 'link') {
      setActiveMode('link');
    } else {
      setActiveMode('guess');
    }
  }, [params.mode]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeMode === 'guess' && styles.tabActive]}
          onPress={() => setActiveMode('guess')}>
          <User
            size={20}
            color={activeMode === 'guess' ? '#10b981' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeMode === 'guess' && styles.tabTextActive,
            ]}>
            Guess Player
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeMode === 'link' && styles.tabActive]}
          onPress={() => setActiveMode('link')}>
          <Gamepad2
            size={20}
            color={activeMode === 'link' ? '#10b981' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeMode === 'link' && styles.tabTextActive,
            ]}>
            Common Link
          </Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'guess' ? <GuessPlayerGame /> : <CommonLinkGame />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 48,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginLeft: 8,
  },
  tabTextActive: {
    color: '#10b981',
  },
});
