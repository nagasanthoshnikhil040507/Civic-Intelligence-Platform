import axios from 'axios';

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await axios.get(url, { timeout: 5000 });
    
    if (res.data) {
      const region = res.data.city || res.data.locality || res.data.principalSubdivision || 'Unknown Area';
      return region;
    }
    return 'Unknown Area';
  } catch (err: any) {
    console.error(`Geocoding failed for ${lat},${lon}:`, err.message);
    return 'Unknown Area';
  }
}
