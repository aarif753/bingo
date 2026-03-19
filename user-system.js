// ===========================================
// USER SYSTEM - COMPLETE WITH PASSWORD AUTH
// ===========================================

// Configuration - REPLACE WITH YOUR WORKER URL
const WORKER_URL = 'https://bingo.aarifbabu8948.workers.dev'; // CHANGE THIS TO YOUR ACTUAL WORKER URL

// Global state
let currentUser = null;
let statusCheckInterval = null;

// ===========================================
// UI ELEMENTS - Add to your HTML
// ===========================================
function addUserSystemUI() {
  const gameContainer = document.querySelector('.game-container');
  
  // Create user panel HTML (shown after login)
  const userPanelHTML = `
    <div id="user-panel" style="
      background: rgba(0,0,0,0.3);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 20px;
      border: 1px solid rgba(255,255,255,0.1);
      display: none;
    ">
      <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="color: #2ecc71;">●</span>
          <span id="user-welcome" style="color: white; font-weight: 600;"></span>
        </div>
        <div style="display: flex; gap: 10px; margin-left: auto;">
          <span style="color: #bdc3c7;">Wins: <span id="user-wins">0</span></span>
          <span style="color: #bdc3c7;">Games: <span id="user-games">0</span></span>
        </div>
        <button id="logout-btn" style="
          background: #e74c3c;
          color: white;
          border: none;
          padding: 5px 15px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        ">Logout</button>
      </div>
    </div>
  `;
  
  // Create login modal HTML with password fields
  const loginModalHTML = `
    <div id="login-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.95);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    ">
      <div style="
        background: linear-gradient(135deg, #2c3e50, #1a252f);
        padding: 30px;
        border-radius: 20px;
        width: 90%;
        max-width: 400px;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      ">
        <h2 style="color: white; text-align: center; margin-bottom: 20px;">🎮 Welcome to Bingo</h2>
        
        <!-- Tabs -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button id="login-tab" style="
            flex: 1;
            padding: 10px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Login</button>
          <button id="register-tab" style="
            flex: 1;
            padding: 10px;
            background: #34495e;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Register</button>
        </div>
        
        <!-- Login Form (with password) -->
        <div id="login-form">
          <input type="text" id="login-username" placeholder="Username" style="
            width: 100%;
            padding: 12px;
            margin-bottom: 10px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
          ">
          
          <input type="password" id="login-password" placeholder="Password" style="
            width: 100%;
            padding: 12px;
            margin-bottom: 15px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
          ">
          
          <button id="login-submit" style="
            width: 100%;
            padding: 12px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">Login</button>
        </div>
        
        <!-- Register Form (with password & confirm) -->
        <div id="register-form" style="display: none;">
          <input type="text" id="register-username" placeholder="Username (3-15 chars)" style="
            width: 100%;
            padding: 12px;
            margin-bottom: 10px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
          ">
          
          <input type="password" id="register-password" placeholder="Password (min 6 chars)" style="
            width: 100%;
            padding: 12px;
            margin-bottom: 10px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
          ">
          
          <input type="password" id="register-confirm-password" placeholder="Confirm Password" style="
            width: 100%;
            padding: 12px;
            margin-bottom: 10px;
            border: 2px solid #34495e;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
          ">
          
          <div id="password-feedback" style="
            font-size: 12px;
            margin-bottom: 15px;
            color: #bdc3c7;
            min-height: 20px;
          "></div>
          
          <button id="register-submit" style="
            width: 100%;
            padding: 12px;
            background: #2ecc71;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">Create Account</button>
        </div>
        
        <div id="login-message" style="
          margin-top: 15px;
          text-align: center;
          color: #e74c3c;
          font-size: 14px;
          min-height: 20px;
        "></div>
      </div>
    </div>
  `;
  
  // Add to page
  gameContainer.insertAdjacentHTML('afterbegin', userPanelHTML);
  document.body.insertAdjacentHTML('beforeend', loginModalHTML);
  
  // Add event listeners
  setupUserSystemEvents();
}

