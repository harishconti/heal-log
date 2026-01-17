import { Outlet, Link } from 'react-router-dom';
import { Shield, BarChart2, Users, FileText, Activity, ShieldCheck, type LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background Pattern & Glows */}
      <BackgroundGradient />

      {/* Main Grid Container */}
      <div className="relative w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left: Hero Section */}
        <HeroSection />

        {/* Right: Login Card */}
        <LoginCard />
      </div>
    </div>
  );
}

function BackgroundGradient() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* SVG Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6TTAgMTZjMC02LjYyNyA1LjM3My0xMiAxMi0xMnMxMiA1LjM3MyAxMiAxMi01LjM3MyAxMi0xMiAxMi0xMi01LjM3My0xMi0xMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      {/* Glowing orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" />
    </div>
  );
}

function HeroSection() {
  return (
    <div className="text-white space-y-6 md:space-y-8 text-center md:text-left">
      {/* Brand */}
      <Link
        to="/"
        className="inline-flex items-center gap-3 group justify-center md:justify-start"
      >
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-lg text-white border border-white/10">
          H
        </div>
        <span className="text-base font-semibold tracking-wide">HealLog</span>
      </Link>

      {/* Hero Text */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
          Modern care for <br className="hidden md:block" />
          modern practice.
        </h1>
        <p className="text-base text-white/85 max-w-lg mx-auto md:mx-0 leading-relaxed">
          Streamline your workflow with the dashboard built for high-performance
          medical teams. Secure, fast, and HIPAA-compliant.
        </p>
      </div>

      {/* Stats */}
      <StatGrid />

      {/* Feature Pills */}
      <FeaturePillsGrid />
    </div>
  );
}

function StatGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
      <StatItem icon={Users} value="10K+" label="Active Users" />
      <StatItem icon={Activity} value="99.9%" label="Uptime" />
      <StatItem icon={ShieldCheck} value="HIPAA" label="Compliant" />
    </div>
  );
}

interface StatItemProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

function StatItem({ icon: Icon, value, label }: StatItemProps) {
  return (
    <div className="flex flex-col items-center md:items-start text-center md:text-left">
      {/* Icon container with larger background */}
      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4 border border-white/30">
        <Icon className="w-7 h-7 text-white" />
      </div>
      {/* Value with increased size */}
      <div className="text-4xl font-bold text-white mb-2">{value}</div>
      {/* Label with proper spacing */}
      <div className="text-sm font-medium text-white/75 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function FeaturePillsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto md:mx-0">
      <FeaturePill text="Enterprise Security" icon={Shield} />
      <FeaturePill text="Real-time Analytics" icon={BarChart2} />
      <FeaturePill text="Patient Management" icon={Users} className="hidden sm:flex" />
      <FeaturePill text="Clinical Notes" icon={FileText} className="hidden sm:flex" />
    </div>
  );
}

interface FeaturePillProps {
  text: string;
  icon: LucideIcon;
  className?: string;
}

function FeaturePill({ text, icon: Icon, className }: FeaturePillProps) {
  return (
    <div
      className={cn(
        'px-4 py-2.5 rounded-full',
        'bg-white/10 border border-white/30',
        'text-sm font-medium text-white hover:bg-white/20',
        'hover:border-white/50 transition-all cursor-default',
        'backdrop-blur-md flex items-center gap-2',
        'whitespace-nowrap',
        className
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function LoginCard() {
  return (
    <div className="w-full max-w-md mx-auto md:mx-0 md:ml-auto">
      {/* Glass morphism container */}
      <div
        className={cn(
          'glass-card rounded-2xl shadow-xl overflow-hidden relative animate-slide-up p-8',
          'border-l-4 border-l-primary-500'
        )}
      >
        {/* Form Content via Outlet */}
        <Outlet />

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-center gap-6 text-xs text-gray-500 font-medium">
          <Link
            to="/privacy"
            className="hover:text-primary-600 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-primary-500"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-primary-600 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-primary-500"
          >
            Terms
          </Link>
          <Link
            to="/help"
            className="hover:text-primary-600 transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-primary-500"
          >
            Help
          </Link>
        </div>
      </div>
    </div>
  );
}
