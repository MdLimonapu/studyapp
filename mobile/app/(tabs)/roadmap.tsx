import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { router } from 'expo-router';
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
  },
  'Australia': {
    flag: '🇦🇺',
    steps: [
      { id: 1, title: 'Pass IELTS or PTE Academic Test', desc: 'Take a recognized English test. IELTS Academic (6.0 - 6.5) or PTE Academic (50 - 58) is standard.', critical: true },
      { id: 2, title: 'Complete Genuine Student (GS) Statements', desc: 'Address the Genuine Student requirement by detailing your career goals and course relevance.', critical: true },
      { id: 3, title: 'Submit Application & Pay Deposit', desc: 'Apply directly or via agent, pay the tuition deposit, and obtain your Confirmation of Enrolment (CoE).', critical: true },
      { id: 4, title: 'Purchase OSHC Health Cover & Get Visa', desc: 'Purchase Overseas Student Health Cover and apply online for your Student Visa (Subclass 500).', critical: true }
    ]
  },
  'Netherlands': {
    flag: '🇳🇱',
    steps: [
      { id: 1, title: 'Register on Studielink.nl', desc: 'Create an account on the centralized Dutch national student portal and select your target programs.', critical: true },
      { id: 2, title: 'Upload Documents & Pass English Test', desc: 'Submit transcripts on university portal. Provide IELTS (6.5+) or TOEFL score.', critical: true },
      { id: 3, title: 'Accept Offer & Deposit Living Funds', desc: 'Once accepted, pay the tuition invoice and deposit living funds (~€12,000) for university verification.', critical: true },
      { id: 4, title: 'Let University Handle Visa Application', desc: 'The university applies for your student visa (MVV/VVR) on your behalf after checking financial records.', critical: true }
    ]
  },
  'Sweden': {
    flag: '🇸🇪',
    steps: [
      { id: 1, title: 'Register on Universityadmissions.se', desc: 'Create an account on Sweden’s centralized portal. Select up to 4 programs.', critical: true },
      { id: 2, title: 'Upload Academic Records & English Test', desc: 'Upload certified academic transcripts, diplomas, and English test scores (IELTS Academic 6.5+).', critical: true },
      { id: 3, title: 'Pay Application Fee (SEK 900)', desc: 'Pay the application fee of SEK 900 online so Swedish admissions will process your files.', critical: true },
      { id: 4, title: 'Pay First Semester Tuition & Get Visa', desc: 'Accept your offer, pay the first semester fee directly, and apply for your study residence permit.', critical: true }
    ]
  },
  'France': {
    flag: '🇫🇷',
    steps: [
      { id: 1, title: 'France Campus Registration', desc: 'Create an account on the Etudes en France portal for your country to select programs.', critical: true },
      { id: 2, title: 'Submit Language Test (English/French)', desc: 'Submit DELF/DALF for French programs, or IELTS/TOEFL for English-taught programs.', critical: true },
      { id: 3, title: 'Attend Campus France Academic Interview', desc: 'Schedule and attend the mandatory academic interview at your local Campus France office.', critical: true },
      { id: 4, title: 'Accept Offer & Apply for student Visa', desc: 'Confirm your choice on the portal and apply for your student visa showing proof of funds (~€615/month).', critical: true }
    ]
  },
  'Switzerland': {
    flag: '🇨🇭',
    steps: [
      { id: 1, title: 'Verify Course Language & Pass Test', desc: 'Confirm program language and take Goethe/DELF (German/French) or IELTS/TOEFL (English).', critical: true },
      { id: 2, title: 'Submit Online Application Directly', desc: 'Apply directly via the university online application system and pay fee (CHF 100 - CHF 200).', critical: true },
      { id: 3, title: 'Confirm Admission & Show Swiss Bank Funds', desc: 'Show CHF 20,000 available in a bank account under your name at a bank recognized in Switzerland.', critical: true },
      { id: 4, title: 'Apply for National Visa D', desc: 'Book visa appointment at Swiss consulate and bring your registration letter and bank statements.', critical: true }
    ]
  },
  'Japan': {
    flag: '🇯🇵',
    steps: [
      { id: 1, title: 'Language Certification (Japanese/English)', desc: 'Japanese-taught courses require JLPT N2/N1. English-taught courses require TOEFL/IELTS.', critical: true },
      { id: 2, title: 'Submit Application directly to University', desc: 'Apply directly to the Japanese university online or mail physical documents.', critical: true },
      { id: 3, title: 'Receive Admission & Request COE', desc: 'Submit documents for the university to apply for your COE (Certificate of Eligibility) at Japan Immigration.', critical: true },
      { id: 4, title: 'Receive COE & Get Embassy Visa', desc: 'Take your physical COE card and university admission letter to the Japanese embassy to receive your visa.', critical: true }
    ]
  }
};

