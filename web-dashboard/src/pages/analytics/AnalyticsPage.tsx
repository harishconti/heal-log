import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card, CardHeader, Button, Spinner, Select } from '../../components/ui';
import { LineChart, BarChart, PieChart } from '../../components/charts';
import { useAnalytics, useRequirePro } from '../../hooks';
import { analyticsApi } from '../../api/analytics';

export function AnalyticsPage() {
  const { isLoading: isCheckingPro, isPro } = useRequirePro();
  const [days, setDays] = useState(30);
  const { patientGrowth, notesActivity, weeklyActivity, demographics, isLoading, error } =
    useAnalytics(days);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await analyticsApi.exportAnalytics();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      // Handle error
    } finally {
      setIsExporting(false);
    }
  };

  if (isCheckingPro || !isPro) {
    return null; // Redirect handled by hook
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error loading analytics</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // Transform data for charts
  const weeklyChartData = weeklyActivity.map((item) => ({
    name: item.day,
    value: item.patients + item.notes,
  }));

  const groupsChartData =
    demographics?.by_group.map((item) => ({
      name: item.group || 'Unassigned',
      value: item.count,
    })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Track your practice performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(days)}
            onChange={(e) => setDays(parseInt(e.target.value))}
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
            ]}
          />
          <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Patient Growth */}
      <Card>
        <CardHeader
          title="Patient Growth"
          subtitle={`New patients over the last ${days} days`}
        />
        {patientGrowth.length > 0 ? (
          <LineChart data={patientGrowth} color="#3b82f6" height={300} />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No data available for this period
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes Activity */}
        <Card>
          <CardHeader
            title="Notes Activity"
            subtitle={`Clinical notes created over the last ${days} days`}
          />
          {notesActivity.length > 0 ? (
            <LineChart data={notesActivity} color="#10b981" height={250} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>

        {/* Weekly Activity */}
        <Card>
          <CardHeader title="Weekly Activity" subtitle="Activity by day of week" />
          {weeklyChartData.length > 0 ? (
            <BarChart data={weeklyChartData} color="#8b5cf6" height={250} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </Card>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Patients by Group" subtitle="Distribution across groups" />
          {groupsChartData.length > 0 ? (
            <PieChart data={groupsChartData} height={300} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No groups defined
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Group Breakdown" />
          {demographics?.by_group && demographics.by_group.length > 0 ? (
            <div className="space-y-3">
              {demographics.by_group.map((item, index) => {
                const total = demographics.by_group.reduce((sum, g) => sum + g.count, 0);
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                const colors = [
                  'bg-primary-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-purple-500',
                  'bg-pink-500',
                ];

                return (
                  <div key={item.group || 'unassigned'} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {item.group || 'Unassigned'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[index % colors.length]} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No group data available</div>
          )}
        </Card>
      </div>
    </div>
  );
}
