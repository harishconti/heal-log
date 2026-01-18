import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Bell, 
  Sliders, 
  HelpCircle, 
  FileText, 
  Bug, 
  MessageSquare,
  RefreshCw,
  Moon,
  Sun,
  ChevronDown,
  Mail,
  Check,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Circle
} from 'lucide-react';

// --- Sub Components ---

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button 
    onClick={onChange}
    className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-brand-600' : 'bg-gray-200'}`}
  >
    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const SectionHeader = ({ icon: Icon, title, description, bgClass, iconColor }: any) => (
  <div className="flex items-start gap-4 mb-6">
    <div className={`p-3 rounded-xl ${bgClass}`}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  </div>
);

// --- Settings Page Component ---

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('Billing');
  
  // General Settings State
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    critical: true
  });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [theme, setTheme] = useState('light');

  // Billing State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');

  const renderGeneralSettings = () => (
    <div className="space-y-8">
      {/* Account Settings */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <SectionHeader 
              icon={User} 
              title="Account Settings" 
              description="Update your personal information"
              bgClass="bg-blue-50"
              iconColor="text-brand-600"
          />
          
          <div className="space-y-6">
              <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                  <div className="relative">
                      <input 
                          type="email" 
                          value="alexander.smith@heallog.med" 
                          readOnly
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <Mail size={18} />
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Language</label>
                      <div className="relative">
                          <select className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                              <option>English (US)</option>
                              <option>Spanish</option>
                              <option>French</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Timezone</label>
                      <div className="relative">
                          <select className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                              <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                              <option>(GMT-08:00) Pacific Time</option>
                              <option>(GMT+00:00) London</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <SectionHeader 
              icon={Shield} 
              title="Security" 
              description="Password and authentication settings"
              bgClass="bg-green-50"
              iconColor="text-green-600"
          />

          <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Change Password</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <input type="password" placeholder="Current Password" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                      <input type="password" placeholder="New Password" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                      <input type="password" placeholder="Confirm Password" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div className="flex justify-end">
                      <button className="text-sm font-bold text-brand-600 hover:text-brand-700">Update Password</button>
                  </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl">
                  <div>
                      <h4 className="text-sm font-bold text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <Toggle checked={is2FAEnabled} onChange={() => setIs2FAEnabled(!is2FAEnabled)} />
              </div>
          </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <SectionHeader 
              icon={Bell} 
              title="Notifications" 
              description="Manage how you receive alerts"
              bgClass="bg-orange-50"
              iconColor="text-orange-600"
          />

          <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                  <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Alerts</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Receive daily summaries and weekly reports.</p>
                  </div>
                  <Toggle checked={notifications.email} onChange={() => setNotifications({...notifications, email: !notifications.email})} />
              </div>
               <div className="flex items-center justify-between py-2">
                  <div>
                      <h4 className="text-sm font-medium text-gray-900">Desktop Notifications</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Show pop-up notifications when online.</p>
                  </div>
                  <Toggle checked={notifications.desktop} onChange={() => setNotifications({...notifications, desktop: !notifications.desktop})} />
              </div>
               <div className="flex items-center justify-between py-2">
                  <div>
                      <h4 className="text-sm font-medium text-gray-900">Critical Patient Alerts</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Immediate notifications for critical status changes.</p>
                  </div>
                   {/* Custom red toggle for Critical Alerts */}
                   <button 
                      onClick={() => setNotifications({...notifications, critical: !notifications.critical})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${notifications.critical ? 'bg-red-500' : 'bg-gray-200'}`}
                  >
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${notifications.critical ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
              </div>
          </div>
      </div>

      {/* App Preferences */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <SectionHeader 
              icon={Sliders} 
              title="App Preferences" 
              description="Customize your workspace"
              bgClass="bg-purple-50"
              iconColor="text-purple-600"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Interface Theme</label>
                  <div className="flex p-1 bg-gray-100 rounded-xl">
                      <button 
                          onClick={() => setTheme('light')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'light' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                      >
                          <Sun size={16} /> Light
                      </button>
                       <button 
                          onClick={() => setTheme('dark')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                      >
                          <Moon size={16} /> Dark
                      </button>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Data Refresh Interval</label>
                   <div className="relative">
                      <select className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                          <option>Every 5 minutes</option>
                          <option>Every 15 minutes</option>
                          <option>Every hour</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                  </div>
              </div>
          </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
          <button className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20">Save Changes</button>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="space-y-6">
      {/* Choose Your Plan */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-start gap-4">
             <div className="p-3 rounded-xl bg-blue-50 text-brand-600">
                <Shield size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-gray-900">Choose Your Plan</h3>
                <p className="text-sm text-gray-500">Upgrade to unlock advanced features</p>
             </div>
          </div>
          
          <div className="bg-gray-100 p-1 rounded-xl flex items-center font-bold text-sm">
             <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
             >
                Monthly
             </button>
             <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
             >
                Yearly
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <div 
              onClick={() => setSelectedPlan('Basic')}
              className={`rounded-2xl border p-6 flex flex-col cursor-pointer transition-all hover:shadow-md ${selectedPlan === 'Basic' ? 'border-gray-300 ring-2 ring-gray-100' : 'border-gray-200'}`}
            >
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900">Basic</h3>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900">Free</span>
                        <span className="text-sm text-gray-500 font-medium">/ forever</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Essential tools for individual practitioners.</p>
                </div>
                <div className="space-y-3 mb-8 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" /> Up to 50 patients
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" /> Basic reports
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0" /> Mobile access
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-400">
                        <X size={16} className="text-gray-300 shrink-0" /> <span className="line-through decoration-gray-300">Team tools</span>
                    </div>
                </div>
                <button className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-colors cursor-not-allowed" disabled>
                    Current Plan
                </button>
            </div>

            {/* Pro Plan */}
            <div 
              onClick={() => setSelectedPlan('Pro')}
              className={`relative rounded-2xl border-2 p-6 flex flex-col cursor-pointer transition-all shadow-lg shadow-blue-500/5 ${selectedPlan === 'Pro' ? 'border-brand-600 bg-white' : 'border-gray-200'}`}
            >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Recommended
                </div>
                 <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="font-bold text-gray-900">Pro</h3>
                         <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-3xl font-bold text-gray-900">${billingCycle === 'monthly' ? '20' : '15'}</span>
                            <span className="text-sm text-gray-500 font-medium">/ month</span>
                        </div>
                        <p className={`text-[10px] font-bold mt-1 ${billingCycle === 'yearly' ? 'text-green-600' : 'text-gray-400'}`}>
                           {billingCycle === 'yearly' ? 'Billed $180 yearly' : 'Billed monthly'}
                        </p>
                     </div>
                     {selectedPlan === 'Pro' && <div className="text-brand-600"><CheckCircle2 size={24} fill="currentColor" className="text-white" /></div>}
                 </div>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">For growing clinics requiring advanced tools.</p>
                
                <div className="space-y-3 mb-8 flex-1">
                     <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Unlimited patients
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Team management
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Advanced Analytics
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Priority Support
                    </div>
                </div>

                {selectedPlan === 'Pro' ? (
                     <div className="w-full py-3 text-center text-sm font-bold text-brand-600">
                        Selected for upgrade
                     </div>
                ) : (
                    <button className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
                        Select Plan
                    </button>
                )}
            </div>

            {/* Pro Plus Plan */}
             <div 
              onClick={() => setSelectedPlan('Pro Plus')}
              className={`rounded-2xl border p-6 flex flex-col cursor-pointer transition-all hover:shadow-md ${selectedPlan === 'Pro Plus' ? 'border-brand-600 ring-2 ring-brand-100' : 'border-gray-200'}`}
            >
                <div className="mb-4">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">Pro Plus</h3>
                        {selectedPlan === 'Pro Plus' && <div className="text-brand-600"><CheckCircle2 size={24} fill="currentColor" className="text-white" /></div>}
                    </div>
                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-3xl font-bold text-gray-900">${billingCycle === 'monthly' ? '40' : '30'}</span>
                        <span className="text-sm text-gray-500 font-medium">/ month</span>
                    </div>
                    <p className={`text-[10px] font-bold mt-1 ${billingCycle === 'yearly' ? 'text-green-600' : 'text-gray-400'}`}>
                           {billingCycle === 'yearly' ? 'Billed $360 yearly' : 'Billed monthly'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">Enterprise-grade tools for large scale clinics.</p>
                </div>
                <div className="space-y-3 mb-8 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Everything in Pro
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Multi-clinic Support
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> Dedicated Manager
                    </div>
                     <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 size={16} className="text-brand-600 shrink-0" /> API Access
                    </div>
                </div>
                {selectedPlan === 'Pro Plus' ? (
                     <div className="w-full py-3 text-center text-sm font-bold text-brand-600">
                        Selected for upgrade
                     </div>
                ) : (
                    <button className="w-full py-2.5 border border-brand-200 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-50 transition-colors">
                        Select Plan
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
             <div className="flex items-center gap-2 mb-4">
                 <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <CreditCard size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">Payment Method</h3>
             </div>
             <p className="text-sm text-gray-500 mb-4">Select how you want to pay</p>
             
             <div className="flex gap-4">
                 <div 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-brand-600 bg-brand-50/20' : 'border-gray-200 hover:border-gray-300'}`}
                 >
                     <div className="flex items-center gap-3">
                         <CreditCard size={20} className="text-gray-600" />
                         <span className="font-bold text-gray-700 text-sm">Credit / Debit Card</span>
                     </div>
                     <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'card' ? 'border-brand-600' : 'border-gray-300'}`}>
                         {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-brand-600 rounded-full"></div>}
                     </div>
                 </div>

                 <div 
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-brand-600 bg-brand-50/20' : 'border-gray-200 hover:border-gray-300'}`}
                 >
                     <div className="flex items-center gap-3">
                         <QrCode size={20} className="text-gray-600" />
                         <span className="font-bold text-gray-700 text-sm">UPI Payment</span>
                     </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'upi' ? 'border-brand-600' : 'border-gray-300'}`}>
                         {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 bg-brand-600 rounded-full"></div>}
                     </div>
                 </div>
             </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <p className="text-sm text-gray-500">Total Today {billingCycle === 'yearly' && <span className="text-gray-400 font-normal">(Billed annually)</span>}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">
                    ${selectedPlan === 'Basic' ? '0.00' : selectedPlan === 'Pro' ? (billingCycle === 'monthly' ? '20.00' : '180.00') : (billingCycle === 'monthly' ? '40.00' : '360.00')}
                </span>
                <span className="text-sm text-gray-500 font-medium">USD</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Next billing date: November 24, 2024</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 transition-all active:scale-95 w-full md:w-auto justify-center">
            Upgrade Now
            <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings, billing and preferences.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto no-scrollbar">
          {['General Settings', 'Billing', 'Team Members', 'Integrations'].map((tab) => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap px-1 ${
                 activeTab === tab 
                   ? 'border-brand-600 text-brand-600' 
                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               {tab}
             </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2">
            {activeTab === 'General Settings' && renderGeneralSettings()}
            {activeTab === 'Billing' && renderBilling()}
            {(activeTab === 'Team Members' || activeTab === 'Integrations') && (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400">
                    <Sliders size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-gray-900">Coming Soon</h3>
                    <p className="text-sm">This section is currently under development.</p>
                </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            
            {/* System Status */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">System Status</h3>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Current Version</span>
                        <span className="font-bold text-gray-900">v2.4.1</span>
                    </div>
                    <div className="w-full h-px bg-gray-50"></div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Database Status</span>
                        <span className="font-bold text-green-600 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            Connected
                        </span>
                    </div>
                    <div className="w-full h-px bg-gray-50"></div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Last Synced</span>
                        <span className="font-bold text-gray-900">Just now</span>
                    </div>
                </div>

                <button className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-colors border border-gray-100">
                    <RefreshCw size={16} />
                    Check for Updates
                </button>
            </div>

            {/* Help & Support */}
             <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                 <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                        <HelpCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Help & Support</h3>
                    </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-6">Need assistance? Check our documentation or contact the support team.</p>

                <div className="space-y-2 mb-6">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium text-gray-600 text-left group">
                        <div className="flex items-center gap-3">
                            <FileText size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Documentation Guide
                        </div>
                        <ChevronDown className="-rotate-90 text-gray-300 group-hover:text-gray-500" size={16} />
                    </button>
                     <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors text-sm font-medium text-gray-600 text-left group">
                        <div className="flex items-center gap-3">
                            <Bug size={18} className="text-gray-400 group-hover:text-gray-600" />
                            Report an Issue
                        </div>
                        <ChevronDown className="-rotate-90 text-gray-300 group-hover:text-gray-500" size={16} />
                    </button>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-brand-600/20">
                    <MessageSquare size={18} />
                    Open Support Ticket
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;