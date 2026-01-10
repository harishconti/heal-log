import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Card, Button, Input, Badge, SkeletonTable, EmptyState, TruncatedText } from '../../components/ui';
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
          <h1 className="text-2xl font-semibold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">Manage your patient records</p>
        </div>
        <Link to="/patients/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search patients by name, phone, or ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-11"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>

          {/* Group Filter */}
          <div className="flex items-center gap-3">
            <select
              value={filters.group || ''}
              onChange={(e) => handleGroupFilter(e.target.value || null)}
              disabled={isLoadingGroups}
              className={`block rounded-xl border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${
                groupsError
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : isLoadingGroups
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-wait'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              }`}
              title={groupsError || undefined}
            >
              <option value="">
                {isLoadingGroups ? 'Loading groups...' : groupsError ? 'Groups unavailable' : 'All Groups'}
              </option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Patients List */}
      {isLoading ? (
        <SkeletonTable rows={8} columns={5} />
      ) : patients.length === 0 ? (
        <Card padding="none">
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
        </Card>
      ) : (
        <Card padding="none">
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Complaint
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {patient.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/patients/${patient.id}`}
                                className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                              >
                                {patient.name}
                              </Link>
                              {patient.is_favorite && (
                                <Star className="h-4 w-4 text-amber-500 fill-current" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{patient.patient_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{patient.phone || '-'}</p>
                        <p className="text-sm text-gray-500">{patient.email || '-'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.group ? (
                          <Badge variant="primary">{patient.group}</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">No group</span>
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
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/patients/${patient.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            to={`/patients/${patient.id}/edit`}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                          >
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
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                  {pagination.total} patients
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        </Card>
      )}
    </div>
  );
}
