const products = [
  {
    id: "linen-shirt",
    name: "The Sunday Linen Shirt",
    category: "wear",
    detail: "Washed linen · oat",
    price: 68,
    label: "Bestseller",
    image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "market-tote",
    name: "The Market Tote",
    category: "wear",
    detail: "Organic cotton · moss",
    price: 32,
    label: "Good everyday",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "ceramic-mug",
    name: "Slow Morning Mug",
    category: "home",
    detail: "Hand-thrown stoneware",
    price: 28,
    label: "Made by hand",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "ribbed-tee",
    name: "The Everyday Rib Tee",
    category: "wear",
    detail: "Organic cotton · butter",
    price: 42,
    label: "",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "linen-throw",
    name: "Sunday Linen Throw",
    category: "home",
    detail: "Belgian flax linen · natural",
    price: 96,
    label: "A little luxury",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "everyday-cap",
    name: "The Everyday Cap",
    category: "wear",
    detail: "Recycled cotton · clay",
    price: 36,
    label: "Just arrived",
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "glass-vase",
    name: "Sunday Glass Vase",
    category: "home",
    detail: "Recycled glass · seafoam",
    price: 44,
    label: "",
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "candle",
    name: "The Slow Down Candle",
    category: "home",
    detail: "Cedar & wild fig · 40 hours",
    price: 34,
    label: "A favorite",
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=85",
  },
];

const FREE_SHIPPING_THRESHOLD = 75;
const CART_STORAGE_KEY = "sunday-supply-cart";
const FAVORITES_STORAGE_KEY = "sunday-supply-favorites";
const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#site-search");
const resultCount = document.querySelector(".result-count");
const emptyState = document.querySelector(".empty-state");
const cartDrawer = document.querySelector(".cart-drawer");
const overlay = document.querySelector(".overlay");
const cartContent = document.querySelector(".cart-content");
const cartFooter = document.querySelector(".cart-footer");
const toast = document.querySelector(".toast");

let activeCategory = "all";
let query = "";
let sortOrder = "featured";
let cart = readStorage(CART_STORAGE_KEY, {});
let favorites = new Set(readStorage(FAVORITES_STORAGE_KEY, []));
let toastTimeout;

function readStorage(key, fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    return stored ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Your browser couldn't save this change.");
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
}

function getVisibleProducts() {
  const search = query.trim().toLowerCase();
  const visible = products.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch = !search || `${product.name} ${product.detail} ${product.category}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  if (sortOrder === "price-low") visible.sort((a, b) => a.price - b.price);
  if (sortOrder === "price-high") visible.sort((a, b) => b.price - a.price);
  if (sortOrder === "name") visible.sort((a, b) => a.name.localeCompare(b.name));
  return visible;
}

function renderProducts() {
  const visible = getVisibleProducts();
  productGrid.innerHTML = visible.map((product) => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
        ${product.label ? `<span class="product-label">${product.label}</span>` : ""}
        <button class="favorite-button${favorites.has(product.id) ? " is-favorite" : ""}" type="button" data-favorite="${product.id}" aria-label="${favorites.has(product.id) ? "Remove " + product.name + " from" : "Add " + product.name + " to"} favorites" aria-pressed="${favorites.has(product.id)}">♡</button>
        <button class="quick-add" type="button" data-add="${product.id}">Add to bag — ${formatPrice(product.price)}</button>
      </div>
      <div class="product-info">
        <div><h3 class="product-title">${product.name}</h3><p class="product-detail">${product.detail}</p></div>
        <span class="product-price">${formatPrice(product.price)}</span>
      </div>
    </article>
  `).join("");
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? "good thing" : "good things"}`;
  productGrid.hidden = visible.length === 0;
  emptyState.hidden = visible.length !== 0;
}

function cartQuantity() {
  return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
}

function cartSubtotal() {
  return Object.entries(cart).reduce((total, [id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return total + (product ? product.price * quantity : 0);
  }, 0);
}

function renderCart() {
  const entries = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity }))
    .filter((entry) => entry.product && entry.quantity > 0);
  const quantity = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const subtotal = cartSubtotal();
  document.querySelector(".bag-count").textContent = quantity;
  document.querySelector(".drawer-count").textContent = `(${quantity})`;
  cartFooter.hidden = entries.length === 0;

  if (!entries.length) {
    cartContent.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon" aria-hidden="true">♡</span>
        <h3>Nothing in your bag, yet.</h3>
        <p>There's always room for one more good thing.</p>
        <button type="button" class="button button-dark cart-shop-button">Find your something <span aria-hidden="true">→</span></button>
      </div>`;
  } else {
    cartContent.innerHTML = entries.map(({ product, quantity: count }) => `
      <div class="cart-item">
        <img src="${product.image}" alt="" />
        <div>
          <p class="cart-item-name">${product.name}</p>
          <span class="cart-item-price">${formatPrice(product.price)}</span>
          <div class="quantity-control" aria-label="Quantity for ${product.name}">
            <button type="button" data-quantity="-1" data-id="${product.id}" aria-label="Remove one ${product.name}">−</button>
            <span>${count}</span>
            <button type="button" data-quantity="1" data-id="${product.id}" aria-label="Add one ${product.name}">+</button>
          </div>
        </div>
        <button type="button" class="remove-item" data-remove="${product.id}" aria-label="Remove ${product.name}">Remove</button>
      </div>
    `).join("");
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const shippingCopy = document.querySelector(".shipping-copy");
    const progress = document.querySelector(".progress-track span");
    shippingCopy.textContent = remaining ? `You're ${formatPrice(remaining)} away from complimentary shipping` : "You've unlocked complimentary shipping!";
    progress.style.width = `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`;
  }

  document.querySelector(".cart-subtotal").textContent = formatPrice(subtotal);
  saveStorage(CART_STORAGE_KEY, cart);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function addToCart(id) {
  if (!products.some((product) => product.id === id)) return;
  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  const product = products.find((item) => item.id === id);
  showToast(`${product.name} added to your bag`);
}

