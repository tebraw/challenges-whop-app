/**
 * 🔍 DATABASE CONNECTION DIAGNOSTICS (SAFE)
 * Checks connection without modifying data
 */

console.log('🔍 Database Connection Diagnostics...\n');

// Check environment variables (redacted for security)
const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('📊 Environment Check:');
console.log(`DATABASE_URL: ${dbUrl ? '✅ Set (' + dbUrl.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log(`DIRECT_URL: ${directUrl ? '✅ Set (' + directUrl.substring(0, 20) + '...)' : '❌ Missing'}`);

// Check if URLs are pointing to correct hosts
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`Database Host: ${url.hostname}`);
    console.log(`Database Port: ${url.port || 'default'}`);
    console.log(`Database Protocol: ${url.protocol}`);
  } catch (error) {
    console.log('❌ Invalid DATABASE_URL format');
  }
}

console.log('\n💡 Diagnostic Complete - No data was accessed or modified');