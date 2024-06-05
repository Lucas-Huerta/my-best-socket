const socket = io('http://localhost:3000');
let currentGameId = null;
let playerColor = null;
const htmlPlayerColor = document.getElementById("playerColor");
const htmlGameStarted = document.getElementById("gameStarted");
// const game = new Chess();

document.addEventListener("DOMContentLoaded", () => {
    const board = ChessBoard('board', {
        draggable: true,
        dropOffBoard: 'trash',
        sparePieces: false,
        onDrop: handleMove
    });

   
    document.getElementById("createGame").addEventListener("click", () => {
        socket.emit('createGame');
    });

    document.getElementById("joinGame").addEventListener("click", () => {
        const gameId = document.getElementById("gameIdInput").value;
        if (gameId) {
            socket.emit('joinGame', gameId);
        }
    });

    socket.on('gameCreated', ({ gameId, color }) => {
        currentGameId = gameId;
        playerColor = color;
        htmlPlayerColor.innerHTML = `Vous avez créer une partie nommée : ${gameId} et vous jouerez les pions : ${color} .`;
    });

    socket.on('gameJoined', ({ gameId, color }) => {
        currentGameId = gameId;
        playerColor = color;
        htmlPlayerColor.innerHTML = `Vous avez rejoins une partie nommée ${gameId} les pions : ${color}.`;
    });

    socket.on('startGame', ({ gameId, state }) => {
        htmlPlayerColor.innerHTML = null;
        htmlGameStarted.innerHTML = `La partie a commencée ! Vous jouez les pions : ${playerColor}.`;
        game.load(state);
        board.position(game.fen());
    });

    socket.on('moveMade', ({ move, state }) => {
        game.load(state);
        board.position(game.fen());
    });

    socket.on('error', ({ message }) => {
        alert(`${message}.`);
    });

    function handleMove(source, target) {
        if (game.turn() !== playerColor[0]) {
            return 'snapback';
        }
        const move = game.move({ from: source, to: target });
        if (move === null) {
            return 'snapback';
        } else {
            socket.emit('makeMove', { gameId: currentGameId, from: source, to: target });
        }
    }
});


const htmlStartGame = document.getElementById("startGame");
htmlStartGame.addEventListener("click", () => {
    if (currentGameId != null) {
        socket.emit('startGame', currentGameId)
    }else{
        console.log("Vous devez rejoindre une partie avant de commencer");
        alert("Vous devez rejoindre une partie avant de commencer")
    }
})