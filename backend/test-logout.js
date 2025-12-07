#!/usr/bin/env node

/**
 * Test script for Token Blacklist Logout Feature
 * Run: node test-logout.js
 */

const API_BASE_URL = 'http://localhost:3000';

async function testLogoutFlow() {
  console.log('🧪 Testing Token Blacklist Logout Flow\n');

  try {
    // Step 1: Login
    console.log('1️⃣  Logging in...');
    const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'aryanmishra12112003@gmail.com',
        password: 'password123'
      })
    });

    if (!loginRes.ok) {
      console.error('❌ Login failed:', await loginRes.text());
      return;
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Use token (should work)
    console.log('\n2️⃣  Testing /me with token...');
    const meRes1 = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (meRes1.ok) {
      const meData = await meRes1.json();
      console.log('✅ Token works! User:', meData.user.email);
    } else {
      console.error('❌ Token invalid:', await meRes1.text());
    }

    // Step 3: Logout
    console.log('\n3️⃣  Calling logout endpoint...');
    const logoutRes = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (logoutRes.ok) {
      const logoutData = await logoutRes.json();
      console.log('✅ Logout successful:', logoutData.message);
    } else {
      console.error('❌ Logout failed:', await logoutRes.text());
    }

    // Step 4: Try using same token (should fail)
    console.log('\n4️⃣  Testing /me with blacklisted token...');
    const meRes2 = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!meRes2.ok) {
      const errorData = await meRes2.json();
      console.log('✅ Token is now blacklisted!');
      console.log(`   Error: ${errorData.message}`);
    } else {
      console.error('❌ ERROR: Token should be blacklisted but still works!');
    }

    console.log('\n✨ Test completed!\n');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testLogoutFlow();
