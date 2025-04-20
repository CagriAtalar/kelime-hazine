// models/UserStatistics.js
const mongoose = require('mongoose');

const UserStatisticsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    gamesLost: { type: Number, default: 0 },
    gamesDrawn: { type: Number, default: 0 }
});

module.exports = mongoose.model('UserStatistics', UserStatisticsSchema);
