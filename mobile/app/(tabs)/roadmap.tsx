import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const ROADMAPS = {
  'Germany': {
    flag: '🇩🇪',
    steps: [
      { id: 1, title: 'Check University Admission Qualification', desc: 'Verify if your high school diploma or previous university degrees qualify you for direct admission in Germany.', critical: true },
      { id: 2, title: 'Pass Language Proficiency (English/German)', desc: 'Obtain required scores (e.g. IELTS 6.5+ for English programs, or TestDaF for German programs).', critical: true },
      { id: 3, title: 'Prepare Transcripts & Motivation Letter', desc: 'Get your academic transcripts translated. Write a compelling Letter of Motivation.', critical: true },
      { id: 4, title: 'Submit Applications via Uni-Assist or Direct Portal', desc: 'Send your application through the centralized Uni-Assist platform or directly to the university.', critical: true },
      { id: 5, title: 'Secure Blocked Account & Visa', desc: 'Deposit the required living funds (approx. €11,900) into a blocked account and book your visa interview.', critical: true }
    ]
  },
  'UK': {
    flag: '🇬🇧',
    steps: [
      { id: 1, title: 'Take English Language Test (IELTS/PTE)', desc: 'Take a recognized English proficiency test. Usually, an IELTS score of 6.0 - 7.0 is required.', critical: true },
      { id: 2, title: 'Write Personal Statement & Request References', desc: 'Draft an essay explaining your academic interest. Ask teachers or employers for reference letters.', critical: true },
      { id: 3, title: 'Submit Application via UCAS or Portal', desc: 'Apply through UCAS for Bachelor courses, or apply directly on the university portal for Master/PhD programs.', critical: true },
      { id: 4, title: 'Receive CAS Certificate & Apply for Visa', desc: 'Accept your offer, pay the deposit to receive your CAS letter, and submit your student visa application.', critical: true }
    ]
  },
  'USA': {
    flag: '🇺🇸',
    steps: [
      { id: 1, title: 'Take TOEFL/IELTS English Exam', desc: 'Take an English proficiency test. US universities widely prefer TOEFL but accept IELTS (6.5+).', critical: true },
      { id: 2, title: 'Draft Essays & Request Recommendations', desc: 'Write your Statement of Purpose (SOP). Request letters of recommendation from 2-3 academic referees.', critical: true },
      { id: 3, title: 'Submit Applications & Pay Fees', desc: 'Submit applications via Common App or direct portals. Pay university application fees ($50-$100 per school).', critical: true },
      { id: 4, title: 'Obtain Form I-20 & Book Visa Interview', desc: 'Submit bank statements to prove financial support, get your Form I-20, and attend the student visa interview.', critical: true }
    ]
  },
  'Canada': {
    flag: '🇨🇦',
    steps: [
      { id: 1, title: 'Take IELTS Academic Test', desc: 'For streamlined visa processing (SDS stream), you must score a minimum of 6.0 in all bands of IELTS Academic.', critical: true },
      { id: 2, title: 'Prepare Transcripts & Study Plan (SOP)', desc: 'Gather certified academic records and write a detailed Study Plan explaining your academic intentions in Canada.', critical: true },
      { id: 3, title: 'Submit Application directly to University', desc: 'Apply directly via the university online portal and pay the application fee ($100-$150 CAD).', critical: true },
      { id: 4, title: 'Purchase GIC & Apply for Study Permit', desc: 'Purchase a GIC of $20,635 CAD from an approved bank and submit your Canadian Study Permit application.', critical: true }
    ]
  }
};

export default function RoadmapScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedCountry, setSelectedCountry] = useState<keyof typeof ROADMAPS>('Germany');
  const [completedSteps, setCompletedSteps] = useState<Record<string, Record<number, boolean>>>({
    Germany: {},
    UK: {},
    USA: {},
    Canada: {},
  });

  const handleToggleStep = (stepId: number) => {
    setCompletedSteps(prev => {
      const countrySteps = prev[selectedCountry] || {};
      return {
        ...prev,
        [selectedCountry]: {
          ...countrySteps,
          [stepId]: !countrySteps[stepId]
        }
      };
    });
  };

  const currentRoadmap = ROADMAPS[selectedCountry];
  const currentCompleted = completedSteps[selectedCountry] || {};
  const totalSteps = currentRoadmap.steps.length;
  const completedCount = currentRoadmap.steps.filter(s => currentCompleted[s.id]).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Check <Text style={{ color: colors.tint }}>Eligibility</Text>
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text, opacity: 0.6 }]}>
          Select a destination country to view your requirements.
        </Text>
      </View>
 
      {/* Country Horizontal Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryRow}>
        {(Object.keys(ROADMAPS) as Array<keyof typeof ROADMAPS>).map((country) => {
          const isSelected = selectedCountry === country;
          const countryData = ROADMAPS[country];
          return (
            <TouchableOpacity 
              key={country}
              style={[
                styles.countryTab, 
                { backgroundColor: colors.card, borderColor: colors.border },
                isSelected && { borderColor: colors.tint, borderWidth: 2, backgroundColor: 'rgba(204, 255, 0, 0.08)' }
              ]}
              onPress={() => setSelectedCountry(country)}
            >
              <Text style={styles.countryFlag}>{countryData.flag}</Text>
              <Text style={[styles.countryName, { color: colors.text }]}>{country}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
 
      {/* Checklist Card */}
      <View style={[styles.checklistCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            {currentRoadmap.flag} {selectedCountry} Steps
          </Text>
          <Text style={[styles.progressPct, { color: colors.tint }]}>{completedCount}/{totalSteps}</Text>
        </View>
 
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%`, backgroundColor: colors.tint }]} />
        </View>
 
        <View style={styles.stepsList}>
          {currentRoadmap.steps.map((step) => {
            const isDone = !!currentCompleted[step.id];
            return (
              <TouchableOpacity 
                key={step.id} 
                style={[
                  styles.stepCard, 
                  { backgroundColor: colors.background, borderColor: colors.border },
                  isDone && { borderColor: colors.tint, backgroundColor: 'rgba(204, 255, 0, 0.02)' }
                ]}
                onPress={() => handleToggleStep(step.id)}
                activeOpacity={0.8}
              >
                <View style={styles.stepHeader}>
                  <View style={[
                    styles.checkbox, 
                    { borderColor: colors.tint },
                    isDone && { backgroundColor: colors.tint, borderColor: colors.tint }
                  ]}>
                    {isDone && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.stepTitleContainer}>
                    <Text style={[
                      styles.stepTitle, 
                      { color: colors.text },
                      isDone && { textDecorationLine: 'line-through', opacity: 0.5 }
                    ]}>
                      {step.title}
                    </Text>
                    {step.critical && (
                      <View style={styles.requiredTag}>
                        <Text style={styles.requiredTagText}>Required</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[
                  styles.stepDesc,
                  { color: colors.text, opacity: isDone ? 0.4 : 0.6 }
                ]}>
                  {step.desc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

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
    lineHeight: 20,
  },
  countryRow: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingVertical: 4,
  },
  countryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryFlag: {
    fontSize: 18,
    marginRight: 8,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '700',
  },
  checklistCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressPct: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  stepsList: {
    gap: 12,
  },
  stepCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  stepTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
    lineHeight: 20,
  },
  requiredTag: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  requiredTagText: {
    color: '#ef4444',
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 34,
  },
});
