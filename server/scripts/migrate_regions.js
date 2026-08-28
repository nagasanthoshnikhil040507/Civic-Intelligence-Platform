const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const delay = ms => new Promise(r => setTimeout(r, ms));

async function geocode(lat, lon) {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await axios.get(url, { timeout: 5000 });
    if (res.data) {
      return res.data.city || res.data.locality || res.data.principalSubdivision || 'Unknown Area';
    }
    return 'Unknown Area';
  } catch (err) {
    console.error(`Geocoding failed for ${lat},${lon}:`, err.message);
    return 'Unknown Area';
  }
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const collection = mongoose.connection.collection('complaints');
  // Re-run for ALL complaints to overwrite 'Unknown Area'
  const complaints = await collection.find({ $or: [{ region: { $exists: false } }, { region: 'Unknown Area' }] }).toArray();
  
  console.log(`Found ${complaints.length} complaints to geocode...`);
  
  let count = 0;
  for (const c of complaints) {
    let region = 'Unknown Area';
    
    const lon = c.location?.coordinates?.[0];
    const lat = c.location?.coordinates?.[1];
    
    if (lon !== undefined && lat !== undefined && (lon !== 0 || lat !== 0)) {
      region = await geocode(lat, lon);
      await delay(200); // 5 requests per second is perfectly fine for BigDataCloud
    }
    
    await collection.updateOne({ _id: c._id }, { $set: { region } });
    count++;
    if (count % 10 === 0) console.log(`Processed ${count}/${complaints.length}`);
  }
  
  console.log('Geocoding complete!');
  process.exit(0);
});
