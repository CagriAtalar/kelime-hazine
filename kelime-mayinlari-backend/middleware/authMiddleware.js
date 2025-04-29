const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

// Logger importu
const logger = require('../utils/logger');

module.exports = async (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        logger.warn('Authorization header missing');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const session = await Session.findOne({ token });

        if (!session) {
            logger.warn('Unauthorized access attempt: session not found');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.user = decoded;
        logger.info(`Authorized request: userId=${decoded.userId}`);
        next();
    } catch (err) {
        logger.warn('Invalid token provided');
        res.status(401).json({ error: 'Invalid token' });
    }
};
