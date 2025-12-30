import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, BarChart3, FileUp, Globe, Headphones, ArrowLeft } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { useAuthStore } from '../store';
import { paymentsApi } from '../api/payments';

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get detailed insights into patient growth, activity trends, and demographics.',
  },
  {
    icon: FileUp,
    title: 'Document Storage',
    description: 'Upload and manage patient documents securely (coming soon).',
  },
  {
    icon: Globe,
    title: 'Web Dashboard',
    description: 'Access your practice data from any browser with the full web dashboard.',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get faster responses and dedicated support for your practice.',
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
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're already on Pro!</h1>
        <p className="text-gray-600 mb-6">
          You have access to all premium features including the web dashboard.
        </p>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upgrade to Pro</h1>
          <p className="text-gray-600 mt-1">Unlock all features for your practice</p>
        </div>
      </div>

      {/* Pricing Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
          RECOMMENDED
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900">Pro Plan</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Everything you need to manage and grow your medical practice.
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-500">/month</span>
            </div>
          </div>
          <div className="lg:text-right">
            {error && (
              <p className="text-sm text-red-600 mb-2">{error}</p>
            )}
            <Button size="lg" onClick={handleUpgrade} isLoading={isLoading}>
              Upgrade Now
            </Button>
            <p className="text-xs text-gray-500 mt-2">Cancel anytime</p>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => (
          <Card key={feature.title} className="flex gap-4">
            <div className="p-3 bg-primary-100 rounded-lg h-fit">
              <feature.icon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Feature Comparison */}
      <Card>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Feature</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Basic</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">
                  <span className="flex items-center justify-center gap-1">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Pro
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.feature} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-sm text-gray-900">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {row.basic ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.pro ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-gray-300">—</span>
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
        <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Can I cancel anytime?</h3>
            <p className="text-sm text-gray-600">
              Yes, you can cancel your subscription at any time. You'll continue to have access
              until the end of your billing period.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Is my data secure?</h3>
            <p className="text-sm text-gray-600">
              Absolutely. We use industry-standard encryption and security practices to protect
              your patient data.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-600">
              We accept all major credit cards through our secure payment provider, Stripe.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
