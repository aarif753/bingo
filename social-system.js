// ===========================================
// SOCIAL SYSTEM - ONLINE USERS & FRIENDS
// ===========================================

// Configuration
const WORKER_URL = 'https://bingo.aarifbabu8948.workers.dev'; // REPLACE WITH YOUR WORKER URL

// State
let onlineUsers = [];
let friendRequests = [];
let friends = [];
let socialUpdateInterval = null;

// ===========================================
// ADD SOCIAL UI TO GAME
// ===========================================
function addSocialUI() {
  const gameContainer = document.querySelector('.game-container');
  
  const socialHTML = `
    <div id="social-panel" style="
      background: rgba(0,0,0,0.3);
      border-radius: 15px;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid rgba(255,255,255,0.1);
      display: none;
    ">
      <!-- Tabs -->
      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
        <button class="social-tab active" data-tab="online" style="
          flex: 1;
          padding: 10px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Online Players <span id="online-count" style="
          background: rgba(255,255,255,0.2);
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 8px;
        ">0</span></button>
        
        <button class="social-tab" data-tab="friends" style="
          flex: 1;
          padding: 10px;
          background: #34495e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        ">Friends <span id="friends-count" style="
          background: rgba(255,255,255,0.2);
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 8px;
        ">0</span></button>
        
        <button class="social-tab" data-tab="requests" style="
          flex: 1;
          padding: 10px;
          background: #34495e;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          position: relative;
        ">Requests <span id="requests-count" style="
          background: #e74c3c;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 8px;
          display: none;
        ">0</span></button>
      </div>
      
      <!-- Online Users Tab -->
      <div id="online-tab" class="social-tab-content">
        <div style="
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        ">
          <input type="text" id="search-online" placeholder="Search players..." style="
            flex: 1;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            color: white;
          ">
        </div>
        <div id="online-list" style="
          max-height: 300px;
          overflow-y: auto;
        ">
          <!-- Online users will be inserted here -->
        </div>
      </div>
      
      <!-- Friends Tab -->
      <div id="friends-tab" class="social-tab-content" style="display: none;">
        <div id="friends-list" style="
          max-height: 300px;
          overflow-y: auto;
        ">
          <!-- Friends list will be inserted here -->
        </div>
      </div>
      
      <!-- Friend Requests Tab -->
      <div id="requests-tab" class="social-tab-content" style="display: none;">
        <div id="requests-list" style="
          max-height: 300px;
          overflow-y: auto;
        ">
          <!-- Friend requests will be inserted here -->
        </div>
      </div>
    </div>
  `;
  
  // Insert after user panel
  const userPanel = document.getElementById('user-panel');
  if (userPanel) {
    userPanel.insertAdjacentHTML('afterend', socialHTML);
  } else {
    gameContainer.insertAdjacentHTML('afterbegin', socialHTML);
  }
  
  // Add CSS for scrollbar
  const style = document.createElement('style');
  style.textContent = `
    #online-list::-webkit-scrollbar,
    #friends-list::-webkit-scrollbar,
    #requests-list::-webkit-scrollbar {
      width: 8px;
    }
    
    #online-list::-webkit-scrollbar-track,
    #friends-list::-webkit-scrollbar-track,
    #requests-list::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }
    
    #online-list::-webkit-scrollbar-thumb,
    #friends-list::-webkit-scrollbar-thumb,
    #requests-list::-webkit-scrollbar-thumb {
      background: #3498db;
      border-radius: 4px;
    }
    
    .friend-item, .online-item, .request-item {
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      transition: all 0.3s;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .friend-item:hover, .online-item:hover, .request-item:hover {
      background: rgba(255,255,255,0.1);
      transform: translateX(5px);
    }
    
    .social-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 5px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s;
    }
    
    .social-btn:hover {
      background: #2980b9;
      transform: scale(1.05);
    }
    
    .social-btn.danger {
      background: #e74c3c;
    }
    
    .social-btn.danger:hover {
      background: #c0392b;
    }
    
    .social-btn.success {
      background: #2ecc71;
    }
    
    .social-btn.success:hover {
      background: #27ae60;
    }
    
    .online-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
    }
    
    .online { background: #2ecc71; box-shadow: 0 0 10px #2ecc71; }
    .offline { background: #95a5a6; }
  `;
  document.head.appendChild(style);
  
  // Setup event listeners
  setupSocialEvents();
}

