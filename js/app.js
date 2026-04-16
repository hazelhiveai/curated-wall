/* ============================================
   CURATED WALL — App Logic
   ============================================ */

const WHATSAPP_NUMBER = '916361096873';
const PRICE = '₹999';
const MAX_PICKS = 3;

// Constants
const DOUBLE_TAP_MS = 300;
const SCROLL_THRESHOLD = 400;
const ZOOM_LEVEL = 3;
const TOAST_DURATION = 3000;
const TOAST_FADE_MS = 300;

// Color palettes for placeholder images
const PALETTE = [
  '#F4A261','#264653','#606C38','#6D597A','#BC6C25','#577590',
  '#F94144','#355070','#003049','#2B2D42','#E63946','#1D3557',
  '#CDB4DB','#BDE0FE','#780000','#669BBC','#3A86FF','#8338EC',
];

// HTML escape to prevent XSS when interpolating into innerHTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let allPrints = [];
let selectedPrints = [];
let currentFilter = 'all';

async function init() {
  try {
    const res = await fetch('data/stock.json');
    allPrints = await res.json();
    renderGallery();
    setupSelectDelegation();
    setupFilters();
    setupModal();
    setupZoom();
    setupReviewModal();
    setupScrollTop();
  } catch (err) {
    console.error('Failed to load prints:', err);
    document.getElementById('product-grid').innerHTML =
      '<p style="text-align:center;color:#999;padding:40px;">Unable to load prints. Please try again later.</p>';
  }
}

function renderGallery() {
  const grid = document.getElementById('product-grid');
  const emptyMsg = document.getElementById('gallery-empty');

  const filtered = filterPrints();

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  grid.innerHTML = filtered.map((print, i) => createCard(print, i)).join('');

  // Attach image error handlers (safe placeholder without innerHTML XSS)
  grid.querySelectorAll('.product-card img').forEach(img => {
    img.addEventListener('error', function () {
      const card = this.closest('.product-card');
      const color = card.dataset.color || '#ccc';
      const name = card.querySelector('.card-name').textContent;
      const wrapper = this.parentElement;
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.style.background = color;
      const icon = document.createElement('span');
      icon.className = 'placeholder-icon';
      icon.textContent = '▢';
      const label = document.createElement('span');
      label.textContent = name;
      placeholder.appendChild(icon);
      placeholder.appendChild(label);
      wrapper.replaceChild(placeholder, this);
    }, { once: true });
  });
}

function filterPrints() {
  const inStock = allPrints.filter(p => p.stock > 0);
  const results = currentFilter === 'all'
    ? inStock
    : inStock.filter(p => p.orientation === currentFilter);

  // Sort portrait-first, then landscape
  return results.sort((a, b) => {
    if (a.orientation === b.orientation) return 0;
    return a.orientation === 'portrait' ? -1 : 1;
  });
}

function createCard(print, index) {
  const isSoldOut = print.stock === 0;
  const isSelected = selectedPrints.some(p => p.id === print.id);
  const isFull = selectedPrints.length >= MAX_PICKS && !isSelected;
  const stockClass = isSoldOut ? 'out-of-stock' : print.stock === 1 ? 'low-stock' : 'in-stock';
  const stockText = isSoldOut ? 'Sold Out' : print.stock === 1 ? 'Only 1 left' : print.stock >= 100 ? 'Available' : `${print.stock} in stock`;
  const color = PALETTE[index % PALETTE.length];
  const aspectClass = print.orientation === 'portrait' ? 'aspect-portrait' : 'aspect-landscape';
  const safeId = escapeHTML(print.id);
  const safeName = escapeHTML(print.name);
  const safeDesc = escapeHTML(print.description);
  const safeOrientation = escapeHTML(print.orientation);
  const imgPath = `images/collection/${safeId}.jpg`;

  let selectBtnText = 'Select';
  let selectBtnClass = 'btn-select';
  let selectBtnTitle = 'Click to select';
  if (isSelected) {
    selectBtnText = '✓ Selected';
    selectBtnClass = 'btn-select selected';
    selectBtnTitle = 'Click to deselect';
  } else if (isFull) {
    selectBtnText = 'Select';
    selectBtnClass = 'btn-select full';
    selectBtnTitle = '';
  }

  return `
    <article class="product-card${isSoldOut ? ' sold-out' : ''}${isSelected ? ' card-selected' : ''}" data-id="${safeId}" data-color="${color}">
      <div class="card-image ${aspectClass}">
        <img src="${imgPath}"
             alt="${safeName} — ${safeOrientation} art print"
             loading="lazy"
        >

        ${isSoldOut ? '<div class="sold-out-badge">Sold Out</div>' : ''}
        ${isSelected ? '<div class="selected-badge">✓</div>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-name">${safeName}</h3>
        <p class="card-description">${safeDesc}</p>
        <div class="card-footer">
          <span class="card-stock ${stockClass}">${stockText}</span>
        </div>
        ${isSoldOut ? '' : `<button class="${selectBtnClass}" data-select="${safeId}" ${isFull ? 'disabled' : ''} title="${selectBtnTitle}">${selectBtnText}</button>`}
      </div>
    </article>`;
}

