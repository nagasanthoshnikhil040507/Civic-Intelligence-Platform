const axios = require('axios');

async function testGeocode() {
  const lat = 16.50045131435224;
  const lon = 80.64561367034914; // A coordinate from previous output
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await axios.get(url);
    console.log(res.data);
  } catch(e) {
    console.error(e.message);
  }
}

testGeocode();
