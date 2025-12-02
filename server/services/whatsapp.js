let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  try {
    if (sid && token) {
      const twilio = require('twilio');
      twilioClient = twilio(sid, token);
      return twilioClient;
    }
  } catch (e) {}
  return null;
}

async function sendWhatsAppMessage(body) {
  try {
    if (process.env.WHATSAPP_ENABLED !== 'true') return false;
    const from = process.env.WHATSAPP_FROM; // e.g., whatsapp:+14155238886
    const to = process.env.WHATSAPP_TO;     // e.g., whatsapp:+234XXXXXXXXXX
    if (!from || !to) return false;
    const client = getClient();
    if (!client) return false;
    const resp = await client.messages.create({ from, to, body });
    return !!resp && !!resp.sid;
  } catch (e) {
    try { console.warn('WhatsApp send failed:', e.message); } catch {}
    return false;
  }
}

async function sendWhatsAppMessageTo(to, body) {
  try {
    if (process.env.WHATSAPP_ENABLED !== 'true') return false;
    const from = process.env.WHATSAPP_FROM;
    if (!from || !to) return false;
    const client = getClient();
    if (!client) return false;
    const resp = await client.messages.create({ from, to, body });
    return !!resp && !!resp.sid;
  } catch (e) {
    try { console.warn('WhatsApp send failed:', e.message); } catch {}
    return false;
  }
}

module.exports = { sendWhatsAppMessage, sendWhatsAppMessageTo };