/* --- Selection Logic --- */
function setupSelectDelegation() {
  document.getElementById('product-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-select]');
    if (!btn) return;
    toggleSelect(btn.dataset.select);
  });
}

function toggleSelect(printId) {
  const index = selectedPrints.findIndex(p => p.id === printId);
  if (index > -1) {
    selectedPrints.splice(index, 1);
  } else {
    if (selectedPrints.length >= MAX_PICKS) return;
    const print = allPrints.find(p => p.id === printId);
    if (print) selectedPrints.push(print);
  }
  updateCardStates();
  updateSelectionBar();
}

function updateCardStates() {
  const grid = document.getElementById('product-grid');
  const cards = grid.querySelectorAll('.product-card');
  const isFull = selectedPrints.length >= MAX_PICKS;

  cards.forEach(card => {
    const id = card.dataset.id;
    const isSelected = selectedPrints.some(p => p.id === id);

    // Update card selection class
    card.classList.toggle('card-selected', isSelected);

    // Update selected badge
    let badge = card.querySelector('.selected-badge');
    if (isSelected && !badge) {
      badge = document.createElement('div');
      badge.className = 'selected-badge';
      badge.textContent = '✓';
      card.querySelector('.card-image').appendChild(badge);
    } else if (!isSelected && badge) {
      badge.remove();
    }

    // Update select button
    const btn = card.querySelector('[data-select]');
    if (!btn) return;

    if (isSelected) {
      btn.textContent = '✓ Selected';
      btn.className = 'btn-select selected';
      btn.disabled = false;
      btn.title = 'Click to deselect';
    } else if (isFull) {
      btn.textContent = 'Select';
      btn.className = 'btn-select full';
      btn.disabled = true;
      btn.title = '';
    } else {
      btn.textContent = 'Select';
      btn.className = 'btn-select';
      btn.disabled = false;
      btn.title = 'Click to select';
    }
  });
}

function updateSelectionBar() {
  const bar = document.getElementById('selection-bar');
  const countEl = document.getElementById('selection-count');
  const namesEl = document.getElementById('selection-names');
  const ctaEl = document.getElementById('selection-cta');

  const count = selectedPrints.length;

  if (count === 0) {
    bar.classList.remove('visible');
    return;
  }

  bar.classList.add('visible');
  countEl.textContent = `${count} of ${MAX_PICKS} prints selected`;
  namesEl.textContent = selectedPrints.map(p => p.name).join(' · ');

  if (count === MAX_PICKS) {
    ctaEl.classList.remove('disabled');
    ctaEl.disabled = false;
    ctaEl.onclick = () => openReviewModal();
  } else {
    ctaEl.classList.add('disabled');
    ctaEl.disabled = false;
    ctaEl.onclick = () => {
      const remaining = MAX_PICKS - count;
      showToast(`Please select ${remaining} more print${remaining > 1 ? 's' : ''} to complete your set of ${MAX_PICKS}.`);
    };
  }
}

/* --- Toast Notification --- */
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger reflow then show
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), TOAST_FADE_MS);
  }, TOAST_DURATION);
}

/* --- Detail Modal Logic --- */
let modalPrintId = null;

