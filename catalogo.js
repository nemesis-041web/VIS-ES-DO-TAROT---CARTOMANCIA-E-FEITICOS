const STORAGE_KEY_CART = window.VISOES_STORAGE_KEYS.cart;
let cart = window.readSharedCart();
let pendingCartRemovalId = null;

const currentMonthName = document.getElementById('currentMonthName');
if (currentMonthName) {
  currentMonthName.textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
}

document.querySelectorAll('.collection-options a').forEach(link => {
  link.addEventListener('click', () => {
    window.playMagicSound('navigate');
    window.setTimeout(() => {
      link.closest('.collection-picker').open = false;
    }, 180);
  });
});

function formatCatalogPrice(amount) {
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function requestRemoveFromCart(serviceId) {
  const item = window.VISOES_SERVICES.find(s => s.id === serviceId);
  if (!item) return;

  pendingCartRemovalId = serviceId;
  document.getElementById('cartAlertItem').textContent = item.title;
  document.getElementById('cartAlertBackdrop').hidden = false;
}

function closeCartAlert() {
  pendingCartRemovalId = null;
  document.getElementById('cartAlertBackdrop').hidden = true;
}

function confirmRemoveFromCart() {
  if (!pendingCartRemovalId) return;
  const serviceId = pendingCartRemovalId;
  closeCartAlert();

  cart = cart.filter(id => id !== serviceId);
  window.writeSharedCart(cart);
  window.playMagicSound('remove');
  updateCatalogCart();

  const service = window.VISOES_SERVICES.find(s => s.id === serviceId);
  document.getElementById('catalogCartFeedback').textContent = `${service ? service.title : 'Item'} foi removido do pedido.`;
}

function updateCatalogCart() {
  const cartItems = document.getElementById('catalogCartItems');
  const totalElement = document.getElementById('catalogCartTotal');
  const cartCount = document.getElementById('catalogCartCount');
  const feedback = document.getElementById('catalogCartFeedback');
  const selectedServices = cart.map(id => window.VISOES_SERVICES.find(service => service.id === id)).filter(Boolean);
  const hasCustomPrice = selectedServices.some(service => service.isCustomPrice);
  const total = selectedServices.reduce((sum, service) => sum + service.price, 0);

  cartCount.textContent = selectedServices.length;
  cartCount.parentElement.setAttribute('aria-label', `Ver meu pedido, ${selectedServices.length} ${selectedServices.length === 1 ? 'item' : 'itens'}`);
  totalElement.textContent = `R$ ${formatCatalogPrice(total)}${hasCustomPrice ? ' + valores sob consulta' : ''}`;
  cartItems.replaceChildren();

  if (selectedServices.length === 0) {
    feedback.textContent = 'Seu carrinho está vazio. Adicione uma leitura para iniciar o pedido.';
  } else {
    feedback.textContent = `${selectedServices.length} ${selectedServices.length === 1 ? 'leitura selecionada' : 'leituras selecionadas'}; você pode concluir o agendamento no próximo passo.`;
  }

  selectedServices.forEach(service => {
    const row = document.createElement('li');
    row.className = 'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-purple-400/20 bg-purple-950/35 p-3 text-sm';
    const title = document.createElement('span');
    title.className = 'font-semibold text-white';
    title.textContent = service.title;
    const details = document.createElement('span');
    details.className = 'text-right text-tarot-goldLight';
    details.textContent = service.isCustomPrice ? service.priceLabel : `R$ ${formatCatalogPrice(service.price)}`;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'rounded-lg border border-rose-300/25 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-400/10';
    removeButton.textContent = 'Remover';
    removeButton.setAttribute('aria-label', `Remover ${service.title} do pedido`);
    removeButton.addEventListener('click', () => requestRemoveFromCart(service.id));
    row.append(title, details, removeButton);
    cartItems.append(row);
  });

  document.querySelectorAll('[data-service-id]').forEach(article => {
    const button = article.querySelector('.catalog-add-button');
    if (!button) return;
    const inCart = cart.includes(article.dataset.serviceId);
    button.textContent = inCart ? '✓ No pedido · remover' : 'Adicionar ao pedido';
    button.setAttribute('aria-pressed', String(inCart));
    button.classList.toggle('border-rose-300/35', inCart);
    button.classList.toggle('text-rose-100', inCart);
    button.classList.toggle('border-tarot-gold/45', !inCart);
    button.classList.toggle('text-tarot-goldLight', !inCart);
  });
}

function toggleCatalogCartItem(serviceId) {
  const service = window.VISOES_SERVICES.find(item => item.id === serviceId);
  if (!service) {
    console.error(`Leitura não encontrada no catálogo compartilhado: ${serviceId}`);
    return;
  }

  if (cart.includes(serviceId)) {
    requestRemoveFromCart(serviceId);
  } else {
    cart.push(serviceId);
    window.writeSharedCart(cart);
    window.playMagicSound('add');
    updateCatalogCart();
    document.getElementById('catalogCartFeedback').textContent = `${service.title} foi adicionada ao pedido.`;
  }
}

document.querySelectorAll('[data-service-id]').forEach(article => {
  const serviceId = article.dataset.serviceId;
  const service = window.VISOES_SERVICES.find(item => item.id === serviceId);
  if (!service) {
    console.error(`Leitura sem cadastro compartilhado: ${serviceId}`);
    return;
  }

  article.classList.add('catalog-card', 'catalog-reveal');
  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'catalog-add-button mt-6 h-10 w-full inline-flex items-center justify-center rounded-xl border border-tarot-gold/45 px-4 text-[11px] font-bold uppercase tracking-wider text-tarot-goldLight transition hover:-translate-y-0.5 hover:bg-tarot-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tarot-gold';
  
  const inCart = cart.includes(serviceId);
  action.textContent = inCart ? '✓ No pedido · remover' : 'Adicionar ao pedido';
  
  action.addEventListener('click', () => toggleCatalogCartItem(serviceId));
  article.append(action);
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.catalog-reveal').forEach(card => revealObserver.observe(card));
document.querySelectorAll('.collection-anchor').forEach(section => {
  section.classList.add('catalog-reveal');
  revealObserver.observe(section);
});

/* --- OBSERVER DA LUZ DE FUNDO DINÂMICA --- */
const categoryOrb = document.getElementById('categoryGlowOrb');
const categoryObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const color = entry.target.dataset.categoryColor || 'rgba(147, 51, 234, 0.18)';
      categoryOrb.style.background = `radial-gradient(circle, ${color} 0%, rgba(147, 51, 234, 0.06) 65%, transparent 85%)`;
    }
  });
}, { threshold: 0.28 });

