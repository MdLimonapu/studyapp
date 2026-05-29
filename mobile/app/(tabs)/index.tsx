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
  Keyboard,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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
  const [showFieldModal, setShowFieldModal] = useState(false);
  
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
      setFieldSuggestions(POPULAR_FIELDS.slice(0, 6)); // Default popular
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (val: string) => {
    setField(val);
    setShowSuggestions(false);
    setShowFieldModal(false);
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
      .then(async (data) => {
        let list = [];
        if (data && Array.isArray(data.courses)) {
          list = data.courses;
        } else if (Array.isArray(data)) {
          list = data;
        }
        setResults(list);
        await AsyncStorage.setItem('search_results', JSON.stringify(list));
        router.push('/(tabs)/mymatches');
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
      {/* Centered Logo & Brand Header */}
      <View style={styles.headerContainer}>
        <View style={styles.logoCenteredContainer}>
          <Svg width="48" height="48" viewBox="0 0 32 32" fill="none">
            <Path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#studplex-grad)" />
            <Path d="M6 14.5V21C6 24.3 10.5 27 16 27C21.5 27 26 24.3 26 21V14.5L16 19.5L6 14.5Z" fill="url(#studplex-grad2)" />
            <Defs>
              <LinearGradient id="studplex-grad" x1="2" y1="2" x2="30" y2="16">
                <Stop stopColor="#ccff00" offset="0" />
                <Stop stopColor="#ff6b00" offset="1" />
              </LinearGradient>
              <LinearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27">
                <Stop stopColor="#ff6b00" offset="0" />
                <Stop stopColor="#ccff00" offset="1" />
              </LinearGradient>
            </Defs>
          </Svg>
        </View>
        
        <View style={styles.heroCenteredText}>
          <Text style={[styles.heroTitlePre, { color: colors.text, textAlign: 'center' }]}>Find the right</Text>
          <Text style={[styles.heroTitleMain, { textAlign: 'center' }]}>university</Text>
          <Text style={[styles.heroTitlePost, { color: colors.text, textAlign: 'center' }]}>worldwide</Text>
          <Text style={[styles.heroSubtitle, { color: colors.text, opacity: 0.6, textAlign: 'center' }]}>
            Match your dream international university program in seconds.
          </Text>
        </View>
      </View>
 
      {/* Form Card */}
      <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Destination Country</Text>
        
        {/* Custom Dropdown Selector */}
        <TouchableOpacity 
          style={[styles.dropdownSelector, { borderColor: showCountryDropdown ? colors.tint : colors.border, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]} 
          onPress={() => {
            Keyboard.dismiss();
            setShowCountryDropdown(true);
          }}
        >
          <Text style={[styles.dropdownSelectorText, { color: selectedCountry ? colors.text : '#7f8a9e' }]}>
            {selectedCountryData ? `${selectedCountryData.flag}   ${selectedCountryData.name}` : "Select country"}
          </Text>
          <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '900' }}>▼</Text>
        </TouchableOpacity>
 
        {/* Floating Backdrop Modal Selector */}
        <Modal
          visible={showCountryDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCountryDropdown(false)}
        >
          <Pressable 
            style={styles.modalBackdrop} 
            onPress={() => setShowCountryDropdown(false)}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Destination</Text>
                <TouchableOpacity onPress={() => setShowCountryDropdown(false)} style={styles.modalCloseButton}>
                  <Text style={[styles.modalCloseText, { color: colors.tint }]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                {countries.map((c) => {
                  const isSelected = selectedCountry === c.name;
                  return (
                    <TouchableOpacity
                      key={c.name}
                      style={[
                        styles.modalDropdownItem, 
                        { borderBottomColor: colors.border },
                        isSelected && { backgroundColor: 'rgba(204, 255, 0, 0.1)' }
                      ]}
                      onPress={() => {
                        setSelectedCountry(c.name);
                        setShowCountryDropdown(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[
                          styles.modalDropdownItemText, 
                          { color: colors.text },
                          isSelected && { color: colors.tint, fontWeight: '700' }
                        ]}>
                          {c.flag}   {c.name}
                        </Text>
                        {isSelected && (
                          <Text style={{ color: colors.tint, fontWeight: '900', fontSize: 16 }}>✓</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
 
        <Text style={[styles.label, { color: colors.text }]}>Degree Level</Text>
        <View style={styles.degreeRow}>
          {['bachelor', 'master', 'phd'].map((d) => {
            const isSelected = degree === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.degreePill,
                  { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' },
                  isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }
                ]}
                onPress={() => setDegree(d)}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#000' : colors.text }]}>
                  {d === 'phd' ? 'PhD' : d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Field of Study</Text>
        
        {/* Field Selection Selector trigger */}
        <TouchableOpacity 
          style={[styles.dropdownSelector, { borderColor: showFieldModal ? colors.tint : colors.border, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]} 
          onPress={() => {
            setFieldSuggestions(field.trim().length > 0 
              ? POPULAR_FIELDS.filter(f => f.toLowerCase().includes(field.toLowerCase().trim())).slice(0, 5)
              : POPULAR_FIELDS.slice(0, 6)
            );
            setShowFieldModal(true);
          }}
        >
          <Text style={[styles.dropdownSelectorText, { color: field ? colors.text : '#7f8a9e' }]}>
            {field || "e.g. Data Science, Robotics"}
          </Text>
          <Text style={{ color: colors.tint, fontSize: 13, fontWeight: '900' }}>✎</Text>
        </TouchableOpacity>
 
        {/* Floating Modal for Field of Study Search */}
        <Modal
          visible={showFieldModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFieldModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <Pressable 
              style={styles.modalBackdrop} 
              onPress={() => setShowFieldModal(false)}
            >
              <Pressable 
                style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Field of Study</Text>
                  <TouchableOpacity onPress={() => setShowFieldModal(false)} style={styles.modalCloseButton}>
                    <Text style={[styles.modalCloseText, { color: colors.tint }]}>✕</Text>
                  </TouchableOpacity>
                </View>
 
                <TextInput
                  style={[styles.modalInput, { borderColor: colors.tint, color: colors.text, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]}
                  value={field}
                  onChangeText={handleFieldInput}
                  placeholder="Search fields (e.g. Computer Science)"
                  placeholderTextColor="#7f8a9e"
                  autoFocus={true}
                  autoCorrect={false}
                  autoCapitalize="words"
                />
 
                <Text style={{ fontSize: 13, color: colors.text, opacity: 0.6, marginTop: 12, marginBottom: 8, fontWeight: '700' }}>
                  {field.trim().length > 0 ? "Suggestions" : "Popular Fields"}
                </Text>
 
                <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
                  {/* Typed Text Direct Selection Option */}
                  {field.trim().length > 0 && (
                    <TouchableOpacity
                      style={[
                        styles.modalDropdownItem, 
                        { backgroundColor: 'rgba(204, 255, 0, 0.05)', borderColor: 'rgba(204, 255, 0, 0.25)', borderWidth: 1 }
                      ]}
                      onPress={() => setShowFieldModal(false)}
                    >
                      <Text style={[styles.modalDropdownItemText, { color: colors.tint, fontWeight: '700' }]}>
                        Use: "{field}"
                      </Text>
                    </TouchableOpacity>
                  )}
 
                  {fieldSuggestions.map((item, idx) => {
                    const isSelected = field.toLowerCase().trim() === item.toLowerCase().trim();
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.modalDropdownItem, 
                          { borderBottomColor: colors.border },
                          isSelected && { backgroundColor: 'rgba(204, 255, 0, 0.08)' }
                        ]}
                        onPress={() => handleSelectSuggestion(item)}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[
                            styles.modalDropdownItemText, 
                            { color: colors.text },
                            isSelected && { color: colors.tint, fontWeight: '700' }
                          ]}>
                            {item}
                          </Text>
                          {isSelected && (
                            <Text style={{ color: colors.tint, fontWeight: '900', fontSize: 16 }}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
 
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
            <ActivityIndicator color="#000" />
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
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{item.score}% Match</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.programUniversity, { color: colors.text, opacity: 0.6 }]}>{item.university}</Text>
                
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
    marginBottom: Platform.OS === 'ios' ? 100 : 85,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 15,
  },
  logoCenteredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    width: 48,
    height: 48,
  },
  heroCenteredText: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  heroTitlePre: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  heroTitleMain: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ccff00',
    lineHeight: 42,
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  heroTitlePost: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 19,
  },
  formCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 10,
  },
  dropdownSelector: {
    height: 54,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dropdownSelectorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 350,
  },
  modalDropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalDropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalInput: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 10,
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
    paddingVertical: 11,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
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
    backgroundColor: 'rgba(204, 255, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(204, 255, 0, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  profilePillText: {
    color: '#ccff00',
    fontSize: 13.5,
    fontWeight: '600',
  },
  profilePillClose: {
    color: '#ccff00',
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
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  searchButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 10,
  },
  searchButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    borderRadius: 20,
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
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 255, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 255, 0, 0.25)',
  },
  scoreText: {
    color: '#d4ff00',
    fontSize: 12,
    fontWeight: '800',
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
