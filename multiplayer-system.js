// ===========================================
// MULTIPLAYER SYSTEM - ROOMS & GAME SYNC
// ===========================================

// Configuration
const WORKER_URL = 'https://bingo.aarifbabu8948.workers.dev'; // REPLACE WITH YOUR WORKER URL

// State
let currentRoom = null;
let roomUpdateInterval = null;
let availableRooms = [];

// ===========================================
// ADD MULTIPLAYER UI
// ===========================================
function addMultiplayerUI() {
  const gameContainer = document.querySelector('.game-container');
  
  const multiplayerHTML = `
    <div id="multiplayer-panel" style="
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid rgba(255,255,255,0.1);
      display: none;
    ">
      <!-- Room List / Create Room View -->
      <div id="lobby-view">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="color: white; margin: 0;">Game Rooms</h3>
          <button id="create-room-btn" class="multiplayer-btn" style="
            background: #2ecc71;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">+ Create Room</button>
        </div>
        
        <!-- Room Filters -->
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <button class="filter-btn active" data-filter="waiting" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
          ">Waiting</button>
          <button class="filter-btn" data-filter="playing" style="
            background: #34495e;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
          ">Playing</button>
          <button class="filter-btn" data-filter="finished" style="
            background: #34495e;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
          ">Finished</button>
          <div style="flex: 1;"></div>
          <input type="text" id="search-rooms" placeholder="Search rooms..." style="
            padding: 8px 15px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px;
            color: white;
            width: 200px;
          ">
        </div>
        
        <!-- Rooms List -->
        <div id="rooms-list" style="
          max-height: 300px;
          overflow-y: auto;
        ">
          <!-- Rooms will be inserted here -->
        </div>
      </div>
      
      <!-- Room View (when joined) -->
      <div id="room-view" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 id="room-name" style="color: white; margin: 0;"></h3>
            <div style="color: #bdc3c7; font-size: 13px;">Code: <span id="room-code"></span></div>
          </div>
          <div>
            <button id="leave-room-btn" class="multiplayer-btn danger" style="
              background: #e74c3c;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
            ">Leave Room</button>
          </div>
        </div>
        
        <!-- Players List -->
        <div id="players-list" style="
          background: rgba(0,0,0,0.2);
          border-radius: 10px;
          padding: 15px;
          margin-bottom: 20px;
        ">
          <!-- Players will be inserted here -->
        </div>
        
        <!-- Game Controls (Host only) -->
        <div id="host-controls" style="display: none; margin-bottom: 15px;">
          <button id="start-game-btn" class="multiplayer-btn success" style="
            width: 100%;
            background: #2ecc71;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
          ">Start Game</button>
        </div>
        
        <!-- Ready Button (Non-host) -->
        <div id="player-controls">
          <button id="ready-btn" class="multiplayer-btn" style="
            width: 100%;
            background: #3498db;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 16px;
          ">Ready ✓</button>
        </div>
      </div>
    </div>
    
    <!-- Create Room Modal -->
    <div id="create-room-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      backdrop-filter: blur(5px);
    ">
      <div style="
        background: linear-gradient(135deg, #2c3e50, #1a252f);
        padding: 30px;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
      ">
        <h3 style="color: white; margin-bottom: 20px;">Create New Room</h3>
        
        <input type="text" id="room-name-input" placeholder="Room Name" style="
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border: 2px solid #34495e;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          color: white;
        ">
        
        <div style="margin-bottom: 15px;">
          <label style="color: white; display: block; margin-bottom: 5px;">Max Players</label>
          <select id="max-players" style="
            width: 100%;
            padding: 12px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
          ">
            <option value="2">2 Players</option>
            <option value="4">4 Players</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="color: white; display: flex; align-items: center; gap: 10px;">
            <input type="checkbox" id="private-room"> Private Room
          </label>
        </div>
        
        <div id="password-field" style="display: none; margin-bottom: 15px;">
          <input type="password" id="room-password" placeholder="Room Password" style="
            width: 100%;
            padding: 12px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
          ">
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button id="cancel-create-btn" style="
            flex: 1;
            padding: 12px;
            background: #34495e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          ">Cancel</button>
          <button id="confirm-create-btn" style="
            flex: 1;
            padding: 12px;
            background: #2ecc71;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          ">Create</button>
        </div>
      </div>
    </div>
    
    <!-- Join Room Modal -->
    <div id="join-room-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.9);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      backdrop-filter: blur(5px);
    ">
      <div style="
        background: linear-gradient(135deg, #2c3e50, #1a252f);
        padding: 30px;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
      ">
        <h3 style="color: white; margin-bottom: 20px;" id="join-room-title">Join Room</h3>
        
        <input type="text" id="join-room-code" placeholder="Room Code" style="
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border: 2px solid #34495e;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          color: white;
          text-transform: uppercase;
        ">
        
        <div id="join-password-field" style="display: none; margin-bottom: 15px;">
          <input type="password" id="join-password" placeholder="Room Password" style="
            width: 100%;
            padding: 12px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
          ">
        </div>
        
        <div id="join-error" style="color: #e74c3c; margin-bottom: 10px; font-size: 14px;"></div>
        
        <div style="display: flex; gap: 10px;">
          <button id="cancel-join-btn" style="
            flex: 1;
            padding: 12px;
            background: #34495e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          ">Cancel</button>
          <button id="confirm-join-btn" style="
            flex: 1;
            padding: 12px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          ">Join</button>
        </div>
      </div>
    </div>
  `;
  
  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    .multiplayer-btn {
      transition: all 0.3s;
    }
    .multiplayer-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }
    .multiplayer-btn.danger:hover {
      background: #c0392b;
    }
    .multiplayer-btn.success:hover {
      background: #27ae60;
    }
    .filter-btn.active {
      background: #3498db !important;
    }
    #rooms-list::-webkit-scrollbar {
      width: 8px;
    }
    #rooms-list::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    #rooms-list::-webkit-scrollbar-thumb {
      background: #3498db;
      border-radius: 4px;
    }
    .room-item {
      background: rgba(255,255,255,0.05);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: all 0.3s;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .room-item:hover {
      background: rgba(255,255,255,0.1);
      transform: translateX(5px);
    }
    .player-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .player-item.host {
      background: rgba(241, 196, 15, 0.1);
      border: 1px solid #f1c40f;
    }
    .ready-badge {
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .ready-badge.ready {
      background: #2ecc71;
      color: white;
    }
    .ready-badge.not-ready {
      background: #e74c3c;
      color: white;
    }
  `;
  document.head.appendChild(style);
  
  // Insert after social panel
  const socialPanel = document.getElementById('social-panel');
  if (socialPanel) {
    socialPanel.insertAdjacentHTML('afterend', multiplayerHTML);
  } else {
    gameContainer.insertAdjacentHTML('beforeend', multiplayerHTML);
  }
  
  setupMultiplayerEvents();
}

// ===========================================
// EVENT SETUP
// ===========================================
function setupMultiplayerEvents() {
  // Create room modal
  document.getElementById('create-room-btn').addEventListener('click', () => {
    document.getElementById('create-room-modal').style.display = 'flex';
  });
  
  document.getElementById('cancel-create-btn').addEventListener('click', () => {
    document.getElementById('create-room-modal').style.display = 'none';
  });
  
  document.getElementById('private-room').addEventListener('change', (e) => {
    document.getElementById('password-field').style.display = e.target.checked ? 'block' : 'none';
  });
  
  document.getElementById('confirm-create-btn').addEventListener('click', createRoom);
  
  // Join room modal
  document.getElementById('cancel-join-btn').addEventListener('click', () => {
    document.getElementById('join-room-modal').style.display = 'none';
  });
  
  document.getElementById('confirm-join-btn').addEventListener('click', joinRoom);
  
  // Room filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.style.background = '#34495e';
        b.classList.remove('active');
      });
      this.style.background = '#3498db';
      this.classList.add('active');
      fetchRooms(this.dataset.filter);
    });
  });
  
  // Search rooms
  document.getElementById('search-rooms').addEventListener('input', debounce(() => {
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'waiting';
    fetchRooms(activeFilter);
  }, 300));
  
  // Room view buttons
  document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);
  document.getElementById('ready-btn').addEventListener('click', toggleReady);
  document.getElementById('start-game-btn').addEventListener('click', startGame);
  
  // Join room code input auto-uppercase
  document.getElementById('join-room-code').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
  });
}

// ===========================================
// API CALLS
// ===========================================

// Fetch available rooms
async function fetchRooms(status = 'waiting') {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/list?status=${status}`);
    const data = await response.json();
    
    if (data.success) {
      availableRooms = data.rooms;
      renderRooms();
    }
  } catch (error) {
    console.error('Error fetching rooms:', error);
  }
}

