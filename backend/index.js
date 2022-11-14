const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
var cors = require("cors");
const { newUser, getIndividualRoomUsers, exitRoom, getActiveUser } = require("./helpers/userHelper");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
    },
});

/* 
  join_room
  send_message
  daemon


  join_accepted
  update_room
  receive_message
  logoff
*/

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
    const userAddress = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    console.log("address", socket.handshake)
    socket.on("join_room", (room, name) => {
        
        const user = newUser(socket.id, userAddress, name, room);
        socket.join(room);
        socket.emit("join_accepted", true);
        io.to(user?.room).emit("update_room", getIndividualRoomUsers(user?.room));
    });

    socket.on("send_message", (id, message) => {
        io.to(id).emit("receive_message", { sender: getActiveUser(socket.id), message });
    });
    let logoffTimer;
    socket.on("daemon", () => {
        clearTimeout(logoffTimer);
        logoffTimer = setTimeout(function () {
            socket.emit("logoff", { reason: "Logged off due to inactivity" });
            exitRoom(socket.id);
            io.to(user?.room).emit("update_room", getIndividualRoomUsers(user.room));
        }, 1000 * 300);
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
