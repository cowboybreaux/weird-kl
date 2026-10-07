'use strict';

const products = [
  { id: 'ws-01', name: 'WS-01 / Pink Polo — SS', sleeve: 'SS', price: 289, image: './assets/products/wierd-ws-01.png', description: 'A bright pink top with a layered attitude and a Kuala Lumpur campus signal.' },
  { id: 'ws-02', name: 'WS-02 / Pink Polo — LS', sleeve: 'LS', price: 299, image: './assets/products/wierd-ws-02.png', description: 'A soft pink top with a crisp collar, built for warm streets and late plans.' },
  { id: 'ws-03', name: 'WS-03 / Navy Polo — SS', sleeve: 'SS', price: 289, image: './assets/products/wierd-ws-03.png', description: 'A deep navy top with bright contrast details and a clean athletic cut.' },
  { id: 'ws-04', name: 'WS-04 / Navy Polo — LS', sleeve: 'LS', price: 319, image: './assets/products/wierd-ws-04.png', description: 'A navy top with a relaxed body, contrast collar, and room to move.' }
];
const heroStories = [
  { video: './assets/teasers/teaser-01-ajib-web.mp4', poster: products[0].image, label: 'Ajib' },
  { video: './assets/teasers/teaser-02-cahaya-web.mp4', poster: products[1].image, label: 'Cahaya' },
  { video: './assets/teasers/teaser-03-dayah-web.mp4', poster: products[2].image, label: 'Dayah' },
  { video: './assets/teasers/teaser-04-azi-web.mp4', poster: products[3].image, label: 'Azi' }
];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const money = (value) => 'RM ' + value.toFixed(2);
const webImage = (path) => path.replace(/\.png$/, '.webp');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobile = window.matchMedia('(max-width: 900px)');
const hero = $('#drop');
const videos = $$('.hero-video');
const chrome = $('.site-chrome');
const header = $('.site-header');
const headerSections = $$('.hero, .manifesto-bar, .product-section, .lookbook-section, .site-footer');
const shell = $('.site-shell');
const menu = $('#mobile-nav');
const menuToggle = $('.menu-toggle');
const backdrop = $('#modal-backdrop');
const panels = [$('#quick-view'), $('#cart-drawer')];
const state = {
  accessGranted: false,
  cart: [], quickViewId: null, selectedSize: 'S', menuOpen: false,
  heroIndex: 0, displayedIndex: -1, activeVideo: videos[0],
  heroVisible: hero.getBoundingClientRect().bottom > 0 && hero.getBoundingClientRect().top < window.innerHeight,
  heroTimer: null, heroAbort: null, pendingVideo: null, heroToken: 0, videoCleanup: null,
  panel: null, closingPanel: false, panelOpener: null, panelTimer: null, lockedY: null, bodyStyle: null
};

// This is a client-side preview gate, not server-side authentication.
const accessSessionKey = 'wierd-preview-access-v1';
function unlockSite({ remembered = false } = {}) {
  state.accessGranted = true;
  $('#access-password').value = '';
  $('#access-gate').hidden = true;
  shell.hidden = false;
  shell.inert = false;
  shell.removeAttribute('aria-hidden');
  $('.skip-link').hidden = false;
  document.body.classList.remove('is-locked');
  try { sessionStorage.setItem(accessSessionKey, 'granted'); } catch { /* Access still works when storage is unavailable. */ }
  updateChromeHeight();
  window.requestAnimationFrame(() => {
    let anchor = null;
    try { anchor = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch { /* Ignore malformed fragments. */ }
    if (anchor) anchor.scrollIntoView({ behavior: 'instant' });
    else if (!remembered) window.scrollTo({ top: 0, behavior: 'instant' });
    updateScrollChrome();
    const rect = hero.getBoundingClientRect();
    state.heroVisible = rect.bottom > measuredChromeHeight && rect.top < window.innerHeight;
    syncHeroActivity();
    if (!remembered) $('.site-header .wordmark').focus({ preventScroll: true });
  });
}
function initializeAccessGate() {
  const form = $('#access-form');
  const input = $('#access-password');
  const error = $('#access-error');
  input.disabled = false;
  $('.access-submit').disabled = false;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value === 'ayamgoreng') {
      unlockSite();
      return;
    }
    error.textContent = input.value ? 'Wrong password. Try again.' : 'Enter the password.';
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    input.select();
  });
  input.addEventListener('input', () => {
    input.removeAttribute('aria-invalid');
    error.textContent = '';
  });
  let remembered = false;
  try { remembered = sessionStorage.getItem(accessSessionKey) === 'granted'; } catch { /* Show the gate when storage is blocked. */ }
  if (remembered) unlockSite({ remembered: true });
  else if (!mobile.matches) input.focus({ preventScroll: true });
}

