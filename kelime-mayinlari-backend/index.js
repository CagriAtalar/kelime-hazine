require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db'); // <-- düzelttik burada
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const matchmakingRoutes = require('./routes/matchmakingRoutes');
const handleSocketConnection = require('./socket/gameSocket'); // <-- destructuring kaldırıldı
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Üretimde burayı değiştirmen lazım!
    },
});
app.set('io', io);

// Connect Database
connectDB(); // <-- fonksiyon çağrıldı

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/matchmaking', matchmakingRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    handleSocketConnection(io, socket);

    socket.on('disconnect', () => {
        logger.warn(`Socket disconnected: ${socket.id}`);
    });
});

// Server Listen
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    logger.success(`Server is running on port ${PORT}`);
});
