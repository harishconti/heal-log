/**
 * Error Messages Utility
 * Context-aware error message mapping for better user experience
 */

type ErrorContext = 'signup' | 'login' | 'add_patient' | 'reset_password' | 'verify_otp';

const ERROR_MESSAGES: Record<string, Record<ErrorContext, string>> = {
    'email already exists': {
        signup: '📧 This email is already registered. Would you like to sign in instead?',
        login: 'Email not found in our records.',
        add_patient: 'A patient with this email already exists.',
        reset_password: 'Email not found in our records.',
        verify_otp: 'This email is already verified.',
    },
    'account with this email': {
        signup: '📧 This email is already registered. Would you like to sign in instead?',
        login: 'Email not found in our records.',
        add_patient: 'A patient with this email already exists.',
        reset_password: 'Email not found in our records.',
        verify_otp: 'This email is already verified.',
    },
    'invalid email or password': {
        signup: 'Registration failed. Please try again.',
        login: '❌ Wrong email or password. Try again or reset password.',
        add_patient: 'Invalid credentials.',
        reset_password: 'Invalid credentials.',
        verify_otp: 'Invalid credentials.',
    },
    'email not verified': {
        signup: '📧 Please verify your email first.',
        login: '📧 Please verify your email first. Check your inbox for the OTP.',
        add_patient: 'Email not verified.',
        reset_password: 'Please verify your email first.',
        verify_otp: 'Please enter the OTP sent to your email.',
    },
    'invalid otp': {
        signup: 'Invalid verification code.',
        login: 'Invalid verification code.',
        add_patient: 'Invalid code.',
        reset_password: 'Invalid code.',
        verify_otp: '❌ Invalid OTP. Please check and try again.',
    },
    'otp has expired': {
        signup: 'Verification code expired. Please request a new one.',
        login: 'Verification code expired.',
        add_patient: 'Code expired.',
        reset_password: 'Code expired.',
        verify_otp: '⏰ OTP has expired. Please request a new one.',
    },
    'maximum attempts': {
        signup: 'Too many attempts. Please request a new code.',
        login: 'Too many attempts.',
        add_patient: 'Too many attempts.',
        reset_password: 'Too many attempts.',
        verify_otp: '🚫 Maximum attempts exceeded. Please request a new OTP.',
    },
    'invalid or expired reset token': {
        signup: 'Invalid link.',
        login: 'Invalid link.',
        add_patient: 'Invalid link.',
        reset_password: '❌ This reset link is invalid or has expired. Please request a new one.',
        verify_otp: 'Invalid token.',
    },
    'network': {
        signup: '📶 Network error. Please check your connection.',
        login: '📶 Network error. Please check your connection.',
        add_patient: '📶 Network error. Please check your connection.',
        reset_password: '📶 Network error. Please check your connection.',
        verify_otp: '📶 Network error. Please check your connection.',
    },
};

/**
 * Get a user-friendly error message based on context
 */
export const getErrorMessage = (errorText: string, context: ErrorContext): string => {
    const lowerError = errorText.toLowerCase();

    for (const [key, messages] of Object.entries(ERROR_MESSAGES)) {
        if (lowerError.includes(key)) {
            return messages[context];
        }
    }

    // Default fallback
    return `❌ ${errorText || 'Something went wrong. Please try again.'}`;
};

/**
 * Check if error indicates email needs verification
 */
export const isVerificationError = (errorText: string): boolean => {
    const lowerError = errorText.toLowerCase();
    return lowerError.includes('email not verified') ||
        lowerError.includes('not verified') ||
        lowerError.includes('verify your email');
};

/**
 * Check if error indicates duplicate email (409 conflict)
 */
export const isDuplicateEmailError = (errorText: string): boolean => {
    const lowerError = errorText.toLowerCase();
    return lowerError.includes('email already exists') ||
        lowerError.includes('account with this email');
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: any): boolean => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        error.code === 'NETWORK_ERROR';
};