function setupModal() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  const prevBtn = document.getElementById('modal-prev');
  const nextBtn = document.getElementById('modal-next');
  const selectBtn = document.getElementById('modal-select');

  document.getElementById('product-grid').addEventListener('click', (e) => {
    if (e.target.closest('[data-select]')) return;
    const card = e.target.closest('.product-card');
    if (!card) return;
    openModal(card.dataset.id, card);
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  prevBtn.addEventListener('click', () => navigateModal(-1));
  nextBtn.addEventListener('click', () => navigateModal(1));

  selectBtn.addEventListener('click', () => {
    if (modalPrintId) {
      toggleSelect(modalPrintId);
      updateModalContent();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigateModal(-1);
    if (e.key === 'ArrowRight') navigateModal(1);
    if (e.key === 'Tab') trapFocus(e);
  });
}

let modalTriggerEl = null;
let modalPreviewMode = false;

function openModal(printId, triggerEl, previewMode) {
  modalTriggerEl = triggerEl || null;
  modalPreviewMode = !!previewMode;
  modalPrintId = printId;
  updateModalContent();
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.toggle('preview-mode', modalPreviewMode);
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Move focus into modal
  document.getElementById('modal-close').focus();
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  const wasPreview = modalPreviewMode;
  overlay.classList.remove('active', 'preview-mode');
  modalPrintId = null;
  modalPreviewMode = false;

  if (wasPreview) {
    // Return to review modal
    document.getElementById('review-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('review-close').focus();
  } else {
    document.body.style.overflow = '';
    // Return focus to the card that opened the modal
    if (modalTriggerEl) {
      modalTriggerEl.focus();
      modalTriggerEl = null;
    }
  }
}

function trapFocus(e) {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay.classList.contains('active')) return;
  const modal = overlay.querySelector('.modal');
  const focusable = modal.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function navigateModal(direction) {
  const filtered = filterPrints();
  const currentIndex = filtered.findIndex(p => p.id === modalPrintId);
  if (currentIndex === -1) return;
  const nextIndex = (currentIndex + direction + filtered.length) % filtered.length;
  modalPrintId = filtered[nextIndex].id;
  updateModalContent();
}

function updateModalContent() {
  const print = allPrints.find(p => p.id === modalPrintId);
  if (!print) return;

  const filtered = filterPrints();
  const currentIndex = filtered.findIndex(p => p.id === modalPrintId);

  document.getElementById('modal-img').src = `images/collection/${print.id}.jpg`;
  document.getElementById('modal-img').alt = print.name;
  document.getElementById('modal-name').textContent = print.name;
  document.getElementById('modal-description').textContent = print.description;

  const stockEl = document.getElementById('modal-stock');
  const isSelected = selectedPrints.some(p => p.id === print.id);
  const isFull = selectedPrints.length >= MAX_PICKS && !isSelected;

  if (print.stock === 0) {
    stockEl.textContent = 'Sold Out';
    stockEl.className = 'modal-stock card-stock out-of-stock';
  } else if (print.stock === 1) {
    stockEl.textContent = 'Only 1 left';
    stockEl.className = 'modal-stock card-stock low-stock';
  } else {
    stockEl.textContent = print.stock >= 100 ? 'Available' : `${print.stock} in stock`;
    stockEl.className = 'modal-stock card-stock in-stock';
  }

  const selectBtn = document.getElementById('modal-select');
  if (print.stock === 0) {
    selectBtn.style.display = 'none';
  } else {
    selectBtn.style.display = 'block';
    if (isSelected) {
      selectBtn.textContent = '✓ Selected';
      selectBtn.className = 'btn-select modal-select selected';
      selectBtn.disabled = false;
    } else if (isFull) {
      selectBtn.textContent = 'Select';
      selectBtn.className = 'btn-select modal-select full';
      selectBtn.disabled = true;
    } else {
      selectBtn.textContent = 'Select';
      selectBtn.className = 'btn-select modal-select';
      selectBtn.disabled = false;
    }
  }

  document.getElementById('modal-counter').textContent =
    `${currentIndex + 1} of ${filtered.length} prints`;
}

/* --- Pan-Zoom Logic --- */
function setupZoom() {
  const container = document.getElementById('modal-image');
  const img = document.getElementById('modal-img');
  let isZoomed = false;

  function enterZoom(clientX, clientY) {
    isZoomed = true;
    container.classList.add('zoomed');
    // Set background image to the full-res source
    container.style.backgroundImage = `url('${img.src}')`;
    container.style.backgroundSize = `${ZOOM_LEVEL * 100}%`;
    panZoom(clientX, clientY);
  }

  function exitZoom() {
    isZoomed = false;
    container.classList.remove('zoomed');
    container.style.backgroundImage = '';
  }

  function panZoom(clientX, clientY) {
    const rect = container.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    container.style.backgroundPosition = `${x}% ${y}%`;
  }

  // Desktop: click to toggle, move to pan
  container.addEventListener('click', (e) => {
    if (isZoomed) {
      exitZoom();
    } else {
      enterZoom(e.clientX, e.clientY);
    }
  });

  container.addEventListener('mousemove', (e) => {
    if (isZoomed) panZoom(e.clientX, e.clientY);
  });

  container.addEventListener('mouseleave', () => {
    if (isZoomed) exitZoom();
  });

  // Mobile: double-tap to toggle, drag to pan
  let lastTap = 0;
  container.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_MS) {
      e.preventDefault();
      if (isZoomed) {
        exitZoom();
      } else {
        const touch = e.changedTouches[0];
        enterZoom(touch.clientX, touch.clientY);
      }
    }
    lastTap = now;
  });

  container.addEventListener('touchmove', (e) => {
    if (isZoomed && e.touches.length === 1) {
      e.preventDefault();
      panZoom(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  // Reset zoom when navigating to a different print
  const observer = new MutationObserver(() => {
    if (isZoomed) exitZoom();
  });
  observer.observe(img, { attributes: true, attributeFilter: ['src'] });
}

/* --- Filter Logic --- */
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery();
    });
  });
}