function renderProducts() {
  $('#product-grid').innerHTML = products.map((product, index) => [
    '<article class="product-card">',
    '<button class="product-image" type="button" data-action="quick-view" data-product-id="' + product.id + '" aria-label="View ' + product.name + '">',
    '<picture><source srcset="' + webImage(product.image) + '" type="image/webp" /><img src="' + product.image + '" alt="' + product.name + '" width="800" height="800" loading="lazy" decoding="async" /></picture>',
    index === 0 ? '<span class="product-tag">Drop 001</span>' : '',
    '<span class="quick-view-trigger">View piece</span></button>',
    '<div class="product-info"><div class="product-detail-row"><p class="product-code">' + product.id.toUpperCase() + ' / ' + product.sleeve + '</p>',
    '<p class="product-price">' + money(product.price) + '</p></div>',
    '<h3 class="product-name">' + product.name.split(' / ')[1].split(' — ')[0] + '</h3></div></article>'
  ].join('')).join('');
}

let measuredChromeHeight = 0;
let heroObserver = null;
function updateChromeHeight() {
  const height = Math.ceil(chrome.getBoundingClientRect().height);
  const headerHeight = header.getBoundingClientRect().height;
  if (!height || !headerHeight) return;
  document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
  if (height !== measuredChromeHeight) {
    measuredChromeHeight = height;
    document.documentElement.style.setProperty('--chrome-height', height + 'px');
    observeHeroVisibility();
  }
  updateScrollChrome();
}
function updateScrollChrome() {
  chrome.classList.toggle('is-scrolled', (state.lockedY ?? window.scrollY) > 12);
  if (!state.accessGranted || state.lockedY !== null) return;
  const headerRect = header.getBoundingClientRect();
  const sampleY = headerRect.top + headerRect.height / 2;
  let darkArtwork = false;
  for (const section of headerSections) {
    const rect = section.getBoundingClientRect();
    if (sampleY < rect.top || sampleY >= rect.bottom) continue;
    darkArtwork = section.matches('.manifesto-bar, .lookbook-section');
    if (section.matches('.product-section')) {
      const fadeHeight = parseFloat(getComputedStyle(section, '::after').height) || 0;
      // The eased fade becomes light enough for dark artwork before its halfway point.
      darkArtwork = fadeHeight > 0 && sampleY >= rect.bottom - fadeHeight * .57;
    }
    break;
  }
  header.classList.toggle('has-dark-artwork', darkArtwork);
}
let scrollFrame = null;
window.addEventListener('scroll', () => {
  if (scrollFrame !== null) return;
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null;
    updateScrollChrome();
  });
}, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(updateChromeHeight).observe(chrome);
window.addEventListener('resize', updateChromeHeight, { passive: true });

