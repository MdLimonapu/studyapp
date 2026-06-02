import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { fetchProfile } from '../../services/api';
import { GradedBackground } from '@/components/GradedBackground';

const SUBJECT_OPTIONS = [
  'University Matching & Admission',
  'Visa & Document Preparation',
  'Eligibility & Grade Conversion',
  'Scholarships & Funding',
  'Profile & Account Setup',
  'Bug Report or Feedback',
  'Other',
];

const FAQ_ITEMS = [
  {
    question: 'Is Studplex free to use?',
    answer:
      'Yes, Studplex is 100% free to use. Our platform is designed to help students explore university options, check eligibility, and prepare for their study abroad journey at no cost.',
  },
  {
    question: 'How accurate are the university matches?',
    answer:
      'Our matches are based on verified data from official university sources, including entry requirements, tuition fees, and program details. We continuously update our database to ensure accuracy.',
  },
  {
    question: 'How do I edit my matching details?',
    answer:
      'Head to your Profile page and update your academic information such as degree level, field of study, and GPA. Your matches will automatically refresh based on your updated profile.',
  },
  {
    question: 'Who can I contact for visa questions?',
    answer:
      'For visa-specific inquiries, contact the embassy or consulate of your destination country directly. You can also reach out to us through this form and we will do our best to guide you.',
  },
];

