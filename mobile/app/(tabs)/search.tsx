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
  Image,
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
  deadline?: string;
  language?: string;
  fee?: string;
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

const getShortDeadline = (deadlineText?: string) => {
  if (!deadlineText) return 'Verify';
  const text = deadlineText.toLowerCase();
  
  if (text.includes('january-july') && text.includes('july-january')) {
    return 'Jan-July / July-Jan';
  }
  if (text.includes('december-march')) return 'Dec - March';
  if (text.includes('january-may')) return 'Jan - May';
  if (text.includes('december-april')) return 'Dec - April';
  if (text.includes('november-march')) return 'Nov - March';
  if (text.includes('january') && text.includes('august')) return 'Jan (Autumn) / Aug (Spring)';
  if (text.includes('6-10 months')) return '6-10 months before';
  
  const monthRegex = /(january|february|march|april|may|june|july|august|september|october|november|december)/gi;
  const matches = deadlineText.match(monthRegex);
  if (matches && matches.length > 0) {
    const unique = [...new Set(matches.map(m => m.slice(0, 3)))];
    return unique.join(' - ');
  }
  
  if (deadlineText.length > 30) {
    return 'Verify on site';
  }
  return deadlineText;
};

const getShortFee = (feeText?: string) => {
  if (!feeText) return 'Verify';
  return feeText.split(/ at | for | depending |;/i)[0].trim();
};

const countryFlags: Record<string, string> = {
  'germany': '🇩🇪',
  'uk': '🇬🇧',
  'united kingdom': '🇬🇧',
  'usa': '🇺🇸',
  'united states': '🇺🇸',
  'canada': '🇨🇦',
  'australia': '🇦🇺',
  'netherlands': '🇳🇱',
  'sweden': '🇸🇪',
  'france': '🇫🇷',
  'switzerland': '🇨🇭',
  'japan': '🇯🇵',
};

const getCountryFlag = (country?: string) => {
  if (!country) return '🌍';
  return countryFlags[country.toLowerCase().trim()] || '🌍';
};

const formatDegree = (degree?: string) => {
  if (!degree) return '';
  const d = degree.toLowerCase().trim();
  if (d === 'master') return "Master";
  if (d === 'bachelor') return "Bachelor";
  if (d === 'phd') return "PhD";
  return degree.charAt(0).toUpperCase() + degree.slice(1);
};