function openCart() {
  overlay.hidden = false;
  cartDrawer.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => {
    overlay.classList.add("is-visible");
    cartDrawer.classList.add("is-open");
  });
  document.body.classList.add("cart-open");
  document.querySelector(".close-cart").focus();
}

function closeCart() {
  overlay.classList.remove("is-visible");
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
  setTimeout(() => {
    if (!cartDrawer.classList.contains("is-open")) overlay.hidden = true;
  }, 280);
}

function setCategory(category) {
  activeCategory = category;
  document.querySelectorAll(".category-tab").forEach((tab) => {
    const isActive = tab.dataset.category === category;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
  renderProducts();
}

productGrid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  const favoriteButton = event.target.closest("[data-favorite]");
  if (addButton) addToCart(addButton.dataset.add);
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveStorage(FAVORITES_STORAGE_KEY, [...favorites]);
    renderProducts();
  }
});

document.querySelectorAll(".category-tab").forEach((tab) => {
  tab.addEventListener("click", () => setCategory(tab.dataset.category));
});

document.querySelectorAll("[data-nav-category], [data-footer-category]").forEach((link) => {
  link.addEventListener("click", () => {
    setCategory(link.dataset.navCategory || link.dataset.footerCategory);
    document.querySelector(".main-nav").classList.remove("is-open");
    document.querySelector(".mobile-menu-button").setAttribute("aria-expanded", "false");
  });
});

document.querySelector("#view-all").addEventListener("click", () => setCategory("all"));
document.querySelector(".reset-search").addEventListener("click", () => {
  searchInput.value = "";
  query = "";
  setCategory("all");
});
searchInput.addEventListener("input", () => {
  query = searchInput.value;
  renderProducts();
});
document.querySelector("#sort-products").addEventListener("change", (event) => {
  sortOrder = event.target.value;
  renderProducts();
});
document.querySelector(".search-toggle").addEventListener("click", () => {
  const searchBar = document.querySelector(".search-bar");
  searchBar.classList.toggle("is-open");
  if (searchBar.classList.contains("is-open")) searchInput.focus();
});
document.querySelector(".search-close").addEventListener("click", () => {
  document.querySelector(".search-bar").classList.remove("is-open");
  searchInput.value = "";
  query = "";
  renderProducts();
});
document.querySelector(".search-bar").addEventListener("submit", (event) => event.preventDefault());
document.querySelector(".bag-button").addEventListener("click", openCart);
document.querySelector(".close-cart").addEventListener("click", closeCart);
document.querySelector(".continue-shopping").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

cartContent.addEventListener("click", (event) => {
  if (event.target.closest(".cart-shop-button")) {
    closeCart();
    return;
  }
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const id = quantityButton.dataset.id;
    cart[id] = (cart[id] || 0) + Number(quantityButton.dataset.quantity);
    if (cart[id] <= 0) delete cart[id];
    renderCart();
  }
  if (removeButton) {
    delete cart[removeButton.dataset.remove];
    renderCart();
    showToast("Removed from your bag");
  }
});

document.querySelector(".checkout-button").addEventListener("click", () => {
  closeCart();
  showToast("Checkout is a demo — no payment was taken.");
});
document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#newsletter-email");
  document.querySelector(".newsletter-message").textContent = "You're on the list — see you Sunday!";
  email.value = "";
});

document.querySelector(".mobile-menu-button").addEventListener("click", (event) => {
  const nav = document.querySelector(".main-nav");
  const isOpen = nav.classList.toggle("is-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    document.querySelector(".search-bar").classList.remove("is-open");
    document.querySelector(".main-nav").classList.remove("is-open");
  }
});

renderProducts();
renderCart();
