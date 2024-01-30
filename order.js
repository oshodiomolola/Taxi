class Order {
  constructor({currentLocation, destination, price, sender}) {

    this.currentLocation = currentLocation
    this.destination = destination
    this.price = price
    this.sender = sender
    this.status = "pending"
    this.driver = null
  }
}

module.exports = Order





