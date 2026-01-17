import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-white">
      {/* LEFT COLUMN: BRANDING
        Pattern: "Fixed Aspect Ratio" feel with optical centering.
        - lg:w-[55%] gives slightly more weight to branding than the form (standard modern pattern).
        - px-20 xl:px-32 prevents text from sticking to the left edge.
      */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-slate-900 overflow-hidden items-center justify-center px-20 xl:px-32">

        {/* Abstract Background - Subtle and deep */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 to-primary-900/90 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />

        {/* Content Container - Vertically Centered */}
        <div className="relative z-10 w-full max-w-2xl space-y-12">

          {/* Brand Logo - Floating */}
          <div className="inline-flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
              <span className="font-bold text-2xl">H</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">HealLog</span>
          </div>

          {/* Hero Typography - Large and Spaced */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight">
              Focus on patients, <br />
              <span className="text-primary-200">not paperwork.</span>
            </h1>
            <p className="text-lg text-primary-100/80 leading-relaxed max-w-lg">
              The intelligent dashboard for modern medical teams. Secure, fast, and designed for clarity.
            </p>
          </div>

          {/* Social Proof / Trust Badge */}
          <div className="flex items-center gap-4 pt-4">
             <div className="flex -space-x-3">
               {[1,2,3].map((i) => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-primary-900 bg-gray-200" />
               ))}
             </div>
             <div className="text-sm text-white font-medium">
               Trusted by 10,000+ clinicians
             </div>
          </div>

          {/* Footer Copyright - Absolute bottom safe area */}
          <div className="absolute bottom-12 left-0 text-xs text-primary-400/60 font-medium tracking-widest uppercase">
            © {new Date().getFullYear()} HealLog Platform
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: FORM
        Pattern: "Single Column Focus".
        - w-full max-w-md creates a comfortable reading line length.
      */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50">
        <div className="w-full max-w-[400px] animate-in slide-in-from-right-8 duration-500">
          {/* Mobile Logo (Visible only on small screens) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
          </div>

          <Outlet />

          {/* Footer Links - Detached from card for clean look */}
          <div className="mt-10 pt-6 border-t border-gray-200/60 flex justify-center gap-8">
            <Link to="/privacy" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Terms</Link>
            <Link to="/help" className="text-xs text-gray-400 hover:text-gray-900 transition-colors">Help Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
