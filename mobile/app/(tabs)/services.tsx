import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { useUser } from '@clerk/expo';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { GradedBackground } from '@/components/GradedBackground';

const SERVICES = [
  {
    icon: 'file-text-o',
    iconColor: '#ff6b00',
    title: 'Academic Document Evaluation',
    desc: 'Comprehensive review of your transcripts, certificates, and GPA conversions. We verify international equivalence to fit university admissions criteria.',
    features: ['GPA Equivalence Audits', 'Credential Verification', 'Prerequisites Mapping'],
    docOptions: ['Academic Transcript', 'Graduation Certificate', 'GPA Report', 'Other'],
    ctaText: 'Start Document Evaluation'
  },
  {
    icon: 'vcard-o',
    iconColor: '#00f0ff',
    title: 'Visa & Immigration Guidance',
    desc: 'Step-by-step navigation through visa applications. We help organize your visa portfolios, prepare financial proofs, and audit documents to maximize approval odds.',
    features: ['Document Checklist Audits', 'Financial Portfolios Review', 'Interview Prep Tips'],
    docOptions: ['Financial/Bank Statement', 'Passport Copy', 'Sponsorship Letter', 'Visa Application Draft', 'Other'],
    ctaText: 'Request Visa Review'
  },
  {
    icon: 'graduation-cap',
    iconColor: '#a855f7',
    title: 'University Application Strategy',
    desc: 'Professional review of your university application folders. Get structural feedback on your Personal Statement, CV, and letters of recommendation to stand out.',
    features: ['SOP / Essay Review', 'Letter of Recommendation Audits', 'Portfolio Alignment'],
    docOptions: ['Statement of Purpose (SOP)', 'CV / Resume', 'Letter of Recommendation', 'Other'],
    ctaText: 'Submit Application Files'
  },
  {
    icon: 'lightbulb-o',
    iconColor: '#eab308',
    title: 'Admissions & Matching Consult',
    desc: 'In-depth review of your academic background to map out specific courses and admission roadmaps across Europe, North America, and beyond.',
    features: ['Custom Eligibility Checklists', 'Direct Admission Entry Audits', 'Deadline Management'],
    docOptions: ['Detailed CV', 'Transcripts Overview', 'Target University List', 'Other'],
    ctaText: 'Request Admissions Review'
  },
  {
    icon: 'money',
    iconColor: '#ccff00',
    title: 'Scholarship & Funding Advisory',
    desc: 'Discover and align with compatible government, university, and private scholarship programs that fit your profile credentials.',
    features: ['Scholarship Eligibility Checks', 'Funding Document Verification', 'Application Alignment'],
    docOptions: ['Scholarship Application Essay', 'Income Statement', 'Awards Portfolio', 'Other'],
    ctaText: 'Request Funding Audit'
  },
  {
    icon: 'globe',
    iconColor: '#10b981',
    title: 'Departure & Integration Support',
    desc: 'Pre-departure assistance, including accommodation guidance, health insurance alignment, and student enrollment verification steps.',
    features: ['Accommodation Sourcing Tips', 'Health Insurance Alignment', 'Enrollment Portals Setup'],
    docOptions: ['Enrollment Offer Letter', 'Accommodation Application', 'Health Insurance Policy', 'Other'],
    ctaText: 'Request Departure Review'
  }
];

