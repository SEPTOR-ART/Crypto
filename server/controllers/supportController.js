const SupportMessage = require('../models/SupportMessage');
const { Types } = require('mongoose');

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
    const msgs = await SupportMessage.find(filter).sort({ createdAt: -1 }).limit(500);
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

module.exports = { createMessage, getMyMessages, adminList, adminUpdateStatus, adminReply };
