import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: 'patients',
      columns: [
        { name: 'patient_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'phone', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'location', type: 'string' },
        { name: 'initial_complaint', type: 'string' },
        { name: 'initial_diagnosis', type: 'string' },
        { name: 'photo', type: 'string', isOptional: true },
        { name: 'group', type: 'string', isOptional: true },
        { name: 'is_favorite', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Source tracking for Google Contacts sync
        { name: 'source', type: 'string', isOptional: true },
        { name: 'external_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'last_synced_at', type: 'number', isOptional: true },
        { name: 'sync_version', type: 'number', isOptional: true },
        { name: 'local_modified_at', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
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
});