import { schemaMigrations, createTable, addColumns, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        // Create the new clinical_notes table
        // Note: For users upgrading from v1, any existing patient_notes data
        // won't be automatically migrated. Since the app syncs with backend,
        // the notes will be pulled from the server on next sync.
        createTable({
          name: 'clinical_notes',
          columns: [
            { name: 'patient_id', type: 'string', isIndexed: true },
            { name: 'content', type: 'string' },
            { name: 'timestamp', type: 'number' },
            { name: 'visit_type', type: 'string' },
            { name: 'created_by', type: 'string' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        // Fix schema mismatch: align column names with backend (created_at, updated_at, user_id)
        // Drop the old table and recreate with correct columns.
        // Data will be restored from backend on next sync.
        unsafeExecuteSql('DROP TABLE IF EXISTS clinical_notes'),
        createTable({
          name: 'clinical_notes',
          columns: [
            { name: 'patient_id', type: 'string', isIndexed: true },
            { name: 'content', type: 'string' },
            { name: 'visit_type', type: 'string' },
            { name: 'user_id', type: 'string', isIndexed: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
  ],
});