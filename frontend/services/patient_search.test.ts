import { PatientService } from './patient_service';
import { database } from '@/models/database';
import { Q } from '@nozbe/watermelondb';

// Mock dependencies
jest.mock('@/models/database', () => ({
    database: {
        collections: {
            get: jest.fn(),
        },
    },
}));

jest.mock('@/utils/monitoring', () => ({
    addBreadcrumb: jest.fn(),
}));

describe('PatientService Search', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('queryPatients filters by name or phone', async () => {
        const mockCollection = {
            query: jest.fn().mockReturnValue({
                fetch: jest.fn().mockResolvedValue([]),
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await PatientService.queryPatients({ search: 'John' });

        expect(database.collections.get).toHaveBeenCalledWith('patients');
        expect(mockCollection.query).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'or',
                conditions: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'where',
                        left: 'name',
                        comparison: expect.objectContaining({ operator: 'like', right: { value: '%John%' } })
                    }),
                    expect.objectContaining({
                        type: 'where',
                        left: 'phone',
                        comparison: expect.objectContaining({ operator: 'like', right: { value: '%John%' } })
                    }),
                ])
            }),
            expect.anything() // Sort
        );
    });

    it('queryPatients filters by date range', async () => {
        const mockCollection = {
            query: jest.fn().mockReturnValue({
                fetch: jest.fn().mockResolvedValue([]),
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await PatientService.queryPatients({ fromDate: 1000, toDate: 2000 });

        expect(mockCollection.query).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'where',
                left: 'updated_at',
                comparison: expect.objectContaining({ operator: 'gte', right: { value: 1000 } })
            }),
            expect.objectContaining({
                type: 'where',
                left: 'updated_at',
                comparison: expect.objectContaining({ operator: 'lte', right: { value: 2000 } })
            }),
            expect.anything()
        );
    });

    it('queryPatients sorts results', async () => {
        const mockCollection = {
            query: jest.fn().mockReturnValue({
                fetch: jest.fn().mockResolvedValue([]),
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await PatientService.queryPatients({ sortBy: 'last_visit', sortOrder: 'desc' });

        expect(mockCollection.query).toHaveBeenCalled();
    });

    it('queryPatients handles 100+ patients efficiently', async () => {
        const largeDataset = Array.from({ length: 150 }, (_, i) => ({
            id: `p${i}`,
            name: `Patient ${i}`,
            phone: `555-${i}`
        }));

        const mockCollection = {
            query: jest.fn().mockReturnValue({
                fetch: jest.fn().mockResolvedValue(largeDataset),
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        const start = performance.now();
        const results = await PatientService.queryPatients({ search: 'Patient' });
        const end = performance.now();

        expect(results).toHaveLength(150);
        expect(end - start).toBeLessThan(100); // Should be very fast (mocked)
    });
});