export default function ServicesScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useUser();

  // Booking states
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [docType, setDocType] = useState('');
  const [fileName, setFileName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleOpenBooking = (service: any) => {
    setSelectedService(service);
    setDocType('');
    setFileName('');
    setComment('');
    setSubmitSuccess(false);
    setShowDropdown(false);
  };

  const handleCloseBooking = () => {
    setSelectedService(null);
  };

  const handleSimulateFileSelect = () => {
    if (!docType) return;
    const cleanDocName = docType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setFileName(`my_${cleanDocName}_draft.pdf`);
  };

  const handleSubmitBooking = async () => {
    if (!docType || !fileName) return;
    setIsSubmitting(true);

    try {
      // 1. Request Payment Intent clientSecret from backend
      const backendUrl = "http://127.0.0.1:5001"; // Fallback URL for development
      const response = await fetch(`${backendUrl}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: selectedService.price || "49.00",
          service_id: selectedService.title,
          doc_type: docType
        })
      });

      const resData = await response.json();
      if (resData.error) {
        alert(`Server Error: ${resData.error}`);
        setIsSubmitting(false);
        return;
      }

      const clientSecret = resData.clientSecret;
      if (!clientSecret) {
        alert("Failed to initialize payment intent. Please check backend configuration.");
        setIsSubmitting(false);
        return;
      }

      // 2. Init native mobile Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Studplex',
        style: colorScheme === 'dark' ? 'alwaysDark' : 'alwaysLight',
        defaultBillingDetails: {
          name: 'Student User',
        }
      });

      if (initError) {
        alert(`Payment initialization failed: ${initError.message}`);
        setIsSubmitting(false);
        return;
      }

      // 3. Prompt Stripe's native checkout interface
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        alert(`Payment failed: ${presentError.message}`);
        setIsSubmitting(false);
      } else {
        // Send confirmation request to backend to send email notification
        try {
          await fetch(`${backendUrl}/api/payment/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txn_id: 'STX_NATIVE_CONFIRMED', // Mobile SDK confirms natively
              email: user?.primaryEmailAddress?.emailAddress || 'student@example.com',
              service_title: selectedService.title,
              doc_type: docType,
              filename: fileName || 'document.pdf',
              comment: comment,
              price: selectedService.price || '$49.00'
            })
          });
        } catch (confirmErr) {
          console.error("⚠️ Failed to trigger payment confirm mail on mobile:", confirmErr);
        }

        setIsSubmitting(false);
        setSubmitSuccess(true);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to communicate with the payment server.");
      setIsSubmitting(false);
    }
  };

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
            <TouchableOpacity 
              key={index}
              activeOpacity={0.9}
              onPress={() => handleOpenBooking(item)}
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

              {/* Action Button - Permanent Solid Color */}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: item.iconColor }]}
                onPress={() => handleOpenBooking(item)}
              >
                <Text style={[styles.actionBtnText, { color: item.iconColor === '#ccff00' || item.iconColor === '#00f0ff' ? '#000000' : '#ffffff' }]}>
                  {item.ctaText}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
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

      {/* Booking Form Modal */}
      {selectedService && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCloseBooking}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity 
              style={styles.modalBgDismiss} 
              activeOpacity={1} 
              onPress={handleCloseBooking} 
            />
            
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Close Handle / Indicator */}
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <FontAwesome name={selectedService.icon as any} size={22} color={selectedService.iconColor} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Document Upload</Text>
                </View>
                <TouchableOpacity onPress={handleCloseBooking} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.mutedText} />
                </TouchableOpacity>
              </View>

              {!submitSuccess ? (
                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 18, paddingBottom: 24 }}
                >
                  <Text style={[styles.modalDesc, { color: colors.mutedText }]}>
                    Select your document type and upload files to request auditing from our advisors.
                  </Text>

                  {/* Dropdown Selector */}
                  <View>
                    <Text style={[styles.formLabel, { color: colors.mutedText }]}>Document Category</Text>
                    <TouchableOpacity 
                      style={[styles.pickerTrigger, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: colors.border }]}
                      onPress={() => setShowDropdown(!showDropdown)}
                    >
                      <Text style={{ color: docType ? colors.text : colors.mutedText, fontWeight: '600', fontSize: 14 }}>
                        {docType || 'Select document type'}
                      </Text>
                      <FontAwesome name={showDropdown ? "chevron-up" : "chevron-down"} size={12} color={colors.mutedText} />
                    </TouchableOpacity>

                    {showDropdown && (
                      <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {selectedService.docOptions.map((opt: string, oIdx: number) => (
                          <TouchableOpacity 
                            key={oIdx}
                            style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                            onPress={() => {
                              setDocType(opt);
                              setFileName('');
                              setShowDropdown(false);
                            }}
                          >
                            <Text style={{ color: colors.text, fontWeight: '600' }}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Upload Picker (Simulated) */}
                  {docType !== '' && (
                    <View>
                      <Text style={[styles.formLabel, { color: colors.mutedText }]}>Select Document File</Text>
                      <TouchableOpacity 
                        style={[
                          styles.uploadContainer, 
                          { 
                            backgroundColor: 'rgba(255,255,255,0.01)', 
                            borderColor: fileName ? selectedService.iconColor : colors.border 
                          }
                        ]}
                        onPress={handleSimulateFileSelect}
                      >
                        <FontAwesome name="upload" size={28} color={fileName ? selectedService.iconColor : colors.mutedText} />
                        <Text style={[styles.uploadTitle, { color: colors.text }]}>
                          {fileName ? 'File Selected' : 'Choose Document File'}
                        </Text>
                        <Text style={{ color: colors.mutedText, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                          {fileName ? fileName : 'Tap to select PDF, DOCX or Image'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Comment Input */}
                  <View>
                    <Text style={[styles.formLabel, { color: colors.mutedText }]}>Notes / Comments (Optional)</Text>
                    <TextInput
                      style={[
                        styles.commentInput, 
                        { 
                          backgroundColor: 'rgba(255,255,255,0.03)', 
                          borderColor: colors.border,
                          color: colors.text
                        }
                      ]}
                      multiline
                      numberOfLines={3}
                      placeholder="Add any specific context, targets or notes here..."
                      placeholderTextColor={colors.mutedText}
                      value={comment}
                      onChangeText={setComment}
                    />
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitBtn, 
                      { 
                        backgroundColor: (docType && fileName) ? selectedService.iconColor : 'rgba(255,255,255,0.08)',
                        opacity: (docType && fileName) ? 1 : 0.5 
                      }
                    ]}
                    disabled={isSubmitting || !docType || !fileName}
                    onPress={handleSubmitBooking}
                  >
                    <Text style={[
                      styles.submitBtnText, 
                      { color: (docType && fileName) && (selectedService.iconColor === '#ccff00' || selectedService.iconColor === '#00f0ff') ? '#000000' : '#ffffff' }
                    ]}>
                      {isSubmitting ? 'Uploading files...' : 'Request Evaluation'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <View style={styles.successWrapper}>
                  <FontAwesome name="check-circle" size={54} color="#10b981" />
                  <Text style={[styles.successTitle, { color: colors.text }]}>Upload Complete!</Text>
                  <Text style={[styles.successDesc, { color: colors.mutedText }]}>
                    Your file <Text style={{ color: colors.text, fontWeight: '700' }}>{fileName}</Text> has been successfully categorized as a {docType} audit request.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.submitBtn, { backgroundColor: '#10b981', marginTop: 14 }]}
                    onPress={handleCloseBooking}
                  >
                    <Text style={[styles.submitBtnText, { color: '#ffffff' }]}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
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
    paddingBottom: 160, // Large padding to avoid navigation overlay blocking the bottom card!
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
    marginBottom: 16,
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
  actionBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
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

  /* Modal Layout */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalBgDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    padding: 24,
    paddingTop: 14,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDesc: {
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  pickerTrigger: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownList: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  uploadContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  commentInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
