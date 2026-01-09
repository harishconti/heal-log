import { database } from '@/models/database';
import PatientNote from '@/models/PatientNote';
import { NoteFormData } from '@/lib/validation';
import { addBreadcrumb } from '@/utils/monitoring';
import { Q } from '@nozbe/watermelondb';
import { useAppStore } from '@/store/useAppStore';
import { triggerChangeBasedSync } from './backgroundSync';

export const NoteService = {
    async createNote(data: NoteFormData) {
        addBreadcrumb('note_service', `Creating note for patient: ${data.patient_id}`);
        try {
            // Get current user from Zustand store (accessible outside React components)
            const currentUser = useAppStore.getState().user;
            const userId = currentUser?.id || 'unknown';

            const note = await database.write(async () => {
                return await database.collections.get<PatientNote>('clinical_notes').create(note => {
                    note.patientId = data.patient_id;
                    note.content = data.content;
                    note.visitType = data.visit_type;
                    note.userId = userId;
                    note.createdAt = new Date();
                    note.updatedAt = new Date();
                });
            });

            // Trigger change-based sync (debounced)
            triggerChangeBasedSync();

            return note;
        } catch (error) {
            console.error('Error creating note:', error);
            throw error;
        }
    },

    async updateNote(noteId: string, content: string) {
        addBreadcrumb('note_service', `Updating note: ${noteId}`);
        try {
            const note = await database.write(async () => {
                const note = await database.collections.get<PatientNote>('clinical_notes').find(noteId);
                await note.update(n => {
                    n.content = content;
                    n.updatedAt = new Date();
                });
                return note;
            });

            // Trigger change-based sync (debounced)
            triggerChangeBasedSync();

            return note;
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

            // Trigger change-based sync (debounced)
            triggerChangeBasedSync();
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
                    Q.sortBy('created_at', Q.desc)
                ).fetch();
        } catch (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }
    }
};
