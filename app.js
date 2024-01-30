const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const OrderingApp = require("./orderingApp");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const path = require("path");

app.get("/", (req, res) => {
  console.log("Welcome to Taxi!");
});

app.get("/sender", (req, res) => {
  res.sendFile(path.join(__dirname + "/sender.html"));
});

app.get("/driver", (req, res) => {
  res.sendFile(path.join(__dirname + "/driver.html"));
});

const orderingApp = new OrderingApp();

io.on("connection", (socket) => {
  socket.on("join", (user_type, Username) => {
    console.log(`A ${user_type} named ${Username} is connected`, socket.id);

    const userInfo = {
      socket: socket,
      user_type: user_type,
      name: Username,
    };

    orderingApp.joinSession(userInfo);
  });

  socket.on("requestOrder", (data)=>{
    orderingApp.requestOrder(data)
})

});

PORT = 3900;

server.listen(PORT, () => {
  console.log("server listening");
});
