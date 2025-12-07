const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Individual = require('./models/Individual');
const Company = require('./models/Company');
const EmailVerification = require('./models/EmailVerification');
const TokenBlacklist = require('./models/TokenBlacklist');

async function deleteAllUsers() {
  try {
    console.log('[CLEANUP] Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[CLEANUP] ✓ Connected to MongoDB');

    // Delete all documents from collections
    console.log('[CLEANUP] Deleting all users...');
    const userResult = await User.deleteMany({});
    console.log(`[CLEANUP] ✓ Deleted ${userResult.deletedCount} users`);

    console.log('[CLEANUP] Deleting all individual profiles...');
    const individualResult = await Individual.deleteMany({});
    console.log(`[CLEANUP] ✓ Deleted ${individualResult.deletedCount} individual profiles`);

    console.log('[CLEANUP] Deleting all company profiles...');
    const companyResult = await Company.deleteMany({});
    console.log(`[CLEANUP] ✓ Deleted ${companyResult.deletedCount} company profiles`);

    console.log('[CLEANUP] Deleting all email verifications...');
    const emailVerResult = await EmailVerification.deleteMany({});
    console.log(`[CLEANUP] ✓ Deleted ${emailVerResult.deletedCount} email verification records`);

    console.log('[CLEANUP] Deleting all blacklisted tokens...');
    const tokenResult = await TokenBlacklist.deleteMany({});
    console.log(`[CLEANUP] ✓ Deleted ${tokenResult.deletedCount} blacklisted tokens`);

    console.log('[CLEANUP] ========================================');
    console.log('[CLEANUP] ✓ Database cleanup complete!');
    console.log('[CLEANUP] ========================================');
    console.log('[CLEANUP] Summary:');
    console.log(`  - Users deleted: ${userResult.deletedCount}`);
    console.log(`  - Individual profiles deleted: ${individualResult.deletedCount}`);
    console.log(`  - Company profiles deleted: ${companyResult.deletedCount}`);
    console.log(`  - Email verifications deleted: ${emailVerResult.deletedCount}`);
    console.log(`  - Blacklisted tokens deleted: ${tokenResult.deletedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
    process.exit(1);
  }
}

deleteAllUsers();
