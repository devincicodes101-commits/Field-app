import { Resend } from "resend";

function money(n: number) {
  return "£" + (n ?? 0).toFixed(2);
}

export async function sendQuoteEmailToClient({
  clientName,
  clientEmail,
  jobTitle,
  portalUrl,
  quoteNumber,
  address,
  netAmount,
  vatAmount,
  totalAmount,
  companyName = "Asbestos UK Teams Ltd",
  contactEmail = process.env.QUOTE_CONTACT_EMAIL ?? "sales@asbestosteams.com",
  logoUrl = process.env.QUOTE_LOGO_URL,
}: {
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  portalUrl: string;
  quoteNumber: string;
  address?: string | null;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  companyName?: string;
  contactEmail?: string;
  logoUrl?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured. Add it to .env.local and Vercel environment variables.");
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";
  const resend = new Resend(apiKey);

  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" height="48" style="display:block;border:0;" />`
    : `<span style="display:inline-block;background:#ea580c;color:#fff;font-weight:800;font-size:13px;padding:12px 14px;border-radius:10px;">AUK</span>`;

  const html = `
  <div style="background:#e9edf3;padding:28px 12px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr><td style="background:#0f172a;padding:22px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;">
            ${logo}
            <span style="color:#fff;font-weight:800;font-size:15px;padding-left:10px;">${companyName}</span>
          </td>
          <td align="right" style="color:#cbd5e1;font-weight:700;letter-spacing:.22em;font-size:15px;vertical-align:middle;">QUOTATION</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:28px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;font-weight:700;">Prepared for</div>
            <div style="font-size:16px;color:#0f172a;font-weight:800;margin-top:4px;">${clientName}</div>
            ${address ? `<div style="font-size:13px;color:#64748b;margin-top:3px;">${address}</div>` : ""}
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;font-weight:700;">Quote number</div>
            <div style="font-size:16px;color:#ea580c;font-weight:800;margin-top:4px;">${quoteNumber}</div>
          </td>
        </tr></table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:22px 0;" />
        <p style="font-size:17px;color:#0f172a;font-weight:700;margin:0 0 8px;">Hi ${clientName},</p>
        <p style="font-size:14.5px;color:#475569;line-height:1.6;margin:0 0 22px;">
          Thank you for your enquiry. Please find your personalised quotation below. You can view and accept it by clicking the button below.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="background:#f1f5f9;color:#64748b;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding:11px 14px;">Service</td>
            <td style="background:#f1f5f9;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;padding:11px 14px;text-align:right;">Qty</td>
            <td style="background:#f1f5f9;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;padding:11px 14px;text-align:right;">Total</td>
          </tr>
          <tr>
            <td style="padding:15px 14px;font-size:14.5px;color:#0f172a;border-bottom:1px solid #eef2f7;">${jobTitle}</td>
            <td style="padding:15px 14px;font-size:14.5px;color:#0f172a;text-align:right;border-bottom:1px solid #eef2f7;">1</td>
            <td style="padding:15px 14px;font-size:14.5px;color:#0f172a;text-align:right;border-bottom:1px solid #eef2f7;">${money(netAmount)}</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:14px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:14px;color:#475569;padding:6px 14px;">VAT (20%)</td>
              <td align="right" style="font-size:14px;color:#475569;padding:6px 14px;">${money(vatAmount)}</td></tr>
          <tr><td style="background:#ea580c;color:#fff;font-weight:800;font-size:16px;padding:12px 14px;border-radius:8px 0 0 8px;">Total</td>
              <td align="right" style="background:#ea580c;color:#fff;font-weight:800;font-size:16px;padding:12px 14px;border-radius:0 8px 8px 0;">${money(totalAmount)}</td></tr>
        </table>
      </td></tr>

      <tr><td align="center" style="padding:26px 28px 10px;">
        <a href="${portalUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:700;font-size:15px;">View Your Quote Online →</a>
      </td></tr>
      <tr><td align="center" style="padding:0 28px 28px;font-size:12.5px;color:#94a3b8;">
        Or copy this link:<br/><a href="${portalUrl}" style="color:#ea580c;">${portalUrl}</a>
      </td></tr>

      <tr><td style="background:#ea580c;padding:20px 28px;text-align:center;">
        <p style="color:#fff;font-size:14px;margin:0 0 4px;">Questions? Contact us at <a href="mailto:${contactEmail}" style="color:#fff;font-weight:700;">${contactEmail}</a></p>
        <p style="color:#ffe4d3;font-size:12px;margin:0;">Payment terms: Payment on completion</p>
      </td></tr>
    </table>
  </div>`;

  const { error } = await resend.emails.send({
    from,
    to: clientEmail,
    subject: `Your quote from ${companyName}: ${jobTitle}`,
    html,
  });

  if (error) throw new Error(error.message);
}

export async function sendInvoiceEmailToClient({
  clientName,
  clientEmail,
  jobTitle,
  address,
  invoiceNumber,
  netAmount,
  vatAmount,
  totalAmount,
  companyName = "Asbestos UK Teams Ltd",
  contactEmail = process.env.QUOTE_CONTACT_EMAIL ?? "sales@asbestosteams.com",
  logoUrl = process.env.QUOTE_LOGO_URL,
}: {
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  address?: string | null;
  invoiceNumber: string;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  companyName?: string;
  contactEmail?: string;
  logoUrl?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured. Add it to .env.local and Vercel environment variables.");
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com";
  const resend = new Resend(apiKey);

  const logo = logoUrl
    ? `<img src="${logoUrl}" alt="${companyName}" height="48" style="display:block;border:0;" />`
    : `<span style="display:inline-block;background:#ea580c;color:#fff;font-weight:800;font-size:13px;padding:12px 14px;border-radius:10px;">AUK</span>`;

  const html = `
  <div style="background:#e9edf3;padding:28px 12px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;">
      <tr><td style="background:#0f172a;padding:22px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;">
            ${logo}
            <span style="color:#fff;font-weight:800;font-size:15px;padding-left:10px;">${companyName}</span>
          </td>
          <td align="right" style="color:#cbd5e1;font-weight:700;letter-spacing:.22em;font-size:15px;vertical-align:middle;">INVOICE</td>
        </tr></table>
      </td></tr>

      <tr><td style="padding:28px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top;">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;font-weight:700;">Billed to</div>
            <div style="font-size:16px;color:#0f172a;font-weight:800;margin-top:4px;">${clientName}</div>
            ${address ? `<div style="font-size:13px;color:#64748b;margin-top:3px;">${address}</div>` : ""}
          </td>
          <td align="right" style="vertical-align:top;">
            <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;font-weight:700;">Invoice number</div>
            <div style="font-size:16px;color:#ea580c;font-weight:800;margin-top:4px;">${invoiceNumber}</div>
          </td>
        </tr></table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:22px 0;" />
        <p style="font-size:17px;color:#0f172a;font-weight:700;margin:0 0 8px;">Hi ${clientName},</p>
        <p style="font-size:14.5px;color:#475569;line-height:1.6;margin:0 0 22px;">
          Thank you — your work is complete. Please find your invoice below.
        </p>
      </td></tr>

      <tr><td style="padding:0 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="background:#f1f5f9;color:#64748b;font-size:11px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;padding:11px 14px;">Service</td>
            <td style="background:#f1f5f9;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;padding:11px 14px;text-align:right;">Qty</td>
            <td style="background:#f1f5f9;color:#64748b;font-size:11px;text-transform:uppercase;font-weight:700;padding:11px 14px;text-align:right;">Total</td>
          </tr>
          <tr>
            <td style="padding:15px 14px;font-size:14.5px;color:#0f172a;border-bottom:1px solid #eef2f7;">${jobTitle}</td>
            <td style="padding:15px 14px;font-size:14.5px;color:#0f172a;text-align:right;border-bottom:1px solid #eef2f7;">1</td>
            <td style="padding:15px 14px;font-size:14.5px;color:#0f172a;text-align:right;border-bottom:1px solid #eef2f7;">${money(netAmount)}</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:14px 28px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="font-size:14px;color:#475569;padding:6px 14px;">VAT (20%)</td>
              <td align="right" style="font-size:14px;color:#475569;padding:6px 14px;">${money(vatAmount)}</td></tr>
          <tr><td style="background:#ea580c;color:#fff;font-weight:800;font-size:16px;padding:12px 14px;border-radius:8px 0 0 8px;">Total due</td>
              <td align="right" style="background:#ea580c;color:#fff;font-weight:800;font-size:16px;padding:12px 14px;border-radius:0 8px 8px 0;">${money(totalAmount)}</td></tr>
        </table>
      </td></tr>

      <tr><td style="padding:26px 28px 28px;"></td></tr>

      <tr><td style="background:#ea580c;padding:20px 28px;text-align:center;">
        <p style="color:#fff;font-size:14px;margin:0 0 4px;">Questions? Contact us at <a href="mailto:${contactEmail}" style="color:#fff;font-weight:700;">${contactEmail}</a></p>
        <p style="color:#ffe4d3;font-size:12px;margin:0;">Payment terms: Payment on completion</p>
      </td></tr>
    </table>
  </div>`;

  const { error } = await resend.emails.send({
    from,
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from ${companyName}: ${jobTitle}`,
    html,
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
