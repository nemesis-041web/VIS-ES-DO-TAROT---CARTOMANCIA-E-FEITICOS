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

// DEFINA A SUA PALAVRA-PASSE DA CARTOMANTE AQUI:
const SENHA_MESTRA = "221025gwpassarinhos";

function handleLoginPassword(e) {
  e.preventDefault();
  const val = document.getElementById('adminPasswordInput').value;
  if (val === SENHA_MESTRA) {
    sessionStorage.setItem('cartomante_autenticada', 'true');
    unlockAdminPanel();
  } else {
    document.getElementById('loginError').hidden = false;
  }
}

function unlockAdminPanel() {
  document.getElementById('loginOverlay').style.display = 'none';
  document.getElementById('protectedContent').style.display = 'block';
  initAdminPanel();
}

function handleLogout() {
  sessionStorage.removeItem('cartomante_autenticada');
  window.location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('cartomante_autenticada') === 'true') {
    unlockAdminPanel();
  }
});

// LÓGICA COMPLETA DO PAINEL NA NUVEM
const STORAGE_KEY_PHONE = 'visoes_tarot_phone';
let bookingsFirebase = [];
let knownBookingIds = new Set();
let adminAudioContext;
let phoneInputDirty = false;
let notificationTimer;
const SOUND_MUTED_KEY = 'visoes_tarot_sounds_muted';
let adminSoundsMuted = localStorage.getItem(SOUND_MUTED_KEY) === 'true';

function initAdminPanel() {
  setupAdminSoundInteractions();
  updateAdminSoundToggle();
  const phoneInput = document.getElementById('adminPhoneInput');
  if (phoneInput) {
    phoneInput.addEventListener('input', handlePhoneInput);
  }
  
  // INICIA O MONITORAMENTO EM TEMPO REAL DO FIREBASE
  setupLiveBookingMonitor();
  
  // Oculta modais de atividade antiga que não usamos mais
  const activityBtn = document.getElementById('activityButton');
  if (activityBtn) activityBtn.style.display = 'none';
}

function setupLiveBookingMonitor() {
  db.collection("agendamentos").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    const isInitialLoad = bookingsFirebase.length === 0;
    bookingsFirebase = [];
    let hasNew = false;
    let newestBooking = null;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      data.id = doc.id; // ID real gerado pelo Firebase
      bookingsFirebase.push(data);
      
      if (!isInitialLoad && !knownBookingIds.has(doc.id)) {
        hasNew = true;
        newestBooking = data;
      }
    });

    if (hasNew && newestBooking) {
       showNewBookingToast(newestBooking);
       playAdminSound('newBooking');
    }

    knownBookingIds = new Set(bookingsFirebase.map(item => item.id));
    render();
  });
}

function updateAdminSoundToggle() {
  const button = document.getElementById('adminSoundToggle');
  if (!button) return;
  const label = adminSoundsMuted ? 'Ativar efeitos sonoros' : 'Desativar efeitos sonoros';
  button.setAttribute('aria-pressed', String(adminSoundsMuted));
  button.setAttribute('aria-label', label);
  button.title = label;
  const soundLabelEl = document.getElementById('adminSoundToggleLabel');
  if (soundLabelEl) soundLabelEl.textContent = adminSoundsMuted ? 'Som desligado' : 'Som ligado';
}

function toggleAdminSoundPreference() {
  adminSoundsMuted = !adminSoundsMuted;
  localStorage.setItem(SOUND_MUTED_KEY, String(adminSoundsMuted));
  updateAdminSoundToggle();
}

function getAdminPhone() {
  return localStorage.getItem(STORAGE_KEY_PHONE) || '5585984217895';
}

function isValidAdminPhone(phone) {
  return /^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(phone);
}

function setPhoneValidation(message, isError = false) {
  const status = document.getElementById('phoneValidation');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', isError);
  document.getElementById('adminPhoneInput').setAttribute('aria-invalid', String(isError));
}

