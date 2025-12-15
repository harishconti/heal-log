import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
  version: 2,
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
      ],
    }),
    tableSchema({
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
});