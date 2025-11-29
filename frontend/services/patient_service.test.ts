import { PatientService } from './patient_service';
import { database } from '@/models/database';
import Patient from '@/models/Patient';

// Mock dependencies
jest.mock('@/models/database', () => ({
    database: {
        write: jest.fn((callback) => callback()),
        collections: {
            get: jest.fn(),
        },
    },
}));

jest.mock('@/utils/monitoring', () => ({
    addBreadcrumb: jest.fn(),
}));

jest.mock('react-native-uuid', () => ({
    v4: jest.fn(() => 'mock-uuid'),
}));

describe('PatientService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createPatient creates a new patient', async () => {
        const mockCollection = {
            create: jest.fn((callback) => {
                const patient = {};
                callback(patient);
                return patient;
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        const data = {
            full_name: 'John Doe',
            phone_number: '1234567890',
            email: 'john@example.com',
        };

        const result = await PatientService.createPatient(data);

        expect(database.write).toHaveBeenCalled();
        expect(database.collections.get).toHaveBeenCalledWith('patients');
        expect(mockCollection.create).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({
            patientId: 'PAT-mock-uuid',
            name: 'John Doe',
            phone: '1234567890',
            email: 'john@example.com',
        }));
    });

    it('updatePatient updates an existing patient', async () => {
        const mockPatient = {
            update: jest.fn((callback) => {
                callback(mockPatient);
            }),
            name: 'Old Name',
        };
        const mockCollection = {
            find: jest.fn().mockResolvedValue(mockPatient),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await PatientService.updatePatient('patient-id', { full_name: 'New Name' });

        expect(database.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('patient-id');
        expect(mockPatient.update).toHaveBeenCalled();
        expect(mockPatient.name).toBe('New Name');
    });

    it('deletePatient marks patient as deleted', async () => {
        const mockPatient = {
            markAsDeleted: jest.fn(),
        };
        const mockCollection = {
            find: jest.fn().mockResolvedValue(mockPatient),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await PatientService.deletePatient('patient-id');

        expect(database.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('patient-id');
        expect(mockPatient.markAsDeleted).toHaveBeenCalled();
    });

    it('getPatients fetches all patients', async () => {
        const mockPatients = [{ id: '1', name: 'John' }];
        const mockCollection = {
            query: jest.fn().mockReturnValue({
                fetch: jest.fn().mockResolvedValue(mockPatients),
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        const result = await PatientService.getPatients();

        expect(database.collections.get).toHaveBeenCalledWith('patients');
        expect(mockCollection.query).toHaveBeenCalled();
        expect(result).toEqual(mockPatients);
    });
});
