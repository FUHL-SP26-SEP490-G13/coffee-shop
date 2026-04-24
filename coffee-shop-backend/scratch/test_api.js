const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:5000/api/orders/admin/list?page=1&limit=10&status=all');
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) console.error('Response Data:', err.response.data);
  }
}

test();
