import { NoteService } from './note_service';
import { database } from '@/models/database';

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

describe('NoteService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createNote creates a new note', async () => {
        const mockCollection = {
            create: jest.fn((callback) => {
                const note = { patientId: 'patient-123' };
                callback(note);
                return note;
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        const data = {
            patient_id: 'patient-123',
            content: 'Test note content',
            visit_type: 'Follow-up',
        };

        const result = await NoteService.createNote(data);

        expect(database.write).toHaveBeenCalled();
        expect(database.collections.get).toHaveBeenCalledWith('clinical_notes');
        expect(mockCollection.create).toHaveBeenCalled();
        expect(result).toEqual(expect.objectContaining({
            content: 'Test note content',
            visitType: 'Follow-up',
            userId: 'unknown',
        }));
        expect(result.patientId).toBe('patient-123');
    });

    it('updateNote updates content', async () => {
        const mockNote = {
            update: jest.fn((callback) => {
                callback(mockNote);
            }),
            content: 'Old content',
        };
        const mockCollection = {
            find: jest.fn().mockResolvedValue(mockNote),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await NoteService.updateNote('note-123', 'New content');

        expect(database.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('note-123');
        expect(mockNote.update).toHaveBeenCalled();
        expect(mockNote.content).toBe('New content');
    });

    it('deleteNote marks note as deleted', async () => {
        const mockNote = {
            markAsDeleted: jest.fn(),
        };
        const mockCollection = {
            find: jest.fn().mockResolvedValue(mockNote),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        await NoteService.deleteNote('note-123');

        expect(database.write).toHaveBeenCalled();
        expect(mockCollection.find).toHaveBeenCalledWith('note-123');
        expect(mockNote.markAsDeleted).toHaveBeenCalled();
    });

    it('getNotesByPatient fetches notes sorted by created_at', async () => {
        const mockNotes = [{ id: '1', created_at: 2000 }, { id: '2', created_at: 1000 }];
        const mockCollection = {
            query: jest.fn().mockReturnValue({
                fetch: jest.fn().mockResolvedValue(mockNotes),
            }),
        };
        (database.collections.get as jest.Mock).mockReturnValue(mockCollection);

        const result = await NoteService.getNotesByPatient('patient-123');

        expect(database.collections.get).toHaveBeenCalledWith('clinical_notes');
        expect(mockCollection.query).toHaveBeenCalled();
        expect(result).toEqual(mockNotes);
    });
});
