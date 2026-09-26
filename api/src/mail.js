// Single interface for Resend (primary) / ZeptoMail (budget) / console (local dev)
export async function sendMail({ to, subject, html }) {
  const provider = process.env.EMAIL_PROVIDER || 'console';

  if (provider === 'resend') {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    return resend.emails.send({ from: process.env.RESEND_FROM, to, subject, html });
  }

  if (provider === 'zeptomail') {
    const res = await fetch('https://api.zeptomail.com/v1.1/email', {
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
