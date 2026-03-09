require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase.from('community_exercises').select('id, name, created_by, is_public');
    if (error) { console.error('Error:', error); return; }
    console.log('Exercises in DB:', data.length);
    console.table(data);
}

check();