document.querySelectorAll('[data-category-color]').forEach(section => categoryObserver.observe(section));

/* --- MOTOR CÓSMICO 3D (MUITAS ESTRELAS, COM OPACIDADE SUAVE DO INDEX) --- */
const canvas = document.getElementById('starsCanvas');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createStars();
}

function createStars() {
  stars = [];
  const numStars = Math.floor((canvas.width * canvas.height) / 1500); // Mais estrelas!
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      twinkleFactor: Math.random() * Math.PI
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scrollY = window.scrollY || window.pageYOffset;

  for (let star of stars) {
    star.twinkleFactor += star.speed;
    const currentAlpha = star.alpha + Math.sin(star.twinkleFactor) * 0.3;
    
    const parallaxY = (star.y - scrollY * (star.radius * 0.15)) % canvas.height;
    const finalY = parallaxY < 0 ? parallaxY + canvas.height : parallaxY;

    ctx.beginPath();
    ctx.arc(star.x, finalY, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(240, 220, 180, ${Math.max(0.1, Math.min(1, currentAlpha))})`;
    ctx.shadowBlur = star.radius > 1 ? 5 : 0;
    ctx.shadowColor = '#e0b973';
    ctx.fill();
  }

  requestAnimationFrame(drawStars);
}

window.addEventListener('resize', resizeCanvas);

window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  
  const progressBar = document.getElementById('scrollProgressBar');
  if (progressBar) progressBar.style.width = scrolled + '%';

  const orbDynamic = document.getElementById('categoryGlowOrb');
  const orb2 = document.getElementById('glowOrb2');
  if (orbDynamic && orb2) {
    orbDynamic.style.transform = `translate(-50%, ${winScroll * 0.08}px)`;
    orb2.style.transform = `translateY(${-winScroll * 0.06}px)`;
  }
});

const btnSound = document.getElementById('soundToggle');
if (btnSound) btnSound.addEventListener('click', () => window.playMagicSound('click'));

const btnNav = document.querySelector('a[href="#pedido"]');
if (btnNav) btnNav.addEventListener('click', () => window.playMagicSound('navigate'));

const btnAgendar = document.querySelector('#pedido a');
if (btnAgendar) btnAgendar.addEventListener('click', () => window.playMagicSound('navigate'));

window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY_CART && event.key !== null) return;
  cart = window.readSharedCart();
  updateCatalogCart();
});

resizeCanvas();
drawStars();
window.updateSoundToggle();
updateCatalogCart();

if (window.lucide && typeof window.lucide.createIcons === 'function') {
  lucide.createIcons();
}