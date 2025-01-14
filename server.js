const WebSocket = require('ws');

// Membuat server WebSocket yang mendengarkan pada port yang ditentukan
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let games = {}; // Menyimpan informasi permainan yang sedang berlangsung

// Fungsi untuk mengirimkan pembaruan kepada kedua pemain
function broadcast(gameId, message) {
  const game = games[gameId];
  if (game) {
    game.players.forEach(player => {
      player.send(JSON.stringify(message));
    });
  }
}

// Menangani koneksi WebSocket
wss.on('connection', ws => {
  let currentGameId = null;
  let currentPlayer = null;

  // Menunggu pesan dari pemain
  ws.on('message', message => {
    const data = JSON.parse(message);

    // Jika pemain baru ingin membuat room
    if (data.type === 'createRoom') {
      const gameId = data.gameId;
      if (!games[gameId]) {
        games[gameId] = { board: Array(9).fill(null), players: [] };
        ws.send(JSON.stringify({ type: 'roomCreated', gameId }));
      } else {
        ws.send(JSON.stringify({ type: 'roomError', message: 'Room already exists' }));
      }
    }

    // Jika pemain ingin bergabung ke room yang sudah ada
    if (data.type === 'joinRoom') {
      const gameId = data.gameId;
      if (games[gameId] && games[gameId].players.length < 2) {
        currentGameId = gameId;
        currentPlayer = games[gameId].players.length === 0 ? 'X' : 'O';
        games[gameId].players.push(ws);
        ws.send(JSON.stringify({ type: 'start', player: currentPlayer }));

        // Kirim pembaruan papan ke kedua pemain
        broadcast(gameId, { type: 'update', board: games[gameId].board });
      } else {
        ws.send(JSON.stringify({ type: 'roomError', message: 'Room is full or does not exist' }));
      }
    }

    // Pemain melakukan gerakan
    if (data.type === 'move' && currentGameId) {
      const game = games[currentGameId];
      const { index } = data;

      // Pastikan indeks valid dan tempat belum terisi
      if (game.board[index] === null) {
        game.board[index] = currentPlayer;
        broadcast(currentGameId, { type: 'update', board: game.board });

        // Cek kondisi menang
        if (checkWin(game.board)) {
          broadcast(currentGameId, { type: 'win', winner: currentPlayer });
        }
      }
    }
  });

  // Menangani koneksi terputus
  ws.on('close', () => {
    if (currentGameId) {
      const game = games[currentGameId];
      game.players = game.players.filter(player => player !== ws);
    }
  });
});

// Fungsi untuk mengecek kondisi menang
function checkWin(board) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (let pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return true;
    }
  }
  return false;
}

console.log('Server running...');
