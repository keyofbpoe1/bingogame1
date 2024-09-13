const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('setUsername', (username) => {
    users.set(socket.id, username);
    io.emit('userJoined', username);
  });

  socket.on('chatMessage', (msg) => {
    const username = users.get(socket.id);
    io.emit('chatMessage', { username, message: msg });
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    users.delete(socket.id);
    io.emit('userLeft', username);
    console.log('User disconnected');
  });

  socket.on('winnerMessage', (message) => {
    io.emit('winnerMessage', message);
  });

  socket.on('bingo', (winnerName) => {
    io.emit('gameEnded', winnerName);
  });

  socket.on('winGame', (data) => {
    const { username, winningValues } = data;
    console.log('Win game data:', data);
    io.emit('gameEnded', { winnerName: username, winningValues });
    io.emit('winnerAnnouncement', `${username} has won the game!`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
