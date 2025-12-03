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
    try { console.warn('Twilio client not initialized: missing SID/TOKEN'); } catch {}
  } catch (e) {}
  return null;
}

async function sendWhatsAppMessage(body) {
  try {
    if (process.env.WHATSAPP_ENABLED !== 'true') { try { console.warn('WhatsApp disabled via env (WHATSAPP_ENABLED)'); } catch {} ; return false; }
    const from = process.env.WHATSAPP_FROM; // e.g., whatsapp:+14155238886
    const to = process.env.WHATSAPP_TO;     // e.g., whatsapp:+234XXXXXXXXXX
    if (!from || !to) { try { console.warn('WhatsApp missing FROM/TO env (WHATSAPP_FROM/WHATSAPP_TO)'); } catch {} ; return false; }
    const client = getClient();
    if (!client) { try { console.warn('Twilio client not available'); } catch {} ; return false; }
    const resp = await client.messages.create({ from, to, body });
    try { console.log('WhatsApp message sent:', resp?.sid || 'no sid'); } catch {}
    return !!resp && !!resp.sid;
  } catch (e) {
    try { console.warn('WhatsApp send failed:', e.message || e.code || e); } catch {}
    return false;
  }
}

async function sendWhatsAppMessageTo(to, body) {
  try {
    if (process.env.WHATSAPP_ENABLED !== 'true') { try { console.warn('WhatsApp disabled via env (WHATSAPP_ENABLED)'); } catch {} ; return false; }
    const from = process.env.WHATSAPP_FROM;
    if (!from || !to) { try { console.warn('WhatsApp missing FROM/TO env (WHATSAPP_FROM or recipient)'); } catch {} ; return false; }
    const client = getClient();
    if (!client) { try { console.warn('Twilio client not available'); } catch {} ; return false; }
    const resp = await client.messages.create({ from, to, body });
    try { console.log('WhatsApp message sent:', resp?.sid || 'no sid'); } catch {}
    return !!resp && !!resp.sid;
  } catch (e) {
    try { console.warn('WhatsApp send failed:', e.message || e.code || e); } catch {}
    return false;
  }
}

module.exports = { sendWhatsAppMessage, sendWhatsAppMessageTo };
