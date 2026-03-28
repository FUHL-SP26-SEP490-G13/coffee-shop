const { PayOS } = require("@payos/node");
const payos = new PayOS("91b292b4-d997-4b92-95cd-288e30f25cfd", "c710edb6-46f9-4aec-8ca8-b99cb7b88d65", "57a825f69ff1df9d9b67026f73f1a6d8d3a7024f827f76ae78f72a6284f41217");

payos.paymentRequests.create({
  orderCode: Number(Date.now().toString().slice(-8)),
  amount: 2000,
  description: "Test",
  items: [{ name: "Test Item", quantity: 1, price: 2000 }],
  returnUrl: "http://localhost/ok",
  cancelUrl: "http://localhost/cancel"
}).then(console.log).catch(console.error);
