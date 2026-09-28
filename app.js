// INICIALIZAÇÃO DO FIREBASE (LIGAÇÃO À BASE DE DADOS)
const firebaseConfig = {
  apiKey: "AIzaSyC-2EsubN1unwIRPlKq5oNvtL45_mta2E4",
  authDomain: "visoes-do-tarot.firebaseapp.com",
  projectId: "visoes-do-tarot",
  storageBucket: "visoes-do-tarot.firebasestorage.app",
  messagingSenderId: "870991115380",
  appId: "1:870991115380:web:278b8056a29c62702d0d21"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const SERVICES_CATALOG = window.VISOES_SERVICES;

const MEDIA_DATA = {
  photos: [
    { title: 'Ambiente Consagrado & Cristais de Quartzo', desc: 'Ambiente purificado com ervas aromáticas e pedras ativadas para as leituras diárias.', tag: 'Registro do Espaço', icon: 'sparkles', accent: 'from-purple-900 to-indigo-950', visual: 'cristais' },
    { title: 'Lâminas do Tarot de Marselha & Rider Waite', desc: 'Baralhos tradicionais energizados sob a influência da Lua Cheia para máxima precisão oracular.', tag: 'Instrumentos Sagrados', icon: 'layers', accent: 'from-amber-950 to-purple-950', visual: 'cartas' },
    { title: 'Velas do Rito de Adoçamento', desc: 'Firmezas com favos de mel e essências naturais para restabelecer a paz em relações machucadas.', tag: 'Rituais', icon: 'flame', accent: 'from-pink-950 to-purple-950', visual: 'velas' }
  ],
  videos: [
    { title: 'Demonstração: Como Funciona a Tiragem do Amor', desc: 'Veja o método de abertura das cartas e a resposta direta para o coração.', tag: 'Vídeo Demonstrativo', icon: 'video', accent: 'from-violet-950 to-slate-900', videoInfo: 'Tiragem em tempo real gravada em HD' },
    { title: 'Rito de Abertura de Caminhos Financeiros', desc: 'Momento de consagração e imantação das velas douradas na mesa de alta magia.', tag: 'Vídeo do Rito', icon: 'play-circle', accent: 'from-emerald-950 to-purple-950', videoInfo: 'Registro exclusivo de firmeza' }
  ],
  promos: [
    { title: 'Lua Cheia: Noite Especial de Adoçamento', desc: 'Condição especial para inclusão de nomes no caldeirão de amor da próxima Lua Cheia. Reserve sua vaga!', tag: 'Aviso Astrológico', icon: 'moon', accent: 'from-purple-950 via-rose-950 to-tarot-night', highlight: 'Vagas Limitadas' },
    { title: 'Consultas para diferentes áreas da vida', desc: 'Escolha uma consulta para sua questão amorosa, financeira, profissional ou espiritual.', tag: 'Propaganda Especial', icon: 'sparkle', accent: 'from-amber-950 via-purple-950 to-slate-950', highlight: 'Promoção Ativa' }
  ]
};

let currentMediaTab = 'photos';
let currentSlideIndex = 0;

// FEEDBACKS DATA
const STORAGE_KEY_USER_ID = 'visoes_tarot_user_id';
let feedbacks = [];
let editandoFeedbackId = null;
let selectedRating = 5;
let editSelectedRating = 5;

function getUserId() {
  let userId = localStorage.getItem(STORAGE_KEY_USER_ID);
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem(STORAGE_KEY_USER_ID, userId);
  }
  return userId;
}

function popularSelectsDeServicos() {
  const selects = [document.getElementById('feedbackService'), document.getElementById('editFeedbackService')];
  if (!window.VISOES_SERVICES || window.VISOES_SERVICES.length === 0) return;
  const opcoesHtml = window.VISOES_SERVICES.map(service => 
    `<option value="${escapeHTML(service.title)}">${escapeHTML(service.title)} (${service.priceLabel || 'R$ ' + service.price.toFixed(2)})</option>`
  ).join('');
  selects.forEach(selectEl => { if (selectEl) selectEl.innerHTML = opcoesHtml; });
}

// CART & BOOKING LOGIC
const STORAGE_KEY_CART = window.VISOES_STORAGE_KEYS.cart;
const STORAGE_KEY_BOOKINGS = 'visoes_tarot_bookings';
const STORAGE_KEY_PHONE = 'visoes_tarot_phone';
const STORAGE_KEY_ACTIVITY = 'visoes_tarot_activity';

let cart = window.readSharedCart();
let bookings = [];
const savedCartomantePhone = localStorage.getItem(STORAGE_KEY_PHONE);
let cartomantePhone = savedCartomantePhone || '5585984217895';

try {
  const savedBookings = localStorage.getItem(STORAGE_KEY_BOOKINGS);
  bookings = savedBookings ? JSON.parse(savedBookings) : [];
} catch(e) { bookings = []; }

