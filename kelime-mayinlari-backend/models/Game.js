// models/Game.js
const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    timeOption: { type: String, enum: ['2min', '5min', '12hr', '24hr'] },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
    winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    endReason: { type: String, enum: ['normal', 'resignation', 'timeout', 'first_move_timeout', 'inactivity'], default: 'normal' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: null }
});

module.exports = mongoose.model('Game', GameSchema);