// Create room
async function createRoom() {
  if (!window.currentUser) {
    alert('Please login first');
    return;
  }
  
  const roomName = document.getElementById('room-name-input').value.trim() || `${window.currentUser.username}'s Room`;
  const maxPlayers = parseInt(document.getElementById('max-players').value);
  const isPrivate = document.getElementById('private-room').checked;
  const password = document.getElementById('room-password').value;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        roomName,
        maxPlayers,
        isPrivate,
        password: isPrivate ? password : null
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('create-room-modal').style.display = 'none';
      currentRoom = data.room;
      enterRoomView();
      startRoomUpdates();
    } else {
      alert(data.error || 'Failed to create room');
    }
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Network error. Try again.');
  }
}

// Join room
async function joinRoom() {
  if (!window.currentUser) {
    alert('Please login first');
    return;
  }
  
  const roomId = document.getElementById('join-room-code').value.trim();
  const password = document.getElementById('join-password').value;
  
  if (!roomId) {
    document.getElementById('join-error').textContent = 'Please enter room code';
    return;
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        roomId,
        password
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      document.getElementById('join-room-modal').style.display = 'none';
      currentRoom = data.room;
      enterRoomView();
      startRoomUpdates();
    } else {
      document.getElementById('join-error').textContent = data.error || 'Failed to join room';
    }
  } catch (error) {
    console.error('Error joining room:', error);
    document.getElementById('join-error').textContent = 'Network error. Try again.';
  }
}