function saveCart() { window.writeSharedCart(cart); updateCartUI(); }
window.addEventListener('storage', event => { if (event.key === STORAGE_KEY_CART) { cart = window.readSharedCart(); updateCartUI(); } });

function addToCart(serviceId) {
  const service = SERVICES_CATALOG.find(s => s.id === serviceId);
  if (!service) return;
  if (!cart.includes(serviceId)) {
    cart.push(serviceId);
    saveCart();
    playMagicSound('add');
    showToast('Adicionado ao Carrinho!', `"${service.title}" foi incluído no seu pedido.`);
  } else {
    showToast('Já Selecionado', `"${service.title}" já consta no seu carrinho.`);
  }
}

let pendingCartRemovalId = null;
function requestRemoveFromCart(serviceId) {
  const item = SERVICES_CATALOG.find(service => service.id === serviceId);
  if (!item) return;
  pendingCartRemovalId = serviceId;
  document.getElementById('cartAlertItem').textContent = item.title;
  document.getElementById('cartAlertBackdrop').hidden = false;
}
function closeCartAlert() { pendingCartRemovalId = null; document.getElementById('cartAlertBackdrop').hidden = true; }
function confirmRemoveFromCart() {
  if (!pendingCartRemovalId) return;
  const serviceId = pendingCartRemovalId;
  closeCartAlert();
  playMagicSound('remove');
  removeFromCart(serviceId);
}
function removeFromCart(serviceId) {
  cart = cart.filter(id => id !== serviceId);
  saveCart();
  showToast('Item Retirado', 'Serviço removido do seu carrinho.');
}
function clearCart() {
  if (cart.length === 0) return;
  cart = []; saveCart(); playMagicSound('remove'); showToast('Carrinho Limpo', 'Todos os itens foram retirados.');
}

function getCartTotal() { return cart.reduce((total, id) => { const item = SERVICES_CATALOG.find(s => s.id === id); return total + (item ? item.price : 0); }, 0); }
function getDepositTotal() { return getCartTotal(); }
function hasCustomPriceItem() { return cart.some(id => { const item = SERVICES_CATALOG.find(s => s.id === id); return item && item.isCustomPrice; }); }

function updateCartUI() {
  const count = cart.length;
  const headerCart = document.getElementById('headerCartCount');
  if (headerCart) headerCart.textContent = count;

  const total = getCartTotal();
  const deposit = getDepositTotal();
  const hasCustom = hasCustomPriceItem();

  const totalFormatted = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + (hasCustom ? ' + Valor da bruxa' : '');
  const depositFormatted = deposit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) + (hasCustom ? ' + Valor a definir' : '');

  const drawerTotalEl = document.getElementById('drawerTotalPrice');
  const drawerDepositEl = document.getElementById('drawerDepositPrice');
  if (drawerTotalEl) drawerTotalEl.textContent = totalFormatted;
  if (drawerDepositEl) drawerDepositEl.textContent = depositFormatted;

  const drawerContainer = document.getElementById('drawerItemsList');
  const formSummary = document.getElementById('formServicesSummary');

  if (cart.length === 0) {
    if (drawerContainer) drawerContainer.innerHTML = `<div class="text-center py-10 text-slate-400 text-xs">Nenhum serviço no carrinho no momento.</div>`;
    if (formSummary) formSummary.innerHTML = `<p class="text-rose-400 italic">Por favor, adicione ao menos um serviço no catálogo acima!</p>`;
  } else {
    let drawerHtml = '';
    let summaryHtml = '';
    cart.forEach(id => {
      const item = SERVICES_CATALOG.find(s => s.id === id);
      if (!item) return;
      const priceStr = item.isCustomPrice ? 'Valor definido pela bruxa' : `R$ ${item.price.toFixed(2)}`;
      drawerHtml += `<div class="p-3 rounded-xl bg-purple-950/50 border border-purple-500/20 flex items-center justify-between"><div><div class="text-xs font-bold text-white">${item.title}</div><div class="text-[10px] text-tarot-gold">${priceStr}</div></div><button onclick="requestRemoveFromCart('${item.id}')" class="text-slate-500 hover:text-rose-400 p-1"><i data-lucide="trash" class="w-3.5 h-3.5"></i></button></div>`;
      summaryHtml += `<div class="flex items-center justify-between"><span>• ${item.title}</span><span class="font-bold text-tarot-gold">${priceStr}</span></div>`;
    });
    if (drawerContainer) drawerContainer.innerHTML = drawerHtml;
    if (formSummary) {
      formSummary.innerHTML = `${summaryHtml}<div class="pt-2 border-t border-purple-500/20 flex justify-between font-bold text-white text-xs"><span>Total:</span><span class="text-tarot-gold">R$ ${totalFormatted}</span></div><div class="flex justify-between font-bold text-emerald-400 text-xs"><span>Pagamento total via PIX:</span><span>R$ ${depositFormatted}</span></div>`;
    }
  }
  renderCatalog();
  observeScrollItems();
  lucide.createIcons();
}
function toggleCartDrawer() { document.getElementById('cartDrawer').classList.toggle('translate-x-full'); }

