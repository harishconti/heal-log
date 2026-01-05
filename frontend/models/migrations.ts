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
    {
      toVersion: 4,
      steps: [
        // Add source tracking columns for Google Contacts sync
        addColumns({
          table: 'patients',
          columns: [
            { name: 'source', type: 'string', isOptional: true },
            { name: 'external_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'last_synced_at', type: 'number', isOptional: true },
            { name: 'sync_version', type: 'number', isOptional: true },
            { name: 'local_modified_at', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});