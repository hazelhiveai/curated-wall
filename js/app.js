/* ============================================
   CURATED WALL — App Logic
   ============================================ */

const WHATSAPP_NUMBER = '916361096873';
const PRICE = '₹999';

// Color palettes for placeholder images (per bundle)
const PALETTE = [
  ['#F4A261','#E76F51','#2A9D8F'],['#264653','#287271','#2A9D8F'],
  ['#606C38','#283618','#DDA15E'],['#6D597A','#B56576','#E56B6F'],
  ['#BC6C25','#DDA15E','#FEFAE0'],['#577590','#43AA8B','#90BE6D'],
  ['#F94144','#F3722C','#F8961E'],['#355070','#6D597A','#B56576'],
  ['#003049','#D62828','#F77F00'],['#2B2D42','#8D99AE','#EDF2F4'],
  ['#E63946','#457B9D','#A8DADC'],['#1D3557','#457B9D','#A8DADC'],
  ['#606C38','#FEFAE0','#DDA15E'],['#CDB4DB','#FFC8DD','#FFAFCC'],
  ['#BDE0FE','#A2D2FF','#CDB4DB'],['#780000','#C1121F','#FDF0D5'],
  ['#669BBC','#003049','#C1121F'],['#3A86FF','#8338EC','#FF006E'],
];

let allBundles = [];
let currentFilter = 'available';

async function init() {
  try {
    const res = await fetch('data/stock.json');
    allBundles = await res.json();
    renderGallery();
    setupFilters();
  } catch (err) {
    document.getElementById('product-grid').innerHTML =
      '<p style="text-align:center;color:#999;padding:40px;">Unable to load bundles. Please try again later.</p>';
  }
}

function renderGallery() {
  const grid = document.getElementById('product-grid');
  const emptyMsg = document.getElementById('gallery-empty');

  const filtered = currentFilter === 'available'
    ? allBundles.filter(b => b.stock > 0)
    : allBundles;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyMsg.style.display = 'block';
    return;
  }

  emptyMsg.style.display = 'none';
  grid.innerHTML = filtered.map((bundle, i) => createCard(bundle, i)).join('');
  initCarousels();
}

function createCard(bundle, index) {
  const isSoldOut = bundle.stock === 0;
  const stockClass = isSoldOut ? 'out-of-stock' : bundle.stock === 1 ? 'low-stock' : 'in-stock';
  const stockText = isSoldOut ? 'Sold Out' : bundle.stock === 1 ? 'Only 1 left' : `${bundle.stock} in stock`;
  const paletteIndex = index % PALETTE.length;
  const colors = PALETTE[paletteIndex];

  const waText = encodeURIComponent(
    `Hi! I'm interested in the "${bundle.name}" bundle (${bundle.id}). Is it still available?`
  );
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;

  const slides = [0, 1, 2].map(j => {
    const color = colors[j];
    const imgPath = `images/bundles/${bundle.id}/print-${j + 1}.jpg`;
    return `
      <div class="carousel-slide">
        <img src="${imgPath}"
             alt="${bundle.name} — Print ${j + 1}"
             onerror="this.parentElement.innerHTML='<div class=\\'placeholder\\' style=\\'background:${color}\\'><span class=\\'placeholder-icon\\'>&#9634;</span><span>Print ${j + 1}</span></div>'"
        >
      </div>`;
  }).join('');

  return `
    <article class="product-card${isSoldOut ? ' sold-out' : ''}" data-id="${bundle.id}">
      <div class="card-carousel" data-carousel>
        <div class="carousel-track">${slides}</div>
        <button class="carousel-btn prev" aria-label="Previous">&#8249;</button>
        <button class="carousel-btn next" aria-label="Next">&#8250;</button>
        <div class="carousel-dots">
          <span class="carousel-dot active" data-slide="0"></span>
          <span class="carousel-dot" data-slide="1"></span>
          <span class="carousel-dot" data-slide="2"></span>
        </div>
        ${isSoldOut ? '<div class="sold-out-badge">Sold Out</div>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-name">${bundle.name}</h3>
        <p class="card-description">${bundle.description}</p>
        <div class="card-footer">
          <span class="card-price">${PRICE}</span>
          <span class="card-stock ${stockClass}">${stockText}</span>
        </div>
        <a href="${isSoldOut ? '#' : waLink}"
           class="btn btn-whatsapp${isSoldOut ? ' disabled' : ''}"
           ${isSoldOut ? '' : 'target="_blank" rel="noopener"'}
           ${isSoldOut ? 'aria-disabled="true"' : ''}
           onclick="${isSoldOut ? 'return false;' : ''}">
          <svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          ${isSoldOut ? 'Sold Out' : 'Order on WhatsApp'}
        </a>
      </div>
    </article>`;
}

/* --- Carousel Logic --- */
function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    let current = 0;
    const track = carousel.querySelector('.carousel-track');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const prevBtn = carousel.querySelector('.prev');
    const nextBtn = carousel.querySelector('.next');

    function goTo(index) {
      current = (index + 3) % 3;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    prevBtn.addEventListener('click', (e) => { e.preventDefault(); goTo(current - 1); });
    nextBtn.addEventListener('click', (e) => { e.preventDefault(); goTo(current + 1); });
    dots.forEach(dot => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.slide)));
    });

    // Touch/swipe support
    let startX = 0;
    let diffX = 0;
    carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchmove', (e) => { diffX = e.touches[0].clientX - startX; }, { passive: true });
    carousel.addEventListener('touchend', () => {
      if (Math.abs(diffX) > 40) {
        goTo(diffX > 0 ? current - 1 : current + 1);
      }
      diffX = 0;
    });
  });
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