// RENDER CATALOG
function renderCatalog() {
  const tarotList = document.getElementById('tarotCardsList');
  const fixedRitualsList = document.getElementById('fixedRitualsList');
  const customRitualsList = document.getElementById('customRitualsList');

  if (tarotList) tarotList.innerHTML = SERVICES_CATALOG.filter(s => s.category === 'tiragem').map(item => {
    const inCart = cart.includes(item.id);
    return `<div class="scroll-item glass-panel p-5 rounded-2xl border ${inCart ? 'border-tarot-gold shadow-[0_0_20px_rgba(224,185,115,0.25)]' : 'border-purple-500/20'} flex flex-col justify-between hover:-translate-y-1 transition duration-300"><div><div class="flex items-center justify-between mb-3"><div class="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-tarot-gold"><i data-lucide="${item.icon}" class="w-5 h-5"></i></div><div class="text-right"><span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-tarot-night border border-tarot-gold/50 text-tarot-gold block">${item.priceLabel}</span></div></div><h3 class="font-cinzel text-base font-bold text-white mb-1">${item.title}</h3><p class="text-xs text-slate-300 mb-4 leading-relaxed">${item.description}</p></div><button onclick="${inCart ? `requestRemoveFromCart('${item.id}')` : `addToCart('${item.id}')`}" class="w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${inCart ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900' : 'bg-gradient-to-r from-purple-900 to-indigo-950 border border-tarot-gold/40 text-white hover:bg-tarot-gold hover:text-tarot-night'}"><i data-lucide="${inCart ? 'check' : 'plus'}" class="w-3.5 h-3.5"></i>${inCart ? 'No Carrinho (Remover)' : 'Adicionar ao Carrinho'}</button></div>`;
  }).join('');

  if (fixedRitualsList) fixedRitualsList.innerHTML = SERVICES_CATALOG.filter(s => s.category === 'magia_fixa').map(item => {
    const inCart = cart.includes(item.id);
    return `<div class="scroll-item glass-panel p-6 rounded-2xl border ${inCart ? 'border-tarot-gold shadow-[0_0_25px_rgba(224,185,115,0.3)]' : 'border-purple-500/30'} flex flex-col justify-between hover:-translate-y-1 transition duration-300"><div><div class="flex items-center justify-between mb-4"><div class="w-12 h-12 rounded-xl bg-purple-950 border border-tarot-gold/50 flex items-center justify-center text-tarot-gold"><i data-lucide="${item.icon}" class="w-6 h-6"></i></div><div class="text-right"><span class="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-tarot-gold text-tarot-night block">${item.priceLabel}</span></div></div><h3 class="font-cinzel text-lg font-bold text-white mb-1">${item.title}</h3><p class="text-[11px] text-purple-300 font-semibold mb-2">${item.subtitle}</p><p class="text-xs text-slate-300 mb-6 leading-relaxed">${item.description}</p></div><button onclick="${inCart ? `requestRemoveFromCart('${item.id}')` : `addToCart('${item.id}')`}" class="w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${inCart ? 'bg-rose-950/70 border border-rose-500/50 text-rose-300 hover:bg-rose-900' : 'bg-tarot-surface hover:bg-tarot-gold hover:text-tarot-night border border-tarot-gold/60 text-tarot-gold'}"><i data-lucide="${inCart ? 'check-check' : 'sparkles'}" class="w-4 h-4"></i>${inCart ? 'Selecionado (Remover)' : 'Adicionar ao Carrinho'}</button></div>`;
  }).join('');

  if (customRitualsList) customRitualsList.innerHTML = SERVICES_CATALOG.filter(s => s.category === 'magia_custom').map(item => {
    const inCart = cart.includes(item.id);
    return `<div class="scroll-item glass-panel ritual-danger-card p-6 rounded-2xl border-2 ${inCart ? 'border-tarot-gold shadow-[0_0_30px_rgba(224,185,115,0.4)]' : 'border-rose-500/30'} flex flex-col justify-between hover:-translate-y-1 transition duration-300 bg-gradient-to-b from-[#260817] to-[#12051d]"><div class="ritual-decoration" aria-hidden="true"><i data-lucide="flame"></i><i data-lucide="zap"></i><i data-lucide="skull"></i><span class="ritual-emoji ritual-emoji-one">✦</span><span class="ritual-emoji ritual-emoji-two">⚠</span><span class="ritual-emoji ritual-emoji-three">✶</span><span class="ritual-ember ritual-ember-one"></span><span class="ritual-ember ritual-ember-two"></span><span class="ritual-ember ritual-ember-three"></span></div><div><div class="flex items-center justify-between mb-4"><div class="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400"><i data-lucide="${item.icon}" class="w-6 h-6"></i></div><span class="px-3 py-1 rounded-full text-xs font-black tracking-wide bg-gradient-to-r from-rose-700 to-amber-600 text-white uppercase shadow-md">Valor definido pela bruxa</span></div><h3 class="font-cinzel text-xl font-bold text-white mb-1">${item.title}</h3><p class="text-[11px] text-rose-300 font-semibold mb-2">${item.subtitle}</p><p class="text-xs text-slate-300 mb-6 leading-relaxed">${item.description}</p><div class="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[11px] text-slate-300 mb-6 flex items-start gap-2"><i data-lucide="shield" class="w-4 h-4 text-rose-400 shrink-0 mt-0.5"></i><span>Avaliação obrigatória: a bruxa parceira analisa o caso.</span></div></div><button onclick="${inCart ? `requestRemoveFromCart('${item.id}')` : `addToCart('${item.id}')`}" class="w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${inCart ? 'bg-rose-950 border border-rose-500 text-rose-300' : 'bg-rose-900/60 hover:bg-rose-700 border border-rose-500/40 text-white'}"><i data-lucide="${inCart ? 'check-check' : 'wand-2'}" class="w-4 h-4"></i>${inCart ? 'Adicionado ao Pedido' : 'Incluir no Meu Agendamento'}</button></div>`;
  }).join('');
}