function heroCanPlay() {
  return state.accessGranted && !motion.matches && state.heroVisible && !document.hidden && !state.menuOpen && !state.panel && !state.closingPanel;
}
function stopHeroTimer() {
  window.clearTimeout(state.heroTimer);
  state.heroTimer = null;
}
function scheduleHeroRotation() {
  stopHeroTimer();
  if (!heroCanPlay()) return;
  state.heroTimer = window.setTimeout(() => setHero((state.heroIndex + 1) % heroStories.length), 5000);
}
function clearVideo(video) {
  video.pause();
  video.classList.remove('is-active', 'is-current');
  if (video.hasAttribute('src')) {
    video.removeAttribute('src');
    video.load();
  }
}
function cancelPendingVideo() {
  ++state.heroToken;
  state.heroAbort?.abort();
  state.heroAbort = null;
  if (state.pendingVideo && state.pendingVideo !== state.activeVideo) clearVideo(state.pendingVideo);
  state.pendingVideo = null;
  window.clearTimeout(state.videoCleanup);
  videos.filter(video => video !== state.activeVideo).forEach(clearVideo);
}
function updateHeroState(index) {
  const story = heroStories[index];
  $('#hero-image').src = story.poster;
  $('#hero-image').alt = 'WIERD campaign, ' + story.label + ' / Drop 001';
  $('#hero-poster-source').srcset = webImage(story.poster);
  hero.dataset.activeStory = String(index);
  state.displayedIndex = index;
}
function showPoster(index) {
  videos.forEach(clearVideo);
  updateHeroState(index);
  $('#hero-poster').classList.add('is-visible');
  scheduleHeroRotation();
}
function waitForPlayable(video, signal) {
  return new Promise((resolve, reject) => {
    let timeout;
    const finish = (error) => {
      window.clearTimeout(timeout);
      video.removeEventListener('canplay', ready);
      video.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
      if (error) reject(error); else resolve();
    };
    const ready = () => finish();
    const failed = () => finish(new Error('Video unavailable'));
    const aborted = () => finish(new DOMException('Cancelled', 'AbortError'));
    video.addEventListener('canplay', ready, { once: true });
    video.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', aborted, { once: true });
    timeout = window.setTimeout(failed, 8000);
    if (signal.aborted) aborted();
    else if (video.readyState >= 3) ready();
  });
}
function waitForFrame(video) {
  if (!video.requestVideoFrameCallback) return new Promise(resolve => window.requestAnimationFrame(resolve));
  return new Promise(resolve => {
    const timeout = window.setTimeout(resolve, 500);
    video.requestVideoFrameCallback(() => { window.clearTimeout(timeout); resolve(); });
  });
}
async function setHero(index) {
  if (!heroStories[index]) return;
  stopHeroTimer();
  cancelPendingVideo();
  state.heroIndex = index;
  if (!heroCanPlay()) {
    showPoster(index);
    return;
  }
  if (index === state.displayedIndex && state.activeVideo.hasAttribute('src') && state.activeVideo.readyState >= 2) {
    try { await state.activeVideo.play(); } catch { showPoster(index); }
    scheduleHeroRotation();
    return;
  }
  const incoming = videos.find(video => video !== state.activeVideo);
  const outgoing = state.activeVideo;
  const token = state.heroToken;
  const controller = new AbortController();
  state.heroAbort = controller;
  state.pendingVideo = incoming;
  incoming.muted = true;
  incoming.poster = webImage(heroStories[index].poster);
  incoming.src = heroStories[index].video;
  const ready = waitForPlayable(incoming, controller.signal);
  incoming.load();
  try {
    await ready;
    if (token !== state.heroToken || !heroCanPlay()) return;
    await incoming.play();
    await waitForFrame(incoming);
    if (token !== state.heroToken || !heroCanPlay()) return;
    updateHeroState(index);
    outgoing.classList.remove('is-current');
    incoming.classList.add('is-active', 'is-current');
    state.activeVideo = incoming;
    state.pendingVideo = null;
    state.heroAbort = null;
    state.videoCleanup = window.setTimeout(() => {
      if (token !== state.heroToken) return;
      clearVideo(outgoing);
      $('#hero-poster').classList.remove('is-visible');
    }, 650);
    scheduleHeroRotation();
  } catch (error) {
    if (error.name === 'AbortError' || token !== state.heroToken) return;
    state.pendingVideo = null;
    state.heroAbort = null;
    showPoster(index);
  }
}
function syncHeroActivity() {
  if (!heroCanPlay()) {
    stopHeroTimer();
    cancelPendingVideo();
    videos.forEach(video => video.pause());
    if (motion.matches) showPoster(state.heroIndex);
  } else {
    setHero(state.heroIndex);
  }
}
videos.forEach(video => video.addEventListener('error', () => {
  if (video === state.activeVideo && !state.pendingVideo) showPoster(state.heroIndex);
}));
function observeHeroVisibility() {
  if (!('IntersectionObserver' in window)) return;
  heroObserver?.disconnect();
  heroObserver = new IntersectionObserver(entries => {
    const visible = entries[0].isIntersecting;
    if (state.heroVisible === visible) return;
    state.heroVisible = visible;
    syncHeroActivity();
  }, { threshold: 0, rootMargin: '-' + measuredChromeHeight + 'px 0px 0px 0px' });
  heroObserver.observe(hero);
}
document.addEventListener('visibilitychange', syncHeroActivity);
motion.addEventListener('change', syncHeroActivity);

