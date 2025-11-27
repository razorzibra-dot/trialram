#!/usr/bin/env node
const https = require('https');

const email = 'super_admin@example.com';
const password = 'SecureAdminPass123!';

const postData = JSON.stringify({
  email,
  password
});

const options = {
  hostname: '127.0.0.1',
  port: 54321,
  path: '/auth/v1/token?grant_type=password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  rejectUnauthorized: false
};

console.log('Testing login with fixed RLS policies...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    
    try {
      const response = JSON.parse(data);
      if (response.access_token) {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log(`Access Token (first 20 chars): ${response.access_token.substring(0, 20)}...`);
      } else if (response.error) {
        console.log(`❌ Login failed: ${response.error} - ${response.error_description}`);
      } else {
        console.log('Response:', response);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  process.exit(1);
});

req.write(postData);
req.end();
