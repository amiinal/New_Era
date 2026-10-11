// Single interface for Resend (primary) / ZeptoMail (budget) / console (local dev)
// Template mode (OTP): pass { template: true, merge } and set
// ZEPTOMAIL_TEMPLATE_KEY — the template owns subject/body, merge fills its
// variables. Falls back to raw html when no key is configured.
export async function sendMail({ to, subject, html, template, merge }) {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  if (provider === 'resend') {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({ from: process.env.RESEND_FROM, to, subject, html });
  }

  if (provider === 'zeptomail') {
    // Zoho CPaaS endpoint (new). Override per data-center if Zoho tells
    // you otherwise, e.g. https://cpaas.zoho.eu/v1.1/email
    const url = process.env.ZEPTOMAIL_URL || 'https://cpaas.zoho.com/v1.1/email';
    const auth = process.env.ZEPTOMAIL_TOKEN || '';
    const from = { address: process.env.ZEPTOMAIL_FROM };
    if (template && process.env.ZEPTOMAIL_TEMPLATE_KEY) {
      const tUrl = url.replace(/\/email\/?$/, '') + '/email/template';
      const res = await fetch(tUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
        body: JSON.stringify({
          from: { ...from, name: 'New Era' },
          to: [{ email_address: { address: to } }],
          template_key: process.env.ZEPTOMAIL_TEMPLATE_KEY,
          merge_info: merge || {},
        }),
      });
      if (!res.ok) throw new Error(`zeptomail-template ${res.status}`);
      return res.json();
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.ZEPTOMAIL_TOKEN || '',
      },
      body: JSON.stringify({
        from: { address: process.env.ZEPTOMAIL_FROM },
        to: [{ email_address: { address: to } }],
        subject,
        htmlbody: html,
      }),
    });
    if (!res.ok) throw new Error(`zeptomail ${res.status}`);
    return res.json();
  }

  console.log(`[mail:console] to=${to} subject=${subject}`);
  return { mocked: true };
}
