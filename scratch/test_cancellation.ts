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
  pickupLat: 23.0361,
  pickupLng: 91.5194,
  destLat: 23.8203,
  destLng: 90.4225,
  pickupAddress: "Cancellation Test Pickup",
  destAddress: "Cancellation Test Dest",
  polyline: "sample_polyline"
};

async function test() {
  const token = await signToken({
    sub: "cmo5ahkry0000hk074dvoe8mj",
    role: "USER"
  });

  // 1. Create a booking
  console.log("Creating booking...");
  const createRes = await fetch("http://localhost:3000/api/booking/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `auth_token=${token}`
    },
    body: JSON.stringify(bookingData)
  });
  const createData = await createRes.json();
  const bookingId = createData.booking?.id;

  if (!bookingId) {
    console.error("Failed to create booking:", createData);
    return;
  }
  console.log("Created Booking ID:", bookingId);

  // 2. Cancel the booking
  console.log("Cancelling booking...");
  const cancelRes = await fetch(`http://localhost:3000/api/booking/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": `auth_token=${token}`
    },
    body: JSON.stringify({ reason: "Changed my mind" })
  });
  
  console.log("Cancel Status:", cancelRes.status);
  const cancelText = await cancelRes.text();
  let cancelData;
  try {
    cancelData = JSON.parse(cancelText);
  } catch {
    console.error("Failed to parse JSON response. Body:", cancelText.substring(0, 500));
    return;
  }
  console.log("Cancel Result:", cancelData.success ? "Success" : "Failed");

  // 3. Verify status
  if (cancelData.booking?.status === "CANCELLED" && cancelData.booking?.cancelledBy === "USER") {
    console.log("✅ SUCCESS: Cancellation works as expected.");
  } else {
    console.error("❌ FAILURE: Cancellation state mismatch.");
    console.log("Final State:", cancelData.booking);
  }
}

test().catch(console.error);
