import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onNavigateToReset?: () => void; // Optional for backward compatibility, but we'll use it
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBackToLogin, onNavigateToReset }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
     <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side - Hero Image & Branding (Matching Login Screen) */}
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
               <div className="flex gap-1 text-yellow-400 text-xs">★★★★★</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
         <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
            <span className="text-xl font-semibold text-brand-900">HealLog</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
          {!isSubmitted ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-600 border border-blue-100">
                  <Mail size={32} />
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h2>
                <p className="text-gray-500 text-sm">Enter your email and we'll send you reset instructions</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address<span className="text-red-500 ml-1">*</span></label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : 'Send reset link'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  onClick={onBackToLogin}
                  className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to login
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                 <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 animate-bounce border border-green-100">
                    <CheckCircle2 size={32} />
                 </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                We sent a password reset link to <br/>
                <span className="font-medium text-gray-900">{email}</span>
              </p>
              
              <button
                  onClick={onBackToLogin}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors mb-4"
                >
                  Back to login
              </button>

              {onNavigateToReset && (
                <button 
                  onClick={onNavigateToReset}
                  className="text-xs text-brand-600 hover:text-brand-700 underline font-medium block mx-auto"
                >
                  (Demo) Simulate clicking email link
                </button>
              )}
              
              <p className="mt-6 text-xs text-gray-400">
                Didn't receive the email? <button onClick={() => setIsSubmitted(false)} className="text-brand-600 hover:underline font-medium">Click to resend</button>
              </p>
            </div>
          )}

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

export default ForgotPasswordScreen;