import api, { updateProfile, changePassword } from './api';

// Mock axios
jest.mock('axios', () => {
    return {
        create: jest.fn(() => ({
            put: jest.fn(),
            post: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() },
            },
        })),
    };
});

describe('User Profile API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('updateProfile sends PUT request to /api/users/me', async () => {
        const updateData = { full_name: 'New Name', phone: '1234567890' };
        (api.put as jest.Mock).mockResolvedValue({ data: { id: '1', ...updateData } });

        const result = await updateProfile(updateData);

        expect(api.put).toHaveBeenCalledWith('/api/users/me', updateData);
        expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('changePassword sends POST request to /api/users/me/password', async () => {
        (api.post as jest.Mock).mockResolvedValue({ data: { message: 'Success' } });

        await changePassword('oldPass', 'newPass');

        expect(api.post).toHaveBeenCalledWith('/api/users/me/password', {
            current_password: 'oldPass',
            new_password: 'newPass',
        });
    });
});