function setMenuOpen(isOpen, { restoreFocus = false, focusFirst = false } = {}) {
  state.menuOpen = Boolean(isOpen && mobile.matches);
  menu.classList.toggle('is-open', state.menuOpen);
  document.documentElement.classList.toggle('menu-is-open', state.menuOpen);
  document.body.classList.toggle('menu-is-open', state.menuOpen);
  $('#main-content').inert = state.menuOpen;
  $('.site-footer').inert = state.menuOpen;
  $('.skip-link').inert = state.menuOpen;
  menu.inert = !state.menuOpen;
  menu.setAttribute('aria-hidden', String(!state.menuOpen));
  menuToggle.setAttribute('aria-expanded', String(state.menuOpen));
  menuToggle.setAttribute('aria-label', state.menuOpen ? 'Close menu' : 'Open menu');
  if (state.menuOpen && focusFirst) $('a', menu).focus({ preventScroll: true });
  if (!state.menuOpen && restoreFocus) menuToggle.focus({ preventScroll: true });
  syncHeroActivity();
}
mobile.addEventListener('change', () => setMenuOpen(false));

function lockPage() {
  if (state.lockedY !== null) return;
  state.lockedY = window.scrollY;
  state.bodyStyle = document.body.getAttribute('style');
  Object.assign(document.body.style, { position: 'fixed', top: '-' + state.lockedY + 'px', left: '0', right: '0', width: '100%', overflow: 'hidden' });
}
function unlockPage() {
  if (state.lockedY === null) return;
  const y = state.lockedY;
  if (state.bodyStyle === null) document.body.removeAttribute('style');
  else document.body.setAttribute('style', state.bodyStyle);
  const previous = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, y);
  document.documentElement.style.scrollBehavior = previous;
  state.lockedY = null;
  updateScrollChrome();
}
function openPanel(panel, opener) {
  window.clearTimeout(state.panelTimer);
  window.clearTimeout(showToast.timeout);
  $('#toast').classList.remove('is-visible');
  state.closingPanel = false;
  if (state.menuOpen) setMenuOpen(false);
  state.panelOpener = opener || document.activeElement;
  panels.forEach(other => {
    other.classList.remove('is-open');
    other.hidden = other !== panel;
    other.inert = other !== panel;
  });
  state.panel = panel;
  backdrop.hidden = false;
  lockPage();
  shell.inert = true;
  $('.skip-link').inert = true;
  void panel.offsetWidth;
  backdrop.classList.add('is-open');
  panel.classList.add('is-open');
  $('.panel-close', panel).focus({ preventScroll: true });
  syncHeroActivity();
}
function closePanels({ restoreFocus = true } = {}) {
  if (!state.panel || state.closingPanel) return;
  const panel = state.panel;
  const opener = state.panelOpener;
  state.closingPanel = true;
  panel.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  panel.inert = true;
  state.panelTimer = window.setTimeout(() => {
    panels.forEach(item => { item.hidden = true; item.inert = false; });
    backdrop.hidden = true;
    shell.inert = false;
    $('.skip-link').inert = false;
    state.panel = null;
    state.closingPanel = false;
    unlockPage();
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    syncHeroActivity();
  }, motion.matches ? 0 : 280);
}
function openQuickView(productId, opener) {
  const product = products.find(item => item.id === productId);
  if (!product) return;
  state.quickViewId = productId;
  state.selectedSize = 'S';
  $('#quick-view-image').src = product.image;
  $('#quick-view-image').alt = product.name;
  $('#quick-view-source').srcset = webImage(product.image);
  $('#quick-view-category').textContent = product.id.toUpperCase() + ' / ' + product.sleeve;
  $('#quick-view-title').textContent = product.name.split(' / ')[1];
  $('#quick-view-price').textContent = money(product.price);
  $('#quick-view-description').textContent = product.description;
  updateSizeSelection();
  openPanel($('#quick-view'), opener);
}
function updateSizeSelection() {
  $$('.size-option').forEach(option => {
    const active = option.dataset.size === state.selectedSize;
    option.classList.toggle('is-active', active);
    option.setAttribute('aria-pressed', String(active));
  });
}
function updateCart() {
  const count = state.cart.length;
  $('.cart-button').setAttribute('aria-label', 'Open bag, ' + count + (count === 1 ? ' piece' : ' pieces'));
  $('.drawer-count').textContent = count;
  $('#cart-total').textContent = money(state.cart.reduce((sum, item) => sum + item.price, 0));
  $('#cart-items').innerHTML = count === 0 ?
    '<div class="empty-cart"><p>Your bag is empty.<br />Find your piece in Drop 001.</p><a class="button button-dark" href="#shop" data-action="browse-pieces">Explore the pieces</a></div>' :
    state.cart.map((item, index) => [
      '<article class="cart-item"><picture><source srcset="' + webImage(item.image) + '" type="image/webp" /><img src="' + item.image + '" alt="' + item.name + '" width="800" height="800" /></picture>',
      '<div><p class="cart-item-name">' + item.name + '</p><p class="cart-item-meta">' + item.sleeve + ' / Size ' + item.size + '</p>',
      '<div class="cart-item-bottom"><span class="cart-item-price">' + money(item.price) + '</span><button class="remove-item" type="button" data-action="remove-item" data-cart-index="' + index + '" aria-label="Remove ' + item.name + ', size ' + item.size + '">Remove</button></div></div></article>'
    ].join('')).join('');
}
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action], [data-size]');
  if (state.menuOpen && event.target === menu) {
    setMenuOpen(false, { restoreFocus: true });
    return;
  }
  if (state.menuOpen && !menu.contains(event.target) && !menuToggle.contains(event.target)) setMenuOpen(false);
  const navLink = event.target.closest('.mobile-nav a');
  if (navLink) setMenuOpen(false);
  if (!target) return;
  if (target.dataset.size) { state.selectedSize = target.dataset.size; updateSizeSelection(); }
  switch (target.dataset.action) {
    case 'menu': setMenuOpen(!state.menuOpen, { focusFirst: event.detail === 0 }); break;
    case 'quick-view': openQuickView(target.dataset.productId, target); break;
    case 'close-panel': closePanels(); break;
    case 'open-cart': updateCart(); openPanel($('#cart-drawer'), target); break;
    case 'add-to-cart': {
      const product = products.find(item => item.id === state.quickViewId);
      if (!product) break;
      state.cart.push({ ...product, size: state.selectedSize });
      updateCart();
      closePanels();
      showToast(product.name + ' / Size ' + state.selectedSize + ' added to bag');
      break;
    }
    case 'remove-item': {
      const index = Number(target.dataset.cartIndex);
      state.cart.splice(index, 1);
      updateCart();
      const removeButtons = $$('.remove-item');
      (removeButtons[Math.min(index, removeButtons.length - 1)] || $('.panel-close', state.panel)).focus({ preventScroll: true });
      break;
    }
    case 'browse-pieces':
      event.preventDefault();
      closePanels({ restoreFocus: false });
      window.setTimeout(() => {
        $('#shop').scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth' });
        $('.product-image').focus({ preventScroll: true });
      }, motion.matches ? 0 : 285);
      break;
  }
});
backdrop.addEventListener('click', () => closePanels());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (state.panel) closePanels();
    else if (state.menuOpen) setMenuOpen(false, { restoreFocus: true });
  }
  if (state.panel && event.key === 'Tab') {
    const focusable = $$('button, a[href], [tabindex="0"]', state.panel).filter(item => !item.disabled && item.getClientRects().length);
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) { event.preventDefault(); state.panel.focus(); return; }
    if (event.shiftKey && (document.activeElement === first || !state.panel.contains(document.activeElement))) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !state.panel.contains(document.activeElement))) {
      event.preventDefault(); first.focus();
    }
  }
});
document.addEventListener('focusin', event => {
  if (state.panel && !state.closingPanel && !state.panel.contains(event.target)) $('.panel-close', state.panel).focus({ preventScroll: true });
});
renderProducts();
updateCart();
updateChromeHeight();
updateScrollChrome();
initializeAccessGate();
