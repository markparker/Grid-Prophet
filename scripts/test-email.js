import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("RESEND_API_KEY present:", !!process.env.RESEND_API_KEY);
console.log("Sending test email from noreply@gridprophets.com...");

try {
  const { data, error } = await resend.emails.send({
    from: "Grid Prophet <noreply@gridprophets.com>",
    to: "delivered@resend.dev",
    subject: "Grid Prophet - Test Email",
    html: "<h1>Test Email</h1><p>If you see this, the gridprophets.com domain is working with Resend.</p>",
  });

  if (error) {
    console.error("FAILED:", JSON.stringify(error, null, 2));
  } else {
    console.log("SUCCESS! Email ID:", data?.id);
  }
} catch (err) {
  console.error("EXCEPTION:", err.message);
}
