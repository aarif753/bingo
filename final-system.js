// ===========================================
// FINAL SYSTEM - LEADERBOARD + CHAT + HISTORY
// ===========================================

// Configuration
const WORKER_URL = 'https://bingo.aarifbabu8948.workers.dev'; // REPLACE WITH YOUR WORKER URL

// State
let leaderboardData = [];
let leaderboardOffset = 0;
let leaderboardHasMore = true;
let chatMessages = [];
let chatUpdateInterval = null;
let matchHistory = [];
let historyOffset = 0;
let historyHasMore = true;
let previousOpponents = [];

// ===========================================
// ADD FINAL UI ELEMENTS
// ===========================================
function addFinalUI() {
  const gameContainer = document.querySelector('.game-container');
  
  const finalHTML = `
    <!-- Tabs for new features -->
    <div id="final-tabs" style="
      display: flex;
      gap: 10px;
      margin: 20px 0;
      background: rgba(0,0,0,0.2);
      padding: 10px;
      border-radius: 50px;
    ">
      <button class="final-tab active" data-tab="leaderboard" style="
        flex: 1;
        padding: 12px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
      ">🏆 Leaderboard</button>
      
      <button class="final-tab" data-tab="chat" style="
        flex: 1;
        padding: 12px;
        background: transparent;
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
      ">💬 Chat</button>
      
      <button class="final-tab" data-tab="history" style="
        flex: 1;
        padding: 12px;
        background: transparent;
        color: white;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s;
      ">📜 History</button>
    </div>
    
    <!-- Leaderboard Panel -->
    <div id="leaderboard-panel" class="final-panel" style="
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.1);
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="color: white; margin: 0;">Global Leaderboard</h3>
        <div style="display: flex; gap: 10px;">
          <button id="refresh-leaderboard" style="
            background: #34495e;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
          ">🔄 Refresh</button>
        </div>
      </div>
      
      <div id="leaderboard-list" style="
        max-height: 300px;
        overflow-y: auto;
      ">
        <!-- Leaderboard entries will be inserted here -->
      </div>
      
      <div id="leaderboard-load-more" style="text-align: center; margin-top: 15px; display: none;">
        <button id="load-more-leaderboard" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">Load More</button>
      </div>
    </div>
    
    <!-- Chat Panel -->
    <div id="chat-panel" class="final-panel" style="
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      display: none;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="color: white; margin: 0;">Room Chat</h3>
        <div style="color: #bdc3c7; font-size: 12px;" id="chat-room-indicator">Not in room</div>
      </div>
      
      <div id="chat-messages" style="
        height: 250px;
        overflow-y: auto;
        background: rgba(0,0,0,0.2);
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      ">
        <!-- Messages will be inserted here -->
      </div>
      
      <div style="display: flex; gap: 10px;">
        <input type="text" id="chat-input" placeholder="Type a message..." style="
          flex: 1;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: white;
        ">
        <button id="send-chat" style="
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Send</button>
      </div>
    </div>
    
    <!-- History Panel -->
    <div id="history-panel" class="final-panel" style="
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      display: none;
    ">
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <button class="history-tab active" data-subtab="matches" style="
          flex: 1;
          padding: 10px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">Match History</button>
        <button class="history-tab" data-subtab="opponents" style="
          flex: 1;
          padding: 10px;
          background: #34495e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">Previous Opponents</button>
      </div>
      
      <!-- Match History Sub-tab -->
      <div id="matches-subtab" class="history-subtab">
        <div id="history-list" style="
          max-height: 300px;
          overflow-y: auto;
        ">
          <!-- Match history entries -->
        </div>
        <div id="history-load-more" style="text-align: center; margin-top: 15px; display: none;">
          <button id="load-more-history" style="
            background: #3498db;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 5px;
            cursor: pointer;
          ">Load More</button>
        </div>
      </div>
      
      <!-- Opponents Sub-tab -->
      <div id="opponents-subtab" class="history-subtab" style="display: none;">
        <div id="opponents-list" style="
          max-height: 300px;
          overflow-y: auto;
        ">
          <!-- Previous opponents list -->
        </div>
      </div>
    </div>
  `;
  
  // Add CSS
  const style = document.createElement('style');
  style.textContent = `
    .final-tab.active {
      background: #3498db !important;
      box-shadow: 0 5px 15px rgba(52,152,219,0.3);
    }
    
    #leaderboard-list::-webkit-scrollbar,
    #chat-messages::-webkit-scrollbar,
    #history-list::-webkit-scrollbar,
    #opponents-list::-webkit-scrollbar {
      width: 8px;
    }
    
    #leaderboard-list::-webkit-scrollbar-track,
    #chat-messages::-webkit-scrollbar-track,
    #history-list::-webkit-scrollbar-track,
    #opponents-list::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    
    #leaderboard-list::-webkit-scrollbar-thumb,
    #chat-messages::-webkit-scrollbar-thumb,
    #history-list::-webkit-scrollbar-thumb,
    #opponents-list::-webkit-scrollbar-thumb {
      background: #3498db;
      border-radius: 4px;
    }
    
    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.3s;
    }
    
    .leaderboard-item:hover {
      background: rgba(255,255,255,0.1);
      transform: translateX(5px);
    }
    
    .leaderboard-item.top-1 {
      background: linear-gradient(90deg, rgba(241,196,15,0.2), rgba(241,196,15,0.05));
      border-left: 3px solid #f1c40f;
    }
    
    .leaderboard-item.top-2 {
      background: linear-gradient(90deg, rgba(189,195,199,0.2), rgba(189,195,199,0.05));
      border-left: 3px solid #bdc3c7;
    }
    
    .leaderboard-item.top-3 {
      background: linear-gradient(90deg, rgba(205,127,50,0.2), rgba(205,127,50,0.05));
      border-left: 3px solid #cd7f32;
    }
    
    .chat-message {
      padding: 8px 12px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
    }
    
    .chat-message.own {
      align-self: flex-end;
      background: #3498db;
      color: white;
    }
    
    .chat-message.other {
      align-self: flex-start;
      background: #34495e;
      color: white;
    }
    
    .chat-message.system {
      align-self: center;
      background: rgba(241,196,15,0.2);
      color: #f1c40f;
      font-size: 12px;
      font-style: italic;
    }
    
    .chat-timestamp {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 2px;
    }
    
    .history-item {
      padding: 15px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 3px solid;
    }
    
    .history-item.win {
      border-left-color: #2ecc71;
    }
    
    .history-item.loss {
      border-left-color: #e74c3c;
    }
    
    .history-item.draw {
      border-left-color: #f39c12;
    }
    
    .opponent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .opponent-item:hover {
      background: rgba(255,255,255,0.1);
      transform: translateX(5px);
    }
  `;
  document.head.appendChild(style);
  
  // Insert at the end of game container
  gameContainer.insertAdjacentHTML('beforeend', finalHTML);
  
  setupFinalEvents();
  
  // Hide panels initially if not logged in
  if (!window.currentUser) {
    document.getElementById('final-tabs').style.display = 'none';
  }
}