// MULTIMEDIA CAROUSEL
function switchMediaTab(tab) {
  currentMediaTab = tab; currentSlideIndex = 0;
  ['photos', 'videos', 'promos'].forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    if (btn) btn.className = t === tab ? 'px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-tarot-gold text-tarot-night shadow-md' : 'px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white';
  });
  renderCarouselSlide();
}
function renderCarouselSlide() {
  const container = document.getElementById('mediaCarouselContent');
  const dotsContainer = document.getElementById('carouselDots');
  if (!container || !dotsContainer) return;
  const current = MEDIA_DATA[currentMediaTab][currentSlideIndex] || MEDIA_DATA[currentMediaTab][0];
  if (!current) return;
  container.innerHTML = `<div class="scroll-item w-full max-w-3xl mx-auto p-6 sm:p-10 rounded-2xl bg-gradient-to-br ${current.accent} border border-tarot-gold/30 flex flex-col md:flex-row items-center gap-8 shadow-inner animate-fadeIn"><div class="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-tarot-night/80 border border-tarot-gold/50 flex flex-col items-center justify-center text-tarot-gold shrink-0 relative overflow-hidden shadow-2xl"><i data-lucide="${current.icon}" class="w-16 h-16 animate-float-slow"></i><span class="text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-2">${current.tag}</span></div><div class="space-y-3 text-center md:text-left flex-1"><span class="text-xs uppercase tracking-widest text-tarot-gold font-bold px-3 py-1 rounded-full bg-tarot-night border border-tarot-gold/30 inline-block">${current.tag}</span><h3 class="text-xl sm:text-2xl font-cinzel font-bold text-white leading-snug">${current.title}</h3><p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">${current.desc}</p></div></div>`;
  dotsContainer.innerHTML = MEDIA_DATA[currentMediaTab].map((_, idx) => `<button onclick="goToMediaSlide(${idx})" class="w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlideIndex ? 'bg-tarot-gold w-6' : 'bg-purple-900/60 hover:bg-purple-700'}"></button>`).join('');
  lucide.createIcons();
  observeScrollItems(container);
}

