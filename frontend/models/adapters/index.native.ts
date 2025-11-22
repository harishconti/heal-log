import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from '@/models/schema';
import migrations from '@/models/migrations';

const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  jsi: true,
  onSetUpError: (error) => {
    console.error('Failed to load database', error);
  },
});

export default adapter;