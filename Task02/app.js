//Array of products
const products = [
  { id: 1, name: "Mechanical Keyboard", price: 45.99 },
  { id: 2, name: "Wireless Mouse", price: 19.50 },
  { id: 3, name: "24\" Monitor", price: 129.00 },
  { id: 4, name: "Headphones", price: 35.75 },
  { id: 5, name: "HD Webcam", price: 42.00 },
  { id: 6, name: "XL Mouse Pad", price: 12.99 },
];

// Array of { id, quantity }
let cart = [];

// DOM references
const productsEl = document.getElementById("products");
const cartEl = document.getElementById("cart");
const totalEl = document.getElementById("total");

// Helper functions
function findProduct(id) {
  return products.find((p) => p.id === id);
}

function formatPrice(value) {
  return "$" + value.toFixed(2);
}

// Cart functions
function addToCart(id) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ id, quantity: 1 });
  }
  render();
}

function changeQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.quantity += delta;

  // If quantity reaches 0, remove from cart
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.id !== id);
  }
  render();
}

function calculateTotal() {
  return cart.reduce((acc, item) => {
    const product = findProduct(item.id);
    return acc + product.price * item.quantity;
  }, 0);
}

function renderCatalog() {
  //Clean container before rendering new products
  productsEl.innerHTML = "";

  //Render each product as a card
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p class="price">${formatPrice(p.price)}</p>
      <button data-id="${p.id}" class="btn-add">Add to cart</button>
    `;
    productsEl.appendChild(card);
  });

  // Attach "Add" button listeners
  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(Number(btn.dataset.id));
    });
  });
}

function renderCart() {
  //Clean container before rendering new products in the cart
  cartEl.innerHTML = "";

  if (cart.length === 0) {
    cartEl.innerHTML = `<p class="empty">Your cart is empty</p>`;
  } else {
    cart.forEach((item) => {
      const product = findProduct(item.id);
      const subtotal = product.price * item.quantity;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <div class="cart-info">
          <span class="name">${product.name}</span>
          <span class="subtotal">${formatPrice(subtotal)}</span>
        </div>
        <div class="controls">
          <button data-id="${item.id}" data-delta="-1" class="btn-minus">−</button>
          <span class="quantity">${item.quantity}</span>
          <button data-id="${item.id}" data-delta="1" class="btn-plus">+</button>
        </div>
      `;
      cartEl.appendChild(row);
    });
  }

  // Attach +/- listeners after nodes are created
  document.querySelectorAll(".btn-minus, .btn-plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.id);
      const delta = Number(btn.dataset.delta);
      changeQuantity(id, delta);
    });
  });
}

function renderTotal() {
  totalEl.textContent = formatPrice(calculateTotal());
}

function render() {
  renderCatalog();
  renderCart();
  renderTotal();
}

// Start the app by rendering initial state
render();