// AVAILABILITY LOGIC
const ALL_WEEK_DAYS = ['Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
function getAvailableTimeSlotsForDay(day) { return (day === 'Quinta-feira' || day === 'Sábado') ? ['17:00', '19:00', '21:00'] : ['16:00', '18:00', '20:00', '22:00']; }
const DAY_TO_INDEX = { 'Domingo': 0, 'Segunda-feira': 1, 'Terça-feira': 2, 'Quarta-feira': 3, 'Quinta-feira': 4, 'Sexta-feira': 5, 'Sábado': 6 };
function getNextSlotDate(day, time) {
  const [hour, minute] = (time || '16:00').split(':').map(Number);
  const today = new Date();
  let offset = (DAY_TO_INDEX[day] - today.getDay() + 7) % 7;
  const candidate = new Date(today);
  candidate.setHours(hour, minute, 0, 0);
  candidate.setDate(candidate.getDate() + offset);
  if (offset === 0 && candidate <= new Date()) candidate.setDate(candidate.getDate() + 7);
  return candidate;
}
function getReservedSlotsForDay(day) { return bookings.filter(b => b.day === day).map(b => b.time).filter(Boolean); }
function getAvailableTimeSlots(day) {
  if (!day) return [];
  const baseSlots = getAvailableTimeSlotsForDay(day);
  const reserved = new Set(getReservedSlotsForDay(day));
  return baseSlots.filter(slot => !reserved.has(slot));
}
function renderAvailabilityPicker() {
  const dayPicker = document.getElementById('dayPicker');
  const timePicker = document.getElementById('timePicker');
  if (!dayPicker || !timePicker) return;
  dayPicker.innerHTML = '';
  timePicker.innerHTML = '<div class="col-span-full text-xs text-slate-400">Selecione um dia primeiro.</div>';

  ALL_WEEK_DAYS.forEach(day => {
    const available = getAvailableTimeSlots(day);
    const selected = document.getElementById('bookingDay').value === day;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scroll-item rounded-xl border px-3 py-3 text-left transition ${selected ? 'border-tarot-gold bg-tarot-gold text-tarot-night shadow-[0_0_18px_rgba(224,185,115,0.2)]' : 'border-purple-500/30 bg-[#090314] text-white hover:border-tarot-gold/60'}`;
    button.innerHTML = `<div class="text-xs font-bold uppercase tracking-wide">${day}</div><div class="text-[10px] mt-1 ${available.length ? 'text-emerald-300' : 'text-rose-300'}">${available.length ? `${available.length} horários livres` : 'Indisponível'}</div>`;
    if (available.length === 0) {
      button.disabled = true;
      button.className = 'rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 px-3 py-3 text-left opacity-60 cursor-not-allowed';
    } else {
      button.onclick = () => {
        document.getElementById('bookingDay').value = document.getElementById('bookingDay').value === day ? '' : day;
        document.getElementById('bookingTime').value = '';
        renderAvailabilityPicker();
      };
    }
    dayPicker.appendChild(button);
  });
  observeScrollItems(dayPicker);
  if (document.getElementById('bookingDay').value) renderAvailableTimeSlots(document.getElementById('bookingDay').value);
}
function renderAvailableTimeSlots(day) {
  const timePicker = document.getElementById('timePicker');
  const availableSlots = getAvailableTimeSlots(day);
  timePicker.innerHTML = '';
  if (!day) return;
  availableSlots.forEach(slot => {
    const selected = document.getElementById('bookingTime').value === slot;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scroll-item rounded-xl border px-3 py-2 text-xs font-bold transition ${selected ? 'border-tarot-gold bg-tarot-gold text-tarot-night' : 'border-purple-500/30 bg-[#090314] text-white'}`;
    button.textContent = slot;
    button.onclick = () => { document.getElementById('bookingTime').value = slot; renderAvailabilityPicker(); };
    timePicker.appendChild(button);
  });
  observeScrollItems(timePicker);
}

// FEEDBACKS FIREBASE LOGIC
function renderFeedbacks() {
  const container = document.getElementById('feedbacksList');
  if (!container) return;
  const currentUserId = getUserId();

  container.innerHTML = feedbacks.map(item => {
    const isAuthor = item.userId === currentUserId;
    const estrelasHtml = '★'.repeat(item.rating) + '☆'.repeat(5 - item.rating);
    return `<div class="scroll-item glass-panel p-6 rounded-2xl border border-purple-500/30 flex flex-col justify-between hover:border-tarot-gold/40 transition"><div><div class="flex items-center justify-between mb-3"><div class="flex text-tarot-gold text-sm">${estrelasHtml}</div><span class="text-[10px] text-slate-400">${item.date}</span></div><p class="text-xs text-slate-300 italic mb-4 leading-relaxed">"${escapeHTML(item.comment)}"</p></div><div><div class="pt-3 border-t border-purple-500/20 flex items-center justify-between"><span class="font-bold text-xs text-white">${escapeHTML(item.name)}</span><span class="text-[10px] text-purple-300">${escapeHTML(item.service)}</span></div>${isAuthor ? `<div class="mt-3 pt-2 border-t border-purple-500/15 flex items-center justify-end gap-2"><button type="button" onclick="abrirModalEdicaoDepoimento('${item.id}')" class="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-200 text-[10px] font-bold hover:bg-purple-900 transition">Editar</button><button type="button" onclick="apagarDepoimento('${item.id}')" class="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px] font-bold hover:bg-rose-900 transition">Excluir</button></div>` : ''}</div></div>`;
  }).join('');
  observeScrollItems(container);
}

function setFeedbackRating(stars) {
  selectedRating = stars;
  const labels = ['', '1 Estrela', '2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas (Excelente)'];
  document.getElementById('starRatingLabel').textContent = labels[stars];
  document.querySelectorAll('.star-btn').forEach((btn, index) => { btn.textContent = index < stars ? '★' : '☆'; });
}

function setEditFeedbackRating(stars) {
  editSelectedRating = stars;
  const labels = ['', '1 Estrela', '2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas (Excelente)'];
  document.getElementById('editStarRatingLabel').textContent = labels[stars];
  document.querySelectorAll('.edit-star-btn').forEach((btn, index) => { btn.textContent = index < stars ? '★' : '☆'; });
}

async function carregarFeedbacksFirebase() {
  try {
    const snapshot = await db.collection("feedbacks").orderBy("createdAt", "desc").get();
    feedbacks = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      feedbacks.push({ id: doc.id, userId: data.userId, name: data.name, service: data.service, rating: data.rating, date: data.date, comment: data.comment });
    });
    renderFeedbacks();
  } catch (erro) { console.error("Erro ao carregar depoimentos da nuvem:", erro); }
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  const btnSubmit = document.getElementById('btnSubmitDepoimento');
  btnSubmit.disabled = true; btnSubmit.textContent = 'A enviar...';

  const name = document.getElementById('feedbackName').value.trim();
  const service = document.getElementById('feedbackService').value;
  const text = document.getElementById('feedbackText').value.trim();

  if (!name || !text) { btnSubmit.disabled = false; btnSubmit.textContent = 'Publicar Meu Depoimento'; return; }

  const novoDepoimento = {
    userId: getUserId(), name: name, service: service, rating: selectedRating, date: 'Agora mesmo', comment: text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection("feedbacks").add(novoDepoimento);
    document.getElementById('feedbackForm').reset();
    setFeedbackRating(5); playMagicSound('success');
    showToast('Depoimento Enviado!', 'Agradecemos de coração por partilhar a sua luz!');
    await carregarFeedbacksFirebase();
  } catch (erro) { showToast('Erro', 'Não foi possível enviar o depoimento.'); } 
  finally { btnSubmit.disabled = false; btnSubmit.textContent = 'Publicar Meu Depoimento'; }
}