// ===========================================
// EVENT SETUP
// ===========================================
function setupFinalEvents() {
  // Tab switching
  document.querySelectorAll('.final-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      
      // Update tab styles
      document.querySelectorAll('.final-tab').forEach(t => {
        t.style.background = 'transparent';
        t.classList.remove('active');
      });
      this.style.background = '#3498db';
      this.classList.add('active');
      
      // Show correct panel
      document.querySelectorAll('.final-panel').forEach(panel => {
        panel.style.display = 'none';
      });
      document.getElementById(`${tabName}-panel`).style.display = 'block';
      
      // Load data if needed
      if (tabName === 'leaderboard') {
        resetLeaderboard();
        loadLeaderboard();
      } else if (tabName === 'chat') {
        startChatUpdates();
      } else if (tabName === 'history') {
        resetHistory();
        loadMatchHistory();
        loadPreviousOpponents();
      }
    });
  });
  
  // History sub-tab switching
  document.querySelectorAll('.history-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const subTab = this.dataset.subtab;
      
      document.querySelectorAll('.history-tab').forEach(t => {
        t.style.background = '#34495e';
        t.classList.remove('active');
      });
      this.style.background = '#3498db';
      this.classList.add('active');
      
      document.querySelectorAll('.history-subtab').forEach(st => {
        st.style.display = 'none';
      });
      document.getElementById(`${subTab}-subtab`).style.display = 'block';
    });
  });
  
  // Leaderboard refresh
  document.getElementById('refresh-leaderboard').addEventListener('click', () => {
    resetLeaderboard();
    loadLeaderboard();
  });
  
  // Load more leaderboard
  document.getElementById('load-more-leaderboard').addEventListener('click', loadMoreLeaderboard);
  
  // Chat send
  document.getElementById('send-chat').addEventListener('click', sendChatMessage);
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
  
  // Load more history
  document.getElementById('load-more-history').addEventListener('click', loadMoreHistory);
}

