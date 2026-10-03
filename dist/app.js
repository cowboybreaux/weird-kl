const products = [
  { id: 'overshirt', name: 'No-Signal Overshirt', category: 'tops', meta: 'Washed bone / 01', price: 289, image: './assets/wierd-lookbook.png', description: 'A roomy overshirt with two pockets, one orange tab, and plenty of wrong turns.' },
  { id: 'tee', name: 'Impact Tee', category: 'tops', meta: 'Black / 02', price: 149, image: './assets/wierd-still-life.png', description: 'Heavyweight cotton with a one-off print that refuses to stay quiet.' },
  { id: 'cargo', name: 'Side Lane Cargo', category: 'bottoms', meta: 'Faded black / 03', price: 319, image: './assets/wierd-hero.png', description: 'Wide-leg utility trousers with room for your keys, your plans, and a change of mind.' },
  { id: 'pouch', name: 'Loud Little Pouch', category: 'objects', meta: 'Signal orange / 04', price: 89, image: './assets/wierd-still-life.png', description: 'A small nylon pouch for the things you keep losing on purpose.' },
  { id: 'jacket', name: 'Concrete Shell', category: 'tops', meta: 'Black / 05', price: 399, image: './assets/wierd-hero.png', description: 'A lightweight shell built for weather, waiting, and leaving early.' },
  { id: 'shorts', name: 'Wrong Turn Shorts', category: 'bottoms', meta: 'Graphite / 06', price: 219, image: './assets/wierd-lookbook.png', description: 'A soft structured short with a wide hem and an unapologetic silhouette.' },
  { id: 'clip', name: 'Key Clip 01', category: 'objects', meta: 'Brushed silver / 07', price: 59, image: './assets/wierd-still-life.png', description: 'A useful little metal interruption for bags, belt loops, and bad ideas.' },
  { id: 'socks', name: 'Signal Socks', category: 'objects', meta: 'Black / 08', price: 49, image: './assets/wierd-still-life.png', description: 'Ribbed cotton socks with a small flash of the thing you almost missed.' }
];

const heroStories = [
  { image: './assets/wierd-hero.png', eyebrow: 'Drop 001 / Concrete Hours', title: 'Nothing<br /><em>fits.</em>', description: 'A loose system for people who never dress the same way twice.' },
  { image: './assets/wierd-lookbook.png', eyebrow: 'Lookbook / The Side Lane', title: 'Take the<br /><em>long way.</em>', description: 'A hot pavement uniform for wherever the plan stops making sense.' },
  { image: './assets/wierd-still-life.png', eyebrow: 'Objects / In Use', title: 'Small<br /><em>signal.</em>', description: 'The little pieces that make a daily uniform feel like yours.' }
];

const state = { filter: 'all', search: '', cart: [], quickViewId: null, selectedSize: 'S' };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `RM ${value.toFixed(2)}`;

function renderProducts() {
  const grid = $('#product-grid');
  const query = state.search.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchesFilter = state.filter === 'all' || product.category === state.filter;
    const matchesSearch = !query || `${product.name} ${product.category} ${product.meta}`.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = filtered.map((product, index) => `
    <article class="product-card" data-product-card data-category="${product.category}">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="${index < 2 ? 'eager' : 'lazy'}" />
        ${index === 0 ? '<span class="product-tag">New</span>' : ''}
        <button class="quick-view-trigger" type="button" data-action="quick-view" data-product-id="${product.id}">Quick view</button>
      </div>
      <div class="product-info">
        <div><p class="product-name">${product.name}</p><p class="product-meta">${product.meta}</p></div>
        <p class="product-price">${money(product.price)}</p>
      </div>
    </article>
  `).join('');

  $('#no-results').hidden = filtered.length > 0;
}

function setFilter(filter) {
  state.filter = filter;
  $$('.filter-button').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === filter));
  renderProducts();
}