export default function ContactScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // UI state
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // FAQ chevron animations
  const faqAnimations = useRef(FAQ_ITEMS.map(() => new Animated.Value(0))).current;

  // Pre-fill name/email from profile
  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem('user_email');
      if (storedEmail && storedEmail.trim() !== '') {
        setEmail(storedEmail);
        try {
          const data = await fetchProfile(storedEmail);
          if (data && data.fullName) {
            setName(data.fullName);
          }
        } catch {
          // Profile fetch failed silently, email is still set
        }
      }
    } catch {
      // AsyncStorage read failed silently
    }
  };

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!subject) {
      setError('Please select a subject category.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter your message.');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        'https://formsubmit.co/ajax/support@studplex.com',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            subject,
            message: message.trim(),
            _subject: 'Studplex App: ' + subject,
          }),
        }
      );

      if (response.ok) {
        setSent(true);
      } else {
        setError('Failed to send message. Please try again later.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setSent(false);
    setSubject('');
    setMessage('');
    setError('');
  };

  const toggleFaq = (index: number) => {
    // Close previously open item
    if (openFaqIndex !== null && openFaqIndex !== index) {
      Animated.timing(faqAnimations[openFaqIndex], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    if (openFaqIndex === index) {
      // Close current
      Animated.timing(faqAnimations[index], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setOpenFaqIndex(null);
    } else {
      // Open new
      Animated.timing(faqAnimations[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      setOpenFaqIndex(index);
    }
  };

  const inputBg = colorScheme === 'dark' ? '#14171f' : '#f9fafb';
  const placeholderColor = colorScheme === 'dark' ? '#5f6672' : '#9ca3af';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <GradedBackground />
      <ScrollView
        style={[styles.container, { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Contact <Text style={{ color: colors.tint }}>Us</Text>
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Get in touch with our team
          </Text>
        </View>

        {sent ? (
          /* Success Confirmation */
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                alignItems: 'center',
                paddingVertical: 48,
              },
            ]}
          >
            <View
              style={[
                styles.successIconCircle,
                { backgroundColor: colorScheme === 'dark' ? 'rgba(204, 255, 0, 0.1)' : 'rgba(204, 255, 0, 0.05)' },
              ]}
            >
              <FontAwesome
                name="check-circle"
                size={48}
                color="#ccff00"
              />
            </View>
            <Text
              style={[
                styles.successTitle,
                { color: colors.text, marginTop: 20 },
              ]}
            >
              Message Sent
            </Text>
            <Text
              style={[
                styles.successDesc,
                { color: colors.mutedText, marginTop: 10 },
              ]}
            >
              Thank you for reaching out. Our team has received your message and
              will get back to you as soon as possible.
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: '#00f0ff', shadowColor: '#00f0ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetButtonText, { color: '#000000', fontWeight: '800' }]}>Send Another Message</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Contact Form */
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.formIconRow}>
              <FontAwesome name="envelope" size={16} color={colors.tint} />
              <Text
                style={[
                  styles.formSectionLabel,
                  { color: colors.text, marginLeft: 8 },
                ]}
              >
                Send us a message
              </Text>
            </View>

            {/* Full Name */}
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: inputBg,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={placeholderColor}
              autoCapitalize="words"
            />

            {/* Email */}
            <Text style={[styles.label, { color: colors.text }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: inputBg,
                },
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Subject Category */}
            <Text style={[styles.label, { color: colors.text }]}>
              Subject Category
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerButton,
                {
                  borderColor: colors.border,
                  backgroundColor: inputBg,
                },
              ]}
              onPress={() => setShowSubjectModal(true)}
            >
              <Text
                style={{
                  color: subject ? colors.text : placeholderColor,
                  fontSize: 14,
                  flex: 1,
                }}
              >
                {subject || 'Select a subject'}
              </Text>
              <FontAwesome
                name="chevron-down"
                size={12}
                color={colors.mutedText}
              />
            </TouchableOpacity>

            {/* Message */}
            <Text style={[styles.label, { color: colors.text }]}>Message</Text>
            <TextInput
              style={[
                styles.input,
                styles.messageInput,
                {
                  borderColor: colors.border,
                  color: colors.text,
                  backgroundColor: inputBg,
                },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your question or issue in detail..."
              placeholderTextColor={placeholderColor}
              multiline
              textAlignVertical="top"
            />

            {/* Error */}
            {error ? (
              <View style={styles.errorRow}>
                <FontAwesome
                  name="exclamation-circle"
                  size={14}
                  color="#ef4444"
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#00f0ff', shadowColor: '#00f0ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]}
              onPress={handleSubmit}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <View style={styles.submitContent}>
                  <FontAwesome
                    name="paper-plane"
                    size={14}
                    color="#000000"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.submitButtonText, { color: '#000000', fontWeight: '800' }]}>Send Message</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeaderRow}>
            <FontAwesome
              name="question-circle"
              size={18}
              color={colors.tint}
            />
            <Text
              style={[
                styles.faqTitle,
                { color: colors.text, marginLeft: 8 },
              ]}
            >
              Frequently Asked Questions
            </Text>
          </View>

          {FAQ_ITEMS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            const rotation = faqAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '180deg'],
            });

            return (
              <View
                key={index}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isOpen ? colors.tint : colors.border,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFaq(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.faqQuestionText,
                      { color: colors.text },
                    ]}
                  >
                    {faq.question}
                  </Text>
                  <Animated.View
                    style={{ transform: [{ rotate: rotation }] }}
                  >
                    <FontAwesome
                      name="chevron-down"
                      size={13}
                      color={isOpen ? colors.tint : colors.mutedText}
                    />
                  </Animated.View>
                </TouchableOpacity>
                {isOpen && (
                  <View style={[styles.faqAnswer, { borderTopColor: colors.border }]}>
                    <Text
                      style={[
                        styles.faqAnswerText,
                        { color: colors.mutedText },
                      ]}
                    >
                      {faq.answer}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <FontAwesome
            name="clock-o"
            size={14}
            color={colors.mutedText}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.footerNoteText, { color: colors.mutedText }]}>
            We typically respond within 24 hours.
          </Text>
        </View>
      </ScrollView>

      {/* Subject Picker Modal */}
      <Modal
        visible={showSubjectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubjectModal(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Select Subject
            </Text>
            {SUBJECT_OPTIONS.map((option) => {
              const isSelected = subject === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.modalOption,
                    {
                      borderColor: colors.border,
                      backgroundColor: isSelected
                        ? colorScheme === 'dark'
                          ? 'rgba(255, 107, 0, 0.08)'
                          : 'rgba(255, 128, 0, 0.08)'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    setSubject(option);
                    setShowSubjectModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color: isSelected ? colors.tint : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {option}
                  </Text>
                  {isSelected && (
                    <FontAwesome
                      name="check"
                      size={14}
                      color={colors.tint}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.modalCloseButton, { borderColor: colors.border }]}
              onPress={() => setShowSubjectModal(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.mutedText }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 85,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  formIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  formSectionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageInput: {
    minHeight: 130,
    paddingTop: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  resetButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 28,
  },
  resetButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
  },
  faqSection: {
    marginTop: 28,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  footerNoteText: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  modalOptionText: {
    fontSize: 14,
    flex: 1,
  },
  modalCloseButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
