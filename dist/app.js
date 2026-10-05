const products = [
  { id: 'ws-01', name: 'WS-01 / Pink Polo — SS', sleeve: 'SS', price: 289, image: './assets/products/wierd-ws-01.png', description: 'A bright pink top with a layered attitude and a Kuala Lumpur campus signal.' },
  { id: 'ws-02', name: 'WS-02 / Pink Polo — LS', sleeve: 'LS', price: 299, image: './assets/products/wierd-ws-02.png', description: 'A soft pink top with a crisp collar, built for warm streets and late plans.' },
  { id: 'ws-03', name: 'WS-03 / Navy Polo — SS', sleeve: 'SS', price: 289, image: './assets/products/wierd-ws-03.png', description: 'A deep navy top with bright contrast details and a clean athletic cut.' },
  { id: 'ws-04', name: 'WS-04 / Navy Polo — LS', sleeve: 'LS', price: 319, image: './assets/products/wierd-ws-04.png', description: 'A navy top with a relaxed body, contrast collar, and room to move.' }
];

const heroStories = [
  { video: './assets/teasers/teaser-01-ajib.mp4', poster: './assets/wierd-hero.png', label: 'Teaser 01 / Ajib', eyebrow: 'Drop 001 / Ajib', title: 'Keep it<br /><em>weird.</em>', description: 'A first look at the WIERD system in motion.' },
  { video: './assets/teasers/teaser-02-cahaya.mp4', poster: './assets/wierd-lookbook.png', label: 'Teaser 02 / Cahaya', eyebrow: 'Drop 001 / Cahaya', title: 'Wear the<br /><em>signal.</em>', description: 'Bright colour, hard lines, and a little room to be off-centre.' },
  { video: './assets/teasers/teaser-03-dayah.mp4', poster: './assets/wierd-still-life.png', label: 'Teaser 03 / Dayah', eyebrow: 'Drop 001 / Dayah', title: 'Made for<br /><em>the in-between.</em>', description: 'Four tops for the parts of the day that do not need a uniform.' },
  { video: './assets/teasers/teaser-04-azi.mp4', poster: './assets/wierd-hero.png', label: 'Teaser 04 / Azi', eyebrow: 'Drop 001 / Azi', title: 'Stay<br /><em>off-centre.</em>', description: 'A campaign in four movements, made in Kuala Lumpur.' }
];

const state = {
  cart: [],
  heroIndex: 0,
  heroTimer: null,
  quickViewId: null,
  selectedSize: 'S',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `RM ${value.toFixed(2)}`;

function renderProducts() {
  $('#product-grid').innerHTML = products.map((product, index) => `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}" loading="${index < 2 ? 'eager' : 'lazy'}" />
        ${index === 0 ? '<span class="product-tag">Drop 001</span>' : ''}
        <button class="quick-view-trigger" type="button" data-action="quick-view" data-product-id="${product.id}">View piece</button>
      </div>
      <div class="product-info">
        <div><p class="product-name">${product.name}</p><p class="product-meta">${product.sleeve}</p></div>
        <p class="product-price">${money(product.price)}</p>
      </div>
    </article>
  `).join('');
}

function scheduleHeroRotation() {
  window.clearInterval(state.heroTimer);
  state.heroTimer = null;
  if (state.reducedMotion) return;
  state.heroTimer = window.setInterval(() => {
    setHero((state.heroIndex + 1) % heroStories.length, { resetTimer: false });
  }, 5000);
}

function showVideoFallback() {
  $('#hero-video').classList.add('is-fallback');
  $('#hero-image').classList.add('is-visible');
}

function setHero(index, { resetTimer = true } = {}) {
  const story = heroStories[index];
  if (!story) return;
  state.heroIndex = index;
  const video = $('#hero-video');
  const source = $('#hero-video-source');
  const poster = $('#hero-image');
  video.classList.remove('is-fallback');
  poster.classList.remove('is-visible');
  video.poster = story.poster;
  poster.src = story.poster;
  poster.alt = `${story.label} campaign poster`;
  source.src = story.video;
  video.load();
  if (state.reducedMotion) {
    video.pause();
  } else {
    video.play().catch(showVideoFallback);
  }
  $('#hero-eyebrow').textContent = story.eyebrow;
  $('#hero-title').innerHTML = story.title;
  $('#hero-description').textContent = story.description;
  $('#hero-index').textContent = `${String(index + 1).padStart(2, '0')} / ${String(heroStories.length).padStart(2, '0')}`;
  $$('.hero-tab').forEach((tab, tabIndex) => {
    const active = tabIndex === index;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  if (resetTimer) scheduleHeroRotation();
}

function setMenuOpen(isOpen) {
  const nav = $('#mobile-nav');
  const toggle = $('.menu-toggle');
  nav.classList.toggle('is-open', isOpen);
  nav.setAttribute('aria-hidden', String(!isOpen));
  nav.inert = !isOpen;
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
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
  $('#quick-view-category').textContent = `Top / ${product.sleeve}`;
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
      <div><p class="cart-item-name">${item.name}</p><p class="cart-item-meta">${item.sleeve} / Size ${item.size}</p><button class="remove-item" type="button" data-action="remove-item" data-cart-index="${index}">Remove</button></div>
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

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action], [data-hero-tab]');
  if (!target) return;
  const action = target.dataset.action;
  if (target.dataset.heroTab) setHero(Number(target.dataset.heroTab));
  if (action === 'menu') setMenuOpen(!$('#mobile-nav').classList.contains('is-open'));
  if (action === 'quick-view') openQuickView(target.dataset.productId);
  if (action === 'close-quick-view' || action === 'close-cart') closePanels();
  if (action === 'open-cart') { updateCart(); openPanel($('#cart-drawer')); }
  if (action === 'add-to-cart') addToCart();
  if (action === 'remove-item') {
    state.cart.splice(Number(target.dataset.cartIndex), 1);
    updateCart();
  }
});

$('#modal-backdrop').addEventListener('click', closePanels);
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
$('#hero-video').addEventListener('canplay', () => {
  $('#hero-video').classList.remove('is-fallback');
  $('#hero-image').classList.remove('is-visible');
});
$('#hero-video').addEventListener('error', showVideoFallback);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePanels();
    setMenuOpen(false);
  }
});
$$('.mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (event) => {
  state.reducedMotion = event.matches;
  if (state.reducedMotion) {
    window.clearInterval(state.heroTimer);
    state.heroTimer = null;
    $('#hero-video').pause();
  } else {
    setHero(state.heroIndex);
  }
});

renderProducts();
updateCart();
setMenuOpen(false);
setHero(0);
