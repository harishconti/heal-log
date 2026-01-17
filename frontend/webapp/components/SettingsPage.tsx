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
  Mail
} from 'lucide-react';

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

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    desktop: true,
    critical: true
  });
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [theme, setTheme] = useState('light');

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and application preferences.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8 overflow-x-auto no-scrollbar">
          {['General Settings', 'Billing', 'Team Members', 'Integrations'].map((tab, index) => (
             <button 
               key={tab}
               className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                 index === 0 
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
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-8">
            
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