import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  Image,
  Linking,
  Platform
} from 'react-native';
import { fetchNews } from '../../services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  url: string;
  date?: string;
  imageUrl?: string;
}

export default function NewsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = () => {
    setLoading(true);
    fetchNews()
      .then(data => {
        if (Array.isArray(data)) {
          setNews(data);
        } else if (data && Array.isArray(data.news)) {
          setNews(data.news);
        }
      })
      .catch(err => {
        console.error("Error loading news:", err);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadNews();
  }, []);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Studplex <Text style={{ color: colors.tint }}>Daily</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: colorScheme === 'dark' ? '#8e9aa8' : '#6b7280' }]}>
          International study and university updates
        </Text>
      </View>
 
      {news.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>No news updates available right now.</Text>
        </View>
      ) : (
        news.map((item, index) => (
          <TouchableOpacity 
            key={item.id || index}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleOpenLink(item.url)}
            activeOpacity={0.8}
          >
            {item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            )}
            <View style={styles.cardContent}>
              <View style={styles.cardMeta}>
                <Text style={[styles.sourceText, { color: colors.tint }]}>{item.source}</Text>
                {item.date && <Text style={[styles.dateText, { color: colorScheme === 'dark' ? '#8e9aa8' : '#6b7280' }]}>{item.date}</Text>}
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.cardSummary, { color: colorScheme === 'dark' ? '#a0aec0' : '#4b5563' }]} numberOfLines={3}>
                {item.summary}
              </Text>
              <Text style={[styles.readMore, { color: colors.tint }]}>Read Full Article →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
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
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
  },
});
