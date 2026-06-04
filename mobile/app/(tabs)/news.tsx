import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  Linking,
  Platform
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchNews } from '../../services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradedBackground } from '@/components/GradedBackground';

const COUNTRY_FLAGS: Record<string, string> = {
  'Germany': '\u{1F1E9}\u{1F1EA}', 'UK': '\u{1F1EC}\u{1F1E7}', 'USA': '\u{1F1FA}\u{1F1F8}',
  'Canada': '\u{1F1E8}\u{1F1E6}', 'Australia': '\u{1F1E6}\u{1F1FA}', 'Netherlands': '\u{1F1F3}\u{1F1F1}',
  'Sweden': '\u{1F1F8}\u{1F1EA}', 'France': '\u{1F1EB}\u{1F1F7}', 'Switzerland': '\u{1F1E8}\u{1F1ED}',
  'Japan': '\u{1F1EF}\u{1F1F5}',
};

const FALLBACK_NEWS = [
  { title: "Germany extends student visa processing to 8 weeks for 2026 intake", source: "daad.de", date: "May 2026", summary: "DAAD reports increased demand. Apply early for German student visas.", country: "Germany", link: "https://www.daad.de" },
  { title: "UK Graduate Route visa — 2 years post-study work rights confirmed", source: "gov.uk", date: "May 2026", summary: "International graduates can stay 2 years after completing UK degrees.", country: "UK", link: "https://www.gov.uk/graduate-visa" },
  { title: "Holland Scholarship 2026-2027 applications now open", source: "studyinholland.nl", date: "Apr 2026", summary: "Available for students outside EEA applying to Dutch universities.", country: "Netherlands", link: "https://www.studyinholland.nl" },
  { title: "Canada caps international student permits for 2026", source: "canada.ca", date: "Apr 2026", summary: "New annual cap introduced to manage housing pressure in major cities.", country: "Canada", link: "https://www.canada.ca" },
  { title: "Sweden updates tuition fees for non-EU students", source: "universityadmissions.se", date: "Apr 2026", summary: "Swedish universities publish updated fee structures for non-EU students.", country: "Sweden", link: "https://www.universityadmissions.se" },
  { title: "DAAD scholarships for Master's and PhD — deadlines June 2026", source: "daad.de", date: "Mar 2026", summary: "Multiple DAAD funding programs open now. Deadline approaching fast.", country: "Germany", link: "https://www.daad.de" },
  { title: "Australia simplifies student visa process for 2026", source: "homeaffairs.gov.au", date: "Mar 2026", summary: "New streamlined process reduces student visa processing to 3-4 weeks.", country: "Australia", link: "https://immi.homeaffairs.gov.au" },
  { title: "France Campus Bourses — new scholarships for international students", source: "campusfrance.org", date: "Mar 2026", summary: "France opens new scholarship round for Master students worldwide.", country: "France", link: "https://www.campusfrance.org" },
];

interface NewsItem {
  title: string;
  source: string;
  summary: string;
  url?: string;
  link?: string;
  date?: string;
  country?: string;
}

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchNews();
      let items: NewsItem[] = [];
      if (Array.isArray(data) && data.length > 0) {
        items = data;
      } else if (data && Array.isArray(data.news) && data.news.length > 0) {
        items = data.news;
      }

      if (items.length > 0) {
        setNews(items);
        await AsyncStorage.setItem('cachedNews', JSON.stringify(items));
      } else {
        // Try cache
        const cached = await AsyncStorage.getItem('cachedNews');
        if (cached) {
          setNews(JSON.parse(cached));
        } else {
          setNews(FALLBACK_NEWS as NewsItem[]);
        }
      }
    } catch {
      // Try cache, then fallback
      try {
        const cached = await AsyncStorage.getItem('cachedNews');
        if (cached) {
          setNews(JSON.parse(cached));
        } else {
          setNews(FALLBACK_NEWS as NewsItem[]);
        }
      } catch {
        setNews(FALLBACK_NEWS as NewsItem[]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const handleOpenLink = (item: NewsItem) => {
    const url = item.url || item.link;
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradedBackground />
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNews(true)}
            tintColor={colors.tint}
          />
        }
      >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Studplex <Text style={{ color: colors.tint }}>Daily</Text>
          </Text>
          <View style={styles.liveDot}>
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.liveText, { color: colors.mutedText }]}>Live</Text>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
          International study and university updates
        </Text>
      </View>

      {news.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FontAwesome name="newspaper-o" size={40} color={colors.mutedText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No News Available</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
            Pull down to refresh and check for the latest updates.
          </Text>
        </View>
      ) : (
        news.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleOpenLink(item)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardCountryRow}>
                <Text style={styles.cardFlag}>{COUNTRY_FLAGS[item.country || ''] || ''}</Text>
                <Text style={[styles.cardCountry, { color: colors.text }]}>{item.country || 'Global'}</Text>
              </View>
              {item.date && (
                <Text style={[styles.dateText, { color: colors.mutedText }]}>{item.date}</Text>
              )}
            </View>

            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.cardSummary, { color: colors.mutedText }]} numberOfLines={3}>
              {item.summary}
            </Text>

            <View style={styles.cardBottom}>
              <Text style={[styles.sourceText, { color: colors.tint }]}>
                {item.source}
              </Text>
              <View style={styles.readMoreRow}>
                <Text style={[styles.readMore, { color: colors.mutedText }]}>Read more</Text>
                <FontAwesome name="angle-right" size={14} color={colors.mutedText} style={{ marginLeft: 4 }} />
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    marginBottom: Platform.OS === 'ios' ? 104 : 86,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardFlag: {
    fontSize: 16,
  },
  cardCountry: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 6,
  },
  cardSummary: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMore: {
    fontSize: 13,
    fontWeight: '600',
  },
});
