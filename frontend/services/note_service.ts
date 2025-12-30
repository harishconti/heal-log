import { database } from '@/models/database';
import PatientNote from '@/models/PatientNote';
import { NoteFormData } from '@/lib/validation';
import { addBreadcrumb } from '@/utils/monitoring';
import { Q } from '@nozbe/watermelondb';
import { useAppStore } from '@/store/useAppStore';

export const NoteService = {
    async createNote(data: NoteFormData) {
        addBreadcrumb('note_service', `Creating note for patient: ${data.patient_id}`);
        try {
            // Get current user from Zustand store (accessible outside React components)
            const currentUser = useAppStore.getState().user;
            const createdByName = currentUser?.full_name || 'Unknown';

            return await database.write(async () => {
                return await database.collections.get<PatientNote>('clinical_notes').create(note => {
                    note.patientId = data.patient_id;  // Use patientId field directly
                    note.content = data.content;
                    note.visitType = data.visit_type;
                    note.timestamp = new Date();
                    note.createdBy = createdByName;
                });
            });
        } catch (error) {
            console.error('Error creating note:', error);
            throw error;
        }
    },

    async updateNote(noteId: string, content: string) {
        addBreadcrumb('note_service', `Updating note: ${noteId}`);
        try {
            return await database.write(async () => {
                const note = await database.collections.get<PatientNote>('clinical_notes').find(noteId);
                await note.update(n => {
                    n.content = content;
                });
                return note;
            });
        } catch (error) {
            console.error('Error updating note:', error);
            throw error;
        }
    },

    async deleteNote(noteId: string) {
        addBreadcrumb('note_service', `Deleting note: ${noteId}`);
        try {
            await database.write(async () => {
                const note = await database.collections.get<PatientNote>('clinical_notes').find(noteId);
                await note.markAsDeleted();
            });
        } catch (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    },

    async getNotesByPatient(patientId: string) {
        try {
            return await database.collections.get<PatientNote>('clinical_notes')
                .query(
                    Q.where('patient_id', patientId),
                    Q.sortBy('timestamp', Q.desc)
                ).fetch();
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    }
};
