// controllers/matchmakingController.js
const Matchmaking = require('../models/Matchmaking');
const Game = require('../models/Game');
const GameState = require('../models/GameState');
const { initializeGameState } = require('../utils/wordUtils');

exports.joinQueue = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { timeOption } = req.body;
        const validOptions = ['2min', '5min', '12hr', '24hr'];
        if (!validOptions.includes(timeOption)) {
            return res.status(400).json({ error: 'Invalid time option' });
        }
        // Check if already in queue
        const existing = await Matchmaking.findOne({ userId, timeOption });
        if (existing) {
            return res.status(400).json({ error: 'Already in matchmaking' });
        }
        // Add to queue
        const entry = await Matchmaking.create({ userId, timeOption, createdAt: new Date() });

        // Try to match
        const opponent = await Matchmaking.findOne({
            userId: { $ne: userId },
            timeOption
        });
        if (opponent) {
            // Create game record
            const game = await Game.create({
                players: [userId, opponent.userId],
                timeOption,
                status: 'active',
                startTime: new Date()
            });
            // Initialize game state
            const state = initializeGameState(game._id, userId, opponent.userId);
            await GameState.create(state);
            // Remove both from matchmaking
            await Matchmaking.deleteMany({ userId: { $in: [userId, opponent.userId] } });
            return res.json({ status: 'matched', gameId: game._id });
        }
        return res.json({ status: 'waiting' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.leaveQueue = async (req, res) => {
    try {
        const userId = req.user.userId;
        await Matchmaking.deleteMany({ userId });
        res.json({ message: 'Left matchmaking' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
