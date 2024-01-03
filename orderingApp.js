const Sender = require("./sender");
const Driver = require("./driver");

class OrderingApp {
  constructor() {
    this.senders = [];
    this.drivers = [];
    this.orders = [];
  }

  joinSession({ user_type, name, socket }) {
    console.log("user info processing", name, socket.id);

    const user = this.createUser({ user_type, name, socket });
    // console.log(user, user.id)
  }

  createUser({ user_type, name, socket }) {
    switch (user_type) {
      case "sender":
        const sender = new Sender(name);
        this.senders.push(sender);
        this.sendEvent({
          socket,
          data: { sender },
          eventname: "senderCreated",
        });

        return sender;
      case "driver":
        const driver = new Driver(name);
        this.drivers.push(driver);
        this.sendEvent({
          socket,
          data: { driver },
          eventname: "driverCreated",
        });

        return driver;
      default:
        throw new Error("Invalid user");
    }
  }

  sendEvent({ socket, data, eventname }) {
    socket.emit({ eventname, data });
    console.log(eventname, data)
  }
}

module.exports = OrderingApp;
