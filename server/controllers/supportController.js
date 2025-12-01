const SupportMessage = require('../models/SupportMessage');
const { Types } = require('mongoose');
const { sendWhatsAppMessage } = require('../services/whatsapp');

const createMessage = async (req, res) => {
  try {
    const { text, subject } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }
    const msg = await SupportMessage.create({
      userId: req.user._id,
      text: text.trim(),
      subject: subject || undefined,
      status: 'open'
    });
    try {
      const email = req.user?.email || 'Unknown user';
      const link = process.env.ADMIN_SUPPORT_URL || 'https://crypto-r29t.onrender.com/admin?tab=support';
      const body = `New support message\nFrom: ${email}\nSubject: ${subject || '-'}\nText: ${text.trim()}\nOpen: ${link}`;
      await sendWhatsAppMessage(body);
    } catch (e) {}
    return res.status(201).json(msg);
  } catch (e) {
    return res.status(500).json({ message: 'Server error creating message' });
  }
};

const getMyMessages = async (req, res) => {
  try {
    const msgs = await SupportMessage.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(msgs);
  } catch (e) {
    return res.status(500).json({ message: 'Server error fetching messages' });
  }
};

const adminList = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['open', 'pending', 'resolved'].includes(status)) {
      filter.status = status;
    }
    const msgs = await SupportMessage.find(filter).populate('userId', 'email firstName lastName').sort({ createdAt: -1 }).limit(500);
    return res.json(msgs);
  } catch (e) {
    return res.status(500).json({ message: 'Server error fetching support messages' });
  }
};

const adminUpdateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!['open', 'pending', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const msg = await SupportMessage.findByIdAndUpdate(id, { status }, { new: true });
    if (!msg) return res.status(404).json({ message: 'Not found' });
    return res.json(msg);
  } catch (e) {
    return res.status(500).json({ message: 'Server error updating status' });
  }
};

const adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body || {};
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!text || typeof text !== 'string') return res.status(400).json({ message: 'Text is required' });
    const msg = await SupportMessage.findById(id);
    if (!msg) return res.status(404).json({ message: 'Not found' });
    msg.replies.push({ sender: 'admin', text: text.trim(), timestamp: new Date() });
    if (msg.status === 'open') msg.status = 'pending';
    await msg.save();
    return res.json(msg);
  } catch (e) {
    return res.status(500).json({ message: 'Server error adding reply' });
  }
};

module.exports = { createMessage, createPublicMessage, getMyMessages, adminList, adminUpdateStatus, adminReply };
const createPublicMessage = async (req, res) => {
  try {
    const { text, subject, name, email } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Text is required' });
    }
    const msg = await SupportMessage.create({
      userId: undefined,
      text: text.trim(),
      subject: subject || undefined,
      status: 'open',
      createdAt: new Date()
    });
    try {
      const who = email ? `${email}` : (name ? `${name}` : 'Anonymous');
      const link = process.env.ADMIN_SUPPORT_URL || 'https://crypto-r29t.onrender.com/admin?tab=support';
      const body = `New public support message\nFrom: ${who}\nSubject: ${subject || '-'}\nText: ${text.trim()}\nOpen: ${link}`;
      await sendWhatsAppMessage(body);
    } catch (e) {}
    return res.status(201).json(msg);
  } catch (e) {
    return res.status(500).json({ message: 'Server error creating message' });
  }
};
