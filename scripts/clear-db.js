import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
  console.error('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file to perform admin operations.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function clearDatabase() {
  console.log('⚠️  WARNING: This will delete ALL users and data from the database.');
  console.log('Starting in 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // 1. Delete data from public tables (Children first to avoid FK constraints)
    const tables = [
      { name: 'messages', pk: 'id', type: 'bigint' },
      { name: 'matches', pk: 'id', type: 'bigint' },
      { name: 'swipes', pk: 'id', type: 'bigint' },
      { name: 'admin_recommendations', pk: 'id', type: 'bigint' },
      { name: 'reports', pk: 'id', type: 'bigint' },
      { name: 'bans', pk: 'user_id', type: 'uuid' },
      { name: 'profiles', pk: 'id', type: 'uuid' },
    ];

    console.log('Clearing public tables...');
    
    for (const table of tables) {
      console.log(`Clearing table: ${table.name}`);
      let query = supabase.from(table.name).delete();

      if (table.type === 'bigint') {
        query = query.gt(table.pk, 0);
      } else {
        query = query.neq(table.pk, '00000000-0000-0000-0000-000000000000');
      }

      const { error } = await query;
      if (error) {
        console.error(`Failed to clear table ${table.name}:`, error.message);
      }
    }

    // 2. List and Delete all Auth Users
    console.log('Fetching auth users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      console.log(`Deleting auth user: ${user.email} (${user.id})`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Failed to delete user ${user.id}:`, deleteError.message);
      }
    }

    console.log('✅ Database cleared successfully.');
    
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

clearDatabase();
