import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  FlatList
} from 'react-native';
import { fetchCountries, searchCourses } from '../../services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const STATIC_COUNTRIES = [
  {"name": "Germany",     "flag": "🇩🇪"},
  {"name": "UK",          "flag": "🇬🇧"},
  {"name": "USA",         "flag": "🇺🇸"},
  {"name": "Canada",      "flag": "🇨🇦"},
  {"name": "Australia",   "flag": "🇦🇺"},
  {"name": "Netherlands", "flag": "🇳🇱"},
  {"name": "Sweden",      "flag": "🇸🇪"},
  {"name": "France",      "flag": "🇫🇷"},
  {"name": "Switzerland", "flag": "🇨🇭"},
  {"name": "Japan",       "flag": "🇯🇵"},
];

interface Program {
  title: string;
  university: string;
  country: string;
  degree: string;
  tuitionFee?: string;
  duration?: string;
  score?: number;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [countries, setCountries] = useState(STATIC_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [degree, setDegree] = useState('master');
  const [field, setField] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Program[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchCountries()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
        }
      })
      .catch(() => {
        // Use static fallback list if backend is booting
      });
  }, []);

  const handleSearch = () => {
    if (!selectedCountry) {
      Alert.alert("Required", "Please select a destination country.");
      return;
    }
    if (!field) {
      Alert.alert("Required", "Please enter your field of study.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    searchCourses({ country: selectedCountry, degree, field })
      .then(data => {
        if (data && Array.isArray(data.courses)) {
          setResults(data.courses);
        } else if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        Alert.alert("Search Error", "Could not fetch search results. Please check your network.");
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Header */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Find the right{'\n'}<Text style={styles.heroTitleHighlight}>university</Text>{'\n'}worldwide</Text>
        <Text style={styles.heroSubtitle}>AI-powered degree matching tailored to your profile.</Text>
      </View>

      {/* Form */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Destination Country</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillContainer}>
          {countries.map((c) => {
            const isSelected = selectedCountry === c.name;
            return (
              <TouchableOpacity
                key={c.name}
                style={[
                  styles.countryPill,
                  { borderColor: colors.border },
                  isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }
                ]}
                onPress={() => setSelectedCountry(c.name)}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#fff' : colors.text }]}>
                  {c.flag} {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.label, { color: colors.text }]}>Degree Level</Text>
        <View style={styles.degreeRow}>
          {['bachelor', 'master', 'phd'].map((d) => {
            const isSelected = degree === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.degreePill,
                  { borderColor: colors.border },
                  isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }
                ]}
                onPress={() => setDegree(d)}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#fff' : colors.text }]}>
                  {d === 'phd' ? 'PhD' : d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Field of Study</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={field}
          onChangeText={setField}
          placeholder="e.g. Data Science, Robotics"
          placeholderTextColor="#9ca3af"
        />

        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.tint }]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Find My Perfect Program</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Section */}
      {hasSearched && (
        <View style={styles.resultsSection}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>Matching Programs</Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.tint} style={{ marginTop: 20 }} />
          ) : results.length === 0 ? (
            <Text style={styles.noResultsText}>No courses match your search criteria. Try adjusting the query.</Text>
          ) : (
            results.map((item, index) => (
              <View 
                key={index} 
                style={[styles.programCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.programHeader}>
                  <Text style={[styles.programTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.score && (
                    <View style={[styles.scoreBadge, { backgroundColor: colors.tint }]}>
                      <Text style={styles.scoreText}>{item.score}% Match</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.programUniversity}>{item.university}</Text>
                
                <View style={styles.programFooter}>
                  <Text style={styles.programMeta}>{item.country} • {item.degree}</Text>
                  {item.tuitionFee && (
                    <Text style={[styles.programFee, { color: colors.tint }]}>{item.tuitionFee}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  heroCard: {
    paddingVertical: 20,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -0.5,
    color: '#111827',
  },
  heroTitleHighlight: {
    color: '#ff8c00',
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#4b5563',
    marginTop: 8,
    lineHeight: 22,
  },
  formCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 4,
  },
  countryPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  degreeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  degreePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  searchButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultsSection: {
    marginTop: 10,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 10,
  },
  programCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
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
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  scoreText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  programUniversity: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
  },
  programFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  programFee: {
    fontSize: 13,
    fontWeight: '700',
  },
});
