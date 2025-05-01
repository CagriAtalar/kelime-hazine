const Matchmaking = require('../models/Matchmaking');
const Game = require('../models/Game');
const GameState = require('../models/GameState');
const { initializeGameState, shuffleLetters } = require('../utils/wordUtils');


// Logger importu
const logger = require('../utils/logger');

exports.joinQueue = async (req, res) => {
    logger.info('POST /api/matchmaking/join - body: ' + JSON.stringify(req.body));
    try {
        const userId = req.user.userId;
        const { timeOption } = req.body;
        const validOptions = ['2min', '5min', '12hr', '24hr'];

        if (!validOptions.includes(timeOption)) {
            logger.warn(`Invalid time option: "${timeOption}"`);
            return res.status(400).json({ error: 'Invalid time option' });
        }

        const alreadyInQueue = await Matchmaking.findOne({ userId, timeOption });
        if (alreadyInQueue) {
            logger.warn(`User already in queue: userId=${userId}`);
            return res.status(400).json({ error: 'Already in matchmaking' });
        }

        await Matchmaking.create({ userId, timeOption, createdAt: new Date() });
        logger.info(`Added to matchmaking queue: userId=${userId}, timeOption=${timeOption}`);

        const opponent = await Matchmaking.findOne({
            userId: { $ne: userId },
            timeOption
        });

        if (opponent) {
            const game = await Game.create({
                players: [userId, opponent.userId],
                timeOption,
                status: 'active',
                startTime: new Date()
            });
            logger.success(`Game created: gameId=${game._id}`);

            const state = initializeGameState(game._id, userId, opponent.userId);
            try {
                const createdState = await GameState.create(state);
                logger.success(`GameState created for gameId=${game._id}`);
            } catch (gsErr) {
                logger.error(`❌ Failed to create GameState: ${gsErr.message}`);
                await Game.deleteOne({ _id: game._id });
                return res.status(500).json({ error: 'Failed to initialize game state' });
            }

            await Matchmaking.deleteMany({ userId: { $in: [userId, opponent.userId] } });
            return res.json({ status: 'matched', gameId: game._id });
        }

        return res.json({ status: 'waiting' });
    } catch (error) {
        logger.error(`Join matchmaking error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.leaveQueue = async (req, res) => {
    logger.info('POST /api/matchmaking/leave');
    try {
        const userId = req.user.userId;

        await Matchmaking.deleteMany({ userId });

        logger.success(`User left matchmaking queue: userId=${userId}`);
        res.json({ message: 'Left matchmaking' });
    } catch (error) {
        logger.error(`Leave matchmaking error: ${error.message}`);
        res.status(500).json({ error: 'Server error' });
    }
};
