// models/GameState.js
const mongoose = require('mongoose');

const GameStateSchema = new mongoose.Schema({
    gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', unique: true },
    currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    turnStartTime: { type: Date, default: Date.now },
    letterPool: { type: [String], default: [] },
    player1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    player2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    player1Hand: { type: [String], default: [] },
    player2Hand: { type: [String], default: [] },
    player1Score: { type: Number, default: 0 },
    player2Score: { type: Number, default: 0 },
    boardState: { type: [[String]], default: Array(15).fill(Array(15).fill('')) },
    boardSpecialTiles: { type: [[String]], default: Array(15).fill(Array(15).fill('')) },
    boardMines: { type: [[String]], default: Array(15).fill(Array(15).fill('')) },
    boardRewards: { type: [[String]], default: Array(15).fill(Array(15).fill('')) },
    player1Rewards: { type: [{ type: String }], default: [] },
    player2Rewards: { type: [{ type: String }], default: [] },
    consecutivePasses: { type: Number, default: 0 },
    areaRestriction: { type: Object, default: null },
    frozenLetters: { type: Object, default: null },
    extraMovePending: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

module.exports = mongoose.model('GameState', GameStateSchema);
