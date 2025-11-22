import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { mySchema } from '@/models/schema';
import migrations from '@/models/migrations';

const adapter = new LokiJSAdapter({
  schema: mySchema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error) => {
    console.error('Failed to load database', error);
  },
});

export default adapter;