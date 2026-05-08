async function run() {
  const tokenRes = await fetch('http://localhost:3000/api/auth/me');
  console.log("Auth/me status:", tokenRes.status);
  const cookie = tokenRes.headers.get('set-cookie');
  console.log("Cookie:", cookie);

  // The /api/auth/me does not set a cookie, it reads it.
  // We need to login to get a cookie.
}
run();
