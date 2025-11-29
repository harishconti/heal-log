import api from './api';
import { AnalyticsService } from './analytics_service';

// Mock axios
jest.mock('axios', () => {
    return {
        create: jest.fn(() => ({
            get: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() },
            },
        })),
    };
});

describe('AnalyticsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getPatientGrowth fetches data from correct endpoint', async () => {
        const mockData = [{ period: '2023-01', count: 10 }];
        (api.get as jest.Mock).mockResolvedValue({ data: mockData });

        const result = await AnalyticsService.getPatientGrowth();

        expect(api.get).toHaveBeenCalledWith('/api/analytics/patient-growth');
        expect(result).toEqual(mockData);
    });

    it('getNotesActivity fetches data from correct endpoint', async () => {
        const mockData = [{ period: '2023-01', count: 5 }];
        (api.get as jest.Mock).mockResolvedValue({ data: mockData });

        const result = await AnalyticsService.getNotesActivity();

        expect(api.get).toHaveBeenCalledWith('/api/analytics/notes-activity');
        expect(result).toEqual(mockData);
    });

    it('getWeeklyActivity fetches data from correct endpoint', async () => {
        const mockData = [{ day: 'Mon', count: 15 }];
        (api.get as jest.Mock).mockResolvedValue({ data: mockData });

        const result = await AnalyticsService.getWeeklyActivity();

        expect(api.get).toHaveBeenCalledWith('/api/analytics/weekly-activity');
        expect(result).toEqual(mockData);
    });

    it('getDemographics fetches data from correct endpoint', async () => {
        const mockData = [{ group: 'A', count: 20 }];
        (api.get as jest.Mock).mockResolvedValue({ data: mockData });

        const result = await AnalyticsService.getDemographics();

        expect(api.get).toHaveBeenCalledWith('/api/analytics/demographics');
        expect(result).toEqual(mockData);
    });

    it('exportAnalytics fetches data from correct endpoint', async () => {
        const mockData = { growth: [], notes: [], activity: [], demographics: [], exported_at: 'now' };
        (api.get as jest.Mock).mockResolvedValue({ data: mockData });

        const result = await AnalyticsService.exportAnalytics();

        expect(api.get).toHaveBeenCalledWith('/api/analytics/export');
        expect(result).toEqual(mockData);
    });
});
