import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        }
})
app.use(cors())

let games = {}; 

io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('createGame', () => {
        const gameId = generateGameId();
        const chess = new Chess();
        games[gameId] = { chess, players: [socket.id], turn: 'white' };

        socket.join(gameId);
        socket.emit('gameCreated', { gameId, color: 'white' });
        console.log(`Game created with ID: ${gameId}`);
    });

    socket.on('joinGame', (gameId) => {
        const game = games[gameId];
        if (game && game.players.length < 2) {
            game.players.push(socket.id);
            socket.join(gameId);
            const color = game.players[0] === socket.id ? 'white' : 'black';
            socket.emit('gameJoined', { gameId, color });
            // io.to(gameId).emit('startGame', { gameId, state: game.chess.fen() });
            console.log(`Player joined game ID: ${gameId}`);
        } else {
            console.log('Game is full or does not exist');
            socket.emit('error', { message: 'La partie est pleine ou non existante' });
        }
    });

    socket.on('makeMove', ({ gameId, from, to }) => {
        const game = games[gameId];
        if (game) {
            const chess = game.chess;
            const move = chess.move({ from, to });
            if (move) {
                io.to(gameId).emit('moveMade', { move, state: chess.fen() });
                game.turn = game.turn === 'white' ? 'black' : 'white';
                console.log(`Move made in game ID: ${gameId}: ${from} -> ${to}`);
            } else {
                socket.emit('invalidMove', { message: 'Invalid move' });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected', socket.id);
        // Clean up any games that the disconnected client was part of
        for (const gameId in games) {
            const game = games[gameId];
            game.players = game.players.filter(player => player !== socket.id);
            if (game.players.length === 0) {
                delete games[gameId];
                console.log(`Game ID: ${gameId} deleted`);
            }
        }
    });

socket.on('startGame', (gameId) => {
    const game = games[gameId];
    if (game && game.players.length === 2) {
        io.to(gameId).emit('startGame', { gameId, state: game.chess.fen() });
        console.log(`Game ID: ${gameId} started`);
    } else {
        console.log('Game does not exist or is not full');
        socket.emit('error', { message: 'La partie n\'existe pas ou n\'est pas pleine' });
    }
})
});

const generateGameId = () => {
    return Math.random().toString(36).substr(2, 9);
};

const PORT = 3000
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});