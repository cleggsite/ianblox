const WS_URL = "wss://YOUR-RENDER-URL.onrender.com";
const ws = new WebSocket(WS_URL);

const playerId = Math.random().toString(36).slice(2);
let roomCode = "";

ws.onopen = () => {
  console.log("Connected to server");
};

ws.onmessage = e => {
  const msg = JSON.parse(e.data);

  if (msg.type === "update") {
    updateGame(msg.data);
  }
};

function joinRoom() {
  roomCode = document.getElementById("roomInput").value.trim();
  if (!roomCode) return alert("Enter a room code");

  ws.send(JSON.stringify({
    type: "join",
    data: {
      room: roomCode,
      id: playerId
    }
  }));

  document.getElementById("menu").hidden = true;
  document.getElementById("game").hidden = false;
}

function startGame() {
  ws.send(JSON.stringify({
    type: "start"
  }));
}

function updateGame(data) {
  document.getElementById("phase").innerText =
    "Phase: " + data.phase;

  const me = data.players[playerId];
  document.getElementById("role").innerText =
    "Role: " + (me?.role ?? "Unknown");

  const list = document.getElementById("players");
  list.innerHTML = "";

  Object.keys(data.players).forEach(id => {
    const li = document.createElement("li");
    li.innerText = id === playerId ? "You" : "Player";
    list.appendChild(li);
  });
}
