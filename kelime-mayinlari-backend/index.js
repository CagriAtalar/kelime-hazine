// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const matchmakingRoutes = require('./routes/matchmakingRoutes');
const gameRoutes = require('./routes/gameRoutes');
const { Server } = require('socket.io');
const gameSocket = require('./socket/gameSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

connectDB();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/game', gameRoutes);

gameSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