function abrirModalEdicaoDepoimento(id) {
  const item = feedbacks.find(f => f.id === id);
  if (!item) return;
  editandoFeedbackId = id;
  document.getElementById('editFeedbackName').value = item.name;
  document.getElementById('editFeedbackService').value = item.service;
  document.getElementById('editFeedbackText').value = item.comment;
  setEditFeedbackRating(item.rating || 5);
  document.getElementById('editFeedbackBackdrop').hidden = false;
  lucide.createIcons();
}

function fecharModalEdicaoDepoimento() { editandoFeedbackId = null; document.getElementById('editFeedbackBackdrop').hidden = true; }

async function handleEditFeedbackSubmit(e) {
  e.preventDefault();
  if (editandoFeedbackId === null) return;
  const name = document.getElementById('editFeedbackName').value.trim();
  const service = document.getElementById('editFeedbackService').value;
  const text = document.getElementById('editFeedbackText').value.trim();
  if (!name || !text) return;

  try {
    await db.collection("feedbacks").doc(editandoFeedbackId).update({ name: name, service: service, rating: editSelectedRating, comment: text, date: 'Editado recentemente' });
    fecharModalEdicaoDepoimento(); playMagicSound('success');
    showToast('Depoimento Atualizado!', 'As suas alterações foram guardadas.');
    await carregarFeedbacksFirebase();
  } catch(e) { showToast('Erro', 'Não foi possível editar.'); }
}

let pendingFeedbackDeleteId = null;
function apagarDepoimento(id) {
  const item = feedbacks.find(f => f.id === id);
  if (!item) return;
  pendingFeedbackDeleteId = id;
  document.getElementById('feedbackAlertName').textContent = item.name || 'este consulente';
  document.getElementById('feedbackAlertBackdrop').hidden = false;
}
function closeFeedbackAlert() { pendingFeedbackDeleteId = null; document.getElementById('feedbackAlertBackdrop').hidden = true; }

async function confirmDeleteFeedback() {
  if (pendingFeedbackDeleteId === null) return;
  try {
    await db.collection("feedbacks").doc(pendingFeedbackDeleteId).delete();
    closeFeedbackAlert(); playMagicSound('remove');
    showToast('Depoimento Removido', 'O seu depoimento foi apagado.');
    await carregarFeedbacksFirebase();
  } catch(e) { showToast('Erro', 'Não foi possível apagar.'); }
}

