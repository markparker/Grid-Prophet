import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  console.log("RESEND_API_KEY present:", !!process.env.RESEND_API_KEY)
  console.log("Sending test email from noreply@gridprophets.com...")

  try {
    const { data, error } = await resend.emails.send({
      from: "Grid Prophet <noreply@gridprophets.com>",
      to: "delivered@resend.dev", // Resend's test inbox -- always succeeds if config is right
      subject: "Test: Grid Prophet Invite Code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 32px; border-radius: 12px;">
          <h1 style="color: #e11d48; text-align: center;">Grid Prophet</h1>
          <p style="color: #a1a1aa; text-align: center;">This is a test email from gridprophets.com</p>
          <div style="background: #18181b; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <div style="background: #0a0a0a; border: 2px dashed #e11d48; border-radius: 8px; padding: 16px; display: inline-block;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #e11d48; letter-spacing: 4px;">TESTCODE</span>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("FAILED:", JSON.stringify(error, null, 2))
    } else {
      console.log("SUCCESS! Email ID:", data?.id)
    }
  } catch (err) {
    console.error("EXCEPTION:", err.message)
  }
}

testEmail()
