import { Outlet, Link } from 'react-router-dom';
import { Shield, Heart, Activity, Stethoscope, Sparkles, CheckCircle2, Users } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wM SI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6TTAgMTZjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

        {/* Glowing orbs */}
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary-500/30 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/20 rounded-full blur-[96px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left side - Modern branding panel */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative z-10">
        <div className="flex flex-col justify-between p-12 xl:p-16 w-full max-w-4xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-2xl">H</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">HealLog</span>
          </Link>

          {/* Main content */}
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">Modern Healthcare Technology</span>
              </div>

              <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
                Transform your patient management
              </h1>

              <p className="text-xl text-white/70 leading-relaxed max-w-xl">
                Join thousands of healthcare professionals using HealLog to streamline practice operations
                with secure, HIPAA-compliant digital records.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/60">Active Users</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-white">99.9%</div>
                <div className="text-sm text-white/60">Uptime</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-white">HIPAA</div>
                <div className="text-sm text-white/60">Compliant</div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureHighlight icon={Shield} text="Enterprise Security" />
              <FeatureHighlight icon={Activity} text="Real-time Analytics" />
              <FeatureHighlight icon={Users} text="Patient Management" />
              <FeatureHighlight icon={Stethoscope} text="Clinical Notes" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-8 text-sm text-white/50">
            <span>© 2026 HealLog</span>
            <span>•</span>
            <Link to="/privacy" className="hover:text-white/80 transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white/80 transition-colors">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col relative z-10 bg-white/5 backdrop-blur-sm lg:bg-transparent">
        {/* Glassmorphism overlay for mobile */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl"></div>

        {/* Mobile header */}
        <div className="lg:hidden relative z-10 px-6 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-xl font-bold text-white">HealLog</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-12 relative z-10">
          <div className="w-full max-w-md">
            {/* Glassmorphism card */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 lg:p-12">
              <Outlet />
            </div>

            {/* Footer text */}
            <p className="mt-6 text-center text-sm text-white/60 lg:text-gray-400">
              Trusted by healthcare professionals worldwide
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureHighlight({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/15 transition-all duration-300 group">
      <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <span className="text-sm font-medium text-white">{text}</span>
    </div>
  );
}
