const UserSocket = require('../models/UserSocket');
const Game = require('../models/Game');
const GameState = require('../models/GameState');

// Logger importu
const logger = require('../utils/logger');

module.exports = (io) => {
    io.on('connection', (socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on('registerSocket', async ({ userId }) => {
            try {
                await UserSocket.findOneAndUpdate(
                    { userId },
                    { socketId: socket.id, connectedAt: new Date() },
                    { upsert: true }
                );
                logger.success(`Socket registered: userId=${userId}, socketId=${socket.id}`);
            } catch (error) {
                logger.error(`Register socket error: ${error.message}`);
            }
        });

        socket.on('disconnect', async () => {
            try {
                await UserSocket.deleteOne({ socketId: socket.id });
                logger.warn(`Socket disconnected and removed: ${socket.id}`);
            } catch (error) {
                logger.error(`Disconnect socket error: ${error.message}`);
            }
        });
    });
};
