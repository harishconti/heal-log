import api, { submitFeedback, getKnownIssues } from './api';

// Mock axios
jest.mock('axios', () => {
    return {
        create: jest.fn(() => ({
            post: jest.fn(),
            get: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() },
            },
        })),
    };
});

describe('Feedback & Beta API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('submitFeedback sends correct payload to /api/feedback/submit', async () => {
        (api.post as jest.Mock).mockResolvedValue({ data: { success: true } });

        const feedback = {
            feedbackType: 'bug' as const,
            description: 'Test bug report',
            email: 'test@example.com',
        };

        await submitFeedback(feedback);

        expect(api.post).toHaveBeenCalledWith('/api/feedback/submit', expect.objectContaining({
            feedback_type: 'bug',
            description: 'Test bug report',
            device_info: expect.any(Object),
        }));
    });

    it('getKnownIssues fetches from /api/beta/known-issues', async () => {
        const mockIssues = [{ id: '1', title: 'Issue 1' }];
        (api.get as jest.Mock).mockResolvedValue({ data: mockIssues });

        const result = await getKnownIssues();

        expect(api.get).toHaveBeenCalledWith('/api/beta/known-issues');
        expect(result).toEqual(mockIssues);
    });
});
