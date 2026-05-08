async function run() {
  const loginRes = await fetch('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '01783721411', password: 'password' }) // Assume password or login skips it for dev?
  });
  console.log("Login status:", loginRes.status);
  const cookie = loginRes.headers.get('set-cookie');
  console.log("Cookie:", cookie ? cookie.substring(0, 50) + "..." : "null");

  const bookingsRes = await fetch('http://localhost:3000/api/user/bookings', {
    headers: { 'Cookie': cookie }
  });
  console.log("Bookings status:", bookingsRes.status);
  const data = await bookingsRes.json();
  console.log("Bookings returned:", data.bookings?.length);
  if (data.bookings?.length > 0) {
    console.log("First booking ID:", data.bookings[0].id);
  }
}
run();