// ===========================================
// LEADERBOARD FUNCTIONS
// ===========================================

function resetLeaderboard() {
  leaderboardData = [];
  leaderboardOffset = 0;
  leaderboardHasMore = true;
  document.getElementById('leaderboard-list').innerHTML = '';
}

async function loadLeaderboard() {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/leaderboard?limit=20&offset=${leaderboardOffset}`);
    const data = await response.json();
    
    if (data.success) {
      leaderboardData = [...leaderboardData, ...data.entries];
      renderLeaderboard();
      
      leaderboardHasMore = data.hasMore;
      document.getElementById('leaderboard-load-more').style.display = data.hasMore ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

async function loadMoreLeaderboard() {
  if (!leaderboardHasMore) return;
  leaderboardOffset += 20;
  await loadLeaderboard();
}

function renderLeaderboard() {
  const leaderboardList = document.getElementById('leaderboard-list');
  
  if (leaderboardData.length === 0) {
    leaderboardList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 30px;">
        No leaderboard data yet
      </div>
    `;
    return;
  }
  
  leaderboardList.innerHTML = leaderboardData.map(entry => {
    let rankClass = '';
    if (entry.rank === 1) rankClass = 'top-1';
    else if (entry.rank === 2) rankClass = 'top-2';
    else if (entry.rank === 3) rankClass = 'top-3';
    
    const isMe = entry.username === window.currentUser?.username;
    
    return `
      <div class="leaderboard-item ${rankClass}" style="
        background: ${isMe ? 'rgba(52,152,219,0.2)' : ''};
      ">
        <div style="
          width: 30px;
          height: 30px;
          background: ${getRankColor(entry.rank)};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
        ">${entry.rank}</div>
        
        <div style="flex: 1;">
          <div style="font-weight: 600; color: white;">
            ${entry.username} ${isMe ? '(You)' : ''}
          </div>
          <div style="font-size: 12px; color: #bdc3c7;">
            Games: ${entry.gamesPlayed} • Win Rate: ${entry.winRate}%
          </div>
        </div>
        
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: bold; color: #f1c40f;">
            ${entry.wins}
          </div>
          <div style="font-size: 11px; color: #bdc3c7;">wins</div>
        </div>
      </div>
    `;
  }).join('');
}

function getRankColor(rank) {
  if (rank === 1) return '#f1c40f';
  if (rank === 2) return '#bdc3c7';
  if (rank === 3) return '#cd7f32';
  return '#34495e';
}

// ===========================================
// CHAT FUNCTIONS
// ===========================================

function startChatUpdates() {
  if (!window.currentUser) {
    document.getElementById('chat-room-indicator').textContent = 'Login to chat';
    document.getElementById('chat-messages').innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 20px;">
        Please login to chat
      </div>
    `;
    return;
  }
  
  if (!window.currentRoom) {
    document.getElementById('chat-room-indicator').textContent = 'Not in room';
    document.getElementById('chat-messages').innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 20px;">
        Join a room to start chatting
      </div>
    `;
    return;
  }
  
  document.getElementById('chat-room-indicator').textContent = `Room: ${window.currentRoom.roomId}`;
  
  // Initial load
  loadChatMessages();
  
  // Set up real-time updates
  if (chatUpdateInterval) clearInterval(chatUpdateInterval);
  chatUpdateInterval = setInterval(loadChatMessages, 3000);
}

function stopChatUpdates() {
  if (chatUpdateInterval) {
    clearInterval(chatUpdateInterval);
    chatUpdateInterval = null;
  }
}

