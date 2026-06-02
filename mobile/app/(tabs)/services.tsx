import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradedBackground } from '@/components/GradedBackground';

const SERVICES = [
  {
    icon: 'file-text-o',
    iconColor: '#ff6b00',
    title: 'Academic Document Evaluation',
    desc: 'Comprehensive review of your transcripts, certificates, and GPA conversions. We verify international equivalence to fit university admissions criteria.',
    features: ['GPA Equivalence Audits', 'Credential Verification', 'Prerequisites Mapping']
  },
  {
    icon: 'vcard-o',
    iconColor: '#00f0ff',
    title: 'Visa & Immigration Guidance',
    desc: 'Step-by-step navigation through visa applications. We help organize your visa portfolios, prepare financial proofs, and audit documents to maximize approval odds.',
    features: ['Document Checklist Audits', 'Financial Portfolios Review', 'Interview Prep Tips']
  },
  {
    icon: 'graduation-cap',
    iconColor: '#a855f7',
    title: 'University Application Strategy',
    desc: 'Professional review of your university application folders. Get structural feedback on your Personal Statement, CV, and letters of recommendation to stand out.',
    features: ['SOP / Essay Review', 'Letter of Recommendation Audits', 'Portfolio Alignment']
  },
  {
    icon: 'lightbulb-o',
    iconColor: '#eab308',
    title: 'Admissions & Matching Consult',
    desc: 'In-depth review of your academic background to map out specific courses and admission roadmaps across Europe, North America, and beyond.',
    features: ['Custom Eligibility Checklists', 'Direct Admission Entry Audits', 'Deadline Management']
  },
  {
    icon: 'money',
    iconColor: '#ccff00',
    title: 'Scholarship & Funding Advisory',
    desc: 'Discover and align with compatible government, university, and private scholarship programs that fit your profile credentials.',
    features: ['Scholarship Eligibility Checks', 'Funding Document Verification', 'Application Alignment']
  },
  {
    icon: 'globe',
    iconColor: '#10b981',
    title: 'Departure & Integration Support',
    desc: 'Pre-departure assistance, including accommodation guidance, health insurance alignment, and student enrollment verification steps.',
    features: ['Accommodation Sourcing Tips', 'Health Insurance Alignment', 'Enrollment Portals Setup']
  }
];

export default function ServicesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradedBackground />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Our Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Premium Services</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedText }]}>
            Expert human assistance and academic audits alongside our search engine to guarantee a smooth entry into your dream university.
          </Text>
        </View>

        {/* Services Cards */}
        <View style={styles.grid}>
          {SERVICES.map((item, index) => (
            <View 
              key={index}
              style={[
                styles.serviceCard, 
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: `${item.iconColor}15` }]}>
                  <FontAwesome name={item.icon as any} size={22} color={item.iconColor} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>

              <Text style={[styles.cardDesc, { color: colors.mutedText }]}>
                {item.desc}
              </Text>

              <View style={[styles.featuresSection, { borderTopColor: colors.border }]}>
                <Text style={[styles.featuresLabel, { color: item.iconColor }]}>Inclusions</Text>
                {item.features.map((feature, fIdx) => (
                  <View key={fIdx} style={styles.featureRow}>
                    <FontAwesome name="check-circle" size={14} color={item.iconColor} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Call to Action Card */}
        <View style={[styles.ctaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.ctaTitle, { color: colors.text }]}>Need Personalized Assistance?</Text>
          <Text style={[styles.ctaDesc, { color: colors.mutedText }]}>
            Whether you need a complete document audit, scholarship guidance, or step-by-step visa assistance, our specialized academic coordinators are here to guide you.
          </Text>
          <TouchableOpacity 
            style={[styles.ctaButton, { backgroundColor: '#ccff00', shadowColor: '#ccff00' }]}
            onPress={() => router.push('/(tabs)/contact')}
          >
            <Text style={styles.ctaButtonText}>Book an Audit Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: Platform.OS === 'ios' ? 100 : 70,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  grid: {
    gap: 20,
  },
  serviceCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  cardDesc: {
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  featuresSection: {
    borderTopWidth: 1,
    paddingTop: 14,
  },
  featuresLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  ctaCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    marginTop: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
