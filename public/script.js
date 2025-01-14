// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA0cRZC5PbgBH5voliUETIElW-GP3ZcU6k",
    authDomain: "ttt-project-2819a.firebaseapp.com",
    databaseURL: "https://ttt-project-2819a-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ttt-project-2819a",
    storageBucket: "ttt-project-2819a.firebasestorage.app",
    messagingSenderId: "48715409415",
    appId: "1:48715409415:web:e53a5f4ff5d460a7b622a2",
    measurementId: "G-NFWXDTXLW1"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database(app);

let player;
let gameId;
let board = Array(9).fill(null);
let currentPlayer = 1;
const status = document.getElementById('status');
const gameBoard = document.getElementById('gameBoard');

function createGame() {
  gameId = Math.random().toString(36).substring(2, 8);
  const gameRef = db.ref(`games/${gameId}`);
  
  // Create new game in Firebase
  gameRef.set({
    board: board,
    currentPlayer: 1,
    players: [null, null] // Track player slots
  });

  updateStatus(`Game Created! Your Game ID: ${gameId}`);
}

function joinGame() {
  gameId = document.getElementById('gameId').value;
  const gameRef = db.ref(`games/${gameId}`);

  // Join an existing game
  gameRef.once('value').then((snapshot) => {
    const game = snapshot.val();
    if (game && game.players[0] === null) {
      game.players[0] = player = 1;
      gameRef.update({ players: game.players });
      updateStatus(`You are Player 1`);
    } else if (game && game.players[1] === null) {
      game.players[1] = player = 2;
      gameRef.update({ players: game.players });
      updateStatus(`You are Player 2`);
    } else {
      updateStatus(`Game is full or doesn't exist.`);
    }
  });
}

function updateStatus(message) {
  status.textContent = message;
}

function updateBoard() {
  gameBoard.innerHTML = '';
  board.forEach((cell, index) => {
    const div = document.createElement('div');
    div.classList.add('cell');
    div.textContent = cell ? (cell === 1 ? 'X' : 'O') : '';
    div.onclick = () => makeMove(index);
    gameBoard.appendChild(div);
  });
}

function makeMove(index) {
  if (!board[index] && currentPlayer === player) {
    board[index] = player;
    const gameRef = db.ref(`games/${gameId}`);
    gameRef.update({
      board: board,
      currentPlayer: currentPlayer === 1 ? 2 : 1
    });
  }
}

// Listen for real-time updates from Firebase
const gameRef = db.ref(`games/${gameId}`);
gameRef.on('value', (snapshot) => {
  const data = snapshot.val();
  if (data) {
    board = data.board;
    currentPlayer = data.currentPlayer;
    updateBoard();
  }
});