export default function RoadmapScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedCountry, setSelectedCountry] = useState<keyof typeof ROADMAPS>('Germany');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, Record<number, boolean>>>({
    Germany: {},
    UK: {},
    USA: {},
    Canada: {},
    Australia: {},
    Netherlands: {},
    Sweden: {},
    France: {},
    Switzerland: {},
    Japan: {},
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

  const criticalSteps = currentRoadmap.steps.filter(s => s.critical);
  const isEligible = criticalSteps.length > 0 && criticalSteps.every(s => currentCompleted[s.id]);

  const handleSearchClick = () => {
    router.navigate('/(tabs)');
  };

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

      {/* Country Dropdown Selector */}
      <TouchableOpacity 
        style={[styles.dropdownSelector, { borderColor: showCountryDropdown ? colors.tint : colors.border, backgroundColor: colorScheme === 'dark' ? '#14171f' : '#f9fafb' }]} 
        onPress={() => setShowCountryDropdown(true)}
      >
        <Text style={[styles.dropdownSelectorText, { color: colors.text }]}>
          {currentRoadmap.flag}   {selectedCountry}
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
              {(Object.keys(ROADMAPS) as Array<keyof typeof ROADMAPS>).map((country) => {
                const isSelected = selectedCountry === country;
                const countryData = ROADMAPS[country];
                return (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.modalDropdownItem, 
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: 'rgba(204, 255, 0, 0.1)' }
                    ]}
                    onPress={() => {
                      setSelectedCountry(country);
                      setShowCountryDropdown(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[
                        styles.modalDropdownItemText, 
                        { color: colors.text },
                        isSelected && { color: colors.tint, fontWeight: '700' }
                      ]}>
                        {countryData.flag}   {country}
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

      {/* Checklist Card */}
      <View style={[styles.checklistCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            Requirements
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
                  styles.stepCardRow, 
                  { backgroundColor: colors.background, borderColor: colors.border },
                  isDone && { borderColor: colors.tint, backgroundColor: 'rgba(204, 255, 0, 0.02)' }
                ]}
                onPress={() => handleToggleStep(step.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: colors.tint },
                  isDone && { backgroundColor: colors.tint, borderColor: colors.tint }
                ]}>
                  {isDone && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text 
                  style={[
                    styles.stepTitleCompact, 
                    { color: colors.text },
                    isDone && { textDecorationLine: 'line-through', opacity: 0.5 }
                  ]}
                >
                  {step.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Eligibility Status Banner */}
      <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {isEligible ? (
          <View style={styles.statusContent}>
            <Text style={styles.statusEmoji}>🎉</Text>
            <Text style={[styles.statusTitle, { color: colors.tint }]}>
              Eligibility Unlocked for {selectedCountry}!
            </Text>
            <Text style={[styles.statusDesc, { color: colors.text, opacity: 0.8 }]}>
              You have completed all critical preparation requirements. You are fully ready to find courses and start your application process!
            </Text>
            <TouchableOpacity 
              style={[styles.statusButton, { backgroundColor: colors.tint }]}
              onPress={handleSearchClick}
            >
              <Text style={styles.statusButtonText}>🔍 Find Courses in {selectedCountry}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusContent}>
            <Text style={[styles.statusDescText, { color: colors.text, opacity: 0.7, marginBottom: 12, textAlign: 'center' }]}>
              ⚠️ Complete all <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Required</Text> steps above to verify your eligibility.
            </Text>
            <TouchableOpacity 
              style={[styles.statusButtonSecondary, { borderColor: colors.border }]}
              onPress={handleSearchClick}
            >
              <Text style={[styles.statusButtonTextSecondary, { color: colors.text }]}>🔍 Search Courses Anyway</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    marginBottom: Platform.OS === 'ios' ? 100 : 85,
  },
  header: {
    marginBottom: 16,
    marginTop: 5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  dropdownSelector: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  checklistCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressPct: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginBottom: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepsList: {
    gap: 10,
  },
  stepCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
  },
  stepTitleCompact: {
    fontSize: 15.5,
    fontWeight: '700',
    flex: 1,
    paddingRight: 6,
  },
  requiredTagCompact: {
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
  statusCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  statusContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusDesc: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusDescText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  statusButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    color: '#000',
    fontSize: 14.5,
    fontWeight: '800',
  },
  statusButtonSecondary: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonTextSecondary: {
    fontSize: 14.5,
    fontWeight: '800',
  },
});
