async function run() {
  const tokenCookie = (await (await fetch('http://localhost:3000/api/auth/me')).headers.get('set-cookie')) || '';
  console.log(tokenCookie);
}
run();
