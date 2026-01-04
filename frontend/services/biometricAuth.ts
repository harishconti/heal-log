import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

// Development-only logging
const devLog = __DEV__
  ? (message: string, ...args: unknown[]) => console.log(message, ...args)
  : () => {};

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricTypes: BiometricType[];
  securityLevel: 'strong' | 'weak' | 'none';
}

const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials_enabled';
const BIOMETRIC_TOKEN_KEY = 'biometric_auth_token';

class BiometricAuthService {
  private static instance: BiometricAuthService;

  private constructor() {}

  static getInstance(): BiometricAuthService {
    if (!BiometricAuthService.instance) {
      BiometricAuthService.instance = new BiometricAuthService();
    }
    return BiometricAuthService.instance;
  }

  /**
   * Check if biometric authentication is available and enrolled
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    try {
      // Check if hardware supports biometrics
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        devLog('[Biometric] No biometric hardware available');
        return {
          isAvailable: false,
          isEnrolled: false,
          biometricTypes: [],
          securityLevel: 'none',
        };
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      // Get supported authentication types
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const biometricTypes: BiometricType[] = supportedTypes.map((type) => {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'fingerprint';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'facial';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'iris';
          default:
            return 'none';
        }
      }).filter((t) => t !== 'none');

      // Determine security level
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      const level: 'strong' | 'weak' | 'none' =
        securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
          ? 'strong'
          : securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
          ? 'weak'
          : 'none';

      devLog('[Biometric] Capabilities:', {
        isAvailable: hasHardware,
        isEnrolled,
        biometricTypes,
        securityLevel: level,
      });

      return {
        isAvailable: hasHardware,
        isEnrolled,
        biometricTypes,
        securityLevel: level,
      };
    } catch (error) {
      devLog('[Biometric] Error checking capabilities:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        biometricTypes: [],
        securityLevel: 'none',
      };
    }
  }

  /**
   * Get human-readable name for biometric type
   */
  getBiometricTypeName(types: BiometricType[]): string {
    if (types.includes('facial')) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    if (types.includes('fingerprint')) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    if (types.includes('iris')) {
      return 'Iris Recognition';
    }
    return 'Biometric';
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(
    promptMessage?: string,
    options?: {
      cancelLabel?: string;
      fallbackLabel?: string;
      disableDeviceFallback?: boolean;
    }
  ): Promise<BiometricAuthResult> {
    try {
      const capabilities = await this.checkCapabilities();

      if (!capabilities.isAvailable || !capabilities.isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication not available',
          errorCode: 'NOT_AVAILABLE',
        };
      }

      const biometricName = this.getBiometricTypeName(capabilities.biometricTypes);
      const message = promptMessage || `Authenticate with ${biometricName}`;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: message,
        cancelLabel: options?.cancelLabel || 'Cancel',
        fallbackLabel: options?.fallbackLabel || 'Use Password',
        disableDeviceFallback: options?.disableDeviceFallback ?? false,
      });

      if (result.success) {
        devLog('[Biometric] Authentication successful');
        return { success: true };
      }

      devLog('[Biometric] Authentication failed:', result.error);

      // Map error to user-friendly message
      let errorMessage = 'Authentication failed';
      let errorCode = 'UNKNOWN';

