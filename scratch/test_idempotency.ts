import { SignJWT } from "jose";

const JWT_SECRET = "super_secret_jwt_key_please_change_in_production";
const key = new TextEncoder().encode(JWT_SECRET);

async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key);
}

const bookingData = {
  pickupLat: 23.8103,
  pickupLng: 90.4125,
  destLat: 23.8203,
  destLng: 90.4225,
  pickupAddress: "Dhanmondi 32, Dhaka",
  destAddress: "Banani 11 Shopping Center",
  polyline: "sample_polyline"
};

async function test() {
  const token = await signToken({
    sub: "cmo5ahkry0000hk074dvoe8mj",
    role: "USER"
  });

  const idempotencyKey = `test-${Date.now()}`;

  const sendRequest = async () => {
    return fetch("http://localhost:3000/api/booking/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
        "Cookie": `auth_token=${token}`
      },
      body: JSON.stringify(bookingData)
    });
  };

  console.log(`Starting test with idempotency key: ${idempotencyKey}`);

  // First request
  const res1 = await sendRequest();
  const data1 = await res1.json();
  console.log("Request 1 Status:", res1.status);
  console.log("Request 1 Booking ID:", data1.booking?.id);

  if (!data1.booking?.id) {
    console.error("Failed to create booking in Request 1:", data1);
    return;
  }

  // Second request with same key
  const res2 = await sendRequest();
  const data2 = await res2.json();
  console.log("Request 2 Status:", res2.status);
  console.log("Request 2 Booking ID:", data2.booking?.id);

  if (data1.booking.id === data2.booking?.id) {
    console.log("✅ SUCCESS: Idempotency works! Returned same Booking ID.");
  } else {
    console.error("❌ FAILURE: Idempotency failed! Returned different Booking ID or error.");
    console.log("Data 2:", data2);
  }
}

test().catch(console.error);
