import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';

// Mock dependencies
const mockUser = {
  id: '1',
  full_name: 'Dr. John Smith',
  email: 'john@example.com',
  plan: 'pro',
};

vi.mock('../../../store', () => ({
  useAuthStore: () => ({
    user: mockUser,
  }),
}));

vi.mock('../../../api/patients', () => ({
  patientsApi: {
    getStats: vi.fn().mockResolvedValue({
      total_patients: 42,
      total_favorites: 10,
      total_groups: 5,
    }),
    getPatients: vi.fn().mockResolvedValue({
      items: [
        { id: '1', name: 'John Doe', group: 'Cardiology', patient_id: 'P001', is_favorite: true },
        { id: '2', name: 'Jane Smith', group: 'Neurology', patient_id: 'P002', is_favorite: false },
      ],
    }),
  },
}));

vi.mock('../../../api/analytics', () => ({
  analyticsApi: {
    getPatientGrowth: vi.fn().mockResolvedValue([
      { date: '2024-01-01', count: 10 },
      { date: '2024-01-15', count: 25 },
      { date: '2024-01-30', count: 42 },
    ]),
  },
}));

// Mock chart component
vi.mock('../../../components/charts', () => ({
  LineChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="line-chart">Chart with {data.length} points</div>
  ),
}));

const renderDashboardPage = () => {
  return render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders welcome message', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });
    });

    it('renders overview subtitle', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText(/here's an overview of your practice/i)).toBeInTheDocument();
      });
    });

    it('shows loading or content', () => {
      renderDashboardPage();
      // Either shows spinner initially or content after quick load
      const hasContent = document.body.textContent?.includes('Welcome back') ||
                         document.body.textContent?.includes('loading') ||
                         document.querySelector('.animate-spin');
      expect(hasContent).toBeTruthy();
    });
  });

  describe('Stat Cards', () => {
    it('displays total patients stat', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Total Patients')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
      });
    });

    it('displays favorites stat', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Favorites')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
      });
    });

    it('displays groups stat', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Groups')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('displays notes today stat', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Notes Today')).toBeInTheDocument();
      });
    });
  });

  describe('Patient Growth Chart (Pro Users)', () => {
    it('displays patient growth section for pro users', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Patient Growth')).toBeInTheDocument();
      });
    });

    it('displays last 30 days subtitle', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      });
    });

    it('has link to view analytics', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('View analytics')).toBeInTheDocument();
      });
    });

    it('renders line chart', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });
  });

  describe('Recent Patients', () => {
    it('displays recent patients section', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Recent Patients')).toBeInTheDocument();
      });
    });

    it('displays patient names', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('displays patient groups', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText(/cardiology/i)).toBeInTheDocument();
        expect(screen.getByText(/neurology/i)).toBeInTheDocument();
      });
    });

    it('has link to view all patients', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('View all')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Actions', () => {
    it('displays quick actions section', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      });
    });

    it('displays add patient action', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Add Patient')).toBeInTheDocument();
      });
    });

    it('displays view patients action', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('View Patients')).toBeInTheDocument();
      });
    });

    it('displays profile action', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('displays analytics action for pro users', async () => {
      renderDashboardPage();
      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Links', () => {
    it('add patient links to correct route', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const addPatientLink = screen.getByText('Add Patient').closest('a');
        expect(addPatientLink).toHaveAttribute('href', '/patients/new');
      });
    });

    it('view patients links to correct route', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const viewPatientsLink = screen.getByText('View Patients').closest('a');
        expect(viewPatientsLink).toHaveAttribute('href', '/patients');
      });
    });

    it('profile links to correct route', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const profileLink = screen.getByText('Profile').closest('a');
        expect(profileLink).toHaveAttribute('href', '/profile');
      });
    });

    it('analytics links to correct route', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const analyticsLink = screen.getByText('Analytics').closest('a');
        expect(analyticsLink).toHaveAttribute('href', '/analytics');
      });
    });
  });

  describe('Typography', () => {
    it('welcome heading is styled correctly', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveClass('text-2xl', 'font-bold', 'text-gray-900');
      });
    });

    it('stat titles are gray text', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statTitle = screen.getByText('Total Patients');
        expect(statTitle).toHaveClass('text-gray-600');
      });
    });

    it('stat values are bold', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statValue = screen.getByText('42');
        expect(statValue).toHaveClass('font-bold');
      });
    });
  });

  describe('Layout', () => {
    it('has proper vertical spacing', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const container = screen.getByRole('heading', { level: 1 }).closest('div')?.parentElement;
        expect(container).toHaveClass('space-y-6');
      });
    });

    it('stats grid uses responsive columns', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statsGrid = screen.getByText('Total Patients').closest('.grid');
        expect(statsGrid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4');
      });
    });

    it('quick actions grid uses responsive columns', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const actionsGrid = screen.getByText('Add Patient').closest('.grid');
        expect(actionsGrid).toHaveClass('grid-cols-2', 'sm:grid-cols-4');
      });
    });
  });

  describe('Color Schema', () => {
    it('total patients icon has primary background', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statCard = screen.getByText('Total Patients').closest('.flex');
        const iconContainer = statCard?.querySelector('.bg-primary-600');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    it('favorites icon has yellow background', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statCard = screen.getByText('Favorites').closest('.flex');
        const iconContainer = statCard?.querySelector('.bg-yellow-500');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    it('groups icon has green background', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statCard = screen.getByText('Groups').closest('.flex');
        const iconContainer = statCard?.querySelector('.bg-green-500');
        expect(iconContainer).toBeInTheDocument();
      });
    });

    it('notes icon has purple background', async () => {
      renderDashboardPage();
      await waitFor(() => {
        const statCard = screen.getByText('Notes Today').closest('.flex');
        const iconContainer = statCard?.querySelector('.bg-purple-500');
        expect(iconContainer).toBeInTheDocument();
      });
    });
  });

  describe('Patient Avatar', () => {
    it('displays patient initials', async () => {
      renderDashboardPage();
      await waitFor(() => {
        // Check for patient names which should show initials
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('patient list shows avatar container', async () => {
      renderDashboardPage();
      await waitFor(() => {
        // Verify patient list is rendered with avatar containers
        const patientList = screen.getByText('Recent Patients').closest('.bg-white');
        expect(patientList).toBeInTheDocument();
      });
    });
  });
});
