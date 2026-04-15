/* ============================================
   CURATED WALL — App Logic
   ============================================ */

const WHATSAPP_NUMBER = '916361096873';
const PRICE = '₹999';
const MAX_PICKS = 3;

// Color palettes for placeholder images
const PALETTE = [
  '#F4A261','#264653','#606C38','#6D597A','#BC6C25','#577590',
  '#F94144','#355070','#003049','#2B2D42','#E63946','#1D3557',
  '#CDB4DB','#BDE0FE','#780000','#669BBC','#3A86FF','#8338EC',
];

let allPrints = [];
let selectedPrints = [];
let currentFilter = 'all';

async function init() {
  try {
    const res = await fetch('data/stock.json');
    allPrints = await res.json();
    renderGallery();
    setupFilters();
    setupModal();
    setupZoom();
    setupScrollTop();
  } catch (err) {
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
}

function filterPrints() {
  let results;
  if (currentFilter === 'all') results = allPrints.filter(p => p.stock > 0);
  else if (currentFilter === 'portrait') results = allPrints.filter(p => p.stock > 0 && p.orientation === 'portrait');
  else if (currentFilter === 'landscape') results = allPrints.filter(p => p.stock > 0 && p.orientation === 'landscape');
  else results = allPrints.filter(p => p.stock > 0);

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
  const imgPath = `images/collection/${print.id}.jpg`;

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
    <article class="product-card${isSoldOut ? ' sold-out' : ''}${isSelected ? ' card-selected' : ''}" data-id="${print.id}">
      <div class="card-image ${aspectClass}">
        <img src="${imgPath}"
             alt="${print.name} — ${print.orientation} art print"
             onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\' style=\\'background:${color}\\'><span class=\\'placeholder-icon\\'>&#9634;</span><span>${print.name}</span></div>'"
        >

        ${isSoldOut ? '<div class="sold-out-badge">Sold Out</div>' : ''}
        ${isSelected ? '<div class="selected-badge">✓</div>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-name">${print.name}</h3>
        <p class="card-description">${print.description}</p>
        <div class="card-footer">
          <span class="card-stock ${stockClass}">${stockText}</span>
        </div>
        ${isSoldOut ? '' : `<button class="${selectBtnClass}" onclick="toggleSelect('${print.id}')" ${isFull ? 'disabled' : ''} title="${selectBtnTitle}">${selectBtnText}</button>`}
      </div>
    </article>`;
}

/* --- Selection Logic --- */
function toggleSelect(printId) {
  const index = selectedPrints.findIndex(p => p.id === printId);
  if (index > -1) {
    selectedPrints.splice(index, 1);
  } else {
    if (selectedPrints.length >= MAX_PICKS) return;
    const print = allPrints.find(p => p.id === printId);
    if (print) selectedPrints.push(print);
  }
  renderGallery();
  updateSelectionBar();
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
    const printNames = selectedPrints.map(p => `"${p.name}" (${p.id})`).join(', ');
    const waText = encodeURIComponent(
      `Hi! I'd like to order a frame with these ${count} prints: ${printNames}. Is this available?`
    );
    ctaEl.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
    ctaEl.classList.remove('disabled');
    ctaEl.removeAttribute('aria-disabled');
    ctaEl.setAttribute('target', '_blank');
    ctaEl.setAttribute('rel', 'noopener');
    ctaEl.onclick = null;
  } else {
    ctaEl.href = '#';
    ctaEl.classList.remove('disabled');
    ctaEl.removeAttribute('aria-disabled');
    ctaEl.removeAttribute('target');
    ctaEl.onclick = (e) => {
      e.preventDefault();
      showToast(`Please select ${MAX_PICKS - count} more print${MAX_PICKS - count > 1 ? 's' : ''} to complete your set of ${MAX_PICKS}.`);
    };
  }
}

/* --- Toast Notification --- */
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger reflow then show
  requestAnimationFrame(() => toast.classList.add('visible'));

  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
    if (e.target.closest('.btn-select')) return;
    const card = e.target.closest('.product-card');
    if (!card) return;
    openModal(card.dataset.id);
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
  });
}

function openModal(printId) {
  modalPrintId = printId;
  updateModalContent();
  document.getElementById('modal-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.body.style.overflow = '';
  modalPrintId = null;
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
  const ZOOM = 3;
  let isZoomed = false;

  function enterZoom(clientX, clientY) {
    isZoomed = true;
    container.classList.add('zoomed');
    // Set background image to the full-res source
    container.style.backgroundImage = `url('${img.src}')`;
    container.style.backgroundSize = `${ZOOM * 100}%`;
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
    if (now - lastTap < 300) {
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

/* --- Scroll to Top --- */
function setupScrollTop() {
  const btn = document.getElementById('scroll-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', init);
