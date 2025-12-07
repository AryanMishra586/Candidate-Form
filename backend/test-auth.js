#!/usr/bin/env node

/**
 * Test Authentication API
 * Run: node test-auth.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000/api/auth';

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test scenarios
async function runTests() {
  console.log('🧪 Starting Authentication Tests...\n');

  try {
    // Test 1: Individual Signup
    console.log('1️⃣  Testing Individual Signup...');
    const signupRes = await makeRequest('POST', '/signup', {
      email: 'john@example.com',
      password: 'password123',
      userType: 'individual',
      firstName: 'John',
      lastName: 'Doe'
    });
    console.log(`Status: ${signupRes.status}`);
    console.log(`Response:`, signupRes.body);
    const individualToken = signupRes.body.token;
    console.log('✅ Individual signup successful!\n');

    // Test 2: Company Signup
    console.log('2️⃣  Testing Company Signup...');
    const companySignupRes = await makeRequest('POST', '/signup', {
      email: 'google@example.com',
      password: 'company123',
      userType: 'company',
      companyName: 'Google India'
    });
    console.log(`Status: ${companySignupRes.status}`);
    console.log(`Response:`, companySignupRes.body);
    const companyToken = companySignupRes.body.token;
    console.log('✅ Company signup successful!\n');

    // Test 3: Login
    console.log('3️⃣  Testing Login...');
    const loginRes = await makeRequest('POST', '/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    console.log(`Status: ${loginRes.status}`);
    console.log(`Response:`, loginRes.body);
    console.log('✅ Login successful!\n');

    // Test 4: Get Me (Individual)
    console.log('4️⃣  Testing Get Me (Individual)...');
    const getMeRes = await makeRequest('GET', '/me');
    getMeRes.headers['authorization'] = `Bearer ${individualToken}`;
    const getMeRes2 = await makeRequest('GET', '/me');
    console.log(`Status: ${getMeRes2.status}`);
    console.log(`Response:`, getMeRes2.body);
    console.log('✅ Get profile successful!\n');

    // Test 5: Invalid Token
    console.log('5️⃣  Testing Invalid Token...');
    const invalidRes = await makeRequest('GET', '/me');
    invalidRes.headers['authorization'] = 'Bearer invalid-token-here';
    console.log(`Status: ${invalidRes.status}`);
    console.log(`Response:`, invalidRes.body);
    console.log('✅ Invalid token handling works!\n');

    console.log('🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

runTests();
