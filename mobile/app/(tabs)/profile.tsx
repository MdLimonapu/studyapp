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
import { fetchProfile, saveProfile } from '../../services/api';
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
    email: 'student@example.com', // fallback/test email
    currentDegree: '',
    currentField: '',
    semester: '',
    universityName: '',
    grade: '',
    notes: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch profile on load
    setLoading(true);
    fetchProfile(profile.email)
      .then(data => {
        if (data && Object.keys(data).length) {
          setProfile(p => ({
            ...p,
            fullName: data.fullName || '',
            currentDegree: data.currentDegree || '',
            currentField: data.currentField || '',
            semester: String(data.semester || ''),
            universityName: data.universityName || '',
            grade: String(data.grade || ''),
            notes: data.notes || '',
          }));
        }
      })
      .catch(err => {
        console.error("Error loading profile:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true);
    saveProfile(profile)
      .then(() => {
        Alert.alert("Success", "Profile updated successfully!");
      })
      .catch(err => {
        Alert.alert("Error", "Failed to update profile. Please try again.");
        console.error(err);
      })
      .finally(() => setSaving(false));
  };

  const getCompletionPercentage = () => {
    const keys = ['fullName', 'currentDegree', 'currentField', 'grade'];
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
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
        <Text style={styles.headerSubtitle}>Set up your profile to match with universities</Text>
      </View>

      {/* Profile Completion Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.completionHeader}>
          <Text style={[styles.completionTitle, { color: colors.text }]}>Completion: {completionPct}%</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${completionPct}%`, backgroundColor: colors.tint }]} />
          </View>
        </View>
        <Text style={styles.completionHint}>
          {completionPct === 100 
            ? "Your profile is complete! Ready for matches." 
            : "Fill in all required fields to unlock AI matching recommendations."}
        </Text>
      </View>

      {/* Form Fields */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Personal Details</Text>
        
        <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={profile.fullName}
          onChangeText={(text) => setProfile(p => ({ ...p, fullName: text }))}
          placeholder="e.g. James Anderson"
          placeholderTextColor="#9ca3af"
        />

        <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text, opacity: 0.7 }]}
          value={profile.email}
          editable={false}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.tint }]}>Academic Information</Text>

        <Text style={[styles.label, { color: colors.text }]}>Degree Level</Text>
        <View style={styles.degreeRow}>
          {DEGREE_OPTIONS.slice(0, 4).map((deg) => {
            const isSelected = profile.currentDegree === deg;
            return (
              <TouchableOpacity 
                key={deg}
                style={[
                  styles.degreeBadge, 
                  { borderColor: colors.border },
                  isSelected && { backgroundColor: colors.tint, borderColor: colors.tint }
                ]}
                onPress={() => setProfile(p => ({ ...p, currentDegree: deg }))}
              >
                <Text style={[styles.degreeBadgeText, { color: isSelected ? '#fff' : colors.text }]}>{deg}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Field of Study</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={profile.currentField}
          onChangeText={(text) => setProfile(p => ({ ...p, currentField: text }))}
          placeholder="e.g. Computer Science"
          placeholderTextColor="#9ca3af"
        />

        <Text style={[styles.label, { color: colors.text }]}>GPA / Academic Grade</Text>
        <TextInput 
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
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
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  card: {
    padding: 16,
    borderRadius: 16,
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
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
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
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 10,
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
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
