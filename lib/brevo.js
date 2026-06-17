const BREVO_API = 'https://api.brevo.com/v3/smtp/email';

function senderInfo() {
  const email = process.env.BREVO_SENDER_EMAIL;
  if (!email) throw new Error('BREVO_SENDER_EMAIL is not set');
  return { name: 'Bibelstunde', email };
}

function appUrl() {
  return process.env.APP_BASE_URL || 'https://bibelstunde.vercel.app';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function templateDE({ barName, password, loginUrl }) {
  const subject = 'Dein Bibelstunde-Zugang';
  const text = `Hi,

danke für deinen Kauf! Hier sind deine Zugangsdaten für Bibelstunde:

Zugangscode:  ${barName}
Passwort:     ${password}

Login: ${loginUrl}

Tipp: Auf dem Tablet die Login-Seite einmal aufrufen, einloggen, dann zum Home-Bildschirm hinzufügen — fertig fürs Setup hinter der Theke.

Bei Fragen einfach auf diese Mail antworten.

Prost,
Florian`;

  const html = `<!doctype html><html lang="de"><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;background:#f6f6f6;padding:24px;color:#222;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;">
    <h1 style="font-family:'Montserrat',sans-serif;font-size:22px;margin:0 0 8px;color:#c9a86a;">Bibelstunde</h1>
    <p style="margin:0 0 18px;color:#666;font-size:14px;">Dein Zugang ist da.</p>
    <p>Hi,</p>
    <p>danke für deinen Kauf! Hier sind deine Zugangsdaten:</p>
    <table style="width:100%;border-collapse:collapse;background:#0b0b0b;color:#fff;border-radius:10px;margin:14px 0;">
      <tr><td style="padding:14px 18px;border-bottom:1px solid #222;width:120px;color:#9e9e9e;font-size:13px;">Zugangscode</td><td style="padding:14px 18px;border-bottom:1px solid #222;font-family:monospace;font-size:16px;">${escapeHtml(barName)}</td></tr>
      <tr><td style="padding:14px 18px;color:#9e9e9e;font-size:13px;">Passwort</td><td style="padding:14px 18px;font-family:monospace;font-size:16px;">${escapeHtml(password)}</td></tr>
    </table>
    <p style="margin:18px 0 24px;">
      <a href="${loginUrl}" style="display:inline-block;background:#c9a86a;color:#111;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Zum Login</a>
    </p>
    <p style="color:#666;font-size:13px;line-height:1.6;">Tipp: Auf dem Tablet die Login-Seite einmal aufrufen, einloggen, dann zum Home-Bildschirm hinzufügen — fertig fürs Setup hinter der Theke.</p>
    <p style="color:#666;font-size:13px;">Bei Fragen einfach auf diese Mail antworten.</p>
    <p style="margin-top:24px;">Prost,<br/>Florian</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

function templateEN({ barName, password, loginUrl }) {
  const subject = 'Your Bibelstunde access';
  const text = `Hi,

thanks for your purchase! Here are your Bibelstunde credentials:

Access code:  ${barName}
Password:     ${password}

Login: ${loginUrl}

Tip: Open the login page on your tablet once, log in, then add it to the home screen — done for the setup behind the counter.

Reply to this email if you have any questions.

Cheers,
Florian`;

  const html = `<!doctype html><html lang="en"><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,sans-serif;background:#f6f6f6;padding:24px;color:#222;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:32px;">
    <h1 style="font-family:'Montserrat',sans-serif;font-size:22px;margin:0 0 8px;color:#c9a86a;">Bibelstunde</h1>
    <p style="margin:0 0 18px;color:#666;font-size:14px;">Your access is here.</p>
    <p>Hi,</p>
    <p>thanks for your purchase! Here are your credentials:</p>
    <table style="width:100%;border-collapse:collapse;background:#0b0b0b;color:#fff;border-radius:10px;margin:14px 0;">
      <tr><td style="padding:14px 18px;border-bottom:1px solid #222;width:120px;color:#9e9e9e;font-size:13px;">Access code</td><td style="padding:14px 18px;border-bottom:1px solid #222;font-family:monospace;font-size:16px;">${escapeHtml(barName)}</td></tr>
      <tr><td style="padding:14px 18px;color:#9e9e9e;font-size:13px;">Password</td><td style="padding:14px 18px;font-family:monospace;font-size:16px;">${escapeHtml(password)}</td></tr>
    </table>
    <p style="margin:18px 0 24px;">
      <a href="${loginUrl}" style="display:inline-block;background:#c9a86a;color:#111;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Open login</a>
    </p>
    <p style="color:#666;font-size:13px;line-height:1.6;">Tip: Open the login page on your tablet once, log in, then add it to the home screen — done for the setup behind the counter.</p>
    <p style="color:#666;font-size:13px;">Reply to this email if you have any questions.</p>
    <p style="margin-top:24px;">Cheers,<br/>Florian</p>
  </div>
</body></html>`;

  return { subject, text, html };
}

export async function sendCredentialsMail({ barName, password, email, locale = 'de' }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error('BREVO_API_KEY is not set');

  const loginUrl = `${appUrl()}/app`;
  const tmpl = locale === 'en'
    ? templateEN({ barName, password, loginUrl })
    : templateDE({ barName, password, loginUrl });

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: senderInfo(),
      to: [{ email }],
      subject: tmpl.subject,
      htmlContent: tmpl.html,
      textContent: tmpl.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}
