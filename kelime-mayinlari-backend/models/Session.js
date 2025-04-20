// models/Session.js
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    token: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }
});

module.exports = mongoose.model('Session', SessionSchema);
