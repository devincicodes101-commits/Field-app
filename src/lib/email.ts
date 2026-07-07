import { Resend } from "resend";

export async function sendQuoteEmailToClient({
  clientName,
  clientEmail,
  jobTitle,
  portalUrl,
  companyName,
}: {
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  portalUrl: string;
  companyName?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured. Add it to .env.local and Vercel environment variables.");
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";
  const company = companyName ?? "Field Services";

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to: clientEmail,
    subject: `Your quote from ${company}: ${jobTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Hi ${clientName},</h2>
        <p style="color:#475569;line-height:1.6;">
          Thank you for your enquiry. Your quote for <strong>${jobTitle}</strong> is ready.
        </p>
        <p style="color:#475569;line-height:1.6;">
          You can view your quote, approve it, send us a message, and upload any reference photos
          using the secure link below.
        </p>
        <div style="margin:32px 0;text-align:center;">
          <a href="${portalUrl}"
             style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
            View Your Quote
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px;">
          Or copy this link into your browser:<br/>
          <a href="${portalUrl}" style="color:#2563eb;">${portalUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="color:#94a3b8;font-size:12px;">
          This link is unique to your quote. Do not share it with others.
        </p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
}

export async function sendMessageNotificationToClient({
  clientName,
  clientEmail,
  senderName,
  jobTitle,
  messageBody,
  portalUrl,
}: {
  clientName: string;
  clientEmail: string;
  senderName: string;
  jobTitle: string;
  messageBody: string;
  portalUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";
  const resend = new Resend(apiKey);

  await resend.emails.send({
    from,
    to: clientEmail,
    subject: `New message on your job: ${jobTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;">
        <h2 style="color:#1e293b;margin-bottom:8px;">Hi ${clientName},</h2>
        <p style="color:#475569;line-height:1.6;">
          You have a new message from <strong>${senderName}</strong> regarding your job
          <strong>${jobTitle}</strong>:
        </p>
        <div style="background:#f1f5f9;border-left:4px solid #2563eb;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="color:#1e293b;margin:0;line-height:1.6;">${messageBody}</p>
        </div>
        <div style="margin:32px 0;text-align:center;">
          <a href="${portalUrl}"
             style="background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
            Reply on your portal
          </a>
        </div>
        <p style="color:#94a3b8;font-size:13px;">
          Or copy this link:<br/>
          <a href="${portalUrl}" style="color:#2563eb;">${portalUrl}</a>
        </p>
      </div>
    `,
  });
}