const getUniDomain = (uni?: string, city?: string) => {
  if (!uni) return 'daad.de';
  const u = uni.toLowerCase().trim();
  const c = city ? city.toLowerCase().trim() : '';

  if (u.includes('köln') || u.includes('cologne')) {
    if (u.includes('th') || u.includes('hochschule')) return 'th-koeln.de';
    return 'uni-koeln.de';
  }
  if (u.includes('paderborn')) return 'uni-paderborn.de';
  if (u.includes('würzburg') || u.includes('wuerzburg')) return 'uni-wuerzburg.de';
  if (u.includes('dresden')) return 'tu-dresden.de';
  if (u.includes('chemnitz')) return 'tu-chemnitz.de';
  if (u.includes('south westphalia') || u.includes('südwestfalen')) return 'fh-swf.de';
  if (u.includes('frankfurt')) {
    if (u.includes('applied sciences')) return 'frankfurt-university.de';
    return 'uni-frankfurt.de';
  }
  if (u.includes('munich') || u.includes('münchen')) {
    if (u.includes('technical') || u.includes('tu')) return 'tum.de';
    return 'lmu.de';
  }
  if (u.includes('german international')) return 'giu-berlin.de';
  if (u.includes('karlsruhe') || u.includes('kit')) return 'kit.edu';
  if (u.includes('aachen') || u.includes('rwth')) return 'rwth-aachen.de';
  if (u.includes('berlin')) {
    if (u.includes('tu') || u.includes('technical')) return 'tu-berlin.de';
    if (u.includes('free') || u.includes('freie')) return 'fu-berlin.de';
    return 'hu-berlin.de';
  }
  if (u.includes('heidelberg')) return 'uni-heidelberg.de';
  if (u.includes('bonn')) return 'uni-bonn.de';
  if (u.includes('hamburg')) return 'uni-hamburg.de';
  if (u.includes('stuttgart')) return 'uni-stuttgart.de';
  if (u.includes('darmstadt')) return 'tu-darmstadt.de';
  if (u.includes('freiburg')) return 'uni-freiburg.de';
  if (u.includes('tübingen') || u.includes('tuebingen')) return 'uni-tuebingen.de';
  if (u.includes('göttingen') || u.includes('goettingen')) return 'uni-goettingen.de';
  if (u.includes('erlangen') || u.includes('nürnberg') || u.includes('fau')) return 'fau.de';

  if (c) {
    const cleanCity = c.split(/\s+/)[0].replace(/[^a-z-]/g, '');
    if (u.includes('technical') || u.includes('tu ') || u.includes('technische')) {
      return `tu-${cleanCity}.de`;
    }
    if (u.includes('applied sciences') || u.includes('fh ') || u.includes('fachhochschule') || u.includes('hochschule')) {
      return `hs-${cleanCity}.de`;
    }
    return `uni-${cleanCity}.de`;
  }

  return 'daad.de';
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
      console.warn('Error saving favorite programs:', err);
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
      console.warn("Couldn't open URL in-app browser:", err);
      // Fallback to opening externally if WebBrowser fails
      Linking.openURL(url).catch((e) =>
        console.warn("Couldn't open URL externally:", e)
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
    const domainName = getUniDomain(item.university, item.city);
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domainName}&sz=64`;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.programCard,
          { 
            backgroundColor: colorScheme === 'dark' ? 'rgba(25, 29, 41, 0.55)' : '#ffffff',
            borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : colors.border
          },
        ]}
        onPress={() => handleOpenLink(item.link)}
        activeOpacity={0.8}
      >
        {/* Card Header Row (City, Love Button & Match Score Box) */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.locationRow}>
            {item.city ? (
              <Text style={[styles.cityText, { color: '#ff6b00' }]}>📍 {item.city}</Text>
            ) : (
              <View />
            )}
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(item);
              }}
              style={styles.loveButton}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={loved ? 'heart' : 'heart-o'}
                size={15}
                color={loved ? '#ff4b6e' : colors.mutedText}
              />
            </TouchableOpacity>

            <View style={[styles.scoreBox, { backgroundColor: colorScheme === 'dark' ? 'rgba(74, 222, 128, 0.12)' : '#e6fbf1', borderColor: colorScheme === 'dark' ? 'rgba(74, 222, 128, 0.25)' : 'rgba(74, 222, 128, 0.15)' }]}>
              <Text style={styles.scoreText}>{Math.round(score)}% Match</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text
          style={[styles.programTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {formatAbbreviation(item.course || item.title || 'Selected Program')}
        </Text>

        {/* University Info Row (Logo + Uni Name) */}
        <View style={styles.uniRow}>
          <View style={[styles.uniLogoWrapper, { borderColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : '#e1e5eb' }]}>
            <Image 
              source={{ uri: faviconUrl }} 
              style={styles.uniLogo}
            />
          </View>
          <Text style={[styles.programUniversity, { color: colors.mutedText }]} numberOfLines={1}>
            {item.university}
          </Text>
        </View>

        {/* Badges Row (Deadline) */}
        {item.deadline ? (
          <View style={styles.badgesWrapper}>
            <View style={[styles.deadlineBadge, { backgroundColor: colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb', borderColor: colorScheme === 'dark' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.deadlineText, { color: '#f59e0b' }]}>
                Deadline: {getShortDeadline(item.deadline)}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Separator and Bottom Meta Row (Duration, Language) */}
        {item.duration || item.language ? (
          <>
            <View style={[styles.cardSeparator, { backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#e1e5eb' }]} />
            <View style={styles.programMetaRow}>
              {item.duration ? (
                <View style={styles.metaItemCompact}>
                  <Text style={styles.metaItemIcon}>⏱️</Text>
                  <Text style={[styles.metaItemText, { color: colors.mutedText }]} numberOfLines={1}>{item.duration}</Text>
                </View>
              ) : null}
              {item.language ? (
                <View style={styles.metaItemCompact}>
                  <Text style={styles.metaItemIcon}>🌐</Text>
                  <Text style={[styles.metaItemText, { color: colors.mutedText }]} numberOfLines={1}>{item.language}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradedBackground />
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            My <Text style={{ color: colors.tint }}>Matches</Text>
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Your personalized university matches
          </Text>
        </View>
        {results.length > 0 && (
          <View style={[styles.totalMatchesBadge, { backgroundColor: colors.tint, borderColor: colors.tint }]}>
            <Text style={[styles.totalMatchesBadgeText, { color: '#ffffff' }]}>{results.length}</Text>
            <Text style={[styles.totalMatchesBadgeLabel, { color: 'rgba(255, 255, 255, 0.8)' }]}>matches</Text>
          </View>
        )}
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

      {/* Content */}
      {results.length === 0 ? (
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    marginBottom: Platform.OS === 'ios' ? 104 : 86,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  totalMatchesBadge: {
    minWidth: 68,
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  totalMatchesBadgeText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  totalMatchesBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
    textTransform: 'lowercase',
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
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBox: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 14,
    marginRight: 6,
  },
  countryText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cityText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  loveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 6,
    borderRadius: 18,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  programTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
  },
  uniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  uniLogoWrapper: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uniLogo: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  programUniversity: {
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
  },
  scoreText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '800',
  },
  degreeBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  degreeBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  deadlineBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  deadlineText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  cardSeparator: {
    height: 1,
    marginVertical: 8,
  },
  programMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  metaItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaItemIcon: {
    fontSize: 13.5,
  },
  metaItemText: {
    fontSize: 12,
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
