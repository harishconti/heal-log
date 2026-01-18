import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';

interface VerifyEmailScreenProps {
  onVerify: () => void;
  onBack: () => void;
  email?: string;
}

const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ onVerify, onBack, email }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take last char if multiple
    setOtp(newOtp);

    // Move to next input if value entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every(char => /^\d$/.test(char))) {
        const newOtp = [...otp];
        pastedData.forEach((char, index) => {
            if (index < 6) newOtp[index] = char;
        });
        setOtp(newOtp);
        // Focus last filled or first empty
        const nextFocus = Math.min(pastedData.length, 5);
        inputRefs.current[nextFocus]?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(digit => digit === '')) return; // Validate all filled

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onVerify();
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side (Same as other screens) */}
      <div className="hidden lg:flex w-1/2 relative bg-brand-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2665&auto=format&fit=crop" 
            alt="Medical Team" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-900 via-brand-800 to-transparent opacity-90"></div>
        </div>
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-brand-700 font-bold text-2xl">H</div>
            <span className="text-2xl font-semibold tracking-tight">HealLog</span>
          </div>
        </div>
        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-bold leading-tight mb-6">Focus on patients, not paperwork.</h1>
          <p className="text-brand-100 text-lg mb-8 leading-relaxed">The intelligent dashboard for modern medical teams. Secure, fast, and designed for clarity.</p>
           <div className="flex items-center gap-4 text-sm font-medium text-brand-50 bg-white/10 p-4 rounded-xl backdrop-blur-sm w-fit">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <img key={i} src={`https://picsum.photos/seed/${i + 10}/100/100`} alt="User" className="w-8 h-8 rounded-full border-2 border-brand-900" />
              ))}
            </div>
            <div className="flex flex-col">
               <span>Trusted by 10,000+ clinicians</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="text-xl font-semibold text-brand-900">HealLog</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-600 border border-blue-100">
              <Mail size={28} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
            <p className="text-gray-500 text-sm">
              Enter the 6-digit code sent to your email address.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 sm:w-14 sm:h-16 border border-gray-200 rounded-xl text-center text-2xl font-bold text-gray-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all bg-white shadow-sm"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.some(d => d === '')}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Verify Code'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Didn't receive the code?{' '}
            <button className="text-brand-600 font-semibold hover:text-brand-700 hover:underline transition-colors">
              Resend
            </button>
          </p>

          <div className="mt-8 text-center">
            <button 
              onClick={onBack}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to registration
            </button>
          </div>

          <div className="mt-10 text-center text-xs text-gray-400 flex justify-center gap-4">
            <a href="#" className="hover:text-gray-600">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600">Terms</a>
            <span>•</span>
            <a href="#" className="hover:text-gray-600">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailScreen;