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
  Switch
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchCountries, searchCourses, fetchProfile } from '../../services/api';
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

const POPULAR_FIELDS = [
  "Computer Science", 
  "Software Engineering", 
  "Data Science", 
  "Artificial Intelligence",
  "Cybersecurity", 
  "Information Technology", 
  "Electrical Engineering", 
  "Mechanical Engineering",
  "Aerospace Engineering", 
  "Biomedical Engineering", 
  "Civil Engineering", 
  "Business Administration",
  "Finance", 
  "Economics", 
  "Management", 
  "Physics", 
  "Chemistry", 
  "Biology", 
  "Mathematics",
  "Medicine", 
  "Nursing", 
  "Public Health", 
  "Law", 
  "Psychology", 
  "Architecture", 
  "Urban Planning"
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
  const [fieldSuggestions, setFieldSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Program[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Profile Sync States
  const [profile, setProfile] = useState<any>(null);
  const [useProfile, setUseProfile] = useState(true);

  // Load countries and synced profile
  useEffect(() => {
    fetchCountries()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
        }
      })
      .catch(() => {});

    loadProfileFromCache();
  }, []);

  const loadProfileFromCache = async () => {
    try {
      const email = await AsyncStorage.getItem('user_email');
      if (email) {
        const data = await fetchProfile(email);
        if (data && Object.keys(data).length > 0) {
          setProfile(data);
          if (data.currentField) {
            setField(data.currentField);
          }
          if (data.currentDegree) {
            setDegree(data.currentDegree.toLowerCase());
          }
        }
      }
    } catch (err) {
      console.log("No profile cached yet:", err);
    }
  };

  // Re-fetch profile on focus/scroll or when user returns
  useEffect(() => {
    const timer = setInterval(() => {
      loadProfileFromCache();
    }, 4000); // Poll every 4 seconds to sync changes seamlessly
    return () => clearInterval(timer);
  }, []);

  const handleFieldInput = (val: string) => {
    setField(val);
    if (val.trim().length > 0) {
      const query = val.toLowerCase().trim();
      const filtered = POPULAR_FIELDS.filter(f => f.toLowerCase().includes(query)).slice(0, 5);
      setFieldSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (val: string) => {
    setField(val);
    setShowSuggestions(false);
  };

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

    const searchPayload = {
      country: selectedCountry,
      degree,
      field
    };

    const activeProfile = useProfile ? profile : null;

    searchCourses(searchPayload, activeProfile)
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {/* Hero Header */}
      <View style={styles.heroCard}>
        <Text style={[styles.heroTitlePre, { color: colors.text }]}>Find the right</Text>
        <Text style={styles.heroTitleMain}>university</Text>
        <Text style={[styles.heroTitlePost, { color: colors.text }]}>worldwide</Text>
        <Text style={[styles.heroSubtitle, { color: colors.text, opacity: 0.7 }]}>
          AI-powered degree matching tailored to your profile.
        </Text>

        {/* Stats Row */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.tint }]}>10+</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.tint }]}>Live</Text>
            <Text style={styles.statLabel}>Real Data</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.tint }]}>AI</Text>
            <Text style={styles.statLabel}>Matching</Text>
          </View>
        </View>
      </View>

      {/* Active Profile Banner */}
      {profile && profile.fullName ? (
        <View style={[styles.profileBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileBannerLeft}>
            <Text style={[styles.profileBannerText, { color: colors.text }]}>
              Matching as <Text style={{ fontWeight: '700', color: colors.tint }}>{profile.fullName}</Text>
            </Text>
            {profile.grade && (
              <Text style={styles.profileBannerSub}>
                GPA: {profile.grade} • {profile.currentDegree}
              </Text>
            )}
          </View>
          <View style={styles.profileBannerRight}>
            <Switch
              value={useProfile}
              onValueChange={setUseProfile}
              trackColor={{ false: '#767577', true: '#ffa500' }}
              thumbColor={useProfile ? colors.tint : '#f4f3f4'}
            />
          </View>
        </View>
      ) : null}

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
                  { borderColor: colors.border, backgroundColor: colors.card },
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
                  { borderColor: colors.border, backgroundColor: colors.card },
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
          onChangeText={handleFieldInput}
          placeholder="e.g. Data Science, Robotics"
          placeholderTextColor="#9ca3af"
        />

        {/* Suggestions List */}
        {showSuggestions && fieldSuggestions.length > 0 && (
          <View style={[styles.suggestionsDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {fieldSuggestions.map((item, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={[styles.suggestionItemText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
            <Text style={[styles.noResultsText, { color: colors.text, opacity: 0.6 }]}>
              No courses match your search criteria. Try adjusting the query.
            </Text>
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
                    <View style={[styles.scoreBadge, { backgroundColor: '#ff8c00' }]}>
                      <Text style={styles.scoreText}>{item.score}% Match</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.programUniversity, { color: colors.text, opacity: 0.7 }]}>{item.university}</Text>
                
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
  heroTitlePre: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  heroTitleMain: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ff8c00',
    lineHeight: 44,
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  heroTitlePost: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14.5,
    marginTop: 8,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#374151',
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  profileBannerLeft: {
    flex: 1,
  },
  profileBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileBannerSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  profileBannerRight: {
    marginLeft: 12,
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
    marginBottom: 10,
  },
  suggestionsDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  suggestionItemText: {
    fontSize: 14.5,
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
    marginTop: 10,
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