// ===========================================
// EVENT SETUP
// ===========================================
function setupSocialEvents() {
  // Tab switching
  document.querySelectorAll('.social-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.dataset.tab;
      
      // Update tab styles
      document.querySelectorAll('.social-tab').forEach(t => {
        t.style.background = '#34495e';
      });
      this.style.background = '#3498db';
      
      // Show correct content
      document.querySelectorAll('.social-tab-content').forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`${tabName}-tab`).style.display = 'block';
    });
  });
  
  // Search online users
  const searchInput = document.getElementById('search-online');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      renderOnlineUsers(searchInput.value);
    }, 300));
  }
}

// ===========================================
// API CALLS
// ===========================================

// Fetch online users
async function fetchOnlineUsers() {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/online-users`);
    const data = await response.json();
    
    if (data.success) {
      onlineUsers = data.onlineUsers.filter(u => u.username !== window.currentUser.username);
      renderOnlineUsers();
      document.getElementById('online-count').textContent = onlineUsers.length;
    }
  } catch (error) {
    console.error('Error fetching online users:', error);
  }
}

// Fetch friend requests
async function fetchFriendRequests() {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/friend/requests/${encodeURIComponent(window.currentUser.username)}`);
    const data = await response.json();
    
    if (data.success) {
      friendRequests = data.requests;
      renderFriendRequests();
      
      const requestsCount = document.getElementById('requests-count');
      if (friendRequests.length > 0) {
        requestsCount.textContent = friendRequests.length;
        requestsCount.style.display = 'inline-block';
      } else {
        requestsCount.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error fetching friend requests:', error);
  }
}

