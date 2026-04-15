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
let currentFilter = 'available';

async function init() {
  try {
    const res = await fetch('data/stock.json');
    allPrints = await res.json();
    renderGallery();
    setupFilters();
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
  if (currentFilter === 'available') return allPrints.filter(p => p.stock > 0);
  if (currentFilter === 'all') return allPrints;
  if (currentFilter === 'portrait') return allPrints.filter(p => p.stock > 0 && p.orientation === 'portrait');
  if (currentFilter === 'landscape') return allPrints.filter(p => p.stock > 0 && p.orientation === 'landscape');
  return allPrints;
}

function createCard(print, index) {
  const isSoldOut = print.stock === 0;
  const isSelected = selectedPrints.some(p => p.id === print.id);
  const isFull = selectedPrints.length >= MAX_PICKS && !isSelected;
  const stockClass = isSoldOut ? 'out-of-stock' : print.stock === 1 ? 'low-stock' : 'in-stock';
  const stockText = isSoldOut ? 'Sold Out' : print.stock === 1 ? 'Only 1 left' : `${print.stock} in stock`;
  const color = PALETTE[index % PALETTE.length];
  const aspectClass = print.orientation === 'portrait' ? 'aspect-portrait' : 'aspect-landscape';
  const imgPath = `images/collection/${print.id}.jpg`;

  let selectBtnText = 'Select';
  let selectBtnClass = 'btn-select';
  if (isSelected) {
    selectBtnText = '✓ Selected';
    selectBtnClass = 'btn-select selected';
  } else if (isFull) {
    selectBtnText = 'Select';
    selectBtnClass = 'btn-select full';
  }

  return `
    <article class="product-card${isSoldOut ? ' sold-out' : ''}${isSelected ? ' card-selected' : ''}" data-id="${print.id}">
      <div class="card-image ${aspectClass}">
        <img src="${imgPath}"
             alt="${print.name} — ${print.orientation} art print"
             onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\' style=\\'background:${color}\\'><span class=\\'placeholder-icon\\'>&#9634;</span><span>${print.name}</span></div>'"
        >
        <span class="orientation-badge">${print.orientation}</span>
        ${isSoldOut ? '<div class="sold-out-badge">Sold Out</div>' : ''}
        ${isSelected ? '<div class="selected-badge">✓</div>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-name">${print.name}</h3>
        <p class="card-description">${print.description}</p>
        <div class="card-footer">
          <span class="card-stock ${stockClass}">${stockText}</span>
        </div>
        ${isSoldOut ? '' : `<button class="${selectBtnClass}" onclick="toggleSelect('${print.id}')" ${isFull ? 'disabled' : ''}>${selectBtnText}</button>`}
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

  if (count > 0) {
    const printNames = selectedPrints.map(p => `"${p.name}" (${p.id})`).join(', ');
    const waText = encodeURIComponent(
      `Hi! I'd like to order a frame with these ${count} print${count > 1 ? 's' : ''}: ${printNames}. Is this available?`
    );
    ctaEl.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
    ctaEl.classList.remove('disabled');
    ctaEl.removeAttribute('aria-disabled');
    ctaEl.setAttribute('target', '_blank');
    ctaEl.setAttribute('rel', 'noopener');
    ctaEl.onclick = null;
  }
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

// Initialize
document.addEventListener('DOMContentLoaded', init);
