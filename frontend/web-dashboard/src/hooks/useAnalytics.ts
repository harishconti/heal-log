import { useState, useEffect } from 'react';
import { analyticsApi, type GrowthData, type WeeklyActivity, type Demographics } from '../api/analytics';

export function useAnalytics(days = 30) {
  const [patientGrowth, setPatientGrowth] = useState<GrowthData[]>([]);
  const [notesActivity, setNotesActivity] = useState<GrowthData[]>([]);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity[]>([]);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [growth, notes, weekly, demo] = await Promise.all([
          analyticsApi.getPatientGrowth(days),
          analyticsApi.getNotesActivity(days),
          analyticsApi.getWeeklyActivity(),
          analyticsApi.getDemographics(),
        ]);
        setPatientGrowth(growth);
        setNotesActivity(notes);
        setWeeklyActivity(weekly);
        setDemographics(demo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  return {
    patientGrowth,
    notesActivity,
    weeklyActivity,
    demographics,
    isLoading,
    error,
  };
}
