import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';

// Mock dependencies
const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../store', () => ({
  useAuthStore: () => ({
    login: mockLogin,
  }),
}));

vi.mock('../../../api', () => ({
  authApi: {
    login: vi.fn(),
  },
}));

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the login form', () => {
      renderLoginPage();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    it('renders email input field', () => {
      renderLoginPage();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('renders password input field', () => {
      renderLoginPage();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders sign in button', () => {
      renderLoginPage();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderLoginPage();
      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('renders sign up link', () => {
      renderLoginPage();
      expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    });

    it('renders pro subscription notice', () => {
      renderLoginPage();
      expect(screen.getByText(/web dashboard requires a pro subscription/i)).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('email input has correct type', () => {
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('password input has correct type', () => {
      renderLoginPage();
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('email input has placeholder', () => {
      renderLoginPage();
      expect(screen.getByPlaceholderText('doctor@example.com')).toBeInTheDocument();
    });

    it('password input has placeholder', () => {
      renderLoginPage();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('email input has autocomplete attribute', () => {
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autoComplete', 'email');
    });

    it('password input has autocomplete attribute', () => {
      renderLoginPage();
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autoComplete', 'current-password');
    });
  });

  describe('Form Validation', () => {
    it('email field accepts text input', async () => {
      renderLoginPage();
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('password field accepts text input', async () => {
      renderLoginPage();
      const passwordInput = screen.getByLabelText(/password/i);

      await userEvent.type(passwordInput, 'password123');
      expect(passwordInput).toHaveValue('password123');
    });

    it('submit button is clickable', () => {
      renderLoginPage();
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Button States', () => {
    it('submit button is full width', () => {
      renderLoginPage();
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      expect(submitButton).toHaveClass('w-full');
    });
  });

  describe('Links', () => {
    it('forgot password link points to correct route', () => {
      renderLoginPage();
      const forgotPasswordLink = screen.getByText(/forgot password/i);
      expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password');
    });

    it('sign up link points to correct route', () => {
      renderLoginPage();
      const signUpLink = screen.getByText(/sign up/i);
      expect(signUpLink.closest('a')).toHaveAttribute('href', '/register');
    });
  });

  describe('Typography', () => {
    it('heading has correct styling', () => {
      renderLoginPage();
      const heading = screen.getByText('Sign in to your account');
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveClass('text-lg', 'font-semibold', 'text-gray-900');
    });

    it('dont have account text is gray', () => {
      renderLoginPage();
      const text = screen.getByText(/don't have an account/i);
      expect(text).toHaveClass('text-gray-600');
    });

    it('pro notice text is small and gray', () => {
      renderLoginPage();
      const notice = screen.getByText(/web dashboard requires a pro subscription/i);
      expect(notice).toHaveClass('text-xs', 'text-gray-500');
    });
  });

  describe('Layout', () => {
    it('form has proper spacing', () => {
      renderLoginPage();
      const form = document.querySelector('form');
      expect(form).toHaveClass('space-y-4');
    });

    it('forgot password link is aligned to the end', () => {
      renderLoginPage();
      const forgotPasswordLink = screen.getByText(/forgot password/i).closest('a');
      const container = forgotPasswordLink?.closest('div');
      expect(container).toHaveClass('justify-end');
    });
  });

  describe('Color Schema', () => {
    it('sign up link has primary color', () => {
      renderLoginPage();
      const signUpLink = screen.getByText(/sign up/i);
      expect(signUpLink).toHaveClass('text-primary-600');
    });

    it('forgot password link has primary color', () => {
      renderLoginPage();
      const link = screen.getByText(/forgot password/i);
      expect(link).toHaveClass('text-primary-600');
    });
  });
});
