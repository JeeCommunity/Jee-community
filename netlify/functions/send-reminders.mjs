import nodemailer from "nodemailer";

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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { subject, message, actionUrl, actionText, testEmail, emails } = body;

    if (!subject || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Subject and message are required." }),
      };
    }

    const rawResendKey =
      process.env.RESEND_API_KEY ||
      process.env.VITE_RESEND_API_KEY ||
      process.env.RESEND_KEY ||
      "";
    const resendApiKey = rawResendKey.replace(/^["']|["']$/g, "").trim();

    const rawResendFrom =
      process.env.RESEND_FROM_EMAIL ||
      process.env.VITE_RESEND_FROM_EMAIL ||
      "JEE Community <onboarding@resend.dev>";
    const cleanedFrom =
      rawResendFrom.replace(/^["']|["']$/g, "").trim() ||
      "JEE Community <onboarding@resend.dev>";

    const gmailUser = (
      process.env.GMAIL_USER ||
      (cleanedFrom.toLowerCase().includes("@gmail.com")
        ? cleanedFrom.replace(/.*<([^>]+)>.*/, "$1").trim()
        : "jeecommunity.updates@gmail.com")
    )
      .replace(/^["']|["']$/g, "")
      .trim();
    const gmailAppPassword = (process.env.GMAIL_APP_PASSWORD || "")
      .replace(/^["']|["']$/g, "")
      .replace(/[\s\u00A0-]/g, "");

    // Resend does not allow @gmail.com as the "from" domain; fallback to onboarding@resend.dev and set reply_to
    const safeFrom = cleanedFrom.toLowerCase().includes("@gmail.com")
      ? "JEE Community <onboarding@resend.dev>"
      : cleanedFrom;
    const resendFrom = safeFrom.includes("<")
      ? safeFrom
      : `JEE Community <${safeFrom}>`;

    if (!resendApiKey && !gmailAppPassword) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error:
            "Neither RESEND_API_KEY nor GMAIL_APP_PASSWORD is configured in Netlify Environment Variables.",
        }),
      };
    }

    const isValidRecipientEmail = (raw) => {
      const email = String(raw || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
      const domain = email.split("@")[1] || "";
      const blockedDomains = [
        "example.com",
        "example.org",
        "example.net",
        "test.com",
        "localhost",
        "invalid",
        "fake.com",
        "dummy.com",
      ];
      return !blockedDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
    };

    let recipientEmails = [];
    if (testEmail) {
      recipientEmails = [String(testEmail).trim().toLowerCase()].filter(isValidRecipientEmail);
    } else if (emails && Array.isArray(emails) && emails.length > 0) {
      recipientEmails = [
        ...new Set(
          emails
            .map((e) => String(e || "").trim().toLowerCase())
            .filter(isValidRecipientEmail)
        ),
      ];
    }

    if (!recipientEmails.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "No valid recipient emails found." }),
      };
    }

    const targetUrl = actionUrl || "https://jee-community.netlify.app";
    const targetText = actionText || "Open JEE Community App 🚀";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 20px 10px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 6px 14px; border-radius: 9999px; margin-bottom: 12px;">
              <span style="color: #ffffff; font-size: 13px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">🎓 IIT-JEE Aspirants Community</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">JEE Community</h1>
            <p style="color: #e0e7ff; margin: 6px 0 0; font-size: 14px;">Free Doubt Solving • Notes Hub • Live Study Groups</p>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px 28px; color: #1e293b; line-height: 1.7; font-size: 15px;">
            <div style="white-space: pre-wrap; word-break: break-word;">${String(message).replace(/\n/g, "<br>")}</div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 36px 0 20px;">
              <a href="${targetUrl}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                ${targetText}
              </a>
            </div>

            <div style="text-align: center; margin-top: 10px;">
              <a href="${targetUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">${targetUrl}</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 6px 0;">You received this update because you are a verified member of the JEE Community platform.</p>
            <p style="margin: 0;">© ${new Date().getFullYear()} JEE Community. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    const sendSingleResend = async (toAddress, customFrom) => {
      const sender = customFrom || resendFrom;
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [toAddress],
          reply_to: gmailUser,
          subject,
          html: htmlContent,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (
        !response.ok &&
        sender !== "JEE Community <onboarding@resend.dev>" &&
        String(data?.message || "").toLowerCase().includes("domain")
      ) {
        return sendSingleResend(toAddress, "JEE Community <onboarding@resend.dev>");
      }
      return { ok: response.ok, status: response.status, data };
    };

    // 1. Try Resend first if RESEND_API_KEY is present
    if (resendApiKey) {
      if (testEmail) {
        const result = await sendSingleResend(testEmail);
        if (result.ok) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              provider: "resend",
              message: `Test email sent via Resend to ${testEmail}!`,
              id: result.data?.id,
            }),
          };
        }

        const errMsg = result.data?.message || result.data?.error || "Resend API error";
        const matchOwner = String(errMsg).match(/\(([^)]+@[^)]+)\)/);
        if (matchOwner && matchOwner[1] && matchOwner[1].toLowerCase() !== testEmail.toLowerCase()) {
          const retryOwner = await sendSingleResend(matchOwner[1]);
          if (retryOwner.ok) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                provider: "resend",
                message: `Test email sent via Resend to your Resend-registered email (${matchOwner[1]})!`,
                id: retryOwner.data?.id,
              }),
            };
          }
        }

        if (!gmailAppPassword) {
          return {
            statusCode: result.status || 500,
            headers,
            body: JSON.stringify({ error: `Resend Error: ${errMsg}` }),
          };
        }
      } else {
        // Bulk broadcast via Resend Batch API (chunks of 100)
        let totalSent = 0;
        let domainRestrictionMessage = "";
        let activeSender = resendFrom;

        for (let i = 0; i < recipientEmails.length; i += 100) {
          const chunk = recipientEmails.slice(i, i + 100);
          const batchPayload = chunk.map((emailAddr) => ({
            from: activeSender,
            to: [emailAddr],
            reply_to: gmailUser,
            subject,
            html: htmlContent,
          }));

          let batchRes = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(batchPayload),
          });
          let batchData = await batchRes.json().catch(() => ({}));

          if (
            !batchRes.ok &&
            activeSender !== "JEE Community <onboarding@resend.dev>" &&
            String(batchData?.message || "").toLowerCase().includes("domain")
          ) {
            activeSender = "JEE Community <onboarding@resend.dev>";
            const retryPayload = chunk.map((emailAddr) => ({
              from: activeSender,
              to: [emailAddr],
              reply_to: gmailUser,
              subject,
              html: htmlContent,
            }));
            batchRes = await fetch("https://api.resend.com/emails/batch", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(retryPayload),
            });
            batchData = await batchRes.json().catch(() => ({}));
          }

          if (batchRes.ok) {
            totalSent += chunk.length;
          } else {
            const msg = String(batchData?.message || batchData?.error || "");
            if (
              msg.toLowerCase().includes("only send testing emails to your own email") ||
              msg.toLowerCase().includes("testing email address")
            ) {
              domainRestrictionMessage = msg;
              if (!gmailAppPassword) {
                const matchOwner = msg.match(/\(([^)]+@[^)]+)\)/);
                if (matchOwner && matchOwner[1]) {
                  const singleRes = await sendSingleResend(matchOwner[1], activeSender);
                  if (singleRes.ok) totalSent += 1;
                }
              }
              break;
            } else if (!gmailAppPassword) {
              return {
                statusCode: batchRes.status || 500,
                headers,
                body: JSON.stringify({
                  error: `Resend Error: ${msg || "Failed to send batch emails"}`,
                }),
              };
            }
          }
        }

        if (totalSent > 0 && !domainRestrictionMessage) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              provider: "resend",
              sentCount: totalSent,
              message: `Resend broadcast sent successfully to ${totalSent} users! 🚀`,
            }),
          };
        }

        if (domainRestrictionMessage && !gmailAppPassword) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              provider: "resend",
              sentCount: totalSent,
              warning: domainRestrictionMessage,
              message:
                totalSent > 0
                  ? `Resend se aapke registered email par mail bhej diya gaya! (Sabhi ${recipientEmails.length} students ko bhejne ke liye upar 'Open in Gmail App' use karein ya GMAIL_APP_PASSWORD add karein).`
                  : `Resend Free Mode: Bina custom domain verify kiye Resend sirf aapke khud ke email par bhejta hai. Sabhi ${recipientEmails.length} students ko bhejne ke liye upar 'Open in Gmail App 🚀' button dabaiye!`,
            }),
          };
        }
      }
    }

    // 2. Fallback or Direct Path: Gmail SMTP via Nodemailer
    if (gmailAppPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailAppPassword,
        },
      });

      if (testEmail) {
        await transporter.sendMail({
          from: `"JEE Community" <${gmailUser}>`,
          to: testEmail,
          subject,
          html: htmlContent,
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            provider: "gmail",
            message: `Test email sent via Gmail (${gmailUser}) to ${testEmail}!`,
          }),
        };
      }

      // Send bulk via BCC chunks of 50 so it completes well within Netlify's 10s serverless timeout
      let sentCount = 0;
      for (let i = 0; i < recipientEmails.length; i += 50) {
        const chunk = recipientEmails.slice(i, i + 50);
        await transporter.sendMail({
          from: `"JEE Community" <${gmailUser}>`,
          to: gmailUser,
          bcc: chunk.join(", "),
          subject,
          html: htmlContent,
        });
        sentCount += chunk.length;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          provider: "gmail",
          sentCount,
          message: `Broadcast sent to ${sentCount} students via Gmail (${gmailUser})! 🚀`,
        }),
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Could not send emails." }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to send emails: " + (err?.message || String(err)) }),
    };
  }
};
