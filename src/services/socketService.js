const { Server } = require('socket.io');

let ioInstance;
const connectedUsers = {};

function handleConnection(socket) {
    console.log('New socket connection established:', socket.id);

    // Authenticate user and map userId to socketId
    socket.on('authenticate', (userId) => {
        if (userId && socket.id) {
            connectedUsers[userId] = socket.id;
            console.log(`User with ID: ${userId} authenticated with socket ID: ${socket.id}`);
        } else {
            console.error('Authentication failed: userId or socket.id is missing');
        }
    });

    // Handle disconnections
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove disconnected user from connectedUsers
        const userId = Object.keys(connectedUsers).find(id => connectedUsers[id] === socket.id);
        if (userId) {
            delete connectedUsers[userId];
            console.log(`User with ID: ${userId} disconnected`);
        }
    });
}

// Initialize Socket.IO
function initializeSocket(server) {
    ioInstance = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT'],
            credentials: true,
        },
    });

    ioInstance.on('connection', handleConnection);
}

module.exports = {
    initializeSocket,
    ioInstance,
    connectedUsers
};