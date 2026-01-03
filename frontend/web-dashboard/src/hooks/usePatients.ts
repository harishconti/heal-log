import { useState, useEffect, useCallback } from 'react';
import { patientsApi, type PatientFilters } from '../api/patients';
import type { Patient, PatientStats, PaginatedResponse } from '../types';

export function usePatients(initialFilters: PatientFilters = {}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PatientFilters>(initialFilters);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Patient> = await patientsApi.getPatients(filters);
      setPatients(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
        totalPages: response.total_pages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch patients');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const updateFilters = useCallback((newFilters: Partial<PatientFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    patients,
    pagination,
    isLoading,
    error,
    filters,
    updateFilters,
    setPage,
    refetch: fetchPatients,
  };
}

export function usePatientStats() {
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await patientsApi.getStats();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch patient stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}

export function usePatient(id: string) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      setIsLoading(true);
      try {
        const data = await patientsApi.getPatient(id);
        setPatient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch patient');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPatient();
    }
  }, [id]);

  return { patient, isLoading, error, setPatient };
}
