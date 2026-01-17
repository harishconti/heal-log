import React from 'react';
import { 
  CheckCircle2, 
  Briefcase, 
  Star, 
  Wallet, 
  Download,
  MoreHorizontal,
  Search,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// --- Mock Data ---

const GROWTH_DATA = [
  { name: 'WEEK 1', newPatients: 30, returning: 15 },
  { name: 'WEEK 2', newPatients: 45, returning: 22 },
  { name: 'WEEK 3', newPatients: 65, returning: 35 },
  { name: 'WEEK 4', newPatients: 85, returning: 55 },
];

const TREATMENTS_DATA = [
  { name: 'Physiotherapy Rehabilitation', dept: 'ORTHOPEDICS', count: 128, outcome: 92, trend: 5.2 },
  { name: 'Cardiovascular Screening', dept: 'CARDIOLOGY', count: 85, outcome: 96, trend: 12.4 },
  { name: 'Standard Pediatric Checkup', dept: 'PEDIATRICS', count: 64, outcome: 99, trend: 0.0 },
  { name: 'Full Body MRI Scan', dept: 'RADIOLOGY', count: 42, outcome: 88, trend: -2.1 },
  { name: 'Migraine Consultation', dept: 'NEUROLOGY', count: 28, outcome: 76, trend: 1.8 },
];

// --- Sub Components ---

const AnalyticsStatCard = ({ icon: Icon, label, value, subValue, trend, color, bgClass, iconColor }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgClass}`}>
        <Icon size={20} className={iconColor} />
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${trend === 0 ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-600'}`}>
        {trend > 0 ? '+' : ''}{trend === 0 ? '0%' : `${trend}%`}
      </span>
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{label}</h3>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {subValue && <span className="text-sm text-gray-400 font-medium">{subValue}</span>}
      </div>
    </div>
  </div>
);

const DepartmentProgress = ({ name, value, count, colorClass, bgClass }: any) => (
  <div className="mb-6 last:mb-0">
    <div className="flex justify-between items-end mb-2">
      <div>
        <h4 className="text-sm font-bold text-gray-900">{name}</h4>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{count} Cases processed</p>
      </div>
      <span className={`text-sm font-bold ${colorClass.replace('bg-', 'text-')}`}>{value}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${bgClass}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const AnalyticsPage = () => {
  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics Overview</h1>
          <p className="text-gray-500 mt-1">Performance metrics and patient insights for this month.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
          <Download size={16} />
          Export Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsStatCard 
          icon={CheckCircle2}
          label="Treatment Success Rate"
          value="94%"
          trend={2.4}
          bgClass="bg-green-50"
          iconColor="text-green-600"
        />
        <AnalyticsStatCard 
          icon={Briefcase}
          label="Total Consultations"
          value="452"
          trend={14}
          bgClass="bg-blue-50"
          iconColor="text-blue-600"
        />
        <AnalyticsStatCard 
          icon={Star}
          label="Avg. Patient Rating"
          value="4.8"
          subValue="/5"
          trend={0}
          bgClass="bg-orange-50"
          iconColor="text-orange-600"
        />
        <AnalyticsStatCard 
          icon={Wallet}
          label="Revenue This Month"
          value="$24.5k"
          trend={8.1}
          bgClass="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Patient Growth Chart */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Patient Growth & Retention</h3>
              <p className="text-sm text-gray-500">Monthly patient acquisition and retention trends</p>
            </div>
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-md shadow-sm">Live</span>
               <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-1 hover:bg-gray-50">
                  Last 30 Days <span className="opacity-50">▼</span>
               </button>
            </div>
          </div>
          
          <div className="h-[300px] w-full relative">
            <div className="absolute top-[35%] left-[45%] z-10 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-xl font-medium hidden sm:block">
                New: 48 Patients
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}} 
                    dy={20}
                />
                <YAxis hide domain={[0, 120]} />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                    itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                />
                <Legend 
                    wrapperStyle={{paddingTop: '20px'}}
                    iconType="circle"
                    formatter={(value) => <span className="text-xs font-bold text-gray-600 ml-1">{value}</span>}
                />
                <Line 
                    type="monotone" 
                    dataKey="newPatients" 
                    name="New Patients"
                    stroke="#0ea5e9" 
                    strokeWidth={4} 
                    dot={{r: 4, strokeWidth: 2, fill: '#fff'}} 
                    activeDot={{r: 6}}
                />
                <Line 
                    type="monotone" 
                    dataKey="returning" 
                    name="Returning"
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Performance */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-gray-900">Department Performance</h3>
             <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20}/></button>
          </div>
          
          <div className="space-y-2">
            <DepartmentProgress name="Cardiology" value={85} count={124} colorClass="text-brand-500" bgClass="bg-brand-500" />
            <DepartmentProgress name="Pediatrics" value={62} count={98} colorClass="text-emerald-500" bgClass="bg-emerald-500" />
            <DepartmentProgress name="Neurology" value={45} count={42} colorClass="text-orange-500" bgClass="bg-orange-500" />
            <DepartmentProgress name="Orthopedics" value={38} count={35} colorClass="text-purple-500" bgClass="bg-purple-500" />
            <DepartmentProgress name="General Medicine" value={22} count={18} colorClass="text-gray-500" bgClass="bg-gray-300" />
          </div>

          <button className="w-full mt-8 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
            View Detailed Report
          </button>
        </div>
      </div>

      {/* Treatment Areas Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div>
              <h3 className="text-lg font-bold text-gray-900">Popular Treatment Areas</h3>
              <p className="text-sm text-gray-500">Detailed breakdown by treatment type and outcome</p>
           </div>
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search treatments..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20"
              />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-white border-b border-gray-50">
              <tr>
                <th className="px-8 py-5 font-bold tracking-wider">Treatment Name</th>
                <th className="px-8 py-5 font-bold tracking-wider">Department</th>
                <th className="px-8 py-5 font-bold tracking-wider">Frequency</th>
                <th className="px-8 py-5 font-bold tracking-wider">Outcome Rate</th>
                <th className="px-8 py-5 font-bold tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TREATMENTS_DATA.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-gray-900">{item.name}</td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide
                        ${item.dept === 'ORTHOPEDICS' ? 'bg-purple-50 text-purple-600' :
                          item.dept === 'CARDIOLOGY' ? 'bg-blue-50 text-blue-600' :
                          item.dept === 'PEDIATRICS' ? 'bg-emerald-50 text-emerald-600' :
                          item.dept === 'RADIOLOGY' ? 'bg-orange-50 text-orange-600' :
                          'bg-indigo-50 text-indigo-600'
                        }`}>
                        {item.dept}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-gray-500 font-medium">{item.count}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${item.outcome > 90 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${item.outcome}%` }}></div>
                        </div>
                        <span className="font-bold text-gray-700">{item.outcome}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center gap-1 font-bold text-xs ${
                        item.trend > 0 ? 'text-green-600' : item.trend < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                        {item.trend > 0 ? <TrendingUp size={14} /> : item.trend < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                        {item.trend > 0 ? '+' : ''}{item.trend}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-50 text-center">
            <button className="text-brand-600 text-sm font-bold hover:text-brand-700">View All Treatments</button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;