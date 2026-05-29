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
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { fetchProfile, saveProfile, registerUser } from '../../services/api';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

// Enable WebBrowser redirects
WebBrowser.maybeCompleteAuthSession();

const DEGREE_OPTIONS = [
  "High School",
  "Foundation",
  "Bachelor",
  "Master",
  "PhD",
  "Diploma",
  "Other"
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    currentDegree: '',
    currentField: '',
    semester: '',
    universityName: '',
    grade: '',
    notes: '',
    studplexId: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Load cached email and profile on mount
  useEffect(() => {
    loadCachedProfile();
  }, []);

  const loadCachedProfile = async () => {
    setLoading(true);
    try {
      const email = await AsyncStorage.getItem('user_email');
      if (email && email.trim() !== '') {
        await syncProfileFromServer(email);
      } else {
        clearLocalProfileState();
      }
    } catch (err) {
      console.error("Error loading cached email:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearLocalProfileState = () => {
    setProfile({
      fullName: '',
      email: '',
      currentDegree: '',
      currentField: '',
      semester: '',
      universityName: '',
      grade: '',
      notes: '',
      studplexId: '',
    });
  };

  const syncProfileFromServer = async (emailToSync: string) => {
    try {
      const data = await fetchProfile(emailToSync);
      if (data && Object.keys(data).length && data.email) {
        setProfile({
          fullName: data.fullName || '',
          email: data.email || emailToSync,
          currentDegree: data.currentDegree || '',
          currentField: data.currentField || '',
          semester: String(data.semester || ''),
          universityName: data.universityName || '',
          grade: String(data.grade || ''),
          notes: data.notes || '',
          studplexId: data.studplexId || '',
        });
        await AsyncStorage.setItem('user_email', data.email);
      } else {
        // Fallback if not in MongoDB yet
        setProfile(p => ({ ...p, email: emailToSync }));
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  };

  const handleLogin = async () => {
    const email = emailInput.trim();
    if (!email) {
      Alert.alert("Required Field", "Please enter your email address.");
      return;
    }
    setAuthLoading(true);
    try {
      const data = await fetchProfile(email);
      if (data && Object.keys(data).length && data.email) {
        await AsyncStorage.setItem('user_email', data.email);
        setProfile({
          fullName: data.fullName || '',
          email: data.email,
          currentDegree: data.currentDegree || '',
          currentField: data.currentField || '',
          semester: String(data.semester || ''),
          universityName: data.universityName || '',
          grade: String(data.grade || ''),
          notes: data.notes || '',
          studplexId: data.studplexId || '',
        });
        Alert.alert("Welcome Back!", `Successfully signed in as ${data.fullName || data.email}`);
      } else {
        Alert.alert(
          "Account Not Found",
          "We couldn't find an account matching this email. Please switch to the Register tab to create a new profile."
        );
      }
    } catch (err) {
      Alert.alert("Connection Error", "Could not connect to the database server.");
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    const email = emailInput.trim();
    const fullName = fullNameInput.trim();

    if (!email || !fullName) {
      Alert.alert("Required Fields", "Please enter both your Full Name and Email Address.");
      return;
    }

    setAuthLoading(true);
    try {
      // 1. Call Backend Registration Endpoint
      const regResult = await registerUser({
        email,
        fullName,
        method: 'mobile'
      });

      // 2. Initialize Profile fields on MongoDB
      await saveProfile({
        email,
        fullName,
        currentDegree: 'Bachelor',
        currentField: '',
        grade: '',
        notes: '',
        studplexId: regResult.studplexId || ''
      });

      await AsyncStorage.setItem('user_email', email);
      
      // 3. Sync state
      setProfile({
        fullName,
        email,
        currentDegree: 'Bachelor',
        currentField: '',
        semester: '',
        universityName: '',
        grade: '',
        notes: '',
        studplexId: regResult.studplexId || '',
      });

      Alert.alert("Registration Complete", "Your Studplex profile has been successfully created!");
    } catch (err) {
      Alert.alert("Registration Failed", "Unable to create your profile. Please try again.");
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      // Directs user to the website's mobile-auth redirect page
      const authUrl = "https://studplex.com/mobile-auth";
      const result = await WebBrowser.openAuthSessionAsync(authUrl, "mobile://");
      
      if (result.type === 'success' && result.url) {
        // Parse parameters returned via deep link schema
        const parsed = Linking.parse(result.url);
        const email = parsed.queryParams?.email as string;
        const fullName = parsed.queryParams?.fullName as string;
        
        if (email) {
          await AsyncStorage.setItem('user_email', email);
          await syncProfileFromServer(email);
          Alert.alert("Welcome Back!", `Successfully signed in as ${fullName || email}`);
        } else {
          Alert.alert("Error", "Authentication succeeded but email was not found.");
        }
      }
    } catch (err) {
      console.error("Google login session error:", err);
      Alert.alert("Connection Error", "Google login portal could not be launched.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSave = () => {
    if (!profile.email.trim()) {
      Alert.alert("Error", "Session email is missing. Please log in again.");
      return;
    }
    setSaving(true);
    saveProfile(profile)
      .then(async () => {
        Alert.alert("Success", "Profile updated and saved to server!");
      })
      .catch(err => {
        Alert.alert("Error", "Failed to update profile. Please try again.");
        console.error(err);
      })
      .finally(() => setSaving(false));
  };

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem('user_email');
            await AsyncStorage.removeItem('search_results');
            clearLocalProfileState();
            setEmailInput('');
            setFullNameInput('');
          }
        }
      ]
    );
  };

  const getCompletionPercentage = () => {
    const keys = ['fullName', 'email', 'currentDegree', 'currentField', 'grade'];
    const filled = keys.filter(k => profile[k as keyof typeof profile]?.trim() !== '');
    return Math.round((filled.length / keys.length) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#ccff00" />
      </View>
    );
  }

  const hasLoggedIn = !!profile.email;
  const completionPct = getCompletionPercentage();

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {!hasLoggedIn ? (
        <View style={styles.centerContainer}>
          <ScrollView 
            contentContainerStyle={styles.centerScrollContent} 
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Header Icon & Branding */}
            <View style={styles.brandingHeader}>
              <Svg width="40" height="40" viewBox="0 0 32 32" fill="none">
                <Path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#studplex-grad)" />
                <Path d="M6 14.5V21C6 24.3 10.5 27 16 27C21.5 27 26 24.3 26 21V14.5L16 19.5L6 14.5Z" fill="url(#studplex-grad2)" />
                <Defs>
                  <LinearGradient id="studplex-grad" x1="2" y1="2" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#ccff00" />
                    <Stop offset="1" stopColor="#ff6b00" />
                  </LinearGradient>
                  <LinearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#ff6b00" />
                    <Stop offset="1" stopColor="#ccff00" />
                  </LinearGradient>
                </Defs>
              </Svg>
              <Text style={[styles.brandingTitle, { color: colors.text }]}>
                Stud<Text style={{ color: '#ccff00' }}>plex</Text>
              </Text>
              <Text style={styles.brandingTagline}>MATCH YOUR FUTURE</Text>
            </View>

            {/* Gated Auth Panel */}
            <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Title & Subtitle */}
              <Text style={[styles.authCardTitle, { color: colors.text }]}>
                {authMode === 'login' ? 'Sign in to your account' : 'Create your account'}
              </Text>
              <Text style={styles.authCardSub}>
                Welcome! Please fill in the details to get started.
              </Text>

              {/* Google OAuth Button - At the TOP */}
              <TouchableOpacity 
                style={[styles.googleButton, { borderColor: '#2e333d', backgroundColor: '#1e222b' }]}
                onPress={handleGoogleSignIn}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <View style={styles.googleButtonContent}>
                    <FontAwesome name="google" size={18} color="#ea4335" style={{ marginRight: 10 }} />
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>
                      Continue with Google
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: '#2e333d' }]} />
                <Text style={[styles.dividerText, { color: '#8e9aa8' }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: '#2e333d' }]} />
              </View>

              {/* Form Input Fields */}
              {authMode === 'register' && (
                <View style={styles.nameRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.clerkLabel, { color: colors.text }]}>FIRST NAME</Text>
                      <Text style={styles.clerkLabelOptional}>Optional</Text>
                    </View>
                    <TextInput 
                      style={[styles.clerkInput, { color: colors.text }]}
                      value={fullNameInput.split(' ')[0] || ''}
                      onChangeText={(text) => {
                        const lastName = fullNameInput.split(' ').slice(1).join(' ') || '';
                        setFullNameInput(text + (lastName ? ' ' + lastName : ''));
                      }}
                      placeholder="First name"
                      placeholderTextColor="#5f6672"
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.clerkLabel, { color: colors.text }]}>LAST NAME</Text>
                      <Text style={styles.clerkLabelOptional}>Optional</Text>
                    </View>
                    <TextInput 
                      style={[styles.clerkInput, { color: colors.text }]}
                      value={fullNameInput.split(' ').slice(1).join(' ') || ''}
                      onChangeText={(text) => {
                        const firstName = fullNameInput.split(' ')[0] || '';
                        setFullNameInput(firstName + (text ? ' ' + text : ''));
                      }}
                      placeholder="Last name"
                      placeholderTextColor="#5f6672"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.clerkLabel, { color: colors.text }]}>EMAIL ADDRESS</Text>
                <TextInput 
                  style={[styles.clerkInput, { color: colors.text }]}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  placeholder="Enter your email address"
                  placeholderTextColor="#5f6672"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.clerkLabel, { color: colors.text }]}>PASSWORD</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput 
                    style={[styles.clerkInput, { color: colors.text, flex: 1, borderBottomWidth: 0, paddingRight: 40 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#5f6672"
                    secureTextEntry={!showPassword}
                    onChangeText={(text) => {
                      // Custom local login uses password for Clerk Web Auth, here we save to state dynamically
                      setPasswordInput(text);
                    }}
                    value={passwordInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.eyeIconContainer}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#8e9aa8" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button: Orange gradient style matching website */}
              <TouchableOpacity 
                style={[styles.clerkContinueButton, { backgroundColor: '#ff6b00' }]}
                onPress={authMode === 'login' ? handleLogin : handleRegister}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.clerkContinueButtonText}>
                    Continue  ▶
                  </Text>
                )}
              </TouchableOpacity>

              {/* Tab Switch Link */}
              <TouchableOpacity 
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                <Text style={{ color: '#ccff00', fontWeight: '700', fontSize: 13 }}>
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* Logged In Content */
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Top Header Icon & Branding */}
          <View style={styles.brandingHeader}>
            <Svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <Path d="M16 2L2 9L16 16L30 9L16 2Z" fill="url(#studplex-grad)" />
              <Path d="M6 14.5V21C6 24.3 10.5 27 16 27C21.5 27 26 24.3 26 21V14.5L16 19.5L6 14.5Z" fill="url(#studplex-grad2)" />
              <Defs>
                <LinearGradient id="studplex-grad" x1="2" y1="2" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#ccff00" />
                  <Stop offset="1" stopColor="#ff6b00" />
                </LinearGradient>
                <LinearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                  <Stop offset="0" stopColor="#ff6b00" />
                  <Stop offset="1" stopColor="#ccff00" />
                </LinearGradient>
              </Defs>
            </Svg>
            <Text style={[styles.brandingTitle, { color: colors.text }]}>
              Stud<Text style={{ color: '#ccff00' }}>plex</Text>
            </Text>
            <Text style={styles.brandingTagline}>MATCH YOUR FUTURE</Text>
          </View>

          {/* Upper Profile Identity Info */}
          <View style={styles.header}>
            <View style={styles.identityRow}>
              <View style={[styles.avatarCircle, { backgroundColor: '#ccff00' }]}>
                {profile.fullName ? (
                  <Text style={[styles.avatarText, { color: '#000' }]}>
                    {profile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                ) : (
                  <FontAwesome name="user" size={32} color="#000" />
                )}
              </View>
              <View style={styles.identityInfo}>
                <Text style={[styles.identityName, { color: colors.text }]}>
                  {profile.fullName || "Student Account"}
                </Text>
                <Text style={[styles.identityEmail, { color: colors.text, opacity: 0.6 }]}>
                  {profile.email}
                </Text>
                {profile.studplexId ? (
                  <View style={[styles.studplexIdBadge, { backgroundColor: 'rgba(255, 107, 0, 0.12)', borderColor: 'rgba(255, 107, 0, 0.35)' }]}>
                    <Text style={[styles.studplexIdText, { color: '#ff6b00' }]}>ID: {profile.studplexId}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
     
          {/* Profile Completion Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.completionHeader}>
              <Text style={[styles.completionTitle, { color: colors.text }]}>Completion: {completionPct}%</Text>
              <View style={[styles.progressContainer, { backgroundColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' }]}>
                <View style={[styles.progressBar, { width: `${completionPct}%`, backgroundColor: '#ccff00' }]} />
              </View>
            </View>
            <Text style={[styles.completionHint, { color: colorScheme === 'dark' ? '#8e9aa8' : '#6b7280' }]}>
              {completionPct === 100 
                ? "Your profile is fully complete! You are ready for AI university matches." 
                : "Complete all fields to sync custom eligibility guidelines for study abroad."}
            </Text>
     
            {/* Visual Checklist */}
            <View style={styles.checklist}>
              {[
                { label: 'Full name', done: !!profile.fullName },
                { label: 'Email address', done: !!profile.email },
                { label: 'Degree level', done: !!profile.currentDegree },
                { label: 'Field of study', done: !!profile.currentField },
                { label: 'GPA / Grade', done: !!profile.grade },
              ].map((item, idx) => (
                <View key={idx} style={styles.checkItem}>
                  <View style={[
                    styles.checkDot, 
                    { backgroundColor: item.done ? '#ccff00' : '#6b7280' }
                  ]} />
                  <Text style={[
                    styles.checkLabel, 
                    { color: colors.text, opacity: item.done ? 0.9 : 0.5 }
                  ]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Form Fields */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: '#ccff00' }]}>Personal Details</Text>
            
            <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]}
              value={profile.fullName}
              onChangeText={(text) => setProfile(p => ({ ...p, fullName: text }))}
              placeholder="e.g. James Anderson"
              placeholderTextColor="#9ca3af"
            />
          </View>
     
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: '#ccff00' }]}>Academic Information</Text>
     
            <Text style={[styles.label, { color: colors.text }]}>Degree Level</Text>
            <View style={styles.degreeRow}>
              {DEGREE_OPTIONS.map((deg) => {
                const isSelected = profile.currentDegree === deg;
                return (
                  <TouchableOpacity 
                    key={deg}
                    style={[
                      styles.degreeBadge, 
                      { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' },
                      isSelected && { backgroundColor: '#ccff00', borderColor: '#ccff00' }
                    ]}
                    onPress={() => setProfile(p => ({ ...p, currentDegree: deg }))}
                  >
                    <Text style={[styles.degreeBadgeText, { color: isSelected ? '#000' : colors.text }]}>{deg}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
     
            <Text style={[styles.label, { color: colors.text }]}>Field of Study</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]}
              value={profile.currentField}
              onChangeText={(text) => setProfile(p => ({ ...p, currentField: text }))}
              placeholder="e.g. Computer Science"
              placeholderTextColor="#9ca3af"
            />
     
            <Text style={[styles.label, { color: colors.text }]}>GPA / Academic Grade</Text>
            <TextInput 
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]}
              value={profile.grade}
              onChangeText={(text) => setProfile(p => ({ ...p, grade: text }))}
              placeholder="e.g. 3.5 or 85"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
          </View>
     
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#ccff00' }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={[styles.buttonText, { color: '#000' }]}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.unlinkButton, { borderColor: colors.border }]}
            onPress={handleLogout}
          >
            <Text style={[styles.unlinkButtonText, { color: colors.text, opacity: 0.6 }]}>
              🔑 Log Out & Reset Session
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  centerScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  brandingHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  brandingTitle: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  brandingTagline: {
    fontSize: 9,
    color: '#8e9aa8',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  authCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  authCardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  authCardSub: {
    fontSize: 13,
    color: '#8e9aa8',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
  },
  identityInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  identityName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  identityEmail: {
    fontSize: 13,
    marginBottom: 6,
  },
  studplexIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.35)',
  },
  studplexIdText: {
    color: '#ff6b00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginLeft: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  completionHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  checklist: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 12,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  checkLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8e9aa8',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  degreeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  degreeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  degreeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#ccff00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  unlinkButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  unlinkButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  googleButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  clerkLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  clerkLabelOptional: {
    fontSize: 11,
    color: '#8e9aa8',
    fontStyle: 'italic',
  },
  clerkInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#2e333d',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#1e222b',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e333d',
    borderRadius: 12,
    backgroundColor: '#1e222b',
    overflow: 'hidden',
  },
  eyeIconContainer: {
    position: 'absolute',
    right: 12,
    justifyContent: 'center',
    height: '100%',
  },
  clerkContinueButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  clerkContinueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});


