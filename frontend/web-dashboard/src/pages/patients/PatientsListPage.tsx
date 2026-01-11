import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, Users, Filter, Eye, Edit3 } from 'lucide-react';
import { Button, Input, Badge, EmptyState, DataTable, type Column } from '../../components/ui';
import { usePatients } from '../../hooks';
import { patientsApi } from '../../api/patients';
import type { Patient } from '../../types';

// Pagination constant
const DEFAULT_PAGE_SIZE = 20;

export function PatientsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);

  const { patients, pagination, isLoading, filters, updateFilters, setPage } = usePatients({
    search: searchParams.get('search') || undefined,
    group: searchParams.get('group') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    page_size: DEFAULT_PAGE_SIZE,
  });

  useEffect(() => {
    patientsApi.getGroups()
      .then(setGroups)
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load groups:', err);
        }
        setGroupsError('Failed to load groups');
      })
      .finally(() => setIsLoadingGroups(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput || undefined });
    setSearchParams((prev) => {
      if (searchInput) {
        prev.set('search', searchInput);
      } else {
        prev.delete('search');
      }
      prev.delete('page');
      return prev;
    });
  };

  const handleGroupFilter = (group: string | null) => {
    updateFilters({ group: group || undefined });
    setSearchParams((prev) => {
      if (group) {
        prev.set('group', group);
      } else {
        prev.delete('group');
      }
      prev.delete('page');
      return prev;
    });
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    setSearchParams((prev) => {
      prev.set('page', String(page));
      return prev;
    });
  };

  const columns: Column<Patient>[] = [
    {
      key: 'name',
      header: 'Patient',
      render: (patient) => (
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-white font-bold text-base">
              {patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link
                to={`/patients/${patient.id}`}
                className="font-bold text-gray-900 hover:text-primary-600 transition-colors"
              >
                {patient.name}
              </Link>
              {patient.is_favorite && (
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 font-medium">{patient.patient_id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (patient) => (
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-gray-900">{patient.phone || '-'}</p>
          <p className="text-sm text-gray-500">{patient.email || ''}</p>
        </div>
      ),
    },
    {
      key: 'group',
      header: 'Group',
      render: (patient) =>
        patient.group ? (
          <Badge variant="primary" className="font-semibold px-2.5 py-0.5 rounded-lg">
            {patient.group}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm italic">No group</span>
        ),
    },
    {
      key: 'initial_complaint',
      header: 'Complaint',
      render: (patient) => (
        <div className="max-w-[240px] truncate text-sm text-gray-600">
          {patient.initial_complaint || '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (patient) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/patients/${patient.id}`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-primary-50 hover:text-primary-600">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link to={`/patients/${patient.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 hover:text-gray-900">
              <Edit3 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Patients</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and view your patient records</p>
        </div>
        <Link to="/patients/new">
          <Button className="h-12 px-6 shadow-lg shadow-primary-500/20" rounded="full">
            <Plus className="h-5 w-5" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients by name, phone, or ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 h-12 border-gray-200"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-12 px-6">
              Search
            </Button>
          </form>

          {/* Group Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500 whitespace-nowrap">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Filter by Group:</span>
            </div>
            <div className="relative">
              <select
                value={filters.group || ''}
                onChange={(e) => handleGroupFilter(e.target.value || null)}
                disabled={isLoadingGroups}
                className={`
                  appearance-none block w-full rounded-xl border px-4 py-3 pr-10
                  text-sm font-medium transition-all focus:outline-none focus:ring-4 focus:ring-primary-100
                  min-w-[180px] cursor-pointer
                  ${groupsError
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : isLoadingGroups
                      ? 'border-gray-200 bg-gray-50 text-gray-400'
                      : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <Filter className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          data={patients}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          pagination={{
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onPageChange: handlePageChange,
          }}
          emptyState={
            <div className="py-12">
              <EmptyState
                icon={filters.search || filters.group ? Search : Users}
                title="No patients found"
                description={
                  filters.search || filters.group
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first patient to the system'
                }
                action={
                  !filters.search && !filters.group
                    ? {
                      label: 'Add Patient',
                      onClick: () => window.location.href = '/patients/new',
                      icon: Plus,
                    }
                    : undefined
                }
                secondaryAction={
                  filters.search || filters.group
                    ? {
                      label: 'Clear filters',
                      onClick: () => {
                        setSearchInput('');
                        updateFilters({ search: undefined, group: undefined });
                        setSearchParams(new URLSearchParams());
                      },
                    }
                    : undefined
                }
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
