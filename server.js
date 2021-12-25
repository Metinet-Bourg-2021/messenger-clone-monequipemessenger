require("dotenv/config");
const express = require("express");
const app = express();
const http = require("http");
const mongoose = require("mongoose");
const server = http.createServer(app);
const { Server } = require("socket.io");
const checkAuth = require("./auth");
const config = require("./config.json");
const {
  createConversation,
  getConversations,
  seeConversation,
  removeParticipant,
  addParticipant,
} = require("./controllers/conversationController");
const {
  saveMessage,
  deleteMessage,
  editMessage,
  reactMessage,
  replyMessage,
} = require("./controllers/messageController");
const { authenticate, getUsers } = require("./controllers/userController");

const io = new Server(server, { cors: { origin: "*" } });

app.get("/", (req, res) => {
  res.send("A utiliser pour du debug si vous avez besoin...");
});

server.listen(config.port, () => {
  console.log("Server is listening");
  console.log(
    "Pensez à recharger vos pages/navigateurs afin de réinitialiser les sockets"
  );
});

mongoose.connect(
  `${config.database.server}/${config.database.name}`,
  {},
  (err) => {
    isDBConnected = !err;
    console.log(err || "Connexion à la base réussie !!!");
  }
);

const socketsByUser = {};

const initAuth = (authFct, initUser) => (params, callback) => {
  const auth = authFct(params, callback, socketsByUser);
  initUser(params.username);
  return auth;
};

io.on("connection", (socket) => {
  //Penser a conserver le socket pour pouvoir s'en servir plus tard
  //Remplacer les callbacks par des fonctions dans d'autres fichiers

  const handleSetUser = (username) => {
    socketsByUser[username] = socket;
  };

  socket.on("@authenticate", initAuth(authenticate, handleSetUser));

  socket.on("@getUsers", checkAuth(getUsers));

  socket.on(
    "@getOrCreateOneToOneConversation",
    checkAuth(createConversation, socketsByUser)
  );

  socket.on(
    "@createManyToManyConversation",
    checkAuth(createConversation, socketsByUser)
  );

  socket.on("@getConversations", checkAuth(getConversations));

  socket.on("@postMessage", checkAuth(saveMessage, socketsByUser));

  socket.on("@seeConversation", checkAuth(seeConversation, socketsByUser));
  socket.on("@removeParticipant", checkAuth(removeParticipant, socketsByUser));
  socket.on("@addParticipant", checkAuth(addParticipant, socketsByUser));

  socket.on("@replyMessage", checkAuth(replyMessage, socketsByUser));
  socket.on("@editMessage", checkAuth(editMessage, socketsByUser));
  socket.on("@reactMessage", checkAuth(reactMessage, socketsByUser));
  socket.on("@deleteMessage", checkAuth(deleteMessage, socketsByUser));

  socket.on("disconnect", (reason) => {});
});

// Addresse du serveur démo: wss://teach-vue-chat-server.glitch.me
