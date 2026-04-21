import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * withIdempotency wraps an API handler to provide idempotency based on the X-Idempotency-Key header.
 * It stores the response body and status code for successful or client-error responses.
 */
export async function withIdempotency(
  request: Request,
  userId: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const key = request.headers.get("X-Idempotency-Key");

  // If no idempotency key provided, proceed normally
  if (!key) {
    return handler();
  }

  try {
    // 1. Check for existing processed request
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key_userId: { key, userId } },
    });

    if (existing) {
      console.log(`[Idempotency] returning cached response for key: ${key}`);
      try {
        const body = JSON.parse(existing.responseBody);
        return NextResponse.json(body, { status: existing.responseStatus });
      } catch (parseError) {
        console.error("[Idempotency] Failed to parse cached response body", parseError);
        // Fallback: if parsing fails, we proceed with handler
      }
    }

    // 2. Execute the actual request handler
    const response = await handler();

    // 3. Store result if it's not a server error (5xx)
    // We only cache deterministic results. 5xx might be transient.
    if (response.status < 500) {
      try {
        // We need to read the body of the response to store it.
        // Since NextResponse doesn't easily expose the raw body as text after creation 
        // without consuming it, we rely on the handler returning a response we can read.
        // Note: This works for standard JSON responses.
        const clonedResponse = response.clone();
        const bodyText = await clonedResponse.text();

        await prisma.idempotencyKey.upsert({
          where: { key_userId: { key, userId } },
          create: {
            key,
            userId,
            responseBody: bodyText,
            responseStatus: response.status,
          },
          update: {
            responseBody: bodyText,
            responseStatus: response.status,
          },
        });
      } catch (storeError) {
        console.error("[Idempotency] Failed to store response", storeError);
      }
    }

    return response;
  } catch (error) {
    console.error("[Idempotency] Unexpected error in wrapper", error);
    return NextResponse.json({ error: "Internal Server Error (Idempotency)" }, { status: 500 });
  }
}
