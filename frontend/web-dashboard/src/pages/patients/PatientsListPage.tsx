import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, ChevronLeft, ChevronRight, Users, Filter, Eye, Edit3 } from 'lucide-react';
import { Button, Input, Badge, SkeletonTable, EmptyState, TruncatedText } from '../../components/ui';
import { usePatients } from '../../hooks';
import { patientsApi } from '../../api/patients';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">Manage and view your patient records</p>
        </div>
        <Link to="/patients/new">
          <Button className="h-12 px-6 shadow-lg shadow-primary-500/25">
            <Plus className="h-5 w-5" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients by name, phone, or ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-12 h-12"
              />
            </div>
            <Button type="submit" variant="secondary" className="h-12 px-6">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </form>

          {/* Group Filter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-gray-500">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Filter:</span>
            </div>
            <select
              value={filters.group || ''}
              onChange={(e) => handleGroupFilter(e.target.value || null)}
              disabled={isLoadingGroups}
              className={`block rounded-xl border px-4 py-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-w-[160px] ${
                groupsError
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : isLoadingGroups
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-wait'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              }`}
              title={groupsError || undefined}
            >
              <option value="">
                {isLoadingGroups ? 'Loading...' : groupsError ? 'Error' : 'All Groups'}
              </option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Patients List */}
      {isLoading ? (
        <SkeletonTable rows={8} columns={5} />
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Complaint
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((patient, index) => (
                  <tr
                    key={patient.id}
                    className="group hover:bg-gradient-to-r hover:from-primary-50/30 hover:to-transparent transition-all duration-200"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                          <span className="text-white font-semibold text-base">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/patients/${patient.id}`}
                              className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                            >
                              {patient.name}
                            </Link>
                            {patient.is_favorite && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{patient.patient_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">{patient.phone || '-'}</p>
                      <p className="text-sm text-gray-500">{patient.email || '-'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient.group ? (
                        <Badge variant="primary" className="font-medium">
                          {patient.group}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm italic">No group</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {patient.initial_complaint ? (
                        <TruncatedText
                          text={patient.initial_complaint}
                          maxWidth={200}
                          className="text-sm text-gray-600"
                        />
                      ) : (
                        <span className="text-sm text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/patients/${patient.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <Link
                          to={`/patients/${patient.id}/edit`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{(pagination.page - 1) * pagination.pageSize + 1}</span> to{' '}
                <span className="font-semibold text-gray-700">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{' '}
                <span className="font-semibold text-gray-700">{pagination.total}</span> patients
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          pagination.page === pageNum
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
