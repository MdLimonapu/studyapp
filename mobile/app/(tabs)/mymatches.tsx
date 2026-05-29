import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Linking,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Program {
  title: string;
  course?: string;
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

const formatAbbreviation = (val?: string) => {
  if (!val) return "";
  return val
    .replace(/\bBEng\b/g, 'B.Eng.')
    .replace(/\bMEng\b/g, 'M.Eng.')
    .replace(/\bBSc\b/g, 'B.Sc.')
    .replace(/\bMSc\b/g, 'M.Sc.')
    .replace(/\bBA\b/g, 'B.A.')
    .replace(/\bMA\b/g, 'M.A.')
    .replace(/\bPhD\b/g, 'Ph.D.')
    .replace(/\bbeng\b/g, 'B.Eng.')
    .replace(/\bmeng\b/g, 'M.Eng.')
    .replace(/\bbsc\b/g, 'B.Sc.')
    .replace(/\bmsc\b/g, 'M.Sc.');
};

interface SearchQuery {
  country?: string;
  degree?: string;
  field?: string;
}

export default function MyMatchesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [results, setResults] = useState<Program[]>([]);
  const [favorites, setFavorites] = useState<Program[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState<SearchQuery | null>(null);
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

      const rawLoved = await AsyncStorage.getItem('loved_programs');
      if (rawLoved) {
        setFavorites(JSON.parse(rawLoved));
      }

      const rawQuery = await AsyncStorage.getItem('search_query');
      if (rawQuery) {
        setSearchQuery(JSON.parse(rawQuery));
      } else {
        setSearchQuery(null);
      }
    } catch (err) {
      console.log("Error loading cached matches:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (item: Program) => {
    try {
      const isFav = favorites.some(p => (p.link === item.link && p.link) || (p.university === item.university && p.course === item.course));
      let newFav: Program[] = [];
      if (isFav) {
        newFav = favorites.filter(p => !((p.link === item.link && p.link) || (p.university === item.university && p.course === item.course)));
      } else {
        newFav = [...favorites, item];
      }
      setFavorites(newFav);
      await AsyncStorage.setItem('loved_programs', JSON.stringify(newFav));
    } catch (err) {
      console.error("Error saving favorite programs:", err);
    }
  };

  const isItemFavorite = (item: Program) => {
    return favorites.some(p => (p.link === item.link && p.link) || (p.university === item.university && p.course === item.course));
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

  const renderCard = (item: Program, index: number) => {
    const score = item.score || (item.match_rating ? item.match_rating * 33 : 85);
    const loved = isItemFavorite(item);
    return (
      <TouchableOpacity 
        key={index} 
        style={[styles.programCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleOpenLink(item.link)}
        activeOpacity={0.8}
      >
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item);
          }}
          style={styles.loveButton}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>{loved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>

        <View style={styles.programHeader}>
          <Text style={[styles.programTitle, { color: colors.text }]} numberOfLines={2}>
            {formatAbbreviation(item.course || item.title || "Selected Program")}
          </Text>
        </View>
        
        <Text style={[styles.programUniversity, { color: colors.text, opacity: 0.7 }]}>
          {item.university}
        </Text>
        
        <View style={styles.programFooter}>
          <View style={styles.metaBadgesRow}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(score)}% Match</Text>
            </View>
          </View>
          
          {item.city ? (
            <Text style={[styles.locationText, { color: '#8e9aa8' }]}>
              📍 {item.city}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Search Query Indicator (Row of styled badges) */}
      {searchQuery && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <View style={[styles.indicatorBadge, { backgroundColor: 'rgba(96, 165, 251, 0.08)', borderColor: 'rgba(96, 165, 251, 0.25)' }]}>
            <Text style={[styles.indicatorBadgeText, { color: '#60a5fa' }]}>
              🌎 {searchQuery.country || 'All Countries'}
            </Text>
          </View>
          <View style={[styles.indicatorBadge, { backgroundColor: 'rgba(96, 165, 251, 0.08)', borderColor: 'rgba(96, 165, 251, 0.25)' }]}>
            <Text style={[styles.indicatorBadgeText, { color: '#60a5fa' }]}>
              🎓 {formatAbbreviation(searchQuery.degree || 'Master')}
            </Text>
          </View>
        </View>
      )}

      {/* Tab Filter Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, !showFavoritesOnly && styles.tabButtonActive]}
          onPress={() => setShowFavoritesOnly(false)}
        >
          <Text style={[styles.tabButtonText, { color: colors.text }, !showFavoritesOnly && { fontWeight: '800', color: colors.tint }]}>
            All Matches ({results.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, showFavoritesOnly && styles.tabButtonActive]}
          onPress={() => setShowFavoritesOnly(true)}
        >
          <Text style={[styles.tabButtonText, { color: colors.text }, showFavoritesOnly && { fontWeight: '800', color: '#ff4b80' }]}>
            Favorites ❤️ ({favorites.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conditional Rendering of Lists */}
      {showFavoritesOnly ? (
        favorites.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyIcon}>❤️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorites Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.text, opacity: 0.6 }]}>
              Tap the heart icon on any program card to save it here for future reference.
            </Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {favorites.map((item, index) => renderCard(item, index))}
          </View>
        )
      ) : (
        results.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.text, opacity: 0.6 }]}>
              Use the Match tab to search and find university programs matching your preferences.
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.tint }]}
              onPress={() => router.navigate('/(tabs)')}
            >
              <Text style={styles.emptyButtonText}>Start Search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {results.map((item, index) => renderCard(item, index))}
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    marginBottom: Platform.OS === 'ios' ? 100 : 85,
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
  indicatorBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  indicatorBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
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
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
    position: 'relative',
  },
  loveButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 6,
    borderRadius: 18,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    marginRight: 24,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  scoreText: {
    color: '#4ade80',
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
  metaBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metaBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  metaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