function handlePhoneInput() {
  const input = document.getElementById('adminPhoneInput');
  document.getElementById('phoneSaveNotice').hidden = true;
  const digitsOnly = input.value.replace(/\D/g, '');
  phoneInputDirty = true;
  if (input.value !== digitsOnly) {
    input.value = digitsOnly;
    setPhoneValidation('Digite somente números. Inclua o código do país (55) e o DDD.', true);
  } else {
    setPhoneValidation('Digite somente números, incluindo código do país (55) e DDD. O telefone precisa ser válido.');
  }
}

function getAdminAudioContext() {
  if (adminSoundsMuted) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  adminAudioContext ||= new AudioContext();
  if (adminAudioContext.state === 'suspended') adminAudioContext.resume();
  return adminAudioContext;
}

function playAdminSound(type = 'click') {
  const ctx = getAdminAudioContext();
  if (!ctx) return;
  const profiles = {
    click: { notes: [392, 587], duration: .18, volume: .04, wave: 'sine', glide: 1.18 },
    success: { notes: [659, 784, 988], duration: .5, volume: .065, wave: 'sine', glide: 1.06 },
    newBooking: { notes: [523, 659, 784, 1047, 1318], duration: .95, volume: .09, wave: 'triangle', glide: 1.03 },
    remove: { notes: [659, 494, 330], duration: .36, volume: .055, wave: 'triangle', glide: .88 },
  };
  const profile = profiles[type] || profiles.click;
  const start = ctx.currentTime;
  const gap = profile.duration / profile.notes.length;
  profile.notes.forEach((frequency, index) => {
    const noteStart = start + index * gap * .76;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = profile.wave;
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * profile.glide), noteStart + profile.duration * .7);
    gain.gain.setValueAtTime(.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(profile.volume, noteStart + .02);
    gain.gain.exponentialRampToValueAtTime(.0001, noteStart + profile.duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + profile.duration + .02);
  });
}

let toastTimer;
function showSuccessToast(title = 'Excluído com sucesso', message = 'O agendamento foi removido do histórico.') {
  const toast = document.getElementById('successToast');
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMessage').textContent = message;
  clearTimeout(toastTimer);
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}

function showNewBookingToast(booking) {
  const toast = document.getElementById('newBookingToast');
  document.getElementById('newBookingMessage').textContent = `${booking.name || 'Um cliente'} enviou um novo agendamento.`;
  clearTimeout(notificationTimer);
  toast.classList.add('visible');
  notificationTimer = setTimeout(() => toast.classList.remove('visible'), 6000);
}

function saveAdminPhone() {
  const input = document.getElementById('adminPhoneInput');
  const val = input.value.trim();
  if (!/^\d+$/.test(val) || !isValidAdminPhone(val)) {
    setPhoneValidation('Número inválido. Informe um telefone brasileiro válido com código do país 55 e DDD.', true);
    input.focus();
    return;
  }
  localStorage.setItem(STORAGE_KEY_PHONE, val);
  phoneInputDirty = false;
  setPhoneValidation('WhatsApp válido e salvo com sucesso.');
  const saveNotice = document.getElementById('phoneSaveNotice');
  saveNotice.hidden = false;
  setTimeout(() => { saveNotice.hidden = true; }, 3500);
  render();
  playAdminSound('success');
}

let pendingDeleteId = null;
function requestDeleteBooking(id) {
  const booking = bookingsFirebase.find(item => item.id === id);
  if (!booking) return;
  pendingDeleteId = id;
  document.getElementById('deleteAlertName').textContent = booking.name || 'este cliente';
  document.getElementById('deleteAlertBackdrop').hidden = false;
}

function requestClearAllBookings() {
  if (!bookingsFirebase.length) return;
  pendingDeleteId = 'all';
  document.getElementById('deleteAlertName').textContent = 'todo o histórico de pedidos';
  document.getElementById('deleteAlertBackdrop').hidden = false;
}

function closeDeleteAlert() {
  pendingDeleteId = null;
  document.getElementById('deleteAlertBackdrop').hidden = true;
}