// ===========================================
// EVENT SETUP
// ===========================================
function setupUserSystemEvents() {
  // Tab switching
  document.getElementById('login-tab').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-tab').style.background = '#3498db';
    document.getElementById('register-tab').style.background = '#34495e';
    document.getElementById('login-message').textContent = '';
  });
  
  document.getElementById('register-tab').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('register-tab').style.background = '#3498db';
    document.getElementById('login-tab').style.background = '#34495e';
    document.getElementById('login-message').textContent = '';
  });
  
  // Login submit
  document.getElementById('login-submit').addEventListener('click', handleLogin);
  
  // Register submit
  document.getElementById('register-submit').addEventListener('click', handleRegister);
  
  // Enter key on login
  document.getElementById('login-username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  
  // Enter key on register
  document.getElementById('register-username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  document.getElementById('register-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  document.getElementById('register-confirm-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
  
  // Real-time username check for register
  document.getElementById('register-username').addEventListener('input', debounce(checkUsername, 500));
  
  // Password strength checker
  document.getElementById('register-password').addEventListener('input', checkPasswordStrength);
  
  // Password match checker
  document.getElementById('register-confirm-password').addEventListener('input', checkPasswordMatch);
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

// ===========================================
// PASSWORD VALIDATION FUNCTIONS
// ===========================================

function checkPasswordStrength() {
  const password = document.getElementById('register-password').value;
  const feedback = document.getElementById('password-feedback');
  
  if (password.length === 0) {
    feedback.textContent = '';
    feedback.style.color = '#bdc3c7';
  } else if (password.length < 6) {
    feedback.textContent = '❌ Too short (minimum 6 characters)';
    feedback.style.color = '#e74c3c';
  } else if (password.length >= 6 && password.length < 8) {
    feedback.textContent = '⚠️ Weak password (add more characters)';
    feedback.style.color = '#f39c12';
  } else {
    // Check for strong password (has numbers and letters)
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (hasLetter && hasNumber && password.length >= 8) {
      feedback.textContent = '✓ Strong password';
      feedback.style.color = '#2ecc71';
    } else {
      feedback.textContent = '⚠️ Medium strength (mix letters and numbers)';
      feedback.style.color = '#f39c12';
    }
  }
}

function checkPasswordMatch() {
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm-password').value;
  const feedback = document.getElementById('password-feedback');
  
  if (confirm.length === 0) return;
  
  if (password !== confirm) {
    feedback.textContent = '❌ Passwords do not match';
    feedback.style.color = '#e74c3c';
  } else {
    feedback.textContent = '✓ Passwords match';
    feedback.style.color = '#2ecc71';
  }
}

// ===========================================
// API CALLS
// ===========================================

// Check username availability
async function checkUsername() {
  const username = document.getElementById('register-username').value.trim();
  const feedback = document.getElementById('password-feedback');
  
  if (username.length < 3) {
    feedback.style.color = '#bdc3c7';
    feedback.textContent = 'Minimum 3 characters';
    return;
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/api/check/${encodeURIComponent(username)}`);
    const data = await response.json();
    
    if (!data.valid) {
      feedback.style.color = '#e74c3c';
      feedback.textContent = data.message || 'Invalid username';
    } else if (!data.available) {
      feedback.style.color = '#e74c3c';
      feedback.textContent = '❌ Username already taken';
    } else {
      feedback.style.color = '#2ecc71';
      feedback.textContent = '✓ Username available';
    }
  } catch (error) {
    console.error('Check error:', error);
  }
}

// Handle registration with password
async function handleRegister() {
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const messageEl = document.getElementById('login-message');
  
  // Validation
  if (!username || !password || !confirmPassword) {
    messageEl.textContent = 'Please fill all fields';
    return;
  }
  
  if (username.length < 3 || username.length > 15) {
    messageEl.textContent = 'Username must be 3-15 characters';
    return;
  }
  
  if (password.length < 6) {
    messageEl.textContent = 'Password must be at least 6 characters';
    return;
  }
  
  if (password !== confirmPassword) {
    messageEl.textContent = 'Passwords do not match';
    return;
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      messageEl.style.color = '#2ecc71';
      messageEl.textContent = 'Registration successful! Logging in...';
      currentUser = data.user;
      
      // Clear form
      document.getElementById('register-username').value = '';
      document.getElementById('register-password').value = '';
      document.getElementById('register-confirm-password').value = '';
      
      hideLoginModal();
      startUserSession();
    } else {
      messageEl.style.color = '#e74c3c';
      messageEl.textContent = data.error || 'Registration failed';
    }
  } catch (error) {
    messageEl.textContent = 'Network error. Try again.';
    console.error('Register error:', error);
  }
}

// Handle login with password
async function handleLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const messageEl = document.getElementById('login-message');
  
  if (!username || !password) {
    messageEl.textContent = 'Please enter username and password';
    return;
  }
  
  try {
    const response = await fetch(`${WORKER_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      messageEl.style.color = '#2ecc71';
      messageEl.textContent = 'Login successful!';
      currentUser = data.user;
      
      // Clear form
      document.getElementById('login-username').value = '';
      document.getElementById('login-password').value = '';
      
      hideLoginModal();
      startUserSession();
    } else {
      messageEl.style.color = '#e74c3c';
      messageEl.textContent = data.error || 'Invalid username or password';
      
      // Shake animation for wrong password
      const modal = document.querySelector('#login-modal > div');
      modal.style.animation = 'shake 0.5s';
      setTimeout(() => {
        modal.style.animation = '';
      }, 500);
    }
  } catch (error) {
    messageEl.textContent = 'Network error. Try again.';
    console.error('Login error:', error);
  }
}

// Add shake animation for wrong password
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// Handle logout
async function handleLogout() {
  if (currentUser) {
    // Update status to offline
    try {
      await fetch(`${WORKER_URL}/api/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: currentUser.username, 
          status: 'offline' 
        })
      });
    } catch (error) {
      console.error('Status update error:', error);
    }
    
    // Clear session
    currentUser = null;
    localStorage.removeItem('bingoUser');
    
    // Stop status check
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      statusCheckInterval = null;
    }
    
    // Show login modal
    showLoginModal();
    
    // Hide user panel
    document.getElementById('user-panel').style.display = 'none';
    
    // Hide social and multiplayer panels
    const socialPanel = document.getElementById('social-panel');
    if (socialPanel) socialPanel.style.display = 'none';
    
    const multiplayerPanel = document.getElementById('multiplayer-panel');
    if (multiplayerPanel) multiplayerPanel.style.display = 'none';
    
    // Reset game status
    const gameStatus = document.getElementById('game-status');
    if (gameStatus) {
      gameStatus.textContent = 'Please login to play';
    }
  }
}

// ===========================================
// SESSION MANAGEMENT
// ===========================================

// Start user session after login
function startUserSession() {
  // Save to localStorage (without password)
  const userToSave = { ...currentUser };
  delete userToSave.password; // Ensure password not saved
  localStorage.setItem('bingoUser', JSON.stringify(userToSave));
  
  // Update UI
  document.getElementById('user-welcome').textContent = `Welcome, ${currentUser.username}!`;
  document.getElementById('user-wins').textContent = currentUser.wins || 0;
  document.getElementById('user-games').textContent = currentUser.gamesPlayed || 0;
  document.getElementById('user-panel').style.display = 'block';
  
  // Update game status
  const gameStatus = document.getElementById('game-status');
  if (gameStatus) {
    gameStatus.textContent = `${currentUser.username}, click "Your Player" to begin`;
  }
  
  // Show social and multiplayer panels
  const socialPanel = document.getElementById('social-panel');
  if (socialPanel) {
    socialPanel.style.display = 'block';
    // Trigger social system initialization
    if (typeof startSocialSystem === 'function') {
      startSocialSystem();
    }
  }
  
  const multiplayerPanel = document.getElementById('multiplayer-panel');
  if (multiplayerPanel) {
    multiplayerPanel.style.display = 'block';
    // Trigger multiplayer system initialization
    if (typeof fetchRooms === 'function') {
      fetchRooms();
    }
  }
  
  // Start periodic status update (every 30 seconds)
  statusCheckInterval = setInterval(() => {
    updateUserStatus();
  }, 30000);
  
  // Update status immediately
  updateUserStatus();
  
  // Handle page unload
  window.addEventListener('beforeunload', () => {
    if (currentUser) {
      // Use sendBeacon for reliable last status
      const data = JSON.stringify({ 
        username: currentUser.username, 
        status: 'offline' 
      });
      navigator.sendBeacon(`${WORKER_URL}/api/status`, 
        new Blob([data], { type: 'application/json' })
      );
    }
  });
  
  // Dispatch event for other scripts
  document.dispatchEvent(new CustomEvent('userLoggedIn', { 
    detail: { username: currentUser.username } 
  }));
}

// Update user online status
async function updateUserStatus() {
  if (!currentUser) return;
  
  try {
    await fetch(`${WORKER_URL}/api/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: currentUser.username, 
        status: 'online' 
      })
    });
  } catch (error) {
    console.error('Status update error:', error);
  }
}

// ===========================================
// UI HELPERS
// ===========================================

function hideLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

function showLoginModal() {
  document.getElementById('login-modal').style.display = 'flex';
  
  // Reset forms
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('register-username').value = '';
  document.getElementById('register-password').value = '';
  document.getElementById('register-confirm-password').value = '';
  document.getElementById('login-message').textContent = '';
  document.getElementById('password-feedback').textContent = '';
  
  // Show login tab by default
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-tab').style.background = '#3498db';
  document.getElementById('register-tab').style.background = '#34495e';
}

// Check for saved session
function checkSavedSession() {
  const savedUser = localStorage.getItem('bingoUser');
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      // Verify with server (but don't need password for session check)
      fetch(`${WORKER_URL}/api/user/${encodeURIComponent(currentUser.username)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            currentUser = data.user;
            hideLoginModal();
            startUserSession();
          } else {
            // Session invalid
            localStorage.removeItem('bingoUser');
            showLoginModal();
          }
        })
        .catch(() => {
          // Offline mode - use saved data
          hideLoginModal();
          startUserSession();
        });
    } catch (e) {
      showLoginModal();
    }
  } else {
    showLoginModal();
  }
}

// Utility: debounce function
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
// INITIALIZATION
// ===========================================

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  // Add UI elements
  addUserSystemUI();
  
  // Check for saved session
  checkSavedSession();
  
  // Modify original game start button
  modifyGameStartButton();
});

// Modify original game button to use username
function modifyGameStartButton() {
  const originalStartBtn = document.getElementById('start-btn');
  if (originalStartBtn) {
    originalStartBtn.addEventListener('click', function(e) {
      if (!currentUser) {
        e.preventDefault();
        showLoginModal();
        return false;
      }
    });
  }
  
  const yourPlayerBtn = document.getElementById('your-player-btn');
  if (yourPlayerBtn) {
    yourPlayerBtn.addEventListener('click', function() {
      if (!currentUser) {
        showLoginModal();
        return false;
      }
    });
  }
}

// Export for other scripts
window.currentUser = currentUser;
window.handleLogout = handleLogout;
window.startUserSession = startUserSession;