// Leave room
async function leaveRoom() {
  if (!window.currentUser || !currentRoom) return;
  
  if (!confirm('Leave this room?')) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        roomId: currentRoom.roomId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      stopRoomUpdates();
      currentRoom = null;
      exitRoomView();
      fetchRooms();
    }
  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

// Toggle ready status
async function toggleReady() {
  if (!window.currentUser || !currentRoom) return;
  
  const currentReady = currentRoom.players[window.currentUser.username]?.ready || false;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        roomId: currentRoom.roomId,
        ready: !currentReady
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Room update will refresh via interval
    }
  } catch (error) {
    console.error('Error toggling ready:', error);
  }
}

// Start game (host only)
async function startGame() {
  if (!window.currentUser || !currentRoom) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        roomId: currentRoom.roomId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update game grid with shuffled numbers
      updateGameGrid(data.gameState.numbers);
    } else {
      alert(data.error || 'Failed to start game');
    }
  } catch (error) {
    console.error('Error starting game:', error);
  }
}

// Make a move
async function makeMove(number) {
  if (!window.currentUser || !currentRoom) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        roomId: currentRoom.roomId,
        number
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      alert(data.error || 'Invalid move');
    }
  } catch (error) {
    console.error('Error making move:', error);
  }
}

// Fetch room state
async function fetchRoomState() {
  if (!currentRoom) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/rooms/${currentRoom.roomId}`);
    const data = await response.json();
    
    if (data.success) {
      currentRoom = data.room;
      updateRoomView();
      
      // If game is playing, update the grid
      if (currentRoom.status === 'playing') {
        updateGameGrid(currentRoom.gameState.numbers);
        highlightMarkedCells(currentRoom.gameState.markedCells);
        
        // Show turn indicator
        if (currentRoom.gameState.currentTurn === window.currentUser.username) {
          document.getElementById('game-status').textContent = 'Your turn!';
        } else {
          document.getElementById('game-status').textContent = `${currentRoom.gameState.currentTurn}'s turn`;
        }
      }
      
      // If game finished, show winner
      if (currentRoom.status === 'finished' && currentRoom.gameState.winner) {
        document.getElementById('game-status').textContent = `🎉 ${currentRoom.gameState.winner} wins! 🎉`;
        createConfetti();
      }
    }
  } catch (error) {
    console.error('Error fetching room state:', error);
  }
}

// ===========================================
// RENDER FUNCTIONS
// ===========================================

