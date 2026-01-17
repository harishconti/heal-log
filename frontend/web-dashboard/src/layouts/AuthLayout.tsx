import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* LEFT COLUMN: BRANDING (Updated from Reference) */}
      <div className="hidden lg:flex w-1/2 relative bg-primary-900 overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2665&auto=format&fit=crop"
            alt="Medical Team"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          {/* Using primary-900 instead of brand-900 */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900 via-primary-800 to-transparent opacity-90"></div>
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-700 font-bold text-2xl">
              H
            </div>
            <span className="text-2xl font-semibold tracking-tight">HealLog</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Focus on patients, not paperwork.
          </h1>
          <p className="text-primary-100 text-lg mb-8 leading-relaxed">
            The intelligent dashboard for modern medical teams.
            Secure, fast, and designed for clarity.
          </p>

          <div className="flex items-center gap-4 text-sm font-medium text-primary-50 bg-white/10 p-4 rounded-xl backdrop-blur-sm w-fit">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://picsum.photos/seed/${i + 10}/100/100`}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-primary-900"
                />
              ))}
            </div>
            <div className="flex flex-col">
               <span>Trusted by 10,000+ clinicians</span>
               <div className="flex gap-1 text-yellow-400 text-xs">
                 ★★★★★
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: FORM CONTAINER */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Logo */}
        <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              H
            </div>
            <span className="text-xl font-semibold text-primary-900">HealLog</span>
        </div>

        <div className="w-full max-w-md">
           <Outlet />

           {/* Footer Links (From Reference) */}
           <div className="mt-8 text-center text-xs text-gray-400 flex justify-center gap-4">
            <Link to="/privacy" className="hover:text-gray-600">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-gray-600">Terms</Link>
            <span>•</span>
            <Link to="/help" className="hover:text-gray-600">Help Center</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