// BOOKING HANDLER
function showBookingValidation(message, input) {
  playMagicSound('alert'); showToast('Campo obrigatório', message);
  input.focus(); input.classList.add('border-rose-400');
  setTimeout(() => input.classList.remove('border-rose-400'), 1800);
}
// Substituir a função handleBookingSubmit inteira no app.js
async function handleBookingSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('userName');
  const phoneInput = document.getElementById('userPhone');
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const btnSubmit = event.target.querySelector('button[type="submit"]');

  if (!name) { showBookingValidation('O campo nome não pode ficar vazio.', nameInput); return; }
  if (!phone) { showBookingValidation('O campo WhatsApp não pode ficar vazio.', phoneInput); return; }
  if (cart.length === 0) { playMagicSound('alert'); showToast('Carrinho vazio', 'Adicione algo antes de confirmar.'); return; }

  const day = document.getElementById('bookingDay').value;
  const time = document.getElementById('bookingTime').value;
  if (!day || !time) { playMagicSound('alert'); showToast('Aviso', 'Selecione dia e horário.'); return; }

  // Altera o botão para mostrar que está a carregar
  btnSubmit.disabled = true;
  btnSubmit.querySelector('span').textContent = 'Processando...';

  const notes = document.getElementById('bookingNotes').value.trim();
  const selectedServices = cart.map(id => SERVICES_CATALOG.find(s => s.id === id)).filter(Boolean);
  const totalAmount = getCartTotal();
  const depositAmount = getDepositTotal();
  const hasCustom = hasCustomPriceItem();

  // Cria o objeto do agendamento
  const newBooking = {
    dateCreated: new Date().toLocaleString('pt-BR'),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    slotDateTime: getNextSlotDate(day, time).toISOString(), 
    name, phone, day, time, 
    notes: notes || 'Sem observações.',
    services: selectedServices.map(s => `${s.title} (${s.isCustomPrice ? 'Valor definido pela bruxa parceira' : 'R$ ' + s.price.toFixed(2)})`),
    total: totalAmount, 
    deposit: depositAmount, 
    hasCustom
  };

  try {
    // 1. Grava no banco de dados na nuvem!
    await db.collection("agendamentos").add(newBooking);
    
    playMagicSound('confirm');
    
    // 2. Prepara e envia a mensagem para o WhatsApp
    const servicesListText = selectedServices.map(s => `• ${s.title}: ${s.isCustomPrice ? 'Valor definido pela bruxa parceira' : 'R$ ' + s.price.toFixed(2)}`).join('\n');
    const whatsappText = `🔮 *SOLICITAÇÃO DE AGENDAMENTO - VISÕES DO TAROT* 🔮\n\n👤 *Consulente:* ${name}\n📱 *WhatsApp:* ${phone}\n📅 *Dia Escolhido:* ${day}\n⏰ *Horário:* ${time}\n\n✨ *SERVIÇOS:* \n${servicesListText}\n\n💰 *VALOR TOTAL:* R$ ${totalAmount.toFixed(2)}\n\n_Estou enviando o pagamento total via PIX para confirmar meu horário com segurança._`;

    setTimeout(() => { window.open(`https://wa.me/${cartomantePhone}?text=${encodeURIComponent(whatsappText)}`, '_blank'); }, 1000);
    
    // 3. Limpa o formulário do cliente
    document.getElementById('bookingForm').reset();
    clearCart();
    
  } catch (error) {
    showToast('Erro', 'Não foi possível enviar o agendamento. Verifique sua conexão.');
  } finally {
    // Restaura o botão
    btnSubmit.disabled = false;
    btnSubmit.querySelector('span').textContent = 'Confirmar no WhatsApp';
  }

  bookings.unshift(newBooking);
  localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  updateAdminBadge(); playMagicSound('confirm');

  const servicesListText = selectedServices.map(s => `• ${s.title}: ${s.isCustomPrice ? 'Valor definido pela bruxa parceira' : 'R$ ' + s.price.toFixed(2)}`).join('\n');
  const whatsappText = `🔮 *SOLICITAÇÃO DE AGENDAMENTO - VISÕES DO TAROT* 🔮\n\n👤 *Consulente:* ${name}\n📱 *WhatsApp:* ${phone}\n📅 *Dia Escolhido:* ${day}\n⏰ *Horário:* ${time}\n\n✨ *SERVIÇOS:* \n${servicesListText}\n\n💰 *VALOR TOTAL:* R$ ${totalAmount.toFixed(2)}\n\n_Estou enviando o pagamento total via PIX para confirmar meu horário com segurança._`;

  setTimeout(() => { window.open(`https://wa.me/${cartomantePhone}?text=${encodeURIComponent(whatsappText)}`, '_blank'); }, 1000);
}

