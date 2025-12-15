import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});