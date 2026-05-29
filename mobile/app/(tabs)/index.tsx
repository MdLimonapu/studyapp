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
  Keyboard
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
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
      if (email && email.trim() !== '') {
        const data = await fetchProfile(email);
        if (data && Object.keys(data).length > 0) {
          setProfile(data);
          if (data.currentField && !field) {
            setField(data.currentField);
          }
          if (data.currentDegree) {
            setDegree(data.currentDegree.toLowerCase());
          }
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.log("No profile cached yet:", err);
      setProfile(null);
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
    // Dismiss the keyboard instantly so user can see search results
    Keyboard.dismiss();

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

  const selectedCountryData = countries.find(c => c.name === selectedCountry);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {/* Header Row with Logo */}
      <View style={styles.headerRow}>
        <View style={styles.heroCard}>
          <Text style={[styles.heroTitlePre, { color: colors.text }]}>Find the right</Text>
          <Text style={styles.heroTitleMain}>university</Text>
          <Text style={[styles.heroTitlePost, { color: colors.text }]}>worldwide</Text>
          <Text style={[styles.heroSubtitle, { color: colors.text, opacity: 0.7 }]}>
            Match your dream international university program in seconds.
          </Text>
        </View>
        
        {/* Render Vector Brand SVG Logo */}
        <View style={styles.logoContainer}>
          <Svg width="40" height="40" viewBox="0 0 32 32" fill="none">
            <Path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#studplex-grad)" />
            <Path d="M6 14.5V21C6 24.3 10.5 27 16 27C21.5 27 26 24.3 26 21V14.5L16 19.5L6 14.5Z" fill="url(#studplex-grad2)" />
            <Defs>
              <LinearGradient id="studplex-grad" x1="2" y1="2" x2="30" y2="16">
                <Stop stopColor="#ff8c00" offset="0" />
                <Stop stopColor="#f59e0b" offset="1" />
              </LinearGradient>
              <LinearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27">
                <Stop stopColor="#f59e0b" offset="0" />
                <Stop stopColor="#ff8c00" offset="1" />
              </LinearGradient>
            </Defs>
          </Svg>
        </View>
      </View>

      {/* Form */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Destination Country</Text>
        
        {/* Custom Dropdown Selector */}
        <TouchableOpacity 
          style={[styles.dropdownSelector, { borderColor: colors.border }]} 
          onPress={() => setShowCountryDropdown(!showCountryDropdown)}
        >
          <Text style={[styles.dropdownSelectorText, { color: selectedCountry ? colors.text : '#9ca3af' }]}>
            {selectedCountryData ? `${selectedCountryData.flag} ${selectedCountryData.name}` : "Select country"}
          </Text>
          <Text style={{ color: colors.tint, fontSize: 12 }}>{showCountryDropdown ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {showCountryDropdown && (
          <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {countries.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    setSelectedCountry(c.name);
                    setShowCountryDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text }]}>
                    {c.flag} {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

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

        {/* Active Profile Sync (Pill format directly below study field) */}
        {profile && profile.fullName ? (
          useProfile ? (
            <TouchableOpacity 
              style={styles.profilePillInteractive} 
              onPress={() => setUseProfile(false)}
            >
              <Text style={styles.profilePillText} numberOfLines={1}>
                Searching as <Text style={{ fontWeight: '700' }}>{profile.fullName}</Text>
              </Text>
              <Text style={styles.profilePillClose}>×</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.profilePromptContainer}
              onPress={() => setUseProfile(true)}
            >
              <Text style={[styles.profilePromptText, { color: colors.text }]}>
                💡 Use profile matches for better results
              </Text>
            </TouchableOpacity>
          )
        ) : null}

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
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    marginTop: 10,
  },
  logoContainer: {
    marginTop: 6,
    marginRight: 4,
    width: 40,
    height: 40,
  },
  heroCard: {
    flex: 1,
    paddingRight: 16,
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
    lineHeight: 20,
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
  dropdownSelector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dropdownSelectorText: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownList: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 14.5,
    fontWeight: '600',
  },
  pillContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 4,
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
  pillText: {
    fontSize: 13,
    fontWeight: '600',
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
  profilePillInteractive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 0, 0.25)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  profilePillText: {
    color: '#ff8c00',
    fontSize: 13.5,
    fontWeight: '500',
  },
  profilePillClose: {
    color: '#ff8c00',
    fontSize: 18,
    fontWeight: '600',
    paddingLeft: 6,
  },
  profilePromptContainer: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  profilePromptText: {
    fontSize: 13.5,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
