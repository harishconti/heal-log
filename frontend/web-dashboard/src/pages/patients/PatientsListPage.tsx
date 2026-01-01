import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Card, Button, Input, Badge, Spinner } from '../../components/ui';
import { usePatients } from '../../hooks';
import { patientsApi } from '../../api/patients';

export function PatientsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const { patients, pagination, isLoading, filters, updateFilters, setPage } = usePatients({
    search: searchParams.get('search') || undefined,
    group: searchParams.get('group') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    page_size: 20,
  });

  useEffect(() => {
    patientsApi.getGroups().then(setGroups).catch(() => {});
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
              className="block rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            >
              <option value="">All Groups</option>
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
      <Card padding="none">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {filters.search || filters.group ? (
                <Search className="h-7 w-7 text-gray-400" />
              ) : (
                <Users className="h-7 w-7 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {filters.search || filters.group
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first patient'}
            </p>
            {!filters.search && !filters.group && (
              <Link to="/patients/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Add Patient
                </Button>
              </Link>
            )}
          </div>
        ) : (
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
                        <p className="text-sm text-gray-600 max-w-xs truncate">
                          {patient.initial_complaint || '-'}
                        </p>
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
        )}
      </Card>
    </div>
  );
}
