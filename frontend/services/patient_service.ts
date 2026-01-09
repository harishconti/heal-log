import { database } from '@/models/database';
import Patient from '@/models/Patient';
import { PatientFormData } from '@/lib/validation';
import uuid from 'react-native-uuid';
import { addBreadcrumb } from '@/utils/monitoring';
import { Q } from '@nozbe/watermelondb';
import { generatePatientId } from '@/utils/patientIdGenerator';

export interface PatientFilter {
    search?: string;
    sortBy?: 'name' | 'last_visit' | 'date_added';
    sortOrder?: 'asc' | 'desc';
    fromDate?: number;
    toDate?: number;
}

export const PatientService = {
    // ... existing methods ...

    async queryPatients(filter: PatientFilter = {}) {
        try {
            const conditions = [];

            if (filter.search) {
                const searchStr = Q.sanitizeLikeString(filter.search);
                conditions.push(
                    Q.or(
                        Q.where('name', Q.like(`%${searchStr}%`)),
                        Q.where('phone', Q.like(`%${searchStr}%`))
                    )
                );
            }

            if (filter.fromDate) {
                conditions.push(Q.where('updated_at', Q.gte(filter.fromDate)));
            }

            if (filter.toDate) {
                conditions.push(Q.where('updated_at', Q.lte(filter.toDate)));
            }

            let sortColumn = 'name';
            if (filter.sortBy === 'date_added') sortColumn = 'created_at';
            if (filter.sortBy === 'last_visit') sortColumn = 'updated_at';

            const sortOrder = filter.sortOrder === 'desc' ? Q.desc : Q.asc;

            return await database.collections.get<Patient>('patients').query(
                ...conditions,
                Q.sortBy(sortColumn, sortOrder)
            ).fetch();
        } catch (error) {
            console.error('Error querying patients:', error);
            throw error;
        }
    },

    async createPatient(data: PatientFormData) {
        addBreadcrumb('patient_service', `Creating patient: ${data.full_name}`);
        try {
            const patientId = await generatePatientId('PAT');

            return await database.write(async () => {
                return await database.collections.get<Patient>('patients').create(patient => {
                    patient.patientId = patientId;
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
                    // New patient profile fields
                    patient.yearOfBirth = data.year_of_birth || null;
                    patient.gender = data.gender || '';
                    patient.activeTreatmentPlan = data.active_treatment_plan || '';
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
                    // New patient profile fields
                    if (data.year_of_birth !== undefined) p.yearOfBirth = data.year_of_birth;
                    if (data.gender !== undefined) p.gender = data.gender;
                    if (data.active_treatment_plan !== undefined) p.activeTreatmentPlan = data.active_treatment_plan;
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

};
