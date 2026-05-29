import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProfile, saveProfile } from '../../services/api';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

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
  const [syncing, setSyncing] = useState(false);

  // Load cached email and profile on mount
  useEffect(() => {
    loadCachedProfile();
  }, []);

  const loadCachedProfile = async () => {
    setLoading(true);
    try {
      const email = await AsyncStorage.getItem('user_email');
      if (email && email.trim() !== '') {
        setProfile(p => ({ ...p, email }));
        await syncProfileFromServer(email);
      } else {
        // Start completely blank/empty if not synced yet
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
      }
    } catch (err) {
      console.error("Error loading cached email:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncProfileFromServer = async (emailToSync: string) => {
    setSyncing(true);
    try {
      const data = await fetchProfile(emailToSync);
      if (data && Object.keys(data).length) {
        setProfile(p => ({
          ...p,
          fullName: data.fullName || '',
          email: emailToSync,
          currentDegree: data.currentDegree || '',
          currentField: data.currentField || '',
          semester: String(data.semester || ''),
          universityName: data.universityName || '',
          grade: String(data.grade || ''),
          notes: data.notes || '',
          studplexId: data.studplexId || '',
        }));
        await AsyncStorage.setItem('user_email', emailToSync);
      } else {
        // If email not found or empty, just keep the input email
        setProfile(p => ({ ...p, email: emailToSync, studplexId: '' }));
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = () => {
    if (!profile.email.trim()) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    setSaving(true);
    saveProfile(profile)
      .then(async () => {
        await AsyncStorage.setItem('user_email', profile.email);
        Alert.alert("Success", "Profile updated and saved to server!");
      })
      .catch(err => {
        Alert.alert("Error", "Failed to update profile. Please try again.");
        console.error(err);
      })
      .finally(() => setSaving(false));
  };

  const getCompletionPercentage = () => {
    const keys = ['fullName', 'email', 'currentDegree', 'currentField', 'grade'];
    const filled = keys.filter(k => profile[k as keyof typeof profile]?.trim() !== '');
    return Math.round((filled.length / keys.length) * 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const completionPct = getCompletionPercentage();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {/* Upper Profile Identity Info */}
      <View style={styles.header}>
        <View style={styles.identityRow}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.tint }]}>
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
              {profile.fullName || "Global Student"}
            </Text>
            <Text style={[styles.identityEmail, { color: colors.text, opacity: 0.6 }]}>
              {profile.email || "Unsynced Guest Profile"}
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
            <View style={[styles.progressBar, { width: `${completionPct}%`, backgroundColor: colors.tint }]} />
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
                { backgroundColor: item.done ? colors.tint : '#6b7280' }
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
 
      {/* Sync Profile Zone */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Account Sync</Text>
        <Text style={[styles.hint, { color: colors.text, opacity: 0.6, marginBottom: 12 }]}>
          Enter the email address you use on the Studplex website to import and sync your details instantly.
        </Text>
        
        <View style={styles.syncRow}>
          <TextInput 
            style={[styles.syncInput, { borderColor: colors.border, color: colors.text, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]}
            value={profile.email}
            onChangeText={(text) => setProfile(p => ({ ...p, email: text }))}
            placeholder="e.g. student@example.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={[styles.syncButton, { backgroundColor: colors.tint }]}
            onPress={() => syncProfileFromServer(profile.email)}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={[styles.syncButtonText, { color: '#000' }]}>Sync</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
 
      {/* Form Fields */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Personal Details</Text>
        
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
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Academic Information</Text>
 
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
                  isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }
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
        style={[styles.button, { backgroundColor: colors.tint }]}
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
        onPress={async () => {
          await AsyncStorage.removeItem('user_email');
          await AsyncStorage.removeItem('search_results');
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
          Alert.alert("Session Reset", "All local test data cleared. App is now in guest mode.");
        }}
      >
        <Text style={[styles.unlinkButtonText, { color: colors.text, opacity: 0.6 }]}>
          Unlink Account & Reset Session
        </Text>
      </TouchableOpacity>

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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#000',
    fontSize: 28,
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
    backgroundColor: '#e5e7eb',
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
    color: '#6b7280',
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
  hint: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 10,
  },
  syncRow: {
    flexDirection: 'row',
    gap: 8,
  },
  syncInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  syncButton: {
    width: 80,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  degreeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
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
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
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
});
