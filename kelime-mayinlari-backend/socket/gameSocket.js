// socket/gameSocket.js
const UserSocket = require('../models/UserSocket');
const Game = require('../models/Game');
const GameState = require('../models/GameState');

module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('registerSocket', async ({ userId }) => {
            await UserSocket.findOneAndUpdate(
                { userId },
                { socketId: socket.id, connectedAt: new Date() },
                { upsert: true }
            );
        });

        socket.on('disconnect', async () => {
            await UserSocket.deleteOne({ socketId: socket.id });
        });
    });
};

// elsewhere in controllers after state changes:
// emit to both players:
// const sockets = await UserSocket.find({ userId: { $in: [p1, p2] } });
// sockets.forEach(s => io.to(s.socketId).emit('game_state_updated', payload));