// HELP POPUP & ADMIN
let helpPopupAudioUnlocked = false; let helpPopupAudioPlayed = false;
function formatHelpPhone(phone) { const digits = String(phone).replace(/\D/g, ''); if (digits.length === 13 && digits.startsWith('55')) return `+55 (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`; return digits ? `+${digits}` : 'WhatsApp não configurado'; }
function playHelpPopupSound() { if (helpPopupAudioPlayed) return; playMagicSound('success'); helpPopupAudioPlayed = true; }
function openHelpPopup() {
  document.getElementById('helpPopupNumber').textContent = formatHelpPhone(cartomantePhone);
  document.getElementById('helpPopupWhatsApp').href = `https://wa.me/${String(cartomantePhone).replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Fiquei com uma dúvida.')}`;
  document.getElementById('helpPopupBackdrop').hidden = false;
  playMagicSound('click'); if (helpPopupAudioUnlocked) playHelpPopupSound();
}
function closeHelpPopup() { document.getElementById('helpPopupBackdrop').hidden = true; playMagicSound('remove'); }
function scrollToTop() { playMagicSound('click'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function setupHelpPopup() {
  document.getElementById('helpPopupLauncher').addEventListener('click', openHelpPopup);
  document.getElementById('helpPopupClose').addEventListener('click', closeHelpPopup);
  document.getElementById('helpPopupBackdrop').addEventListener('click', e => { if (e.target === e.currentTarget) closeHelpPopup(); });
  document.addEventListener('pointerdown', () => { helpPopupAudioUnlocked = true; if (!document.getElementById('helpPopupBackdrop').hidden) playHelpPopupSound(); }, { once: true });
}

function openAdminModal() { document.getElementById('adminPhoneInput').value = cartomantePhone; renderAdminList(); document.getElementById('adminModal').classList.remove('hidden'); }
function closeAdminModal() { document.getElementById('adminModal').classList.add('hidden'); }
function saveAdminPhone() {
  const val = document.getElementById('adminPhoneInput').value.trim().replace(/\D/g, '');
  if (val.length >= 10) { cartomantePhone = val; localStorage.setItem(STORAGE_KEY_PHONE, val); showToast('Salvo', 'WhatsApp atualizado!'); }
}
function updateAdminBadge() { const badge = document.getElementById('adminPendingBadge'); if (badge) bookings.length > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden'); }
function renderAdminList() {
  const list = document.getElementById('adminBookingsList'); document.getElementById('adminCountText').textContent = `${bookings.length} agendamento(s)`;
  if (bookings.length === 0) { list.innerHTML = '<div class="py-12 text-center text-slate-500 text-xs">Nenhum agendamento gravado.</div>'; return; }
  list.innerHTML = bookings.map(item => `<div class="p-4 rounded-2xl bg-tarot-card border border-purple-500/30 text-xs text-slate-300 space-y-2"><div class="font-bold text-white">${escapeHTML(item.name)} - R$ ${item.total.toFixed(2)}</div><div>📅 ${escapeHTML(item.day)} às ${escapeHTML(item.time)} | 📱 ${escapeHTML(item.phone)}</div></div>`).join('');
  lucide.createIcons();
}

// CANVAS STARS & TOAST
const canvas = document.getElementById('starsCanvas'); const ctx = canvas.getContext('2d'); let stars = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; createStars(); }
function createStars() { stars = []; const numStars = Math.floor((canvas.width * canvas.height) / 8500); for (let i = 0; i < numStars; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5 + 0.4, alpha: Math.random() * 0.8 + 0.2, speed: Math.random() * 0.02 + 0.005, twinkleFactor: Math.random() * Math.PI }); }
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); const scrollY = window.scrollY || window.pageYOffset;
  for (let star of stars) {
    star.twinkleFactor += star.speed; const currentAlpha = star.alpha + Math.sin(star.twinkleFactor) * 0.3; const finalY = (star.y - scrollY * (star.radius * 0.15)) % canvas.height;
    ctx.beginPath(); ctx.arc(star.x, finalY < 0 ? finalY + canvas.height : finalY, star.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(240, 220, 180, ${Math.max(0.1, Math.min(1, currentAlpha))})`; ctx.shadowBlur = star.radius > 1 ? 5 : 0; ctx.shadowColor = '#e0b973'; ctx.fill();
  }
  requestAnimationFrame(drawStars);
}
window.addEventListener('resize', resizeCanvas);

window.addEventListener('scroll', () => {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  const progressBar = document.getElementById('scrollProgressBar'); if (progressBar) progressBar.style.width = scrolled + '%';
  const orb1 = document.getElementById('glowOrb1'); const orb2 = document.getElementById('glowOrb2');
  if (orb1 && orb2) { orb1.style.transform = `translateY(${winScroll * 0.12}px)`; orb2.style.transform = `translateY(${-winScroll * 0.08}px)`; }
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) { if (winScroll > 300) backToTopBtn.classList.add('visible'); else backToTopBtn.classList.remove('visible'); }
});

const observer = new IntersectionObserver(entries => { entries.forEach(entry => { if (entry.target.classList.contains('ritual-section')) { entry.target.classList.toggle('ritual-section-active', entry.isIntersecting); return; } entry.target.classList.toggle('revealed', entry.isIntersecting); }); }, { threshold: 0.12 });
function observeScrollItems(root = document) { root.querySelectorAll('.scroll-item').forEach(el => observer.observe(el)); }

let toastTimer;
function showToast(title, message) {
  clearTimeout(toastTimer); const toast = document.getElementById('toastNotification'); document.getElementById('toastTitle').textContent = title; document.getElementById('toastMessage').textContent = message; toast.classList.remove('translate-x-96'); toast.classList.add('translate-x-0'); toastTimer = setTimeout(hideToast, 4000);
}
function hideToast() { document.getElementById('toastNotification').classList.remove('translate-x-0'); document.getElementById('toastNotification').classList.add('translate-x-96'); }
function escapeHTML(str) { return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)); }

// INICIALIZAÇÃO DA PÁGINA
window.addEventListener('DOMContentLoaded', () => {
  resizeCanvas(); drawStars();
  updateCartUI(); popularSelectsDeServicos();
  if (document.getElementById('mediaCarouselContent')) renderCarouselSlide();
  carregarFeedbacksFirebase(); // <-- Firebase em vez do render local
  renderAvailabilityPicker();
  updateAdminBadge(); setupHelpPopup();
  document.querySelectorAll('.scroll-reveal, .scroll-item, .ritual-section').forEach(el => observer.observe(el));
  lucide.createIcons();
});