// ===========================================
// CLOUDFLARE WORKER - USER SYSTEM API
// ===========================================

// Firebase Configuration (SET YOUR OWN)
const FIREBASE_CONFIG = {
  databaseURL: 'https://your-project-id.firebaseio.com', // REPLACE THIS
  secret: 'YOUR_FIREBASE_SECRET' // Get from Project Settings > Service Accounts > Database Secrets
};

// CORS Headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// ===========================================
// MAIN WORKER HANDLER
// ===========================================
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // ============= USER API ENDPOINTS =============
    
    // REGISTER NEW USER - POST /api/register
    if (path === '/api/register' && request.method === 'POST') {
      return await handleRegister(request);
    }
    
    // LOGIN USER - POST /api/login
    if (path === '/api/login' && request.method === 'POST') {
      return await handleLogin(request);
    }
    
    // UPDATE STATUS - POST /api/status
    if (path === '/api/status' && request.method === 'POST') {
      return await handleStatusUpdate(request);
    }
    
    // GET USER INFO - GET /api/user/:username
    if (path.startsWith('/api/user/') && request.method === 'GET') {
      const username = path.split('/')[3];
      return await handleGetUser(username);
    }
    
    // CHECK USERNAME AVAILABILITY - GET /api/check/:username
    if (path.startsWith('/api/check/') && request.method === 'GET') {
      const username = path.split('/')[3];
      return await handleCheckUsername(username);
    }
    
    // NOT FOUND
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: corsHeaders
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Server Error', 
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

async function fetchFirebase(path, method = 'GET', data = null) {
  const url = `${FIREBASE_CONFIG.databaseURL}${path}.json?auth=${FIREBASE_CONFIG.secret}`;
  
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(url, options);
  return await response.json();
}

// Validate username (only letters, numbers, underscore, 3-15 chars)
function isValidUsername(username) {
  const regex = /^[a-zA-Z0-9_]{3,15}$/;
  return regex.test(username);
}