// Fetch friends list
async function fetchFriends() {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/friends/${encodeURIComponent(window.currentUser.username)}`);
    const data = await response.json();
    
    if (data.success) {
      friends = data.friends;
      renderFriends();
      document.getElementById('friends-count').textContent = friends.length;
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
  }
}

// Send friend request
async function sendFriendRequest(toUsername) {
  if (!window.currentUser) {
    alert('Please login first');
    return;
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/api/friend/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUsername: window.currentUser.username,
        toUsername: toUsername
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(data.message);
      // Update UI to show request sent
      renderOnlineUsers();
    } else {
      alert(data.error || 'Failed to send friend request');
    }
  } catch (error) {
    console.error('Error sending friend request:', error);
    alert('Network error. Try again.');
  }
}

// Respond to friend request
async function respondToFriendRequest(fromUsername, accept) {
  if (!window.currentUser) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/friend/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        fromUsername: fromUsername,
        accept: accept
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Refresh lists
      fetchFriendRequests();
      fetchFriends();
    } else {
      alert(data.error || 'Failed to respond to request');
    }
  } catch (error) {
    console.error('Error responding to request:', error);
  }
}

// Remove friend
async function removeFriend(friendUsername) {
  if (!window.currentUser) return;
  
  if (!confirm(`Remove ${friendUsername} from friends?`)) return;
  
  try {
    const response = await fetch(`${WORKER_URL}/api/friend/remove`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: window.currentUser.username,
        friendUsername: friendUsername
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      fetchFriends();
    } else {
      alert(data.error || 'Failed to remove friend');
    }
  } catch (error) {
    console.error('Error removing friend:', error);
  }
}

// ===========================================
// RENDER FUNCTIONS
// ===========================================

function renderOnlineUsers(searchTerm = '') {
  const onlineList = document.getElementById('online-list');
  if (!onlineList) return;
  
  let filteredUsers = onlineUsers;
  if (searchTerm) {
    filteredUsers = onlineUsers.filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (filteredUsers.length === 0) {
    onlineList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 20px;">
        ${searchTerm ? 'No players found' : 'No online players'}
      </div>
    `;
    return;
  }
  
  onlineList.innerHTML = filteredUsers.map(user => {
    const isFriend = friends.some(f => f.username === user.username);
    const hasPendingRequest = friendRequests.some(r => r.from === user.username);
    
    return `
      <div class="online-item" style="display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span class="online-indicator online"></span>
          <div>
            <div style="font-weight: 600; color: white;">${user.username}</div>
            <div style="font-size: 12px; color: #bdc3c7;">Wins: ${user.wins || 0}</div>
          </div>
        </div>
        <div>
          ${!isFriend && !hasPendingRequest ? `
            <button class="social-btn" onclick="window.sendFriendRequest('${user.username}')">
              Add Friend
            </button>
          ` : isFriend ? `
            <span style="color: #2ecc71; font-size: 12px;">✓ Friend</span>
          ` : `
            <span style="color: #f39c12; font-size: 12px;">Request Sent</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function renderFriends() {
  const friendsList = document.getElementById('friends-list');
  if (!friendsList) return;
  
  if (friends.length === 0) {
    friendsList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 20px;">
        No friends yet. Add some from Online Players!
      </div>
    `;
    return;
  }
  
  friendsList.innerHTML = friends.map(friend => `
    <div class="friend-item" style="display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="online-indicator ${friend.status === 'online' ? 'online' : 'offline'}"></span>
        <div>
          <div style="font-weight: 600; color: white;">${friend.username}</div>
          <div style="font-size: 12px; color: #bdc3c7;">
            Wins: ${friend.wins || 0} • Friends since ${new Date(friend.since).toLocaleDateString()}
          </div>
        </div>
      </div>
      <button class="social-btn danger" onclick="window.removeFriend('${friend.username}')">
        Remove
      </button>
    </div>
  `).join('');
}

function renderFriendRequests() {
  const requestsList = document.getElementById('requests-list');
  if (!requestsList) return;
  
  if (friendRequests.length === 0) {
    requestsList.innerHTML = `
      <div style="text-align: center; color: #bdc3c7; padding: 20px;">
        No pending friend requests
      </div>
    `;
    return;
  }
  
  requestsList.innerHTML = friendRequests.map(request => `
    <div class="request-item" style="display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-weight: 600; color: white;">${request.from}</div>
        <div style="font-size: 12px; color: #bdc3c7;">
          ${new Date(request.timestamp).toLocaleString()}
        </div>
      </div>
      <div style="display: flex; gap: 5px;">
        <button class="social-btn success" onclick="window.respondToFriendRequest('${request.from}', true)">
          Accept
        </button>
        <button class="social-btn danger" onclick="window.respondToFriendRequest('${request.from}', false)">
          Decline
        </button>
      </div>
    </div>
  `).join('');
}

// ===========================================
// START SOCIAL SYSTEM
// ===========================================

function startSocialSystem() {
  if (!window.currentUser) return;
  
  // Show social panel
  document.getElementById('social-panel').style.display = 'block';
  
  // Initial fetch
  fetchOnlineUsers();
  fetchFriendRequests();
  fetchFriends();
  
  // Set up real-time updates (every 10 seconds)
  if (socialUpdateInterval) clearInterval(socialUpdateInterval);
  socialUpdateInterval = setInterval(() => {
    fetchOnlineUsers();
    fetchFriendRequests();
    fetchFriends();
  }, 10000);
}

function stopSocialSystem() {
  if (socialUpdateInterval) {
    clearInterval(socialUpdateInterval);
    socialUpdateInterval = null;
  }
  document.getElementById('social-panel').style.display = 'none';
}

// ===========================================
// UTILITIES
// ===========================================

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===========================================
// EXPOSE FUNCTIONS GLOBALLY
// ===========================================

window.sendFriendRequest = sendFriendRequest;
window.respondToFriendRequest = respondToFriendRequest;
window.removeFriend = removeFriend;

// ===========================================
// INITIALIZATION
// ===========================================

// Listen for user login
document.addEventListener('DOMContentLoaded', () => {
  // Add social UI
  addSocialUI();
  
  // Check if user is already logged in
  if (window.currentUser) {
    startSocialSystem();
  }
  
  // Override user session start
  const originalStartSession = window.startUserSession;
  window.startUserSession = function() {
    if (originalStartSession) originalStartSession();
    startSocialSystem();
  };
  
  // Override logout
  const originalLogout = window.handleLogout;
  window.handleLogout = function() {
    stopSocialSystem();
    if (originalLogout) originalLogout();
  };
});