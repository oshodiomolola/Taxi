const Sender = require("./sender");
const Driver = require("./driver");
const Order = require("./order");

class OrderingApp {
  constructor() {
    this.senders = [];
    this.drivers = [];
    this.orders = [];
    this.socketUserMap = new Map();
  }

  joinSession({ user_type, name, socket }) {
    console.log("user info processing", name, socket.id);

    const user = this.createUser({ user_type, name, socket });
    console.log(user, user.id)
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
    socket.emit(eventname, data);
    console.log(eventname, data);
  }

  requestOrder({ currentLocation, destination, price, senderId }) {
    const sender = this.senders.find((sender)=> sender.id === senderId);

    if(!sender) {
      console.log("Sender not found");
      return;
    } 

    const order = new Order({ currentLocation, destination, price, sender });


    const timer = setTimeout(() => {
      for (const order of this.orders) {
        if (order.status === "pending") {
          order.status = "expired";

          const senderSocket = this.socketUserMap.get(sender.id);
if(senderSocket) {
          senderSocket.emit("orderExpired", { order })
        } else {
          console.log("Sender socket not found in socketUserMap")
        };
        }
      }
    }, 120000);

    const updatedOrder = { ...order, timer: timer };
    this.orders.push(updatedOrder);

    for (const driver of this.drivers) {
      if (driver.in_ride) continue;
      const driverSocket = this.socketUserMap.get(driver.id);
      driverSocket.emit("orderRequested", order);
    }
    return updatedOrder;
  }

  acceptOrder(id, driverId) {
    const order = this.orders.find((order) => order.id === id);
    const sender = this.senders.find((senders) => sender.id === order.sender.id);
    const driver = this.drivers.find((drivers) => driver.id === driverId);

    driver.in_ride = true;
    order.status = "accepted";
    order.driver = driver;
    clearTimeout(order.timer);

    console.log("Order has been accepted!");
    const senderSocket = this.socketUserMap.get(sender.id);
    senderSocket.emit("orderAccepted", { order });

    for (const driver of this.drivers) {
      if (driver.id === driverId) {
        const driverSocket = this.socketUserMap.get(driver.id);
        driverSocket.emit("orderAccepted", { order });
      } else {
        const otherSocket = this.socketUserMap.get(driver.id);
        otherSocket.emit("orderMissed", { order });
      }
    }
  }
  rejectOrder(id, driverId) {
    const order = this.orders.find((order) => order.id === id);
    const sender = this.senders.find((sender) => sender.id === order.sender.id);
    const driver = this.drivers.find((driver) => driver.id === driverId);

    order.status = "rejected";
    clearTimeout(order.timer);
    const driverSocket = this.socketUserMap.get(driver.id)
    driverSocket.emit("orderRejected", {order})
  }

  finishedOrder(id, driverId) {
    const order = this.orders.find((order)=> order.id === id)
    const sender = this.senders.find((sender)=> sender.id === order.sender.id)
    const driver = this.drivers.find((driver)=> driver.id === driverId)

    driver.in_ride = false
    order.status = "finished"
    clearTimeout(order.timer)

    const senderSocket = this.socketUserMap.get(sender.id)
    senderSocket.emit("finishedRide", { order })

    const driverSocket =this.socketUserMap.get(driver.id)
    driverSocket.emit("finishedRide", { order })
  }
}

module.exports = OrderingApp;