async function loadChatMessages() {
  if (!window.currentRoom) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/chat/room/${window.currentRoom.roomId}?limit=50`);
    const data = await response.json();
    
    if (data.success) {
      chatMessages = data.messages;
      renderChatMessages();
    }
  } catch (error) {
    console.error('Error loading chat messages:', error);
  }
}

async function sendChatMessage() {
  if (!window.currentUser) {
    alert('Please login first');
    return;
  }
  
  if (!window.currentRoom) {
    alert('Join a room first');
    return;
  }
  
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: window.currentRoom.roomId,
        from: window.currentUser.username,
        message: message
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      input.value = '';
      // Immediately load new messages
      await loadChatMessages();
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function renderChatMessages() {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;
  
  if (chatMessages.length === 0) {
    chatContainer.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 20px;">
        No messages yet. Start the conversation!
      </div>
    `;
    return;
  }
  
  chatContainer.innerHTML = chatMessages.map(msg => {
    const isOwn = msg.from === window.currentUser?.username;
    const messageClass = msg.type === 'system' ? 'system' : (isOwn ? 'own' : 'other');
    
    return `
      <div class="chat-message ${messageClass}">
        ${msg.type !== 'system' ? `<div style="font-size: 11px; font-weight: 600; margin-bottom: 2px;">${msg.from}</div>` : ''}
        <div>${escapeHtml(msg.message)}</div>
        <div class="chat-timestamp">${formatTime(msg.timestamp)}</div>
      </div>
    `;
  }).join('');
  
  // Auto-scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ===========================================
// HISTORY FUNCTIONS
// ===========================================

function resetHistory() {
  matchHistory = [];
  historyOffset = 0;
  historyHasMore = true;
  document.getElementById('history-list').innerHTML = '';
}

async function loadMatchHistory() {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/history/${encodeURIComponent(window.currentUser.username)}?limit=10&offset=${historyOffset}`);
    const data = await response.json();
    
    if (data.success) {
      matchHistory = [...matchHistory, ...data.matches];
      renderMatchHistory();
      
      historyHasMore = data.hasMore;
      document.getElementById('history-load-more').style.display = data.hasMore ? 'block' : 'none';
    }
  } catch (error) {
    console.error('Error loading match history:', error);
  }
}

async function loadMoreHistory() {
  if (!historyHasMore) return;
  historyOffset += 10;
  await loadMatchHistory();
}

async function loadPreviousOpponents() {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/history/opponents?username=${encodeURIComponent(window.currentUser.username)}`);
    const data = await response.json();
    
    if (data.success) {
      previousOpponents = data.opponents;
      renderPreviousOpponents();
    }
  } catch (error) {
    console.error('Error loading opponents:', error);
  }
}

