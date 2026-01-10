import { Outlet, Link } from 'react-router-dom';
import { Shield, Heart, Activity, Stethoscope } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-2xl font-bold text-white">HealLog</span>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Modern patient management for healthcare professionals
            </h1>
            <p className="text-lg text-primary-100 leading-relaxed mb-12">
              Streamline your practice with secure, HIPAA-compliant patient records,
              clinical notes, and powerful analytics.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureCard
                icon={Shield}
                title="HIPAA Compliant"
                description="Enterprise-grade security"
              />
              <FeatureCard
                icon={Activity}
                title="Real-time Analytics"
                description="Track practice growth"
              />
              <FeatureCard
                icon={Heart}
                title="Patient Focused"
                description="Better care outcomes"
              />
              <FeatureCard
                icon={Stethoscope}
                title="Easy to Use"
                description="Intuitive interface"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-primary-200 text-sm">
            Trusted by healthcare professionals worldwide
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50">
        {/* Mobile header */}
        <div className="lg:hidden px-6 py-4 bg-white border-b border-gray-100">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HealLog</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {/* Desktop logo - subtle version */}
            <div className="hidden lg:flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                <span className="text-white font-bold text-xl">H</span>
              </div>
            </div>

            {/* Auth card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8 sm:p-10">
              <Outlet />
            </div>

            {/* Footer text */}
            <p className="mt-8 text-center text-sm text-gray-400">
              Secure, HIPAA-compliant patient management
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
      <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
      <p className="text-primary-200 text-xs">{description}</p>
    </div>
  );
}
