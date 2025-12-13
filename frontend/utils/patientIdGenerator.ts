import { database } from '@/models/database';
import Patient from '@/models/Patient';
import { Q } from '@nozbe/watermelondb';

/**
 * Generates a sequential patient ID in format: PAT-YYMMDD-NNN
 * Example: PAT-250114-001 (first patient on Jan 14, 2025)
 */
export async function generatePatientId(prefix: string = 'PAT'): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${prefix}-${year}${month}${day}`;

    try {
        // Get all patients with IDs starting with today's date prefix
        const existingPatients = await database.collections
            .get<Patient>('patients')
            .query(
                Q.where('patient_id', Q.like(`${datePrefix}-%`))
            )
            .fetch();

        // Extract counter numbers from existing IDs
        const counters = existingPatients
            .map(p => {
                const match = p.patientId.match(/(\d+)$/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));

        // Find the highest counter, default to 0 if none exist
        const maxCounter = counters.length > 0 ? Math.max(...counters) : 0;
        const nextCounter = maxCounter + 1;

        // Format with leading zeros (3 digits)
        const counterStr = String(nextCounter).padStart(3, '0');

        return `${datePrefix}-${counterStr}`;
    } catch (error) {
        console.error('Error generating patient ID:', error);
        // Fallback to timestamp-based ID if query fails
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}-${year}${month}${day}-${timestamp}`;
    }
}
