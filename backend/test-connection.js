require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const mongoose = require('mongoose');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('🔄 Testing connections...\n');

// Test Supabase
console.log('=== SUPABASE TEST ===');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('📊 Fetching data from "test" table...\n');
    
    const { data, error } = await supabase
      .from('test')
      .select('*');
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('❌ Table "test" does not exist.');
        console.log('\n💡 Tip: Go to Supabase Dashboard → Table Editor to see your table names');
      } else if (error.message.includes('JWT') || error.message.includes('auth')) {
        console.log('❌ Authentication error. Check your SUPABASE_ANON_KEY in .env');
      } else {
        console.log('❌ Error:', error.message);
        console.log('Error code:', error.code);
      }
    } else {
      console.log('✅ Supabase connection successful!\n');
      console.log('📋 Data from "test" table:\n');
      
      if (data.length === 0) {
        console.log('   (Table is empty - no records found)');
      } else {
        console.table(data);
      }
      
      console.log(`\n✓ Total records: ${data.length}`);
    }
  } catch (err) {
    console.log('❌ Failed to connect to Supabase:', err.message);
  }
}


async function testMongoDB() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully!\n');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📦 Database: ${dbName}\n`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('📋 Collections (Tables):');
    if (collections.length === 0) {
      console.log('   (No collections found)');
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
    }
    
    console.log(`\n✓ Total collections: ${collections.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}


// Run both tests
async function runAllTests() {
  await testSupabase();
  await testMongoDB();
  
  console.log('\n✅ All connection tests completed!');
  process.exit(0);
}

runAllTests();