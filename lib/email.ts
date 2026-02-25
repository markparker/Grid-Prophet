import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteCodeEmail({
  to,
  groupName,
  inviteCode,
  creatorName,
}: {
  to: string
  groupName: string
  inviteCode: string
  creatorName: string
}) {
  const { data, error } = await resend.emails.send({
    from: "Grid Prophet <noreply@gridprophets.com>",
    to,
    subject: `Your Grid Prophet League: ${groupName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #fafafa; padding: 32px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #e11d48; font-size: 24px; margin: 0;">Grid Prophet</h1>
          <p style="color: #a1a1aa; font-size: 14px; margin-top: 4px;">F1 Prediction League</p>
        </div>
        <div style="background: #18181b; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">Your invite code for the league</p>
          <h2 style="color: #fafafa; font-size: 20px; margin: 0 0 16px 0;">${groupName}</h2>
          <div style="background: #0a0a0a; border: 2px dashed #e11d48; border-radius: 8px; padding: 16px; display: inline-block;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #e11d48; letter-spacing: 4px;">${inviteCode}</span>
          </div>
        </div>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; text-align: center;">
          Share this code with your friends so they can join your league. Created by <strong style="color: #fafafa;">${creatorName}</strong>.
        </p>
        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
        <p style="color: #71717a; font-size: 12px; text-align: center; margin: 0;">
          Predict pole positions, race results &amp; the World Drivers&apos; Championship.
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
