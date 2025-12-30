import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { verifyOTP, resendOTP } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import * as SecureStore from 'expo-secure-store';
import { getErrorMessage } from '@/utils/errorMessages';

export default function VerifyOTPScreen() {
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { theme, fontScale } = useTheme();
    const { setUser, setIsAuthenticated } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef<(TextInput | null)[]>([]);

    const styles = getStyles(theme, fontScale);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (i + index < 6) {
                    newOtp[i + index] = digit;
                }
            });
            setOtp(newOtp);
            // Focus last filled or next empty
            const nextIndex = Math.min(index + digits.length, 5);
            inputRefs.current[nextIndex]?.focus();

            // Auto-submit if complete
            if (newOtp.every(d => d !== '')) {
                handleVerify(newOtp.join(''));
            }
        } else {
            const newOtp = [...otp];
            newOtp[index] = value.replace(/\D/g, '');
            setOtp(newOtp);

            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }

            // Auto-submit if complete
            if (newOtp.every(d => d !== '')) {
                handleVerify(newOtp.join(''));
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async (otpCode?: string) => {
        const code = otpCode || otp.join('');
        if (code.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the complete 6-digit code.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await verifyOTP(email!, code);

            // Store tokens
            if (Platform.OS === 'web') {
                window.sessionStorage.setItem('token', response.access_token);
                window.sessionStorage.setItem('refresh_token', response.refresh_token);
            } else {
                await SecureStore.setItemAsync('token', response.access_token);
                await SecureStore.setItemAsync('refresh_token', response.refresh_token);
            }

            // Update auth context
            setUser(response.user);
            setIsAuthenticated(true);

            Alert.alert('Success', 'Email verified successfully!', [
                { text: 'OK', onPress: () => router.replace('/') }
            ]);
        } catch (error: any) {
            const message = getErrorMessage(error.message, 'verify_otp');
            Alert.alert('Verification Failed', message);
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend || isResending) return;

        setIsResending(true);
        try {
            await resendOTP(email!);
            setCountdown(60);
            setCanResend(false);
            Alert.alert('OTP Sent', 'A new verification code has been sent to your email.');
        } catch (error: any) {
            Alert.alert('Resend Failed', error.message || 'Failed to resend OTP. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <View style={styles.content}>
                    {/* Back Button */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="mail-open" size={48} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.title}>Verify Your Email</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit code to{'\n'}
                            <Text style={styles.email}>{email}</Text>
                        </Text>
                    </View>

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={6}
                                selectTextOnFocus
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
                        onPress={() => handleVerify()}
                        disabled={isLoading || otp.some(d => !d)}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Verify Email</Text>
                        )}
                    </TouchableOpacity>

                    {/* Resend */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive the code? </Text>
                        {canResend ? (
                            <TouchableOpacity onPress={handleResend} disabled={isResending}>
                                <Text style={styles.resendLink}>
                                    {isResending ? 'Sending...' : 'Resend Code'}
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.countdownText}>Resend in {countdown}s</Text>
                        )}
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (theme: any, fontScale: number) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    keyboardAvoid: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.primaryMuted,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28 * fontScale,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16 * fontScale,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24 * fontScale,
    },
    email: {
        fontWeight: '600',
        color: theme.colors.primary,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 32,
    },
    otpInput: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
        fontSize: 24 * fontScale,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.text,
    },
    otpInputFilled: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primaryMuted,
    },
    verifyButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 18 * fontScale,
        fontWeight: '600',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14 * fontScale,
        color: theme.colors.textSecondary,
    },
    resendLink: {
        fontSize: 14 * fontScale,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    countdownText: {
        fontSize: 14 * fontScale,
        color: theme.colors.textSecondary,
        fontWeight: '500',
    },
});
