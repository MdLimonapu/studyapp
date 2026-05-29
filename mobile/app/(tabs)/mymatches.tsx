import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Program {
  title: string;
  university: string;
  country: string;
  degree: string;
  tuitionFee?: string;
  duration?: string;
  score?: number;
  match_rating?: number;
  link?: string;
  city?: string;
}

export default function MyMatchesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [results, setResults] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = async () => {
    try {
      const raw = await AsyncStorage.getItem('search_results');
      if (raw) {
        const parsed = JSON.parse(raw);
        setResults(Array.isArray(parsed) ? parsed : parsed.courses || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.log("Error loading cached matches:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    
    // Set up polling to update matches when user performs a new search
    const interval = setInterval(() => {
      loadMatches();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    Linking.openURL(url).catch(err => console.error("Couldn't open URL:", err));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My <Text style={{ color: colors.tint }}>Matches</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text, opacity: 0.6 }]}>
          Your personalized matching university programs
        </Text>
      </View>

      {results.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.text, opacity: 0.6 }]}>
            Use the Match tab to search and find university programs matching your preferences.
          </Text>
          <TouchableOpacity 
            style={[styles.emptyButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.emptyButtonText}>Start Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.resultsList}>
          {results.map((item, index) => {
            const score = item.score || (item.match_rating ? item.match_rating * 33 : 85);
            return (
              <TouchableOpacity 
                key={index} 
                style={[styles.programCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleOpenLink(item.link)}
                activeOpacity={0.8}
              >
                <View style={styles.programHeader}>
                  <Text style={[styles.programTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{Math.round(score)}% Match</Text>
                  </View>
                </View>
                
                <Text style={[styles.programUniversity, { color: colors.text, opacity: 0.7 }]}>
                  {item.university}{item.city ? ` • ${item.city}` : ''}
                </Text>
                
                <View style={styles.programFooter}>
                  <Text style={styles.programMeta}>{item.country} • {item.degree}</Text>
                  {item.tuitionFee ? (
                    <Text style={[styles.programFee, { color: colors.tint }]}>{item.tuitionFee}</Text>
                  ) : (
                    <Text style={[styles.programFee, { color: colors.tint }]}>No Fees Info</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  emptyCard: {
    padding: 30,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  resultsList: {
    gap: 12,
  },
  programCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    lineHeight: 22,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
  },
  scoreText: {
    color: '#ccff00',
    fontSize: 12,
    fontWeight: '800',
  },
  programUniversity: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 14,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programMeta: {
    fontSize: 12.5,
    color: '#8e9aa8',
  },
  programFee: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
