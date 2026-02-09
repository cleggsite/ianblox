const WS_URL = "https://ianblox.onrender.com";
const ws = new WebSocket(WS_URL);

const playerId = Math.random().toString(36).slice(2);
let roomCode = "";
let isHost = false;

ws.onopen = () => console.log("Connected to server");

ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (msg.type === "update") updateGame(msg.data);
  if (msg.type === "error") alert(msg.data);
  if (msg.type === "created") {
    // room successfully created
    roomCode = msg.room;
    isHost = true;
    showGameUI();
  }
};

// ---------------- CREATE / JOIN ROOM ----------------
function createRoom() {
  const newCode = Math.random().toString(36).slice(2, 7).toUpperCase();
  ws.send(JSON.stringify({ type: "create", data: { room: newCode } }));
  document.getElementById("newRoomCode").innerText = "Creating room...";
}

function joinRoom() {
  const inputCode = document.getElementById("roomInput").value.trim().toUpperCase();
  if (!inputCode) return alert("Enter a room code");

  ws.send(JSON.stringify({
    type: "join",
    data: { room: inputCode, id: playerId }
  }));

  roomCode = inputCode;
  isHost = false;
  showGameUI();
}

function showGameUI() {
  document.getElementById("menu").hidden = true;
  document.getElementById("game").hidden = false;

  document.getElementById("roomInfo").innerText = "Room Code: " + roomCode;
  document.getElementById("hostInfo").innerText = isHost ? "You are the host" : "";
  document.getElementById("startBtn").hidden = !isHost;
  document.getElementById("waiting").innerText = "Waiting for players...";
}

// ---------------- START GAME ----------------
function startGame() {
  if (!isHost) return alert("Only host can start the game");
  ws.send(JSON.stringify({ type: "start" }));
}

// ---------------- UPDATE GAME ----------------
function updateGame(data) {
  document.getElementById("phase").innerText = "Phase: " + data.phase;
  const me = data.players[playerId];
  document.getElementById("role").innerText = "Role: " + (me?.role ?? "Unknown");

  const list = document.getElementById("players");
  list.innerHTML = "";
  Object.keys(data.players).forEach(id => {
    const li = document.createElement("li");
    li.innerText = id === playerId ? "You" : "Player";
    list.appendChild(li);
  });

  const count = Object.keys(data.players).length;
  if (data.phase === "lobby") {
    document.getElementById("waiting").innerText = `Waiting for players... (${count})`;
  } else {
    document.getElementById("waiting").innerText = "";
  }
}