/* --- Review Order Modal --- */

function openReviewModal() {
  closeModal(); // Defensively close detail modal if open
  renderReviewItems();
  updateReviewOrderButton();
  const overlay = document.getElementById('review-overlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('review-close').focus();
}

function closeReviewModal() {
  document.getElementById('review-overlay').classList.remove('active');
  document.body.style.overflow = '';
  updateCardStates();
  updateSelectionBar();
}

function renderReviewItems() {
  const container = document.getElementById('review-items');
  if (selectedPrints.length === 0) {
    container.innerHTML = '<p class="review-empty">No prints selected.</p>';
    return;
  }
  container.innerHTML = selectedPrints.map(p => `
    <div class="review-item" data-id="${escapeHTML(p.id)}">
      <img class="review-item-thumb" src="images/collection/${escapeHTML(p.id)}.jpg" alt="${escapeHTML(p.name)}">
      <span class="review-item-name">${escapeHTML(p.name)}</span>
      <button class="review-item-remove" aria-label="Remove ${escapeHTML(p.name)}" data-remove="${escapeHTML(p.id)}">&times;</button>
    </div>
  `).join('');
}

function removeReviewItem(printId) {
  toggleSelect(printId);
  renderReviewItems();
  updateReviewOrderButton();
  if (selectedPrints.length === 0) {
    closeReviewModal();
  }
}

function updateReviewOrderButton() {
  const btn = document.getElementById('review-order-cta');
  if (selectedPrints.length === MAX_PICKS) {
    btn.classList.remove('disabled');
    btn.disabled = false;
  } else {
    btn.classList.add('disabled');
    btn.disabled = true;
  }
}

function setupReviewModal() {
  const overlay = document.getElementById('review-overlay');
  const closeBtn = document.getElementById('review-close');
  const backBtn = document.getElementById('review-back');
  const orderBtn = document.getElementById('review-order-cta');
  const itemsContainer = document.getElementById('review-items');

  closeBtn.addEventListener('click', closeReviewModal);
  backBtn.addEventListener('click', closeReviewModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeReviewModal();
  });

  itemsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
      removeReviewItem(removeBtn.dataset.remove);
      return;
    }
    const thumb = e.target.closest('.review-item-thumb');
    if (thumb) {
      const item = thumb.closest('.review-item');
      if (item) {
        document.getElementById('review-overlay').classList.remove('active');
        openModal(item.dataset.id, null, true);
      }
    }
  });

  orderBtn.addEventListener('click', () => {
    if (selectedPrints.length !== MAX_PICKS) return;
    const printNames = selectedPrints.map(p => `"${p.name}" (${p.id})`).join(', ');
    const waText = encodeURIComponent(
      `Hi! I'd like to order a frame with these ${selectedPrints.length} prints: ${printNames}. Is this available?`
    );
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
    window.open(waUrl, '_blank', 'noopener');
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeReviewModal();
    if (e.key === 'Tab') {
      const modal = overlay.querySelector('.review-modal');
      const focusable = modal.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}

/* --- Scroll to Top --- */
function setupScrollTop() {
  const btn = document.getElementById('scroll-top');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      btn.classList.toggle('visible', window.scrollY > SCROLL_THRESHOLD);
      ticking = false;
    });
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