function renderRooms() {
  const roomsList = document.getElementById('rooms-list');
  const searchTerm = document.getElementById('search-rooms').value.toLowerCase();
  
  let filteredRooms = availableRooms;
  if (searchTerm) {
    filteredRooms = availableRooms.filter(room => 
      room.roomName.toLowerCase().includes(searchTerm) ||
      room.roomId.toLowerCase().includes(searchTerm) ||
      room.host.toLowerCase().includes(searchTerm)
    );
  }
  
  if (filteredRooms.length === 0) {
    roomsList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 30px;">
        No rooms found
      </div>
    `;
    return;
  }
  
  roomsList.innerHTML = filteredRooms.map(room => `
    <div class="room-item" onclick="window.joinRoomById('${room.roomId}')">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; color: white;">${room.roomName}</div>
          <div style="font-size: 12px; color: #bdc3c7;">
            Host: ${room.host} • Code: ${room.roomId}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #3498db; font-weight: 600;">
            ${room.playerCount}/${room.maxPlayers}
          </div>
          ${room.isPrivate ? '<span style="color: #f39c12;">🔒</span>' : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function enterRoomView() {
  document.getElementById('lobby-view').style.display = 'none';
  document.getElementById('room-view').style.display = 'block';
  document.getElementById('multiplayer-panel').style.display = 'block';
  updateRoomView();
}

function exitRoomView() {
  document.getElementById('lobby-view').style.display = 'block';
  document.getElementById('room-view').style.display = 'none';
}

function updateRoomView() {
  if (!currentRoom) return;
  
  document.getElementById('room-name').textContent = currentRoom.roomName;
  document.getElementById('room-code').textContent = currentRoom.roomId;
  
  // Render players
  const playersList = document.getElementById('players-list');
  const players = Object.values(currentRoom.players || {});
  
  playersList.innerHTML = players.map(player => {
    const isHost = player.username === currentRoom.host;
    const isMe = player.username === window.currentUser?.username;
    
    return `
      <div class="player-item ${isHost ? 'host' : ''}" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: ${isMe ? 'rgba(52, 152, 219, 0.2)' : 'rgba(0,0,0,0.2)'};
      ">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: ${isHost ? '#f1c40f' : 'white'};">
            ${isHost ? '👑' : '👤'}
          </span>
          <div>
            <span style="color: white; font-weight: ${isMe ? '600' : 'normal'};">
              ${player.username} ${isMe ? '(You)' : ''}
            </span>
            <div style="font-size: 11px; color: #bdc3c7;">
              Score: ${player.score || 0}
            </div>
          </div>
        </div>
        <div>
          <span class="ready-badge ${player.ready ? 'ready' : 'not-ready'}">
            ${player.ready ? '✓ Ready' : 'Not Ready'}
          </span>
        </div>
      </div>
    `;
  }).join('');
  
  // Show/hide host controls
  const isHost = currentRoom.host === window.currentUser?.username;
  document.getElementById('host-controls').style.display = isHost && currentRoom.status === 'waiting' ? 'block' : 'none';
  
  // Update ready button
  const myPlayer = currentRoom.players[window.currentUser?.username];
  if (myPlayer) {
    const readyBtn = document.getElementById('ready-btn');
    readyBtn.textContent = myPlayer.ready ? 'Not Ready' : 'Ready ✓';
    readyBtn.style.background = myPlayer.ready ? '#e74c3c' : '#3498db';
  }
}

function updateGameGrid(numbers) {
  const grid = document.getElementById('game-grid');
  if (!grid) return;
  
  // Update existing cells
  const cells = grid.children;
  for (let i = 0; i < cells.length; i++) {
    cells[i].textContent = numbers[i];
    cells[i].dataset.number = numbers[i];
    
    // Override click handler for multiplayer
    cells[i].onclick = function() {
      if (currentRoom?.status === 'playing' && 
          currentRoom.gameState?.currentTurn === window.currentUser?.username &&
          !currentRoom.gameState?.markedCells[this.dataset.number]) {
        makeMove(parseInt(this.dataset.number));
      }
    };
  }
}

function highlightMarkedCells(markedCells) {
  const grid = document.getElementById('game-grid');
  if (!grid) return;
  
  // Reset all cells
  Array.from(grid.children).forEach(cell => {
    cell.classList.remove('player1', 'player2');
  });
  
  // Mark cells
  Object.entries(markedCells).forEach(([num, player]) => {
    const cells = Array.from(grid.children);
    const cell = cells.find(c => c.dataset.number === num);
    if (cell) {
      cell.classList.add(player);
    }
  });
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function startRoomUpdates() {
  if (roomUpdateInterval) clearInterval(roomUpdateInterval);
  roomUpdateInterval = setInterval(fetchRoomState, 2000); // Update every 2 seconds
  fetchRoomState();
}

function stopRoomUpdates() {
  if (roomUpdateInterval) {
    clearInterval(roomUpdateInterval);
    roomUpdateInterval = null;
  }
}

window.joinRoomById = function(roomId) {
  const room = availableRooms.find(r => r.roomId === roomId);
  if (!room) return;
  
  if (room.isPrivate) {
    document.getElementById('join-room-code').value = roomId;
    document.getElementById('join-password-field').style.display = 'block';
    document.getElementById('join-room-modal').style.display = 'flex';
  } else {
    document.getElementById('join-room-code').value = roomId;
    document.getElementById('join-password-field').style.display = 'none';
    joinRoom();
  }
};

function createConfetti() {
  // Reuse confetti function from original game
  if (typeof window.createConfetti === 'function') {
    window.createConfetti();
  }
}

// ===========================================
// INITIALIZATION
// ===========================================

// Listen for user login
document.addEventListener('DOMContentLoaded', () => {
  addMultiplayerUI();
  
  // Override user session start
  const originalStartSession = window.startUserSession;
  window.startUserSession = function() {
    if (originalStartSession) originalStartSession();
    document.getElementById('multiplayer-panel').style.display = 'block';
    fetchRooms();
  };
  
  // Override logout
  const originalLogout = window.handleLogout;
  window.handleLogout = function() {
    if (currentRoom) leaveRoom();
    stopRoomUpdates();
    document.getElementById('multiplayer-panel').style.display = 'none';
    if (originalLogout) originalLogout();
  };
});