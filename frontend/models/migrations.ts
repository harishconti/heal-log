import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        {
          type: 'create_table',
          schema: {
            name: 'clinical_notes',
            columns: [
              { name: 'patient_id', type: 'string', isIndexed: true },
              { name: 'content', type: 'string' },
              { name: 'timestamp', type: 'number' },
              { name: 'visit_type', type: 'string' },
              { name: 'created_by', type: 'string' },
            ],
          },
        },
        {
          type: 'sql',
          sql: 'INSERT INTO clinical_notes SELECT * FROM patient_notes WHERE 1',
        },
        {
          type: 'sql',
          sql: 'DROP TABLE patient_notes',
        },
      ],
    },
  ],
});