function setHero(index) {
  const story = heroStories[index];
  $('#hero-image').style.opacity = '0';
  window.setTimeout(() => {
    $('#hero-image').src = story.image;
    $('#hero-image').alt = story.eyebrow;
    $('#hero-eyebrow').textContent = story.eyebrow;
    $('#hero-title').innerHTML = story.title;
    $('#hero-description').textContent = story.description;
    $('#hero-index').textContent = `${String(index + 1).padStart(2, '0')} / 03`;
    $('#hero-image').style.opacity = '1';
  }, 180);
  $$('.hero-tab').forEach((tab, tabIndex) => {
    const active = tabIndex === index;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}

function openPanel(panel) {
  $('#modal-backdrop').hidden = false;
  panel.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closePanels() {
  $('#modal-backdrop').hidden = true;
  $('#quick-view').hidden = true;
  $('#cart-drawer').hidden = true;
  document.body.style.overflow = '';
}

function openQuickView(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  state.quickViewId = productId;
  state.selectedSize = 'S';
  $('#quick-view-image').src = product.image;
  $('#quick-view-image').alt = product.name;
  $('#quick-view-category').textContent = `${product.category} / Drop 001`;
  $('#quick-view-title').textContent = product.name;
  $('#quick-view-price').textContent = money(product.price);
  $('#quick-view-description').textContent = product.description;
  $$('.size-option').forEach((option) => option.classList.toggle('is-active', option.dataset.size === state.selectedSize));
  openPanel($('#quick-view'));
  window.setTimeout(() => $('.size-option')?.focus(), 20);
}

function updateCart() {
  const count = state.cart.length;
  const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  $$('.cart-count').forEach((element) => { element.textContent = count; });
  $('.drawer-count').textContent = count;
  $('#cart-total').textContent = money(subtotal);
  $('#cart-items').innerHTML = count === 0 ? '<p class="empty-cart">Your bag is currently empty.</p>' : state.cart.map((item, index) => `
    <article class="cart-item">
      <img src="${item.image}" alt="${item.name}" />
      <div><p class="cart-item-name">${item.name}</p><p class="cart-item-meta">Size ${item.size} / Qty 1</p><button class="remove-item" type="button" data-action="remove-item" data-cart-index="${index}">Remove</button></div>
      <span class="cart-item-price">${money(item.price)}</span>
    </article>
  `).join('');
}

function addToCart() {
  const product = products.find((item) => item.id === state.quickViewId);
  if (!product) return;
  state.cart.push({ ...product, size: state.selectedSize });
  updateCart();
  closePanels();
  showToast(`${product.name} / size ${state.selectedSize} added to bag`);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function toggleSearch(isOpen = !$('#search-panel').hidden) {
  const panel = $('#search-panel');
  panel.hidden = !isOpen;
  if (isOpen) {
    $('#search-input').value = state.search;
    $('#search-input').focus();
  }
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-filter], [data-category-link], [data-hero-tab]');
  if (!target) return;
  const action = target.dataset.action;
  if (target.dataset.filter) setFilter(target.dataset.filter);
  if (target.dataset.categoryLink) setFilter(target.dataset.categoryLink);
  if (target.dataset.heroTab) setHero(Number(target.dataset.heroTab));
  if (action === 'search') toggleSearch(true);
  if (action === 'search-close') toggleSearch(false);
  if (action === 'menu') {
    const nav = $('#mobile-nav');
    nav.hidden = !nav.hidden;
    target.setAttribute('aria-expanded', String(!nav.hidden));
  }
  if (action === 'quick-view') openQuickView(target.dataset.productId);
  if (action === 'close-quick-view' || action === 'close-cart') closePanels();
  if (action === 'open-cart') { updateCart(); openPanel($('#cart-drawer')); }
  if (action === 'add-to-cart') addToCart();
  if (action === 'remove-item') {
    state.cart.splice(Number(target.dataset.cartIndex), 1);
    updateCart();
  }
  if (action === 'demo-checkout') showToast('Checkout is a demo for now — your bag is saved in this view.');
});

$('#modal-backdrop').addEventListener('click', closePanels);
$('#search-input').addEventListener('input', (event) => {
  state.search = event.target.value;
  renderProducts();
});
$$('.size-option').forEach((option) => option.addEventListener('click', () => {
  state.selectedSize = option.dataset.size;
  $$('.size-option').forEach((item) => item.classList.toggle('is-active', item === option));
}));
$('#newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = $('#newsletter-email').value.trim();
  if (!email) return;
  $('#form-message').textContent = 'You’re on the list. See you on the weird side.';
  event.target.reset();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePanels();
    toggleSearch(false);
    $('#mobile-nav').hidden = true;
    $('.menu-toggle').setAttribute('aria-expanded', 'false');
  }
});
$$('.mobile-nav a').forEach((link) => link.addEventListener('click', () => {
  $('#mobile-nav').hidden = true;
  $('.menu-toggle').setAttribute('aria-expanded', 'false');
}));

renderProducts();
updateCart();
