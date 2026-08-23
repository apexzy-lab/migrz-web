export type PortalEmailConfig = { token?: string; from?: string; fromName?: string };

export async function sendPortalEmail(config: PortalEmailConfig, to: string, subject: string, textbody: string, htmlbody: string) {
  const token = (config.token || "").trim().replace(/^zoho-enczapikey\s+/i, "");
  if (!token) throw new Error("ZEPTOMAIL_NOT_CONFIGURED");
  const response = await fetch("https://api.zeptomail.com/v1.1/email", {
    method: "POST",
    headers: { Authorization: `Zoho-enczapikey ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: { address: config.from || "comms@migrzz.com", name: config.fromName || "Migrz" },
      to: [{ email_address: { address: to } }],
      subject,
      textbody,
      htmlbody,
    }),
  });
  if (!response.ok) {
    const providerMessage = (await response.text()).slice(0, 500).replace(/[\r\n]+/g, " ");
    console.error("ZeptoMail rejected a transactional email", { status: response.status, providerMessage });
    throw new Error(`ZEPTOMAIL_${response.status}`);
  }
}

export function reviewCompletedEmail(publicId: string, name = "") {
  const greeting = name.trim() ? `Hello ${name.trim()},` : "Hello,";
  const portalUrl = "https://apply.migrzz.com/";
  return {
    subject: `Your Migrz assessment review is complete — ${publicId}`,
    text: `${greeting}\n\nThe professional review of your Migrz assessment ${publicId} is complete. Sign in to your secure portal to review the updated status and request your assessment call. Calls can be scheduled for up to 60 minutes.\n\n${portalUrl}\n\nMigrz`,
    html: `<div style="font-family:Arial,sans-serif;color:#172333;max-width:600px;margin:auto"><h1 style="color:#10233f">MIGRZ</h1><p>${escapeHtml(greeting)}</p><h2>Your assessment review is complete.</h2><p>The professional review of assessment <strong>${escapeHtml(publicId)}</strong> is complete.</p><p>Sign in to your secure portal to review the updated status and request your assessment call. Calls can be scheduled for up to 60 minutes.</p><p><a href="${portalUrl}" style="display:inline-block;padding:13px 18px;background:#10233f;color:#fff;text-decoration:none;border-radius:6px">Open your secure portal</a></p><p style="color:#66788c;font-size:12px">This email is a service notification about your paid Migrz assessment.</p></div>`,
  };
}

export function appointmentEmail(publicId: string, heading: string, detail: string) {
  const portalUrl = "https://apply.migrzz.com/";
  return {
    subject: `${heading} — ${publicId}`,
    text: `${heading}\n\n${detail}\n\nManage the appointment in your secure Migrz portal: ${portalUrl}`,
    html: `<div style="font-family:Arial,sans-serif;color:#172333;max-width:600px;margin:auto"><h1 style="color:#10233f">MIGRZ</h1><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(detail)}</p><p><a href="${portalUrl}" style="display:inline-block;padding:13px 18px;background:#10233f;color:#fff;text-decoration:none;border-radius:6px">Open your secure portal</a></p></div>`,
  };
}

export function callCompletedEmail(applicationPublicId: string, appointmentPublicId: string, nextSteps = "") {
  const portalUrl = "https://apply.migrzz.com/";
  const detail = nextSteps.trim() || "Your Migrz adviser is preparing the written follow-up and any agreed next actions. You can follow progress in your secure portal.";
  return {
    subject: `Your Migrz review call is complete — ${applicationPublicId}`,
    text: `Your Migrz review call is complete.\n\nAssessment: ${applicationPublicId}\nCall reference: ${appointmentPublicId}\n\n${detail}\n\nView your next steps: ${portalUrl}`,
    html: `<div style="font-family:Arial,sans-serif;color:#172333;max-width:600px;margin:auto"><h1 style="color:#10233f">MIGRZ</h1><h2>Your review call is complete.</h2><p>Thank you for meeting with the Migrz team.</p><p><strong>Assessment:</strong> ${escapeHtml(applicationPublicId)}<br><strong>Call reference:</strong> ${escapeHtml(appointmentPublicId)}</p><p>${escapeHtml(detail)}</p><p><a href="${portalUrl}" style="display:inline-block;padding:13px 18px;background:#10233f;color:#fff;text-decoration:none;border-radius:6px">View your next steps</a></p><p style="color:#66788c;font-size:12px">This is a service notification about your Migrz assessment.</p></div>`,
  };
}

export function serviceUpdateEmail(subject: string, heading: string, detail: string, action = "Open your secure portal") {
  const portalUrl = "https://apply.migrzz.com/";
  return {
    subject,
    text: `${heading}\n\n${detail}\n\n${action}: ${portalUrl}\n\nMigrz`,
    html: `<div style="font-family:Arial,sans-serif;color:#172333;max-width:600px;margin:auto"><h1 style="color:#10233f">MIGRZ</h1><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(detail)}</p><p><a href="${portalUrl}" style="display:inline-block;padding:13px 18px;background:#10233f;color:#fff;text-decoration:none;border-radius:6px">${escapeHtml(action)}</a></p><p style="color:#66788c;font-size:12px">This is a private service update about your Migrz assessment.</p></div>`,
  };
}

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character); }
