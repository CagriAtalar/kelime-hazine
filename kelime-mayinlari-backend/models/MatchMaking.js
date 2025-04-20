// models/Matchmaking.js
const mongoose = require('mongoose');

const MatchmakingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timeOption: { type: String, enum: ['2min', '5min', '12hr', '24hr'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Matchmaking', MatchmakingSchema);
