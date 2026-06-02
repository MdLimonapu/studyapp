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
  Platform,
  Linking,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { FontAwesome } from '@expo/vector-icons';
import { fetchCountries, searchCourses, fetchProfile } from '../../services/api';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradedBackground } from '@/components/GradedBackground';
import { useUser } from '@clerk/expo';

const STATIC_COUNTRIES = [
  { name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { name: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  { name: 'USA', flag: '\u{1F1FA}\u{1F1F8}' },
  { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
  { name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}' },
  { name: 'Sweden', flag: '\u{1F1F8}\u{1F1EA}' },
  { name: 'France', flag: '\u{1F1EB}\u{1F1F7}' },
  { name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}' },
  { name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
];

const POPULAR_FIELDS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Artificial Intelligence',
  'Cybersecurity',
  'Information Technology',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Finance',
  'Economics',
  'Management',
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Medicine',
  'Nursing',
  'Public Health',
  'Law',
  'Psychology',
  'Architecture',
  'Urban Planning',
];

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useUser();

  const [countries, setCountries] = useState(STATIC_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [degree, setDegree] = useState('master');
  const [field, setField] = useState('');
  const [fieldSuggestions, setFieldSuggestions] = useState<string[]>([]);
  const [showFieldModal, setShowFieldModal] = useState(false);

  const [loading, setLoading] = useState(false);

  // Profile states
  const [profile, setProfile] = useState<any>(null);
  const [useProfile, setUseProfile] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchCountries()
      .then((data) => {
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
      setUserEmail(email);
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
      console.log('No profile cached yet:', err);
      setProfile(null);
    }
  };

  // Poll for profile changes
  useEffect(() => {
    const timer = setInterval(() => {
      loadProfileFromCache();
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleFieldInput = (val: string) => {
    setField(val);
    if (val.trim().length > 0) {
      const query = val.toLowerCase().trim();
      const filtered = POPULAR_FIELDS.filter((f) =>
        f.toLowerCase().includes(query)
      ).slice(0, 5);
      setFieldSuggestions(filtered);
    } else {
      setFieldSuggestions(POPULAR_FIELDS.slice(0, 6));
    }
  };

  const handleSelectSuggestion = (val: string) => {
    setField(val);
    setShowFieldModal(false);
  };

  const handleSearch = () => {
    Keyboard.dismiss();

    if (!selectedCountry) {
      Alert.alert('Required', 'Please select a destination country.');
      return;
    }
    if (!field) {
      Alert.alert('Required', 'Please enter your field of study.');
      return;
    }

    setLoading(true);

    const searchPayload = {
      country: selectedCountry,
      degree,
      field,
    };

    const activeProfile = useProfile ? profile : null;

    searchCourses(searchPayload, activeProfile)
      .then(async (data) => {
        let list: any[] = [];
        if (data && Array.isArray(data.courses)) {
          list = data.courses;
        } else if (data && Array.isArray(data.results)) {
          list = data.results;
        } else if (Array.isArray(data)) {
          list = data;
        }
        await AsyncStorage.setItem(
          'search_query',
          JSON.stringify(searchPayload)
        );
        await AsyncStorage.setItem('search_results', JSON.stringify(list));
        router.navigate('/(tabs)/search' as any);
      })
      .catch((err) => {
        Alert.alert(
          'Search Error',
          'Could not fetch search results. Please check your network.'
        );
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  const selectedCountryData = countries.find((c) => c.name === selectedCountry);
  const inputBg = colorScheme === 'dark' ? '#14171f' : '#f9fafb';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradedBackground />
      <ScrollView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* ─── Top Header Bar ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <Path
              d="M16 2L2 9L16 16L30 9L16 2Z"
              fill="url(#studplex-grad)"
            />
            <Path
              d="M6 14.5V21C6 24.3 10.5 27 16 27C21.5 27 26 24.3 26 21V14.5L16 19.5L6 14.5Z"
              fill="url(#studplex-grad2)"
            />
            <Defs>
              <LinearGradient
                id="studplex-grad"
                x1="2"
                y1="2"
                x2="30"
                y2="16"
              >
                <Stop stopColor="#6366f1" offset="0" />
                <Stop stopColor="#ff6b00" offset="0.6" />
                <Stop stopColor="#ccff00" offset="1" />
              </LinearGradient>
              <LinearGradient
                id="studplex-grad2"
                x1="6"
                y1="14.5"
                x2="26"
                y2="27"
              >
                <Stop stopColor="#ff6b00" offset="0" />
                <Stop stopColor="#6366f1" offset="0.6" />
                <Stop stopColor="#ccff00" offset="1" />
              </LinearGradient>
            </Defs>
          </Svg>
          <Text style={[styles.brandText, { color: colors.text }]}>
            Studplex
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          {user?.imageUrl ? (
            <Image
              source={{ uri: user.imageUrl }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 1.5,
                borderColor: '#ffffff',
                shadowColor: '#ffffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 6,
              }}
            />
          ) : profile?.fullName ? (
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#6366f1',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: '#ffffff',
                shadowColor: '#ffffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 6,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>
                {profile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
          ) : (
            <FontAwesome
              name="user-circle-o"
              size={28}
              color="#ffffff"
              style={{
                shadowColor: '#ffffff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 6,
              }}
            />
          )}
          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700', marginTop: 2 }}>Profile</Text>
        </TouchableOpacity>
      </View>
 
       {/* ─── Hero Section ─── */}
       <View style={styles.heroSection}>
         <Text style={[styles.heroTitlePre, { color: colors.text }]}>
           Find the right
         </Text>
         <Text style={[styles.heroTitleMain, { color: '#ff6b00' }]}>
           university
         </Text>
        <Text style={[styles.heroTitlePost, { color: colors.text }]}>
          worldwide
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.mutedText }]}>
          Match your dream program.
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ff6b00' }]}>10+</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              Countries
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ccff00' }]}>Live</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              Real Data
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.border }]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#38bdf8' }]}>Free</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              To Use
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Search Form Card ─── */}
      <View
        style={[
          styles.formCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Country Selector */}
        <Text style={[styles.label, { color: colors.text }]}>Country</Text>
        <TouchableOpacity
          style={[
            styles.dropdownSelector,
            {
              borderColor: showCountryDropdown ? colors.tint : colors.border,
              backgroundColor: inputBg,
            },
          ]}
          onPress={() => {
            Keyboard.dismiss();
            setShowCountryDropdown(true);
          }}
        >
          <Text
            style={[
              styles.dropdownSelectorText,
              { color: selectedCountry ? colors.text : colors.mutedText },
            ]}
          >
            {selectedCountryData
              ? `${selectedCountryData.flag}   ${selectedCountryData.name}`
              : 'Select country'}
          </Text>
          <FontAwesome
            name="chevron-down"
            size={12}
            color={colors.tint}
          />
        </TouchableOpacity>

        {/* Country Modal */}
        <Modal
          visible={showCountryDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCountryDropdown(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowCountryDropdown(false)}
          >
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Select Destination
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCountryDropdown(false)}
                  style={styles.modalCloseButton}
                >
                  <FontAwesome name="times" size={18} color={colors.tint} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                keyboardShouldPersistTaps="handled"
              >
                {countries.map((c) => {
                  const isSelected = selectedCountry === c.name;
                  return (
                    <TouchableOpacity
                      key={c.name}
                      style={[
                        styles.modalDropdownItem,
                        { borderBottomColor: colors.border },
                        isSelected && {
                          backgroundColor: 'rgba(255, 107, 0, 0.1)',
                        },
                      ]}
                      onPress={() => {
                        setSelectedCountry(c.name);
                        setShowCountryDropdown(false);
                      }}
                    >
                      <View style={styles.modalItemRow}>
                        <Text
                          style={[
                            styles.modalDropdownItemText,
                            { color: colors.text },
                            isSelected && {
                              color: colors.tint,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {c.flag}   {c.name}
                        </Text>
                        {isSelected && (
                          <FontAwesome
                            name="check"
                            size={14}
                            color={colors.tint}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>

        {/* Degree Level */}
        <Text style={[styles.label, { color: colors.text }]}>Degree Level</Text>
        <View style={styles.degreeRow}>
          {['bachelor', 'master', 'phd'].map((d) => {
            const isSelected = degree === d;
            return (
              <TouchableOpacity
                key={d}
                style={[
                  styles.degreePill,
                  {
                    borderColor: colors.border,
                    backgroundColor: inputBg,
                  },
                  isSelected && {
                    backgroundColor: colors.tint,
                    borderColor: colors.tint,
                  },
                ]}
                onPress={() => setDegree(d)}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: isSelected ? '#000' : colors.text },
                  ]}
                >
                  {d === 'phd'
                    ? 'PhD'
                    : d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Field of Study */}
        <Text style={[styles.label, { color: colors.text }]}>
          Field of Study
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdownSelector,
            {
              borderColor: showFieldModal ? colors.tint : colors.border,
              backgroundColor: inputBg,
            },
          ]}
          onPress={() => {
            setFieldSuggestions(
              field.trim().length > 0
                ? POPULAR_FIELDS.filter((f) =>
                    f.toLowerCase().includes(field.toLowerCase().trim())
                  ).slice(0, 5)
                : POPULAR_FIELDS.slice(0, 6)
            );
            setShowFieldModal(true);
          }}
        >
          <Text
            style={[
              styles.dropdownSelectorText,
              { color: field ? colors.text : colors.mutedText },
            ]}
          >
            {field || 'e.g. Data Science, Robotics'}
          </Text>
          <FontAwesome name="chevron-down" size={12} color={colors.tint} />
        </TouchableOpacity>

        {/* Field of Study Modal */}
        <Modal
          visible={showFieldModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFieldModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowFieldModal(false)}
            >
              <Pressable
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <View
                  style={[
                    styles.modalHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Field of Study
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowFieldModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <FontAwesome name="times" size={18} color={colors.tint} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      borderColor: colors.tint,
                      color: colors.text,
                      backgroundColor: inputBg,
                    },
                  ]}
                  value={field}
                  onChangeText={handleFieldInput}
                  placeholder="Search fields (e.g. Computer Science)"
                  placeholderTextColor={colors.mutedText}
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="words"
                />

                <Text
                  style={[
                    styles.modalSectionLabel,
                    { color: colors.text, opacity: 0.6 },
                  ]}
                >
                  {field.trim().length > 0 ? 'Suggestions' : 'Popular Fields'}
                </Text>

                <ScrollView
                  style={styles.modalScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  {fieldSuggestions.map((item, idx) => {
                    const isSelected =
                      field.toLowerCase().trim() ===
                      item.toLowerCase().trim();
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.modalDropdownItem,
                          { borderBottomColor: colors.border },
                          isSelected && {
                            backgroundColor: 'rgba(255, 107, 0, 0.08)',
                          },
                        ]}
                        onPress={() => handleSelectSuggestion(item)}
                      >
                        <View style={styles.modalItemRow}>
                          <Text
                            style={[
                              styles.modalDropdownItemText,
                              { color: colors.text },
                              isSelected && {
                                color: colors.tint,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {item}
                          </Text>
                          {isSelected && (
                            <FontAwesome
                              name="check"
                              size={14}
                              color={colors.tint}
                            />
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

        {/* Profile Pill */}
        {profile && profile.fullName ? (
          useProfile ? (
            <TouchableOpacity
              style={styles.profilePillInteractive}
              onPress={() => setUseProfile(false)}
            >
              <Text style={styles.profilePillText} numberOfLines={1}>
                Searching as{' '}
                <Text style={{ fontWeight: '700' }}>{profile.fullName}</Text>
              </Text>
              <FontAwesome name="times-circle" size={14} color="#60a5fa" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.profilePromptContainer}
              onPress={() => setUseProfile(true)}
            >
              <View style={styles.profilePromptRow}>
                <FontAwesome
                  name="lightbulb-o"
                  size={14}
                  color={colors.tint}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[styles.profilePromptText, { color: colors.text }]}
                >
                  Use profile matches for better results
                </Text>
              </View>
            </TouchableOpacity>
          )
        ) : null}

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: '#ccff00', shadowColor: '#ccff00' }]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.searchButtonText, { color: '#000000' }]}>Find My Perfect Program</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  flex: {
    flex: 1,
  },

  /* ─── Top Bar ─── */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    padding: 4,
    alignItems: 'center',
  },

  /* ─── Hero Section ─── */
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroTitlePre: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroTitleMain: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 46,
    letterSpacing: -1,
    textTransform: 'lowercase',
    textAlign: 'center',
  },
  heroTitlePost: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    opacity: 0.5,
  },

  /* ─── Form Card ─── */
  formCard: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    shadowColor: '#6366f1',
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

  /* ─── Degree Pills ─── */
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

  /* ─── Modals ─── */
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: 350,
  },
  modalInput: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 10,
  },
  modalSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
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
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  /* ─── Profile Pill ─── */
  profilePillInteractive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(96, 165, 251, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 251, 0.3)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 10,
  },
  profilePillText: {
    color: '#60a5fa',
    fontSize: 13.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  profilePromptContainer: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  profilePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePromptText: {
    fontSize: 13.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  /* ─── Search Button ─── */
  searchButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6b00',
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
});
