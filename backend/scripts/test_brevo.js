const fs = require('fs');
const path = require('path');

// Leer .env manualmente
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/BREVO_API_KEY=["']?([^"'\r\n]+)["']?/);
const apiKey = match ? match[1] : null;

if (!apiKey) {
  console.error('API key not found in .env');
  process.exit(1);
}

async function test() {
  console.log('Using API key:', apiKey.slice(0, 10) + '...');
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        to: [{ email: 'juanklv2003@gmail.com', name: 'Juan Carlos' }],
        templateId: 28,
        params: {
          NOMBRE: 'Juan Carlos'
        }
      })
    });

    const status = response.status;
    const data = await response.json();
    console.log('Status code:', status);
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing Brevo:', error);
  }
}

test();
