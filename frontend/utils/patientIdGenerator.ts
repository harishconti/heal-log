import { database } from '@/models/database';
import Patient from '@/models/Patient';
import { Q } from '@nozbe/watermelondb';

/**
 * Generates a sequential patient ID in format: PTYYYYMM001
 * Example: PT202501001 (first patient in January 2025)
 *
 * Format breakdown:
 * - PT: Prefix for patient
 * - YYYY: 4-digit year
 * - MM: 2-digit month
 * - 001: 3-digit sequential number (resets each month)
 */
export async function generatePatientId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();  // 4-digit year
    const month = String(now.getMonth() + 1).padStart(2, '0');  // 2-digit month
    const prefix = `PT${year}${month}`;  // e.g., "PT202501"

    try {
        // Get all patients with IDs starting with this month's prefix
        const existingPatients = await database.collections
            .get<Patient>('patients')
            .query(
                Q.where('patient_id', Q.like(`${prefix}%`))
            )
            .fetch();

        // Extract counter numbers from existing IDs (last 3 digits)
        const counters = existingPatients
            .map(p => {
                // Extract last 3 characters as the sequence number
                const seq = p.patientId.slice(-3);
                const num = parseInt(seq, 10);
                return isNaN(num) ? 0 : num;
            })
            .filter(n => n > 0);

        // Find the highest counter, default to 0 if none exist
        const maxCounter = counters.length > 0 ? Math.max(...counters) : 0;
        const nextCounter = maxCounter + 1;

        // Format with leading zeros (3 digits)
        const counterStr = String(nextCounter).padStart(3, '0');

        return `${prefix}${counterStr}`;  // e.g., PT202501001
    } catch (error) {
        console.error('Error generating patient ID:', error);
        // Fallback: use timestamp-based suffix if query fails
        const timestamp = Date.now().toString().slice(-3);
        return `${prefix}${timestamp}`;
    }
}
