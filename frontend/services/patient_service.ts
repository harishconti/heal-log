import { database } from '@/models/database';
import Patient from '@/models/Patient';
import { PatientFormData } from '@/lib/validation';
import uuid from 'react-native-uuid';
import { addBreadcrumb } from '@/utils/monitoring';
import { Q } from '@nozbe/watermelondb';

export const PatientService = {
    async createPatient(data: PatientFormData) {
        addBreadcrumb('patient_service', `Creating patient: ${data.full_name}`);
        try {
            return await database.write(async () => {
                return await database.collections.get<Patient>('patients').create(patient => {
                    patient.patientId = `PAT-${uuid.v4()}`;
                    patient.name = data.full_name;
                    patient.phone = data.phone_number || '';
                    patient.email = data.email || '';
                    patient.address = data.address || '';
                    patient.location = data.location || 'Clinic';
                    patient.initialComplaint = data.initial_complaint || '';
                    patient.initialDiagnosis = data.initial_diagnosis || '';
                    patient.photo = data.photo || '';
                    patient.group = data.group || 'general';
                    patient.isFavorite = data.is_favorite || false;
                });
            });
        } catch (error) {
            console.error('Error creating patient:', error);
            throw error;
        }
    },

    async updatePatient(patientId: string, data: Partial<PatientFormData>) {
        addBreadcrumb('patient_service', `Updating patient: ${patientId}`);
        try {
            return await database.write(async () => {
                const patient = await database.collections.get<Patient>('patients').find(patientId);
                await patient.update(p => {
                    if (data.full_name !== undefined) p.name = data.full_name;
                    if (data.phone_number !== undefined) p.phone = data.phone_number;
                    if (data.email !== undefined) p.email = data.email;
                    if (data.address !== undefined) p.address = data.address;
                    if (data.location !== undefined) p.location = data.location;
                    if (data.initial_complaint !== undefined) p.initialComplaint = data.initial_complaint;
                    if (data.initial_diagnosis !== undefined) p.initialDiagnosis = data.initial_diagnosis;
                    if (data.photo !== undefined) p.photo = data.photo;
                    if (data.group !== undefined) p.group = data.group;
                    if (data.is_favorite !== undefined) p.isFavorite = data.is_favorite;
                });
                return patient;
            });
        } catch (error) {
            console.error('Error updating patient:', error);
            throw error;
        }
    },

    async deletePatient(patientId: string) {
        addBreadcrumb('patient_service', `Deleting patient: ${patientId}`);
        try {
            await database.write(async () => {
                const patient = await database.collections.get<Patient>('patients').find(patientId);
                await patient.markAsDeleted(); // Syncable delete
            });
        } catch (error) {
            console.error('Error deleting patient:', error);
            throw error;
        }
    },

    async getPatients() {
        try {
            return await database.collections.get<Patient>('patients').query().fetch();
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    },

    async getPatient(patientId: string) {
        try {
            return await database.collections.get<Patient>('patients').find(patientId);
        } catch (error) {
            console.error('Error fetching patient:', error);
            throw error;
        }
    },

    async searchPatients(query: string) {
        try {
            return await database.collections.get<Patient>('patients').query(
                Q.where('name', Q.like(`%${Q.sanitizeLikeString(query)}%`))
            ).fetch();
        } catch (error) {
            console.error('Error searching patients:', error);
            throw error;
        }
    }
};
