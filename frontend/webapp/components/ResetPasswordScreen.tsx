import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';

interface ResetPasswordScreenProps {
  onBackToLogin: () => void;
  onSubmit: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onBackToLogin, onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        // In a real app, handle error
        return;
    }
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSubmit();
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Left Side - Hero Image & Branding */}
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
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Focus on patients, not paperwork.
          </h1>
          <p className="text-brand-100 text-lg mb-8 leading-relaxed">
            The intelligent dashboard for modern medical teams. 
            Secure, fast, and designed for clarity.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium text-brand-50 bg-white/10 p-4 rounded-xl backdrop-blur-sm w-fit">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/${i + 10}/100/100`} 
                  alt="User" 
                  className="w-8 h-8 rounded-full border-2 border-brand-900"
                />
              ))}
            </div>
            <div className="flex flex-col">
               <span>Trusted by 10,000+ clinicians</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <span className="text-xl font-semibold text-brand-900">HealLog</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-gray-200/50 p-8 sm:p-10 border border-gray-100">
          
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-600 border border-blue-100">
              <RefreshCw size={28} />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create new password</h2>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Your new password must be different from previous used passwords.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : 'Reset Password'}
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

export default ResetPasswordScreen;