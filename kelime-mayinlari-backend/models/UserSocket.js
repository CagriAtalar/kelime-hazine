// models/UserSocket.js
const mongoose = require('mongoose');

const UserSocketSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    socketId: { type: String },
    connectedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSocket', UserSocketSchema);
