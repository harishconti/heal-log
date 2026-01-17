import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, BarChart3, FileUp, Globe, Headphones, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../store';
import { paymentsApi } from '../api/payments';
import { cn } from '@/utils';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get detailed insights into patient growth, activity trends, and demographics.',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    icon: FileUp,
    title: 'Document Storage',
    description: 'Upload and manage patient documents securely (coming soon).',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    icon: Globe,
    title: 'Web Dashboard',
    description: 'Access your practice data from any browser with the full web dashboard.',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get faster responses and dedicated support for your practice.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

const comparisons = [
  { feature: 'Patient Management', basic: true, pro: true },
  { feature: 'Clinical Notes', basic: true, pro: true },
  { feature: 'Offline Sync', basic: true, pro: true },
  { feature: 'Basic Stats', basic: true, pro: true },
  { feature: 'Advanced Analytics', basic: false, pro: true },
  { feature: 'Web Dashboard', basic: false, pro: true },
  { feature: 'Document Storage', basic: false, pro: true },
  { feature: 'Data Export', basic: false, pro: true },
  { feature: 'Priority Support', basic: false, pro: true },
];

export function UpgradePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = user?.plan === 'pro';

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { checkout_url } = await paymentsApi.createCheckoutSession();
      window.location.href = checkout_url;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  if (isPro) {
    return (
      <div className="max-w-full sm:max-w-2xl mx-auto text-center py-12 sm:py-16">
        <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 ring-4 ring-amber-50">
          <Crown className="h-12 w-12 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">You're already on Pro!</h1>
        <p className="text-gray-500 mb-8 text-lg">
          You have access to all premium features including the web dashboard.
        </p>
        <Link to="/dashboard">
          <Button
            size="lg"
            className={cn(
              'bg-gradient-to-r from-primary-600 to-primary-700',
              'shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30',
              'hover:-translate-y-0.5 transition-all duration-300'
            )}
          >
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full lg:max-w-5xl xl:max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Upgrade to Pro</h1>
          <p className="text-gray-500 mt-1">Unlock all features for your practice</p>
        </div>
      </div>

      {/* Pricing Card */}
      <Card className={cn(
        'relative overflow-hidden',
        'border-2 border-primary-200 bg-gradient-to-br from-white to-primary-50/30',
        'shadow-xl shadow-primary-500/10',
        'hover:shadow-2xl hover:shadow-primary-500/15',
        'transition-all duration-300'
      )}>
        {/* Recommended badge */}
        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-bold px-5 py-2 rounded-bl-2xl shadow-lg">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            RECOMMENDED
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-primary-100/50 rounded-full blur-3xl" />
        <div className="absolute -left-8 -top-8 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 p-4">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Crown className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pro Plan</h2>
                <p className="text-sm text-primary-600 font-medium">Most popular choice</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
              Everything you need to manage and grow your medical practice efficiently.
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-500 text-lg">/month</span>
            </div>
          </div>
          <div className="lg:text-right space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-600 font-medium">
                {error}
              </div>
            )}
            <Button
              size="lg"
              onClick={handleUpgrade}
              loading={isLoading}
              className={cn(
                'w-full lg:w-auto min-w-[200px] h-14 text-base',
                'bg-gradient-to-r from-primary-600 to-primary-700',
                'shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40',
                'hover:-translate-y-1 transition-all duration-300'
              )}
            >
              <Sparkles className="h-5 w-5" />
              Upgrade Now
            </Button>
            <div className="flex items-center justify-center lg:justify-end gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Cancel anytime, no commitment</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className={cn(
              'group cursor-default',
              'hover:shadow-lg hover:-translate-y-1',
              'transition-all duration-300'
            )}
          >
            <div className="flex gap-4">
              <div className={cn(
                'p-3 rounded-xl h-fit',
                'group-hover:scale-110 transition-transform duration-300',
                feature.bgColor
              )}>
                <feature.icon className={cn('h-6 w-6', feature.color)} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1.5 group-hover:text-primary-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      <Card className="overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Feature Comparison</h2>
        <div className="overflow-x-auto -mx-6">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-gray-100 bg-gray-50/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-600">Feature</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-600 w-28">Basic</th>
                <th className="text-center py-4 px-6 text-sm font-semibold w-28 bg-amber-50/50">
                  <span className="flex items-center justify-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-700">Pro</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr
                  key={row.feature}
                  className={cn(
                    'transition-colors hover:bg-gray-50/50',
                    i < comparisons.length - 1 && 'border-b border-gray-100'
                  )}
                >
                  <td className="py-4 px-6 text-sm text-gray-700 font-medium">{row.feature}</td>
                  <td className="py-4 px-6 text-center">
                    {row.basic ? (
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <span className="text-gray-300 text-lg">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center bg-amber-50/30">
                    {row.pro ? (
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="h-4 w-4 text-emerald-600" />
                      </div>
                    ) : (
                      <span className="text-gray-300 text-lg">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FAQ */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Frequently Asked Questions</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-medium text-gray-900 mb-1.5">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Yes, you can cancel your subscription at any time. You'll continue to have access
              until the end of your billing period.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-medium text-gray-900 mb-1.5">Is my data secure?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Absolutely. We use industry-standard encryption and security practices to protect
              your patient data. Your data is always yours.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-5">
            <h3 className="font-medium text-gray-900 mb-1.5">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              We accept all major credit cards through our secure payment provider, Stripe.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
