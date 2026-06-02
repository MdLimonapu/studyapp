import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradedBackground } from '@/components/GradedBackground';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@clerk/expo';

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

interface SearchQuery {
  country?: string;
  degree?: string;
  field?: string;
}

const formatAbbreviation = (val?: string) => {
  if (!val) return '';
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

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { isSignedIn, isLoaded } = useAuth();

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
      console.log('Error loading cached matches:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const displayedResults = (!isLoaded || isSignedIn) ? results : results.slice(0, 3);

  const toggleFavorite = async (item: Program) => {
    try {
      const isFav = favorites.some(
        (p) =>
          (p.link === item.link && p.link) ||
          (p.university === item.university && p.course === item.course)
      );
      let newFav: Program[] = [];
      if (isFav) {
        newFav = favorites.filter(
          (p) =>
            !(
              (p.link === item.link && p.link) ||
              (p.university === item.university && p.course === item.course)
            )
        );
      } else {
        newFav = [...favorites, item];
      }
      setFavorites(newFav);
      await AsyncStorage.setItem('loved_programs', JSON.stringify(newFav));
    } catch (err) {
      console.error('Error saving favorite programs:', err);
    }
  };

  const isItemFavorite = (item: Program) => {
    return favorites.some(
      (p) =>
        (p.link === item.link && p.link) ||
        (p.university === item.university && p.course === item.course)
    );
  };

  useEffect(() => {
    loadMatches();

    // Poll AsyncStorage every 2 seconds for new results
    const interval = setInterval(() => {
      loadMatches();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenLink = async (url?: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    } catch (err) {
      console.error("Couldn't open URL in-app browser:", err);
      // Fallback to opening externally if WebBrowser fails
      Linking.openURL(url).catch((e) =>
        console.error("Couldn't open URL externally:", e)
      );
    }
  };

  if (loading) {
    return (
      <View
        style={[styles.container, styles.center, { backgroundColor: colors.background }]}
      >
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
        style={[
          styles.programCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => handleOpenLink(item.link)}
        activeOpacity={0.8}
      >
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item);
          }}
          style={[styles.loveButton, { borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <FontAwesome
            name={loved ? 'heart' : 'heart-o'}
            size={16}
            color={loved ? '#ff4b6e' : colors.mutedText}
          />
        </TouchableOpacity>

        <View style={styles.programHeader}>
          <Text
            style={[styles.programTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {formatAbbreviation(item.course || item.title || 'Selected Program')}
          </Text>
        </View>

        <Text style={[styles.programUniversity, { color: colors.mutedText }]}>
          {item.university}
        </Text>

        <View style={styles.programFooter}>
          <View style={styles.metaBadgesRow}>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>{Math.round(score)}% Match</Text>
            </View>
          </View>

          {item.city ? (
            <View style={styles.locationRow}>
              <FontAwesome
                name="map-marker"
                size={13}
                color="#ff6b00"
                style={styles.locationIcon}
              />
              <Text style={[styles.locationText, { color: '#ff6b00' }]}>
                {item.city}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradedBackground />
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My <Text style={{ color: colors.tint }}>Matches</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
          Your personalized university matches
        </Text>
      </View>

      {/* Search Query Badges */}
      {searchQuery && (
        <View style={styles.badgesRow}>
          {searchQuery.country ? (
            <View
              style={[
                styles.indicatorBadge,
                {
                  backgroundColor: 'rgba(96, 165, 251, 0.08)',
                  borderColor: 'rgba(96, 165, 251, 0.25)',
                },
              ]}
            >
              <FontAwesome
                name="globe"
                size={11}
                color="#60a5fa"
                style={styles.badgeIcon}
              />
              <Text style={[styles.indicatorBadgeText, { color: '#60a5fa' }]}>
                {searchQuery.country}
              </Text>
            </View>
          ) : null}
          {searchQuery.degree ? (
            <View
              style={[
                styles.indicatorBadge,
                {
                  backgroundColor: 'rgba(96, 165, 251, 0.08)',
                  borderColor: 'rgba(96, 165, 251, 0.25)',
                },
              ]}
            >
              <FontAwesome
                name="graduation-cap"
                size={10}
                color="#60a5fa"
                style={styles.badgeIcon}
              />
              <Text style={[styles.indicatorBadgeText, { color: '#60a5fa' }]}>
                {formatAbbreviation(searchQuery.degree)}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Tab Filter Bar */}
      <View style={[styles.tabBar, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            !showFavoritesOnly && [
              styles.tabButtonActive,
              { backgroundColor: `${colors.tint}15` },
            ],
          ]}
          onPress={() => setShowFavoritesOnly(false)}
        >
          <Text
            style={[
              styles.tabButtonText,
              { color: colors.mutedText },
              !showFavoritesOnly && { fontWeight: '800', color: colors.tint },
            ]}
          >
            All Matches ({results.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            showFavoritesOnly && [
              styles.tabButtonActive,
              { backgroundColor: 'rgba(255, 75, 110, 0.1)' },
            ],
          ]}
          onPress={() => setShowFavoritesOnly(true)}
        >
          <View style={styles.tabContent}>
            <FontAwesome
              name="heart"
              size={12}
              color={showFavoritesOnly ? '#ff4b6e' : colors.mutedText}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: colors.mutedText },
                showFavoritesOnly && { fontWeight: '800', color: '#ff4b6e' },
              ]}
            >
              Saved ({favorites.length})
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {showFavoritesOnly ? (
        favorites.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <FontAwesome
              name="heart-o"
              size={48}
              color={colors.mutedText}
              style={styles.emptyIconSpacing}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Saved Programs
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
              Tap the heart icon on any program card to save it here for quick
              access later.
            </Text>
          </View>
        ) : (
          <View style={styles.resultsList}>
            {favorites.map((item, index) => renderCard(item, index))}
          </View>
        )
      ) : results.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <FontAwesome
            name="search"
            size={48}
            color={colors.mutedText}
            style={styles.emptyIconSpacing}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Matches Yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
            Use the search tab to find university programs that match your
            preferences and goals.
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
          {displayedResults.map((item, index) => renderCard(item, index))}

          {isLoaded && !isSignedIn && results.length > 3 && (
            <View
              style={[
                styles.unlockCard,
                { backgroundColor: colors.card, borderColor: '#ff6b00' },
              ]}
            >
              <FontAwesome
                name="lock"
                size={36}
                color="#ff6b00"
                style={{ marginBottom: 12 }}
              />
              <Text style={[styles.unlockTitle, { color: colors.text }]}>
                Unlock {results.length - 3} More Matches
              </Text>
              <Text style={[styles.unlockDesc, { color: colors.mutedText }]}>
                Sign in to see all your matching university programs worldwide.
              </Text>
              <TouchableOpacity
                style={[styles.unlockButton, { backgroundColor: '#ff6b00' }]}
                onPress={() => router.navigate('/(tabs)/profile' as any)}
              >
                <Text style={styles.unlockButtonText}>Sign In / Register</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
    </View>
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
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  indicatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 6,
  },
  indicatorBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    // background set dynamically
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabIcon: {
    marginRight: 6,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
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
  emptyIconSpacing: {
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
    shadowColor: '#ff6b00',
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
  unlockCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  unlockTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  unlockDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  unlockButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  unlockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