function confirmDeleteBooking() {
  if (pendingDeleteId === null) return;
  const id = pendingDeleteId;
  closeDeleteAlert();
  
  if (id === 'all') {
    // Apaga tudo usando Batch do Firebase
    const batch = db.batch();
    bookingsFirebase.forEach(item => {
      batch.delete(db.collection("agendamentos").doc(item.id));
    });
    batch.commit().then(() => {
      playAdminSound('remove');
      showSuccessToast('Histórico limpo', 'Todos os agendamentos foram removidos.');
    });
  } else {
    // Apaga apenas 1 do Firebase
    db.collection("agendamentos").doc(id).delete().then(() => {
      playAdminSound('remove');
      showSuccessToast('Excluído com sucesso', 'O agendamento foi removido do histórico.');
    });
  }
}

function setupAdminSoundInteractions() {
  document.addEventListener('click', event => {
    const interactive = event.target.closest('button');
    if (!interactive) return;
    if (interactive.matches('.delete-btn, .alert-confirm, .activity-clear-btn') || interactive.getAttribute('onclick')?.includes('saveAdminPhone')) return;
    playAdminSound('click');
  });
}

function render() {
  const bookings = bookingsFirebase;
  const phone = getAdminPhone();
  const list = document.getElementById('bookingsList');
  const countTotal = document.getElementById('countTotal');
  const countDeposit = document.getElementById('countDeposit');
  const phoneLabel = document.getElementById('phoneLabel');
  const phoneInput = document.getElementById('adminPhoneInput');

  if (!phoneInputDirty && phoneInput) phoneInput.value = phone;
  if (phoneLabel) phoneLabel.textContent = phone;
  if (countTotal) countTotal.textContent = String(bookings.length);
  if (countDeposit) countDeposit.textContent = `R$ ${bookings.reduce((sum, item) => sum + Number(item.deposit || 0), 0).toFixed(2)}`;

  if (!list) return;
  if (!bookings.length) {
    list.innerHTML = `
      <div class="empty">
        <h3 style="margin:0 0 8px; color:#fff;">Nenhum pedido recebido ainda.</h3>
        <p>Os agendamentos aparecem aqui automaticamente assim que o cliente envia o formulário.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = bookings.map(item => {
    const services = Array.isArray(item.services) ? item.services : [];
    const deposit = Number(item.deposit || 0).toFixed(2);
    const total = Number(item.total || 0).toFixed(2);
    const phoneNumber = String(item.phone || '').replace(/\D/g, '');

    return `
      <article class="booking">
        <div class="booking-top">
          <div>
            <h3>${escapeHtml(item.name || 'Cliente')}</h3>
            <div class="meta" style="margin-top: 8px;">
              <span>📅 ${escapeHtml(item.day || '-')}</span>
              <span>⏰ ${escapeHtml(item.time || '-')}</span>
              <span>📱 ${escapeHtml(item.phone || '-')}</span>
              <span>🕒 ${escapeHtml(item.dateCreated || '-')}</span>
            </div>
          </div>
          <span class="badge success">Pago: R$ ${deposit}</span>
        </div>

        <div class="meta">
          <span><strong>Total:</strong> R$ ${total}</span>
          <span><strong>Pagamento total:</strong> R$ ${deposit}</span>
        </div>

        <div class="services">
          <strong>Serviços solicitados</strong>
          <ul>
            ${services.map(service => `<li>${escapeHtml(service)}</li>`).join('')}
          </ul>
        </div>

        <div class="notes">
          <strong>Mensagem / observações:</strong>
          <div style="margin-top: 8px;">${escapeHtml(item.notes || 'Sem observações adicionais.')}</div>
        </div>

        <div class="booking-actions">
          <a class="button" href="https://wa.me/${phoneNumber}" target="_blank" rel="noreferrer" style="padding: 9px 12px; font-size: 11px;">
            Conversar no WhatsApp
          </a>
          <button class="delete-btn" type="button" onclick="requestDeleteBooking('${item.id}')" style="margin-left: 10px;">
            Excluir
          </button>
        </div>
      </article>
    `;
  }).join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}