const socket = io('http://localhost:3000');
let currentGameId = null;
let playerColor = null;
const htmlPlayerColor = document.getElementById("playerColor");
const htmlGameStarted = document.getElementById("gameStarted");
const htmlButtonCreate = document.getElementById("createGame");
const htmlButtonJoin = document.getElementById("joinGame");
const htmlButtonStartGame = document.getElementById("startGame");
const htmlInfoTurn = document.getElementById("infoTurn");
const htmlPlayerTurn = document.getElementById("playerTurn");
const htmlIdGame = document.getElementById("idGame");
const htmlGameInput = document.getElementById("gameIdInput");

let config = {
    draggable: true,
    dropOffBoard: 'snapback',
    sparePieces: false,
    onDrop: handleMove,
    onDragStart: onDragStart,
    onSnapEnd: onSnapEnd
};
let board = ChessBoard('board', config);
const game = new Chess();

document.addEventListener("DOMContentLoaded", () => {
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
        htmlPlayerColor.innerHTML = `Vous avez créer une partie nommée : <b>${gameId}</b> et vous jouerez les pions : <b>${color}</b>.`;
    });

    socket.on('gameJoined', ({ gameId, color }) => {
        currentGameId = gameId;
        playerColor = color;
        htmlPlayerColor.innerHTML = `Vous avez rejoins une partie nommée <b>${gameId}</b> et vous jouez les pions : <b>${color}</b>.`;
    });

    socket.on('startGame', ({ gameId, state }) => {
        htmlPlayerColor.innerHTML = null;
        htmlButtonCreate.style.display = 'none';
        htmlButtonJoin.style.display = 'none';
        htmlGameStarted.innerHTML = `La partie a commencée ! Vous êtes les pions de couleur : <b>${playerColor === 'white' ? 'blanche' : 'noir'}</b>.`;
        htmlGameInput.style.display = 'none';
        htmlIdGame.innerHTML = `Partie en cours : <b>${gameId}</b>.`;
        htmlInfoTurn.style.display = 'block';
        htmlPlayerTurn.innerHTML = `C'est au tour des pions : <b>${playerColor === 'white' ? 'blancs' : 'noirs'}</b>.`;
        config = {
            ...config,
            orientation: playerColor === 'white' ? 'white' : 'black',
            position: 'start', 
        };
        board = ChessBoard('board', config);
        game.load(state);
        htmlButtonStartGame.style.display = 'none';
    });

    socket.on('moveMade', ({ move, state }) => {
        game.load(state);
        config = {
            ...config,
            orientation: playerColor === 'white' ? 'white' : 'black',
            position: game.fen(), 
        };
        board = ChessBoard('board', config);
        htmlPlayerTurn.innerHTML = `C'est au tour des pions : <b>${playerColor === 'white' ? 'blancs' : 'noirs'}</b>.`;
    });

    socket.on('error', ({ message }) => {
        alert(`${message}.`);
    });
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

function handleMove(source, target) {
    if (game.turn() != playerColor[0]) {
        console.log("Vous ne pouvez pas jouer, c'est au tour de l'autre joueur");
        alert("Vous ne pouvez pas jouer, c'est au tour de l'autre joueur");
        return 'snapback';
    }else if (game.turn() === playerColor[0]){
        const move = game.move({ from: source, to: target });
        if (move === null) {
            return 'snapback';
        } else {
            socket.emit('makeMove', { gameId: currentGameId, from: source, to: target });
        }
    }
}

function onDragStart (source, piece, position, orientation) {
    if (game.game_over()) return false
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onSnapEnd () {
    board.position(game.fen())
}