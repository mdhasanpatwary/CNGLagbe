import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const lat = 23.10206;
const lng = 91.48641;
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

async function run() {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.status, data.error_message);
  if (data.results && data.results.length > 0) {
    console.log("First result:", data.results[0].formatted_address);
  }
}
run();
