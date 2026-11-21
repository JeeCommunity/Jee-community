import crypto from "crypto";

function cleanEnvValue(raw) {
  return String(raw || "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function getRazorpayCredentials() {
  const keyId = cleanEnvValue(
    process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ""
  );
  const keySecret = cleanEnvValue(process.env.RAZORPAY_KEY_SECRET || "");
  return { keyId, keySecret };
}

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const rawPath = String(event.path || "").toLowerCase();
  const action =
    rawPath.endsWith("/config") || event.queryStringParameters?.action === "config"
      ? "config"
      : rawPath.endsWith("/create-order") ||
        event.queryStringParameters?.action === "create-order"
      ? "create-order"
      : rawPath.endsWith("/verify") || event.queryStringParameters?.action === "verify"
      ? "verify"
      : "";

  const { keyId, keySecret } = getRazorpayCredentials();

  if (action === "config" && event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: Boolean(keyId && keySecret),
        keyId: keyId || null,
        mode: keyId.startsWith("rzp_live_")
          ? "live"
          : keyId.startsWith("rzp_test_")
          ? "test"
          : null,
      }),
    };
  }

  if (action === "create-order" && event.httpMethod === "POST") {
    if (!keyId || !keySecret) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: "RAZORPAY_NOT_CONFIGURED",
          message:
            "Razorpay API keys abhi configure nahi hain. Environment variables mein RAZORPAY_KEY_ID aur RAZORPAY_KEY_SECRET add karein.",
        }),
      };
    }

    try {
      const body = JSON.parse(event.body || "{}");
      const amountInr = Number(body.amount);
      if (!Number.isFinite(amountInr) || amountInr < 10 || amountInr > 50000) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: "INVALID_AMOUNT",
            message: "Amount ₹10 se ₹50,000 ke beech hona chahiye.",
          }),
        };
      }

      const amountPaise = Math.round(amountInr * 100);
      const supporterName = String(body.supporterName || "JEE Student").slice(0, 80);
      const cups = Math.max(1, Math.min(500, Math.round(Number(body.cups) || 1)));
      const message = String(body.message || "").slice(0, 200);
      const userId = String(body.userId || "guest").slice(0, 80);
      const receipt = `chai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`.slice(0, 40);

      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes: {
            app: "JEE Community",
            type: "buy_me_a_chai",
            supporterName,
            cups: String(cups),
            message,
            userId,
          },
        }),
      });

      const rzpData = await rzpRes.json().catch(() => ({}));
      if (!rzpRes.ok || !rzpData?.id) {
        return {
          statusCode: rzpRes.status >= 400 ? rzpRes.status : 502,
          headers,
          body: JSON.stringify({
            error: "RAZORPAY_ORDER_FAILED",
            message:
              rzpData?.error?.description ||
              "Razorpay order create nahi ho paya. Kripya apni API keys verify karein.",
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: rzpData.id,
          amount: rzpData.amount,
          currency: rzpData.currency || "INR",
          keyId,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "SERVER_ERROR",
          message: err?.message || "Order create karte waqt error aa gaya.",
        }),
      };
    }
  }

  if (action === "verify" && event.httpMethod === "POST") {
    if (!keyId || !keySecret) {
      return {
        statusCode: 503,
        headers,
        body: JSON.stringify({
          error: "RAZORPAY_NOT_CONFIGURED",
          message: "Razorpay secret key server par set nahi hai.",
        }),
      };
    }

    try {
      const body = JSON.parse(event.body || "{}");
      const orderId = String(body.razorpay_order_id || "").trim();
      const paymentId = String(body.razorpay_payment_id || "").trim();
      const signature = String(body.razorpay_signature || "").trim();

      if (!orderId || !paymentId || !signature) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            verified: false,
            error: "MISSING_FIELDS",
            message: "Payment verification fields incomplete hain.",
          }),
        };
      }

      const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      const actualBuf = Buffer.from(signature, "utf8");
      const isValid =
        expectedBuf.length === actualBuf.length &&
        crypto.timingSafeEqual(expectedBuf, actualBuf);

      if (!isValid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            verified: false,
            error: "INVALID_SIGNATURE",
            message: "Payment signature verify nahi ho paya.",
          }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          verified: true,
          orderId,
          paymentId,
        }),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          verified: false,
          error: "VERIFY_ERROR",
          message: err?.message || "Payment verification failed.",
        }),
      };
    }
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: "Not Found" }),
  };
};