// ===========================================
// USER REGISTRATION HANDLER
// ===========================================
async function handleRegister(request) {
  const { username } = await request.json();
  
  // Validate username
  if (!username || !isValidUsername(username)) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid username. Use 3-15 characters (letters, numbers, underscore only)' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check if username already exists
  const existingUser = await fetchFirebase(`/usernames/${username.toLowerCase()}`);
  
  if (existingUser) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username already taken' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Create user object
  const timestamp = Date.now();
  const userData = {
    username: username,
    status: 'online',
    lastSeen: timestamp,
    createdAt: timestamp,
    wins: 0,
    gamesPlayed: 0,
    friends: {}
  };
  
  // Save to Firebase
  const userKey = `user_${username.toLowerCase()}`;
  
  // Use transaction to ensure atomic operation
  await fetchFirebase(`/users/${userKey}`, 'PUT', userData);
  await fetchFirebase(`/usernames/${username.toLowerCase()}`, 'PUT', userKey);
  
  return new Response(JSON.stringify({ 
    success: true, 
    user: userData,
    message: 'Registration successful!'
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// USER LOGIN HANDLER
// ===========================================
async function handleLogin(request) {
  const { username } = await request.json();
  
  if (!username) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username required' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Find user
  const userKey = await fetchFirebase(`/usernames/${username.toLowerCase()}`);
  
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Get user data
  const userData = await fetchFirebase(`/users/${userKey}`);
  
  if (!userData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User data corrupted' 
    }), { status: 500, headers: corsHeaders });
  }
  
  // Update status to online
  await fetchFirebase(`/users/${userKey}/status`, 'PUT', 'online');
  await fetchFirebase(`/users/${userKey}/lastSeen`, 'PUT', Date.now());
  
  userData.status = 'online';
  userData.lastSeen = Date.now();
  
  return new Response(JSON.stringify({ 
    success: true, 
    user: userData,
    message: `Welcome back, ${username}!`
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// STATUS UPDATE HANDLER
// ===========================================
async function handleStatusUpdate(request) {
  const { username, status } = await request.json();
  
  if (!username || !status || (status !== 'online' && status !== 'offline')) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid request' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await fetchFirebase(`/usernames/${username.toLowerCase()}`);
  
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Update status
  await fetchFirebase(`/users/${userKey}/status`, 'PUT', status);
  await fetchFirebase(`/users/${userKey}/lastSeen`, 'PUT', Date.now());
  
  return new Response(JSON.stringify({ 
    success: true,
    message: `Status updated to ${status}`
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// GET USER INFO HANDLER
// ===========================================
async function handleGetUser(username) {
  const userKey = await fetchFirebase(`/usernames/${username.toLowerCase()}`);
  
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const userData = await fetchFirebase(`/users/${userKey}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    user: userData 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// CHECK USERNAME HANDLER
// ===========================================
async function handleCheckUsername(username) {
  if (!isValidUsername(username)) {
    return new Response(JSON.stringify({ 
      available: false,
      valid: false,
      message: 'Invalid format. Use 3-15 chars (letters, numbers, underscore)'
    }), { status: 200, headers: corsHeaders });
  }
  
  const existingUser = await fetchFirebase(`/usernames/${username.toLowerCase()}`);
  
  return new Response(JSON.stringify({ 
    available: !existingUser,
    valid: true
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// ADD THESE TO EXISTING WORKER.JS
// Place after existing endpoints in handleRequest()
// ===========================================

// GET ONLINE USERS - GET /api/online-users
if (path === '/api/online-users' && request.method === 'GET') {
  return await handleGetOnlineUsers();
}

// SEND FRIEND REQUEST - POST /api/friend/request
if (path === '/api/friend/request' && request.method === 'POST') {
  return await handleFriendRequest(request);
}

// ACCEPT/DECLINE FRIEND REQUEST - POST /api/friend/respond
if (path === '/api/friend/respond' && request.method === 'POST') {
  return await handleFriendResponse(request);
}

// GET FRIEND REQUESTS - GET /api/friend/requests/:username
if (path.startsWith('/api/friend/requests/') && request.method === 'GET') {
  const username = path.split('/')[4];
  return await handleGetFriendRequests(username);
}

// GET FRIEND LIST - GET /api/friends/:username
if (path.startsWith('/api/friends/') && request.method === 'GET') {
  const username = path.split('/')[3];
  return await handleGetFriends(username);
}

// REMOVE FRIEND - DELETE /api/friend/remove
if (path === '/api/friend/remove' && request.method === 'DELETE') {
  return await handleRemoveFriend(request);
}

// ===========================================
// NEW HELPER FUNCTIONS
// ===========================================

// Get user key from username
async function getUserKey(username) {
  return await fetchFirebase(`/usernames/${username.toLowerCase()}`);
}

// ===========================================
// ONLINE USERS HANDLER
// ===========================================
async function handleGetOnlineUsers() {
  // Get all users
  const users = await fetchFirebase('/users');
  
  if (!users) {
    return new Response(JSON.stringify({ 
      success: true, 
      onlineUsers: [] 
    }), { status: 200, headers: corsHeaders });
  }
  
  // Filter online users (status = online, lastSeen within last 2 minutes)
  const now = Date.now();
  const twoMinutesAgo = now - (2 * 60 * 1000);
  
  const onlineUsers = [];
  
  for (const [userKey, userData] of Object.entries(users)) {
    if (userData.status === 'online' && userData.lastSeen > twoMinutesAgo) {
      onlineUsers.push({
        username: userData.username,
        lastSeen: userData.lastSeen,
        wins: userData.wins || 0
      });
    }
  }
  
  // Sort by wins (highest first)
  onlineUsers.sort((a, b) => b.wins - a.wins);
  
  return new Response(JSON.stringify({ 
    success: true, 
    onlineUsers,
    count: onlineUsers.length
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// SEND FRIEND REQUEST
// ===========================================
async function handleFriendRequest(request) {
  const { fromUsername, toUsername } = await request.json();
  
  if (!fromUsername || !toUsername || fromUsername === toUsername) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid usernames' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Get user keys
  const fromUserKey = await getUserKey(fromUsername);
  const toUserKey = await getUserKey(toUsername);
  
  if (!fromUserKey || !toUserKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Check if already friends
  const fromUser = await fetchFirebase(`/users/${fromUserKey}`);
  if (fromUser.friends && fromUser.friends[toUsername]?.status === 'accepted') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Already friends' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check if request already exists
  const existingRequest = await fetchFirebase(`/users/${toUserKey}/friendRequests/${fromUsername}`);
  if (existingRequest) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Friend request already sent' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Create friend request
  const timestamp = Date.now();
  const requestData = {
    from: fromUsername,
    timestamp: timestamp,
    status: 'pending'
  };
  
  // Save to recipient's friendRequests
  await fetchFirebase(`/users/${toUserKey}/friendRequests/${fromUsername}`, 'PUT', requestData);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: `Friend request sent to ${toUsername}` 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// RESPOND TO FRIEND REQUEST
// ===========================================
async function handleFriendResponse(request) {
  const { username, fromUsername, accept } = await request.json();
  
  if (!username || !fromUsername) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid request' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  const fromUserKey = await getUserKey(fromUsername);
  
  if (!userKey || !fromUserKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Check if request exists
  const requestExists = await fetchFirebase(`/users/${userKey}/friendRequests/${fromUsername}`);
  if (!requestExists) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Friend request not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const timestamp = Date.now();
  
  if (accept) {
    // Add to both users' friends lists
    await fetchFirebase(`/users/${userKey}/friends/${fromUsername}`, 'PUT', {
      since: timestamp,
      status: 'accepted'
    });
    
    await fetchFirebase(`/users/${fromUserKey}/friends/${username}`, 'PUT', {
      since: timestamp,
      status: 'accepted'
    });
  }
  
  // Remove the friend request
  await fetchFirebase(`/users/${userKey}/friendRequests/${fromUsername}`, 'DELETE');
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: accept ? `You are now friends with ${fromUsername}` : `Friend request from ${fromUsername} declined`
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// GET FRIEND REQUESTS
// ===========================================
async function handleGetFriendRequests(username) {
  const userKey = await getUserKey(username);
  
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const requests = await fetchFirebase(`/users/${userKey}/friendRequests`);
  
  const requestsList = [];
  if (requests) {
    for (const [fromUsername, requestData] of Object.entries(requests)) {
      requestsList.push({
        from: fromUsername,
        timestamp: requestData.timestamp
      });
    }
  }
  
  // Sort by newest first
  requestsList.sort((a, b) => b.timestamp - a.timestamp);
  
  return new Response(JSON.stringify({ 
    success: true, 
    requests: requestsList 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// GET FRIEND LIST
// ===========================================
async function handleGetFriends(username) {
  const userKey = await getUserKey(username);
  
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const userData = await fetchFirebase(`/users/${userKey}`);
  const friends = [];
  
  if (userData.friends) {
    for (const [friendUsername, friendData] of Object.entries(userData.friends)) {
      if (friendData.status === 'accepted') {
        // Get friend's current status
        const friendKey = await getUserKey(friendUsername);
        const friendData = await fetchFirebase(`/users/${friendKey}`);
        
        friends.push({
          username: friendUsername,
          since: friendData.since,
          status: friendData?.status || 'offline',
          wins: friendData?.wins || 0
        });
      }
    }
  }
  
  // Sort by online first, then by username
  friends.sort((a, b) => {
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    return a.username.localeCompare(b.username);
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    friends 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// REMOVE FRIEND
// ===========================================
async function handleRemoveFriend(request) {
  const { username, friendUsername } = await request.json();
  
  if (!username || !friendUsername) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid request' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  const friendKey = await getUserKey(friendUsername);
  
  if (!userKey || !friendKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Remove from both users' friends lists
  await fetchFirebase(`/users/${userKey}/friends/${friendUsername}`, 'DELETE');
  await fetchFirebase(`/users/${friendKey}/friends/${username}`, 'DELETE');
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: `Removed ${friendUsername} from friends` 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// ADD THESE TO EXISTING WORKER.JS
// Place after existing endpoints in handleRequest()
// ===========================================

// ROOM ENDPOINTS
if (path === '/api/rooms/create' && request.method === 'POST') return await handleCreateRoom(request);
if (path === '/api/rooms/list' && request.method === 'GET') return await handleListRooms(request);
if (path === '/api/rooms/join' && request.method === 'POST') return await handleJoinRoom(request);
if (path === '/api/rooms/leave' && request.method === 'POST') return await handleLeaveRoom(request);
if (path === '/api/rooms/ready' && request.method === 'POST') return await handlePlayerReady(request);
if (path === '/api/rooms/start' && request.method === 'POST') return await handleStartGame(request);
if (path === '/api/rooms/state' && request.method === 'POST') return await handleGameState(request);
if (path === '/api/rooms/move' && request.method === 'POST') return await handlePlayerMove(request);
if (path.startsWith('/api/rooms/') && request.method === 'GET') {
  const roomId = path.split('/')[3];
  return await handleGetRoom(roomId);
}

// ===========================================
// ROOM HELPERS
// ===========================================

// Generate random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Validate room exists
async function roomExists(roomId) {
  const room = await fetchFirebase(`/rooms/room_${roomId}`);
  return !!room;
}

// ===========================================
// CREATE ROOM
// ===========================================
async function handleCreateRoom(request) {
  const { username, roomName, isPrivate, password, maxPlayers = 2 } = await request.json();
  
  if (!username) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username required' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check if user already in a room
  const userKey = await getUserKey(username);
  const userData = await fetchFirebase(`/users/${userKey}`);
  if (userData.currentRoom) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Already in a room' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Generate unique room code
  let roomId;
  let attempts = 0;
  do {
    roomId = generateRoomCode();
    attempts++;
    if (attempts > 10) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to generate unique room code' 
      }), { status: 500, headers: corsHeaders });
    }
  } while (await roomExists(roomId));
  
  const timestamp = Date.now();
  const roomKey = `room_${roomId}`;
  
  // Create room object
  const roomData = {
    roomId: roomId,
    roomName: roomName || `${username}'s Room`,
    host: username,
    createdAt: timestamp,
    status: 'waiting',
    isPrivate: isPrivate || false,
    password: isPrivate ? password : null,
    maxPlayers: maxPlayers || 2,
    players: {
      [username]: {
        username: username,
        ready: false,
        score: 0,
        joinedAt: timestamp
      }
    },
    gameState: {
      numbers: Array.from({length: 25}, (_, i) => i + 1),
      markedCells: {},
      currentTurn: username,
      winner: null,
      startTime: null,
      endTime: null
    }
  };
  
  // Save to Firebase
  await fetchFirebase(`/rooms/${roomKey}`, 'PUT', roomData);
  
  // Add to room list for discovery
  await fetchFirebase(`/roomList/${roomKey}`, 'PUT', {
    roomId: roomId,
    roomName: roomData.roomName,
    host: username,
    playerCount: 1,
    maxPlayers: maxPlayers,
    status: 'waiting',
    isPrivate: isPrivate || false
  });
  
  // Update user's current room
  await fetchFirebase(`/users/${userKey}/currentRoom`, 'PUT', roomId);
  
  return new Response(JSON.stringify({ 
    success: true, 
    room: roomData,
    message: `Room created! Code: ${roomId}`
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// LIST ROOMS
// ===========================================
async function handleListRooms(request) {
  const url = new URL(request.url);
  const includePrivate = url.searchParams.get('includePrivate') === 'true';
  const status = url.searchParams.get('status') || 'waiting';
  
  const rooms = await fetchFirebase('/roomList');
  
  if (!rooms) {
    return new Response(JSON.stringify({ 
      success: true, 
      rooms: [] 
    }), { status: 200, headers: corsHeaders });
  }
  
  // Filter rooms
  const roomList = [];
  for (const [roomKey, roomData] of Object.entries(rooms)) {
    if (roomData.status === status) {
      if (!roomData.isPrivate || includePrivate) {
        roomList.push(roomData);
      }
    }
  }
  
  // Sort by createdAt (newest first)
  roomList.sort((a, b) => b.createdAt - a.createdAt);
  
  return new Response(JSON.stringify({ 
    success: true, 
    rooms: roomList 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// JOIN ROOM
// ===========================================
async function handleJoinRoom(request) {
  const { username, roomId, password } = await request.json();
  
  if (!username || !roomId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username and room ID required' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  const roomKey = `room_${roomId}`;
  
  // Check if room exists
  const roomData = await fetchFirebase(`/rooms/${roomKey}`);
  if (!roomData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Check if room is full
  const playerCount = Object.keys(roomData.players || {}).length;
  if (playerCount >= roomData.maxPlayers) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room is full' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check if game already started
  if (roomData.status !== 'waiting') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Game already in progress' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check password if private
  if (roomData.isPrivate && roomData.password !== password) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Incorrect password' 
    }), { status: 403, headers: corsHeaders });
  }
  
  // Check if user already in room
  if (roomData.players && roomData.players[username]) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Already in this room' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Add player to room
  const timestamp = Date.now();
  await fetchFirebase(`/rooms/${roomKey}/players/${username}`, 'PUT', {
    username: username,
    ready: false,
    score: 0,
    joinedAt: timestamp
  });
  
  // Update room list
  await fetchFirebase(`/roomList/${roomKey}/playerCount`, 'PUT', playerCount + 1);
  
  // Update user's current room
  await fetchFirebase(`/users/${userKey}/currentRoom`, 'PUT', roomId);
  
  // Get updated room data
  const updatedRoom = await fetchFirebase(`/rooms/${roomKey}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    room: updatedRoom,
    message: `Joined room ${roomId}`
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// LEAVE ROOM
// ===========================================
async function handleLeaveRoom(request) {
  const { username, roomId } = await request.json();
  
  if (!username || !roomId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username and room ID required' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  const roomKey = `room_${roomId}`;
  
  const roomData = await fetchFirebase(`/rooms/${roomKey}`);
  if (!roomData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Remove player from room
  await fetchFirebase(`/rooms/${roomKey}/players/${username}`, 'DELETE');
  
  const playerCount = Object.keys(roomData.players || {}).length - 1;
  
  if (playerCount === 0) {
    // Delete room if empty
    await fetchFirebase(`/rooms/${roomKey}`, 'DELETE');
    await fetchFirebase(`/roomList/${roomKey}`, 'DELETE');
  } else {
    // Update room list
    await fetchFirebase(`/roomList/${roomKey}/playerCount`, 'PUT', playerCount);
    
    // If host left, assign new host
    if (roomData.host === username) {
      const remainingPlayers = Object.keys(roomData.players).filter(p => p !== username);
      if (remainingPlayers.length > 0) {
        const newHost = remainingPlayers[0];
        await fetchFirebase(`/rooms/${roomKey}/host`, 'PUT', newHost);
        await fetchFirebase(`/roomList/${roomKey}/host`, 'PUT', newHost);
      }
    }
  }
  
  // Clear user's current room
  await fetchFirebase(`/users/${userKey}/currentRoom`, 'DELETE');
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Left room successfully' 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// PLAYER READY
// ===========================================
async function handlePlayerReady(request) {
  const { username, roomId, ready } = await request.json();
  
  if (!username || !roomId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid request' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const roomKey = `room_${roomId}`;
  const roomData = await fetchFirebase(`/rooms/${roomKey}`);
  
  if (!roomData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Update ready status
  await fetchFirebase(`/rooms/${roomKey}/players/${username}/ready`, 'PUT', ready);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: ready ? 'Ready!' : 'Not ready'
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// START GAME
// ===========================================
async function handleStartGame(request) {
  const { username, roomId } = await request.json();
  
  if (!username || !roomId) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid request' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const roomKey = `room_${roomId}`;
  const roomData = await fetchFirebase(`/rooms/${roomKey}`);
  
  if (!roomData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Check if user is host
  if (roomData.host !== username) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Only host can start game' 
    }), { status: 403, headers: corsHeaders });
  }
  
  // Check if all players are ready
  const players = roomData.players || {};
  const allReady = Object.values(players).every(p => p.ready === true);
  
  if (!allReady) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Not all players ready' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Shuffle numbers for game start
  const numbers = Array.from({length: 25}, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  
  // Update game state
  const timestamp = Date.now();
  await fetchFirebase(`/rooms/${roomKey}/status`, 'PUT', 'playing');
  await fetchFirebase(`/rooms/${roomKey}/gameState`, 'PUT', {
    numbers: numbers,
    markedCells: {},
    currentTurn: roomData.host,
    winner: null,
    startTime: timestamp,
    endTime: null
  });
  
  // Update room list
  await fetchFirebase(`/roomList/${roomKey}/status`, 'PUT', 'playing');
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Game started!',
    gameState: {
      numbers: numbers,
      currentTurn: roomData.host,
      startTime: timestamp
    }
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// PLAYER MOVE
// ===========================================
async function handlePlayerMove(request) {
  const { username, roomId, number } = await request.json();
  
  if (!username || !roomId || !number) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Invalid move' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const roomKey = `room_${roomId}`;
  const roomData = await fetchFirebase(`/rooms/${roomKey}`);
  
  if (!roomData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Check if game is active
  if (roomData.status !== 'playing') {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Game not in progress' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check if it's player's turn
  if (roomData.gameState.currentTurn !== username) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Not your turn' 
    }), { status: 403, headers: corsHeaders });
  }
  
  // Check if number already marked
  if (roomData.gameState.markedCells[number]) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Number already marked' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Mark the cell
  await fetchFirebase(`/rooms/${roomKey}/gameState/markedCells/${number}`, 'PUT', username);
  
  // Check for completed lines (5 in a row)
  const markedCells = { ...roomData.gameState.markedCells, [number]: username };
  const linesCompleted = checkForCompletedLines(markedCells, username);
  
  if (linesCompleted > 0) {
    // Update player score
    const currentScore = roomData.players[username]?.score || 0;
    const newScore = currentScore + linesCompleted;
    await fetchFirebase(`/rooms/${roomKey}/players/${username}/score`, 'PUT', newScore);
    
    // Check for winner (score >= 5)
    if (newScore >= 5) {
      await fetchFirebase(`/rooms/${roomKey}/status`, 'PUT', 'finished');
      await fetchFirebase(`/rooms/${roomKey}/gameState/winner`, 'PUT', username);
      await fetchFirebase(`/rooms/${roomKey}/gameState/endTime`, 'PUT', Date.now());
      await fetchFirebase(`/roomList/${roomKey}/status`, 'PUT', 'finished');
      
      // Update user stats
      await updateUserStats(username, true);
    }
  }
  
  // Determine next turn (simple round-robin)
  const players = Object.keys(roomData.players);
  const currentIndex = players.indexOf(username);
  const nextPlayer = players[(currentIndex + 1) % players.length];
  await fetchFirebase(`/rooms/${roomKey}/gameState/currentTurn`, 'PUT', nextPlayer);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Move registered',
    linesCompleted,
    nextTurn: nextPlayer
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// GET ROOM STATE
// ===========================================
async function handleGetRoom(roomId) {
  const roomKey = `room_${roomId}`;
  const roomData = await fetchFirebase(`/rooms/${roomKey}`);
  
  if (!roomData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    room: roomData 
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// HELPER: Check for completed lines
// ===========================================
function checkForCompletedLines(markedCells, player) {
  // Create 5x5 grid
  const grid = Array(5).fill().map(() => Array(5).fill(null));
  
  // Fill grid with player marks
  Object.entries(markedCells).forEach(([num, playerName]) => {
    const index = parseInt(num) - 1;
    const row = Math.floor(index / 5);
    const col = index % 5;
    grid[row][col] = playerName;
  });
  
  let linesCompleted = 0;
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (grid[row].every(cell => cell === player)) {
      linesCompleted++;
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    let columnComplete = true;
    for (let row = 0; row < 5; row++) {
      if (grid[row][col] !== player) {
        columnComplete = false;
        break;
      }
    }
    if (columnComplete) linesCompleted++;
  }
  
  // Check diagonal (top-left to bottom-right)
  let diag1Complete = true;
  for (let i = 0; i < 5; i++) {
    if (grid[i][i] !== player) {
      diag1Complete = false;
      break;
    }
  }
  if (diag1Complete) linesCompleted++;
  
  // Check diagonal (top-right to bottom-left)
  let diag2Complete = true;
  for (let i = 0; i < 5; i++) {
    if (grid[i][4 - i] !== player) {
      diag2Complete = false;
      break;
    }
  }
  if (diag2Complete) linesCompleted++;
  
  return linesCompleted;
}

// ===========================================
// HELPER: Update user stats
// ===========================================
async function updateUserStats(username, won) {
  const userKey = await getUserKey(username);
  
  if (won) {
    // Increment wins
    const currentWins = await fetchFirebase(`/users/${userKey}/wins`) || 0;
    await fetchFirebase(`/users/${userKey}/wins`, 'PUT', currentWins + 1);
  }
  
  // Increment games played
  const currentGames = await fetchFirebase(`/users/${userKey}/gamesPlayed`) || 0;
  await fetchFirebase(`/users/${userKey}/gamesPlayed`, 'PUT', currentGames + 1);
}

// ===========================================
// ADD THESE TO EXISTING WORKER.JS
// Place after existing endpoints in handleRequest()
// ===========================================

// LEADERBOARD ENDPOINTS
if (path === '/api/leaderboard' && request.method === 'GET') return await handleGetLeaderboard(request);
if (path === '/api/leaderboard/update' && request.method === 'POST') return await handleUpdateLeaderboard(request);

// CHAT ENDPOINTS
if (path === '/api/chat/send' && request.method === 'POST') return await handleSendMessage(request);
if (path === '/api/chat/messages' && request.method === 'GET') return await handleGetMessages(request);
if (path.startsWith('/api/chat/room/') && request.method === 'GET') {
  const roomId = path.split('/')[4];
  const limit = new URL(request.url).searchParams.get('limit') || 50;
  return await handleGetRoomMessages(roomId, limit);
}

// HISTORY ENDPOINTS
if (path === '/api/history/add' && request.method === 'POST') return await handleAddMatchHistory(request);
if (path.startsWith('/api/history/') && request.method === 'GET') {
  const username = path.split('/')[3];
  const limit = new URL(request.url).searchParams.get('limit') || 20;
  const offset = new URL(request.url).searchParams.get('offset') || 0;
  return await handleGetMatchHistory(username, limit, offset);
}
if (path === '/api/history/opponents' && request.method === 'GET') {
  const username = new URL(request.url).searchParams.get('username');
  return await handleGetPreviousOpponents(username);
}

// ===========================================
// LEADERBOARD HANDLERS
// ===========================================

async function handleGetLeaderboard(request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const offset = parseInt(url.searchParams.get('offset')) || 0;
  
  const leaderboard = await fetchFirebase('/leaderboard');
  
  if (!leaderboard) {
    return new Response(JSON.stringify({ 
      success: true, 
      entries: [],
      total: 0
    }), { status: 200, headers: corsHeaders });
  }
  
  // Convert to array and sort by wins (descending)
  let entries = Object.values(leaderboard);
  entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return (b.gamesPlayed - a.gamesPlayed);
  });
  
  const total = entries.length;
  entries = entries.slice(offset, offset + limit);
  
  // Add rank
  entries = entries.map((entry, index) => ({
    ...entry,
    rank: offset + index + 1
  }));
  
  return new Response(JSON.stringify({ 
    success: true, 
    entries,
    total,
    hasMore: (offset + limit) < total
  }), { status: 200, headers: corsHeaders });
}

async function handleUpdateLeaderboard(request) {
  const { username, won } = await request.json();
  
  if (!username) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username required' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  // Get current leaderboard entry
  let leaderboardEntry = await fetchFirebase(`/leaderboard/${userKey}`) || {
    username: username,
    wins: 0,
    gamesPlayed: 0,
    winRate: 0
  };
  
  // Update stats
  leaderboardEntry.gamesPlayed += 1;
  if (won) {
    leaderboardEntry.wins += 1;
  }
  leaderboardEntry.winRate = Math.round((leaderboardEntry.wins / leaderboardEntry.gamesPlayed) * 100);
  leaderboardEntry.lastUpdated = Date.now();
  
  // Save to leaderboard
  await fetchFirebase(`/leaderboard/${userKey}`, 'PUT', leaderboardEntry);
  
  return new Response(JSON.stringify({ 
    success: true, 
    entry: leaderboardEntry
  }), { status: 200, headers: corsHeaders });
}

// ===========================================
// CHAT HANDLERS
// ===========================================

async function handleSendMessage(request) {
  const { roomId, from, message, type = 'text' } = await request.json();
  
  if (!roomId || !from || !message) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Missing required fields' 
    }), { status: 400, headers: corsHeaders });
  }
  
  // Check if room exists
  const roomExists = await fetchFirebase(`/rooms/room_${roomId}`);
  if (!roomExists) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Room not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const timestamp = Date.now();
  const messageId = `msg_${timestamp}`;
  
  const messageData = {
    from,
    message,
    timestamp,
    type
  };
  
  // Save message to room chat
  await fetchFirebase(`/chat/room_${roomId}/messages/${messageId}`, 'PUT', messageData);
  
  // Auto-delete old messages (keep last 100)
  await cleanupOldMessages(roomId);
  
  return new Response(JSON.stringify({ 
    success: true, 
    messageId,
    timestamp
  }), { status: 200, headers: corsHeaders });
}

async function handleGetRoomMessages(roomId, limit = 50) {
  const messages = await fetchFirebase(`/chat/room_${roomId}/messages`);
  
  if (!messages) {
    return new Response(JSON.stringify({ 
      success: true, 
      messages: [] 
    }), { status: 200, headers: corsHeaders });
  }
  
  // Convert to array and sort by timestamp (oldest first)
  let messageList = Object.entries(messages).map(([id, data]) => ({
    id,
    ...data
  }));
  
  messageList.sort((a, b) => a.timestamp - b.timestamp);
  
  // Apply limit (get most recent messages)
  if (messageList.length > limit) {
    messageList = messageList.slice(-limit);
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    messages: messageList 
  }), { status: 200, headers: corsHeaders });
}

async function cleanupOldMessages(roomId) {
  const messages = await fetchFirebase(`/chat/room_${roomId}/messages`);
  
  if (!messages) return;
  
  const messageList = Object.entries(messages);
  if (messageList.length > 100) {
    // Sort by timestamp (oldest first)
    messageList.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Delete oldest messages (keep last 100)
    const toDelete = messageList.slice(0, messageList.length - 100);
    
    for (const [messageId] of toDelete) {
      await fetchFirebase(`/chat/room_${roomId}/messages/${messageId}`, 'DELETE');
    }
  }
}

// ===========================================
// MATCH HISTORY HANDLERS
// ===========================================

async function handleAddMatchHistory(request) {
  const { username, matchData } = await request.json();
  
  if (!username || !matchData) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Missing required fields' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const matchId = `match_${Date.now()}`;
  const matchEntry = {
    matchId,
    ...matchData,
    date: matchData.date || Date.now()
  };
  
  // Save to user's match history
  await fetchFirebase(`/matchHistory/${userKey}/matches/${matchId}`, 'PUT', matchEntry);
  
  // Update leaderboard
  await handleUpdateLeaderboard({
    json: async () => ({ 
      username, 
      won: matchData.result === 'win' 
    })
  });
  
  // Also add to opponent's history if provided
  if (matchData.opponent) {
    const opponentKey = await getUserKey(matchData.opponent);
    if (opponentKey) {
      const opponentMatch = {
        matchId: `${matchId}_opponent`,
        ...matchData,
        username: matchData.opponent,
        opponent: username,
        result: matchData.result === 'win' ? 'loss' : (matchData.result === 'loss' ? 'win' : 'draw'),
        date: matchData.date || Date.now()
      };
      await fetchFirebase(`/matchHistory/${opponentKey}/matches/${matchId}_opponent`, 'PUT', opponentMatch);
    }
  }
  
  return new Response(JSON.stringify({ 
    success: true, 
    matchId
  }), { status: 200, headers: corsHeaders });
}

async function handleGetMatchHistory(username, limit = 20, offset = 0) {
  const userKey = await getUserKey(username);
  
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const history = await fetchFirebase(`/matchHistory/${userKey}/matches`);
  
  if (!history) {
    return new Response(JSON.stringify({ 
      success: true, 
      matches: [],
      total: 0
    }), { status: 200, headers: corsHeaders });
  }
  
  // Convert to array and sort by date (newest first)
  let matches = Object.values(history);
  matches.sort((a, b) => b.date - a.date);
  
  const total = matches.length;
  matches = matches.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  return new Response(JSON.stringify({ 
    success: true, 
    matches,
    total,
    hasMore: (parseInt(offset) + parseInt(limit)) < total
  }), { status: 200, headers: corsHeaders });
}

async function handleGetPreviousOpponents(request) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');
  
  if (!username) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Username required' 
    }), { status: 400, headers: corsHeaders });
  }
  
  const userKey = await getUserKey(username);
  if (!userKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'User not found' 
    }), { status: 404, headers: corsHeaders });
  }
  
  const history = await fetchFirebase(`/matchHistory/${userKey}/matches`);
  
  if (!history) {
    return new Response(JSON.stringify({ 
      success: true, 
      opponents: [] 
    }), { status: 200, headers: corsHeaders });
  }
  
  // Extract unique opponents with match count
  const opponentsMap = new Map();
  
  Object.values(history).forEach(match => {
    if (match.opponent) {
      if (!opponentsMap.has(match.opponent)) {
        opponentsMap.set(match.opponent, {
          username: match.opponent,
          matches: 0,
          wins: 0,
          losses: 0,
          lastPlayed: match.date
        });
      }
      
      const stats = opponentsMap.get(match.opponent);
      stats.matches += 1;
      if (match.result === 'win') stats.wins += 1;
      if (match.result === 'loss') stats.losses += 1;
      if (match.date > stats.lastPlayed) stats.lastPlayed = match.date;
    }
  });
  
  const opponents = Array.from(opponentsMap.values());
  
  // Sort by last played (most recent first)
  opponents.sort((a, b) => b.lastPlayed - a.lastPlayed);
  
  return new Response(JSON.stringify({ 
    success: true, 
    opponents
  }), { status: 200, headers: corsHeaders });
}
