import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, BarChart3, FileUp, Globe, Headphones, ArrowLeft, Sparkles } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../store';
import { paymentsApi } from '../api/payments';

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
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Crown className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">You're already on Pro!</h1>
        <p className="text-gray-500 mb-8">
          You have access to all premium features including the web dashboard.
        </p>
        <Link to="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
      <Card className="relative overflow-hidden border-primary-100">
        <div className="absolute top-0 right-0 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-medium px-4 py-1.5 rounded-bl-xl">
          RECOMMENDED
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-2">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Pro Plan</h2>
            </div>
            <p className="text-gray-500 mb-5 max-w-md">
              Everything you need to manage and grow your medical practice efficiently.
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-500">/month</span>
            </div>
          </div>
          <div className="lg:text-right">
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <Button size="lg" onClick={handleUpgrade} isLoading={isLoading}>
              <Sparkles className="h-4 w-4" />
              Upgrade Now
            </Button>
            <p className="text-xs text-gray-400 mt-2">Cancel anytime, no commitment</p>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} hover>
            <div className="flex gap-4">
              <div className={`p-3 ${feature.bgColor} rounded-xl h-fit`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Feature</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-24">Basic</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-24">
                  <span className="flex items-center justify-center gap-1.5">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Pro
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={row.feature} className={i < comparisons.length - 1 ? 'border-b border-gray-50' : ''}>
                  <td className="py-3.5 px-4 text-sm text-gray-700">{row.feature}</td>
                  <td className="py-3.5 px-4 text-center">
                    {row.basic ? (
                      <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {row.pro ? (
                      <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">-</span>
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
