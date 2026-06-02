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
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { fetchProfile, saveProfile, registerUser } from '../../services/api';
import { FontAwesome, Ionicons, Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useOAuth, useUser, useAuth } from '@clerk/expo';
import { GradedBackground } from '@/components/GradedBackground';

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

  const { isLoaded: clerkLoaded, isSignedIn, user } = useUser();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { signOut } = useAuth();

  const [profile, setProfile] = useState({
    fullName: '',
    firstName: '',
    lastName: '',
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
  const [showAuthWebView, setShowAuthWebView] = useState(false);

  // Modal Editing States
  const [activeEditField, setActiveEditField] = useState<'firstName' | 'lastName' | 'currentDegree' | 'currentField' | 'grade' | null>(null);
  const [tempEditValue, setTempEditValue] = useState('');

  const startEditing = (field: 'firstName' | 'lastName' | 'currentDegree' | 'currentField' | 'grade') => {
    setActiveEditField(field);
    setTempEditValue(profile[field] || '');
  };

  // Load cached email and profile on mount
  useEffect(() => {
    loadCachedProfile();
  }, []);

  // Sync profile when Clerk finishes loading and user is signed in
  useEffect(() => {
    if (clerkLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Google User';
      if (email) {
        handleBackendProfileSync(email, fullName);
      }
    }
  }, [clerkLoaded, isSignedIn, user]);

  const handleBackendProfileSync = async (email: string, fullName: string) => {
    setLoading(true);
    try {
      const data = await fetchProfile(email);
      if (data && Object.keys(data).length && data.email) {
        const nameParts = (data.fullName || fullName).trim().split(/\s+/);
        setProfile({
          fullName: data.fullName || fullName,
          firstName: data.firstName || nameParts[0] || '',
          lastName: data.lastName || nameParts.slice(1).join(' ') || '',
          email: data.email,
          currentDegree: data.currentDegree || 'Bachelor',
          currentField: data.currentField || '',
          semester: String(data.semester || ''),
          universityName: data.universityName || '',
          grade: String(data.grade || ''),
          notes: data.notes || '',
          studplexId: data.studplexId || '',
        });
        await AsyncStorage.setItem('user_email', data.email);
      } else {
        // Auto register on backend
        const regResult = await registerUser({
          email,
          fullName,
          method: 'google_mobile'
        });
        const nameParts = fullName.trim().split(/\s+/);
        const initialProfile = {
          email,
          fullName,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          currentDegree: 'Bachelor',
          currentField: '',
          grade: '',
          notes: '',
          studplexId: regResult.studplexId || ''
        };
        await saveProfile({
          email: initialProfile.email,
          fullName: initialProfile.fullName,
          currentDegree: initialProfile.currentDegree,
          currentField: initialProfile.currentField,
          grade: initialProfile.grade,
          notes: initialProfile.notes,
          studplexId: initialProfile.studplexId,
        });
        setProfile({
          ...initialProfile,
          semester: '',
          universityName: '',
        });
        await AsyncStorage.setItem('user_email', email);
      }
    } catch (err) {
      console.error("Backend sync error:", err);
    } finally {
      setLoading(false);
    }
  };

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
      firstName: '',
      lastName: '',
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
        const nameParts = (data.fullName || '').trim().split(/\s+/);
        setProfile({
          fullName: data.fullName || '',
          firstName: data.firstName || nameParts[0] || '',
          lastName: data.lastName || nameParts.slice(1).join(' ') || '',
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
        const nameParts = (data.fullName || '').trim().split(/\s+/);
        setProfile({
          fullName: data.fullName || '',
          firstName: data.firstName || nameParts[0] || '',
          lastName: data.lastName || nameParts.slice(1).join(' ') || '',
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
      const nameParts = fullName.trim().split(/\s+/);
      setProfile({
        fullName,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
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
      const redirectUrl = Linking.createURL('/oauth-redirect');
      console.log("[OAuth] Using redirect URL:", redirectUrl);
      
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl,
      });
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else {
        setAuthLoading(false);
      }
    } catch (err) {
      console.error("Google sign in error:", err);
      Alert.alert("Authentication Failed", "Google OAuth session could not be completed.");
      setAuthLoading(false);
    }
  };

  const handleSave = () => {
    if (!profile.email.trim()) {
      Alert.alert("Error", "Session email is missing. Please log in again.");
      return;
    }
    setSaving(true);
    
    // Construct fullName from firstName and lastName dynamically
    const combinedName = `${profile.firstName} ${profile.lastName}`.trim();
    const updatedProfile = {
      ...profile,
      fullName: combinedName
    };
    
    saveProfile(updatedProfile)
      .then(async () => {
        setProfile(prev => ({ ...prev, fullName: combinedName }));
        Alert.alert("Success", "Profile updated and saved!");
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
            await signOut();
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
    const keys = ['firstName', 'lastName', 'email', 'currentDegree', 'currentField', 'grade'];
    const filled = keys.filter(k => profile[k as keyof typeof profile]?.trim() !== '');
    return Math.round((filled.length / keys.length) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#ff6b00" />
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
      <GradedBackground />
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
                    <Stop offset="0" stopColor="#6366f1" />
                    <Stop offset="0.6" stopColor="#ff6b00" />
                    <Stop offset="1" stopColor="#ccff00" />
                  </LinearGradient>
                  <LinearGradient id="studplex-grad2" x1="6" y1="14.5" x2="26" y2="27" gradientUnits="userSpaceOnUse">
                    <Stop offset="0" stopColor="#ff6b00" />
                    <Stop offset="0.6" stopColor="#6366f1" />
                    <Stop offset="1" stopColor="#ccff00" />
                  </LinearGradient>
                </Defs>
              </Svg>
              <Text style={[styles.brandingTitle, { color: colors.text }]}>
                Stud<Text style={{ color: '#ff6b00' }}>plex</Text>
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
                <Text style={{ color: '#ff6b00', fontWeight: '700', fontSize: 13 }}>
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* Logged In Content */
        <ScrollView 
          style={[styles.container, { backgroundColor: 'transparent' }]} 
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Upper Profile Identity Info - Centered (Twitter Style) */}
          <View style={styles.twitterHeaderContainer}>
            {/* Avatar inside Svg circular progress wrapper */}
            <View style={styles.avatarProgressWrapper}>
              <Svg width="100" height="100" viewBox="0 0 100 100" style={styles.absoluteSvg}>
                {/* Background circle */}
                <Circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={colorScheme === 'dark' ? '#161a26' : '#e1e5eb'}
                  strokeWidth="4"
                />
                {/* Progress circle */}
                <Circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="4"
                  strokeDasharray={`${(completionPct / 100) * 276.4}, 276.4`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </Svg>
              
              <View style={[styles.twitterAvatarCircle, { backgroundColor: '#6366f1', width: 76, height: 76, borderRadius: 38, margin: 0, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }]}>
                {user?.imageUrl ? (
                  <Image source={{ uri: user.imageUrl }} style={{ width: 76, height: 76 }} />
                ) : profile.fullName ? (
                  <Text style={[styles.twitterAvatarText, { color: '#fff', fontSize: 28 }]}>
                    {profile.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                ) : (
                  <FontAwesome name="user" size={36} color="#fff" />
                )}
              </View>

              {/* Completion badge overlay */}
              <View style={styles.avatarProgressBadge}>
                <Text style={styles.avatarProgressBadgeText}>{completionPct}%</Text>
              </View>
            </View>

            <Text style={[styles.twitterName, { color: colors.text }]}>
              {profile.fullName || "Student Account"}
            </Text>
            <Text style={[styles.twitterEmail, { color: colors.text, opacity: 0.6 }]}>
              {profile.email}
            </Text>
            {profile.studplexId ? (
              <View style={[styles.studplexIdBadge, { backgroundColor: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.35)', marginTop: 8, alignSelf: 'center' }]}>
                <Text style={[styles.studplexIdText, { color: '#6366f1' }]}>ID: {profile.studplexId}</Text>
              </View>
            ) : null}
          </View>

          {/* Academic Details Section (Mockup pastel row buttons) */}
          <Text style={[styles.sectionHeading, { color: colors.text }]}>My Profile Details</Text>
          <Text style={[styles.sectionSubheading, { color: colors.mutedText }]}>Tap any field to update your academic details</Text>

          {/* SINGLE Details Card container grouping all pastel info rows */}
          <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.detailsCardTitle, { color: colors.text }]}>Profile Information</Text>
            
            <View style={styles.pastelPillsContainer}>
              {/* First Name Row (Lavender) */}
              <TouchableOpacity 
                style={[styles.pastelPillRow, { backgroundColor: '#c7d2fe' }]} 
                onPress={() => startEditing('firstName')}
                activeOpacity={0.85}
              >
                <View style={styles.pastelPillTextContainer}>
                  <Text style={[styles.pastelPillLabel, { color: '#1e1b4b', opacity: 0.6 }]}>FIRST NAME</Text>
                  <Text style={[styles.pastelPillValue, { color: '#1e1b4b' }]} numberOfLines={1}>
                    {profile.firstName || "Tap to set first name"}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-up-right" size={18} color="#1e1b4b" />
                </View>
              </TouchableOpacity>

              {/* Last Name Row (Lavender) */}
              <TouchableOpacity 
                style={[styles.pastelPillRow, { backgroundColor: '#c7d2fe' }]} 
                onPress={() => startEditing('lastName')}
                activeOpacity={0.85}
              >
                <View style={styles.pastelPillTextContainer}>
                  <Text style={[styles.pastelPillLabel, { color: '#1e1b4b', opacity: 0.6 }]}>LAST NAME</Text>
                  <Text style={[styles.pastelPillValue, { color: '#1e1b4b' }]} numberOfLines={1}>
                    {profile.lastName || "Tap to set last name"}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-up-right" size={18} color="#1e1b4b" />
                </View>
              </TouchableOpacity>

              {/* Degree Level Row (Lavender) */}
              <TouchableOpacity 
                style={[styles.pastelPillRow, { backgroundColor: '#c7d2fe' }]} 
                onPress={() => startEditing('currentDegree')}
                activeOpacity={0.85}
              >
                <View style={styles.pastelPillTextContainer}>
                  <Text style={[styles.pastelPillLabel, { color: '#1e1b4b', opacity: 0.6 }]}>DEGREE LEVEL</Text>
                  <Text style={[styles.pastelPillValue, { color: '#1e1b4b' }]} numberOfLines={1}>
                    {profile.currentDegree || "Tap to select degree"}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-up-right" size={18} color="#1e1b4b" />
                </View>
              </TouchableOpacity>

              {/* Field of Study Row (Lavender) */}
              <TouchableOpacity 
                style={[styles.pastelPillRow, { backgroundColor: '#c7d2fe' }]} 
                onPress={() => startEditing('currentField')}
                activeOpacity={0.85}
              >
                <View style={styles.pastelPillTextContainer}>
                  <Text style={[styles.pastelPillLabel, { color: '#1e1b4b', opacity: 0.6 }]}>FIELD OF STUDY</Text>
                  <Text style={[styles.pastelPillValue, { color: '#1e1b4b' }]} numberOfLines={1}>
                    {profile.currentField || "Tap to set field"}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-up-right" size={18} color="#1e1b4b" />
                </View>
              </TouchableOpacity>

              {/* GPA / Academic Grade Row (Lavender) */}
              <TouchableOpacity 
                style={[styles.pastelPillRow, { backgroundColor: '#c7d2fe' }]} 
                onPress={() => startEditing('grade')}
                activeOpacity={0.85}
              >
                <View style={styles.pastelPillTextContainer}>
                  <Text style={[styles.pastelPillLabel, { color: '#1e1b4b', opacity: 0.6 }]}>GPA / ACADEMIC GRADE</Text>
                  <Text style={[styles.pastelPillValue, { color: '#1e1b4b' }]} numberOfLines={1}>
                    {profile.grade || "Tap to set grade"}
                  </Text>
                </View>
                <View style={styles.arrowCircle}>
                  <Feather name="arrow-up-right" size={18} color="#1e1b4b" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action button to save to backend */}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#ff6b00', marginTop: 12, marginBottom: 28 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.buttonText, { color: '#ffffff' }]}>Save</Text>
            )}
          </TouchableOpacity>

          {/* Settings / Options card menu */}
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Log Out */}
            <TouchableOpacity 
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={handleLogout}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconWrapper, { backgroundColor: 'rgba(255, 75, 75, 0.1)' }]}>
                  <Ionicons name="log-out-outline" size={18} color="#ff4b4b" />
                </View>
                <Text style={[styles.settingsText, { color: '#ff4b4b', fontWeight: '700' }]}>Log Out & Reset Session</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ff4b4b" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Edit Field Modal */}
      <Modal
        visible={activeEditField !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveEditField(null)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalContentContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                  {activeEditField === 'firstName' ? 'Edit First Name' :
                   activeEditField === 'lastName' ? 'Edit Last Name' :
                   activeEditField === 'currentDegree' ? 'Select Degree Level' :
                   activeEditField === 'currentField' ? 'Edit Field of Study' :
                   activeEditField === 'grade' ? 'Edit GPA / Grade' : ''}
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveEditField(null)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {activeEditField === 'currentDegree' ? (
                  <View style={styles.degreeOptionsContainer}>
                    {DEGREE_OPTIONS.map((deg) => {
                      const isSelected = tempEditValue === deg;
                      return (
                        <TouchableOpacity
                          key={deg}
                          style={[
                            styles.modalDegreeOption,
                            { borderColor: colors.border, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' },
                            isSelected && { backgroundColor: '#ff6b00', borderColor: '#ff6b00' }
                          ]}
                          onPress={() => setTempEditValue(deg)}
                        >
                          <Text style={[styles.modalDegreeOptionText, { color: isSelected ? '#fff' : colors.text }]}>
                            {deg}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <TextInput
                    style={[styles.modalTextInput, { borderColor: colors.border, color: colors.text, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]}
                    value={tempEditValue}
                    onChangeText={setTempEditValue}
                    placeholder={
                      activeEditField === 'firstName' ? 'e.g. Sarah' :
                      activeEditField === 'lastName' ? 'e.g. Wilson' :
                      activeEditField === 'currentField' ? 'e.g. Computer Science' :
                      activeEditField === 'grade' ? 'e.g. 3.5 or 85' : ''
                    }
                    placeholderTextColor="#8e9aa8"
                    keyboardType={activeEditField === 'grade' ? 'numeric' : 'default'}
                    autoFocus={true}
                  />
                )}
              </View>

              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: '#ff6b00' }]}
                onPress={() => {
                  if (activeEditField) {
                    setProfile(prev => ({
                      ...prev,
                      [activeEditField]: tempEditValue
                    }));
                    setActiveEditField(null);
                  }
                }}
              >
                <Text style={[styles.modalSubmitButtonText, { color: '#fff' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    shadowColor: '#ff6b00',
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
  twitterHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarProgressWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  absoluteSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  avatarProgressBadge: {
    position: 'absolute',
    bottom: -2,
    backgroundColor: '#ccff00',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#06080c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarProgressBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  twitterAvatarCircle: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  twitterAvatarText: {
    fontWeight: '900',
  },
  twitterName: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  twitterEmail: {
    fontSize: 14.5,
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  sectionSubheading: {
    fontSize: 13,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  pastelPillsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  pastelPillRow: {
    height: 72,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  pastelPillTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pastelPillLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  pastelPillValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingsCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsText: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsDivider: {
    height: 1,
    opacity: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContentContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    maxHeight: '80%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalBody: {
    marginBottom: 24,
  },
  modalTextInput: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  degreeOptionsContainer: {
    gap: 10,
  },
  modalDegreeOption: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  modalDegreeOptionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalSubmitButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  detailsCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  detailsCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
});


