import React, { useState } from 'react';
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
    ScrollView,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { forgotPassword, resetPassword } from '@/services/api';
import { getPasswordStrength } from '@/lib/validation';

type Step = 'email' | 'token' | 'success';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const { theme, fontScale } = useTheme();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const styles = getStyles(theme, fontScale);
    const passwordStrength = getPasswordStrength(newPassword);

    const handleRequestReset = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(email.trim());
            setStep('token');
            Alert.alert(
                'Check Your Email',
                'If an account exists with this email, you will receive a password reset token.'
            );
        } catch (error: any) {
            // Always show success to prevent email enumeration
            setStep('token');
            Alert.alert(
                'Check Your Email',
                'If an account exists with this email, you will receive a password reset token.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!token.trim()) {
            Alert.alert('Error', 'Please enter the reset token from your email.');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(token.trim(), newPassword);
            setStep('success');
        } catch (error: any) {
            Alert.alert('Reset Failed', error.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderEmailStep = () => (
        <>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="key" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                    Enter your email address and we'll send you a reset token.
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRequestReset}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Send Reset Token</Text>
                )}
            </TouchableOpacity>
        </>
    );

    const renderTokenStep = () => (
        <>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="lock-open" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    Enter the token from your email and create a new password.
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="key" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Reset Token"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={token}
                    onChangeText={setToken}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {newPassword.length > 0 && (
                <View style={styles.strengthContainer}>
                    <View style={styles.strengthBar}>
                        <View style={[styles.strengthFill, { width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color }]} />
                    </View>
                    <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                        {passwordStrength.label}
                    </Text>
                </View>
            )}

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('email')} style={styles.linkContainer}>
                <Text style={styles.linkText}>Didn't receive the token? Try again</Text>
            </TouchableOpacity>
        </>
    );

    const renderSuccessStep = () => (
        <>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: '#2ecc7133' }]}>
                    <Ionicons name="checkmark-circle" size={48} color="#2ecc71" />
                </View>
                <Text style={styles.title}>Password Reset!</Text>
                <Text style={styles.subtitle}>
                    Your password has been reset successfully. You can now sign in with your new password.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace('/login')}
            >
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Back Button */}
                    {step !== 'success' && (
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    )}

                    {step === 'email' && renderEmailStep()}
                    {step === 'token' && renderTokenStep()}
                    {step === 'success' && renderSuccessStep()}
                </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
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
        marginBottom: 32,
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
        paddingHorizontal: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16 * fontScale,
        color: theme.colors.text,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: theme.colors.border,
        borderRadius: 2,
        overflow: 'hidden',
    },
    strengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12 * fontScale,
        fontWeight: '600',
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18 * fontScale,
        fontWeight: '600',
    },
    linkContainer: {
        alignItems: 'center',
        marginTop: 8,
    },
    linkText: {
        fontSize: 14 * fontScale,
        color: theme.colors.primary,
        fontWeight: '500',
    },
});
