import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { COLORS } from '../../constants/colors';

export default function LoginScreen() {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? COLORS.bgPrimaryDark : COLORS.bgPrimary;
  const cardBg = isDark ? COLORS.bgCardDark : COLORS.bgCard;
  const cardBorder = isDark ? COLORS.borderDark : COLORS.border;
  const textPrimary = isDark ? COLORS.textPrimaryDark : COLORS.textPrimary;
  const textMuted = isDark ? COLORS.textMutedDark : COLORS.textMuted;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.logoArea}>
              <Logo size="lg" />
              <Text style={[styles.subtitle, { color: textMuted }]}>Staff Access Portal</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={textMuted}
                  style={styles.inputIcon}
                />
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email Address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={[styles.inputFill, { borderColor: cardBorder }]}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={textMuted}
                  style={styles.inputIcon}
                />
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  style={[styles.inputFill, { borderColor: cardBorder }]}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={textMuted}
                  />
                </TouchableOpacity>
              </View>

              {!!error && (
                <View style={[styles.errorBox, { backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
                  <Text style={[styles.errorText, { color: COLORS.error }]}>{error}</Text>
                </View>
              )}

              <Button
                onPress={handleSubmit}
                isLoading={loading}
                size="lg"
                style={styles.submitBtn}
              >
                Sign In
              </Button>
            </View>

            <Text style={[styles.footer, { color: isDark ? COLORS.textMutedDark : '#cbd5e1' }]}>
              Protected System • Authorized Personnel Only
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 28,
    gap: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  logoArea: {
    alignItems: 'center',
    gap: 10,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  inputFill: {
    flex: 1,
    paddingLeft: 40,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    marginTop: 4,
    borderRadius: 16,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
  },
});
