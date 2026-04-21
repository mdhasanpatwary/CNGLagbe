import { checkRateLimit, resetRateLimit } from "../lib/rate-limit";

async function test() {
  const key = "test:123";
  console.log("--- Starting Rate Limit Test ---");

  // Attempt 1-5 (Allowed)
  for (let i = 1; i <= 5; i++) {
    const res = await checkRateLimit(key, 5, 60);
    console.log(`Attempt ${i}: allowed=${res.allowed}, remaining=${res.remaining}`);
  }

  // Attempt 6 (Blocked)
  const res6 = await checkRateLimit(key, 5, 60);
  console.log(`Attempt 6: allowed=${res6.allowed}, remaining=${res6.remaining}`);

  // Reset
  console.log("Resetting rate limit...");
  await resetRateLimit(key);

  // Attempt 7 (Allowed after reset)
  const res7 = await checkRateLimit(key, 5, 60);
  console.log(`Attempt after reset: allowed=${res7.allowed}, remaining=${res7.remaining}`);

  console.log("--- Test Complete ---");
}

test().catch(console.error);