      switch (result.error) {
        case 'user_cancel':
          errorMessage = 'Authentication cancelled';
          errorCode = 'USER_CANCEL';
          break;
        case 'system_cancel':
          errorMessage = 'Authentication was cancelled by the system';
          errorCode = 'SYSTEM_CANCEL';
          break;
        case 'not_enrolled':
          errorMessage = 'No biometrics enrolled on this device';
          errorCode = 'NOT_ENROLLED';
          break;
        case 'lockout':
          errorMessage = 'Too many failed attempts. Try again later.';
          errorCode = 'LOCKOUT';
          break;
        case 'lockout_permanent':
          errorMessage = 'Biometric authentication is disabled. Use your device passcode.';
          errorCode = 'LOCKOUT_PERMANENT';
          break;
        case 'authentication_failed':
          errorMessage = 'Biometric not recognized';
          errorCode = 'AUTH_FAILED';
          break;
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
      };
    } catch (error: any) {
      devLog('[Biometric] Authentication error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
        errorCode: 'EXCEPTION',
      };
    }
  }

  /**
   * Enable biometric login for the current user
   * Stores the auth token for biometric quick login
   */
  async enableBiometricLogin(authToken: string): Promise<boolean> {
    try {
      const capabilities = await this.checkCapabilities();

      if (!capabilities.isAvailable || !capabilities.isEnrolled) {
        devLog('[Biometric] Cannot enable - biometrics not available');
        return false;
      }

      // Verify user's biometrics first
      const authResult = await this.authenticate('Confirm your identity to enable biometric login');

      if (!authResult.success) {
        devLog('[Biometric] User verification failed');
        return false;
      }

      // Store the token securely
      await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, authToken);
      await SecureStore.setItemAsync(BIOMETRIC_CREDENTIALS_KEY, 'true');

      // Update app settings
      useAppStore.getState().updateSettings({ biometricEnabled: true });

      devLog('[Biometric] Biometric login enabled successfully');
      return true;
    } catch (error) {
      devLog('[Biometric] Error enabling biometric login:', error);
      return false;
    }
  }

  /**
   * Disable biometric login
   */
  async disableBiometricLogin(): Promise<boolean> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);

      useAppStore.getState().updateSettings({ biometricEnabled: false });

      devLog('[Biometric] Biometric login disabled');
      return true;
    } catch (error) {
      devLog('[Biometric] Error disabling biometric login:', error);
      return false;
    }
  }

  /**
   * Check if biometric login is enabled
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      return enabled === 'true';
    } catch (error) {
      devLog('[Biometric] Error checking biometric login status:', error);
      return false;
    }
  }

  /**
   * Attempt biometric login
   * Returns the stored auth token if successful
   */
  async attemptBiometricLogin(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const isEnabled = await this.isBiometricLoginEnabled();

      if (!isEnabled) {
        return {
          success: false,
          error: 'Biometric login not enabled',
        };
      }

      const capabilities = await this.checkCapabilities();
      const biometricName = this.getBiometricTypeName(capabilities.biometricTypes);

      const authResult = await this.authenticate(`Login with ${biometricName}`);

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      // Retrieve stored token
      const token = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY);

      if (!token) {
        // Token was cleared, disable biometric login
        await this.disableBiometricLogin();
        return {
          success: false,
          error: 'Session expired. Please log in with password.',
        };
      }

      devLog('[Biometric] Biometric login successful');
      return {
        success: true,
        token,
      };
    } catch (error: any) {
      devLog('[Biometric] Error during biometric login:', error);
      return {
        success: false,
        error: error.message || 'Biometric login failed',
      };
    }
  }

  /**
   * Update stored token (call after token refresh)
   */
  async updateStoredToken(newToken: string): Promise<boolean> {
    try {
      const isEnabled = await this.isBiometricLoginEnabled();

      if (!isEnabled) {
        return false;
      }

      await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, newToken);
      devLog('[Biometric] Token updated successfully');
      return true;
    } catch (error) {
      devLog('[Biometric] Error updating token:', error);
      return false;
    }
  }

  /**
   * Clear biometric data on logout
   */
  async clearOnLogout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY);
      devLog('[Biometric] Token cleared on logout');
    } catch (error) {
      devLog('[Biometric] Error clearing token:', error);
    }
  }
}

// Export singleton instance
export const biometricAuth = BiometricAuthService.getInstance();

// Export convenience functions
export const checkBiometricCapabilities = () => biometricAuth.checkCapabilities();
export const authenticateWithBiometric = (message?: string) => biometricAuth.authenticate(message);
export const enableBiometricLogin = (token: string) => biometricAuth.enableBiometricLogin(token);
export const disableBiometricLogin = () => biometricAuth.disableBiometricLogin();
export const isBiometricLoginEnabled = () => biometricAuth.isBiometricLoginEnabled();
export const attemptBiometricLogin = () => biometricAuth.attemptBiometricLogin();