function renderMatchHistory() {
  const historyList = document.getElementById('history-list');
  
  if (matchHistory.length === 0) {
    historyList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 30px;">
        No match history yet. Play some games!
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = matchHistory.map(match => {
    const resultClass = match.result;
    const resultText = match.result === 'win' ? '🏆 Win' : (match.result === 'loss' ? '❌ Loss' : '🤝 Draw');
    const resultColor = match.result === 'win' ? '#2ecc71' : (match.result === 'loss' ? '#e74c3c' : '#f39c12');
    
    return `
      <div class="history-item ${resultClass}">
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span style="font-weight: 600; color: white;">vs ${match.opponent || 'Unknown'}</span>
          <span style="color: ${resultColor};">${resultText}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #bdc3c7;">
          <span>Score: ${match.score || 0} - ${match.opponentScore || 0}</span>
          <span>${formatDate(match.date)}</span>
        </div>
        ${match.duration ? `<div style="font-size: 11px; color: #95a5a6; margin-top: 5px;">Duration: ${formatDuration(match.duration)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderPreviousOpponents() {
  const opponentsList = document.getElementById('opponents-list');
  
  if (previousOpponents.length === 0) {
    opponentsList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 30px;">
        No previous opponents yet
      </div>
    `;
    return;
  }
  
  opponentsList.innerHTML = previousOpponents.map(opp => {
    const winRate = Math.round((opp.wins / opp.matches) * 100) || 0;
    
    return `
      <div class="opponent-item" onclick="window.viewOpponentProfile('${opp.username}')">
        <div>
          <div style="font-weight: 600; color: white;">${opp.username}</div>
          <div style="font-size: 12px; color: #bdc3c7;">
            Played ${opp.matches} times • Last: ${formatDate(opp.lastPlayed)}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #2ecc71;">Wins: ${opp.wins}</div>
          <div style="color: #e74c3c;">Losses: ${opp.losses}</div>
          <div style="font-size: 11px; color: #f1c40f;">${winRate}% WR</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===========================================
// GAME INTEGRATION
// ===========================================

// Override game finish to save match history
function saveMatchToHistory(winner, scores) {
  if (!window.currentUser || !window.currentRoom) return;
  
  const matchData = {
    roomId: window.currentRoom.roomId,
    opponent: Object.keys(window.currentRoom.players).find(p => p !== window.currentUser.username),
    result: winner === window.currentUser.username ? 'win' : 'loss',
    score: scores[window.currentUser.username] || 0,
    opponentScore: scores[Object.keys(window.currentRoom.players).find(p => p !== window.currentUser.username)] || 0,
    date: Date.now(),
    duration: window.currentRoom.gameState?.endTime - window.currentRoom.gameState?.startTime
  };
  
  fetch(`${WORKER_URL}/api/history/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: window.currentUser.username,
      matchData
    })
  }).catch(err => console.error('Error saving match history:', err));
}

// Add system message to chat
async function sendSystemMessage(roomId, message) {
  try {
    await fetch(`${WORKER_URL}/api/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId,
        from: 'System',
        message,
        type: 'system'
      })
    });
  } catch (error) {
    console.error('Error sending system message:', error);
  }
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) { // Less than 24 hours
    return 'Today';
  } else if (diff < 172800000) { // Less than 48 hours
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

window.viewOpponentProfile = function(username) {
  // Switch to leaderboard tab and highlight this user
  document.querySelector('[data-tab="leaderboard"]').click();
  
  // Scroll to find the user
  setTimeout(() => {
    const items = document.querySelectorAll('.leaderboard-item');
    for (const item of items) {
      if (item.textContent.includes(username)) {
        item.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.style.background = 'rgba(241,196,15,0.3)';
        setTimeout(() => {
          item.style.background = '';
        }, 2000);
        break;
      }
    }
  }, 500);
};

// ===========================================
// INITIALIZATION
// ===========================================

// Listen for user login
document.addEventListener('DOMContentLoaded', () => {
  addFinalUI();
  
  // Override user session start
  const originalStartSession = window.startUserSession;
  window.startUserSession = function() {
    if (originalStartSession) originalStartSession();
    // Show final tabs after login
    const finalTabs = document.getElementById('final-tabs');
    if (finalTabs) finalTabs.style.display = 'flex';
    resetLeaderboard();
    loadLeaderboard();
  };
  
  // Override logout
  const originalLogout = window.handleLogout;
  window.handleLogout = function() {
    stopChatUpdates();
    if (originalLogout) originalLogout();
    // Hide final tabs after logout
    const finalTabs = document.getElementById('final-tabs');
    if (finalTabs) finalTabs.style.display = 'none';
  };
  
  // Monitor room changes for chat
  const originalEnterRoom = window.enterRoomView;
  window.enterRoomView = function() {
    if (originalEnterRoom) originalEnterRoom();
    if (document.querySelector('[data-tab="chat"]').classList.contains('active')) {
      startChatUpdates();
    }
  };
  
  const originalLeaveRoom = window.leaveRoom;
  window.leaveRoom = function() {
    if (originalLeaveRoom) originalLeaveRoom();
    stopChatUpdates();
  };
  
  // Hook into game finish
  const originalCheckForWinner = window.checkForWinner;
  window.checkForWinner = function() {
    const result = originalCheckForWinner ? originalCheckForWinner() : false;
    if (result && window.currentRoom) {
      // Save match history
      saveMatchToHistory(window.currentUser?.username, {
        [window.currentUser?.username]: window.score,
        [Object.keys(window.currentRoom.players).find(p => p !== window.currentUser?.username)]: 
          window.currentRoom.players[Object.keys(window.currentRoom.players).find(p => p !== window.currentUser?.username)]?.score || 0
      });
      
      // Send system message
      sendSystemMessage(window.currentRoom.roomId, `${window.currentUser?.username} wins the game! 🎉`);
    }
    return result;
  };
  
  // If already logged in, show tabs
  if (window.currentUser) {
    const finalTabs = document.getElementById('final-tabs');
    if (finalTabs) finalTabs.style.display = 'flex';
  }
});
