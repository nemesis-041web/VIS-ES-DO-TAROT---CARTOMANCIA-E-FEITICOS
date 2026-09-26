(function () {
  const STORAGE_KEYS = Object.freeze({
    cart: 'visoes_tarot_cart',
    soundMuted: 'visoes_tarot_sounds_muted'
  });

  const catalogMonth = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

  const services = [
    {
      id: 'consulta_rapida',
      category: 'tiragem',
      title: 'Consulta Rápida e Objetiva',
      subtitle: 'Até 5 perguntas | R$ 30,00',
      description: 'Consulta oracular direta para questões amorosas, financeiras, profissionais ou espirituais.',
      price: 30,
      priceLabel: 'R$ 30,00',
      isCustomPrice: false,
      questionLimit: 5,
      icon: 'message-circle-question'
    },
    {
      id: 'tiragem_aprofundada',
      category: 'tiragem',
      title: 'Tiragem Aprofundada',
      subtitle: 'Até 8 perguntas | R$ 50,00',
      description: 'Uma leitura mais detalhada para investigar sua questão com maior profundidade e direcionamento.',
      price: 50,
      priceLabel: 'R$ 50,00',
      isCustomPrice: false,
      questionLimit: 8,
      icon: 'layers-3'
    },
    {
      id: 'mapa_area',
      category: 'tiragem',
      title: 'Mapa da Área em Questão',
      subtitle: 'Até 12 perguntas | R$ 80,00',
      description: 'Mapeamento amplo da área escolhida: amorosa, financeira, profissional ou espiritual.',
      price: 80,
      priceLabel: 'R$ 80,00',
      isCustomPrice: false,
      questionLimit: 12,
      icon: 'map'
    },
    {
      id: 'mapa_astral',
      category: 'magia_fixa',
      title: 'Mapa Astral Completo',
      subtitle: 'Mandala Astrológica Natal & Trânsitos',
      description: 'Estudo aprofundado do Sol, Ascendente, Lua, regentes kármicos e propósito de alma com direcionamento oracular.',
      price: 0,
      priceLabel: 'Sob consulta',
      isCustomPrice: true,
      icon: 'globe'
    },
    {
      id: 'adocamento_amoroso',
      category: 'magia_fixa',
      title: 'Adoçamento Amoroso',
      subtitle: 'Harmonia, Ternura & Quebra de Orgulho',
      description: 'Rito com mel, ervas doces e velas consagradas para apaziguar brigas, abrir o coração e resgatar o carinho mútuo.',
      price: 0,
      priceLabel: 'Sob consulta',
      isCustomPrice: true,
      icon: 'heart-handshake'
    },
    {
      id: 'magias_prosperidade',
      category: 'magia_fixa',
      title: 'Magia de Abertura & Prosperidade',
      subtitle: 'Desbloqueio de Caminhos Financeiros',
      description: 'Firmeza consagrada para quebrar demandas, afastar mau-olhado sobre vendas e atrair oportunidades de ouro.',
      price: 0,
      priceLabel: 'Sob consulta',
      isCustomPrice: true,
      icon: 'wand-2'
    },
    {
      id: 'amarracao_amorosa',
      category: 'magia_custom',
      title: 'Amarração Amorosa Tradicional',
      subtitle: 'União Espiritual Direcionada',
      description: 'Trabalho de alta densidade espiritual para ligar destinos. Requer avaliação prévia no oráculo para averiguar permissão cósmica.',
      price: 0,
      priceLabel: 'Valor definido pela bruxa parceira',
      isCustomPrice: true,
      icon: 'flame'
    },
    {
      id: 'outras_magias_complexas',
      category: 'magia_custom',
      title: 'Outras Magias de Alta Complexidade',
      subtitle: 'Demandas Fortes, Afastamento & Proteção',
      description: 'Trabalhos personalizados segundo a necessidade do caso (afastamento de rivais, quebra de feitiços antigos ou consagrações pesadas).',
      price: 0,
      priceLabel: 'Valor definido pela bruxa parceira',
      isCustomPrice: true,
      icon: 'shield-alert'
    },
    {
      id: 'catalog_clareza_coracao',
      category: 'catalogo',
      title: 'Clareza do Coração',
      subtitle: 'Coleção Amor & Afeto | 5 cartas',
      description: 'Leitura objetiva para entender os sentimentos e intenções da pessoa de forma direta.',
      price: 35,
      priceLabel: 'R$ 35,00',
      isCustomPrice: false,
      icon: 'heart-pulse'
    },
    {
      id: 'catalog_verdades_coracao',
      category: 'catalogo',
      title: 'Verdades do Coração',
      subtitle: 'Coleção Amor & Afeto | 8 cartas',
      description: 'Aprofundamento emocional para compreender intenções ocultas e o que há por trás do comportamento.',
      price: 50,
      priceLabel: 'R$ 50,00',
      isCustomPrice: false,
      icon: 'heart'
    },
    {
      id: 'catalog_universo_dois',
      category: 'catalogo',
      title: 'Universo a Dois',
      subtitle: 'Coleção Amor & Afeto | 12 cartas',
      description: 'Análise completa da dinâmica do casal, visão individual de cada um, desafios e futuro do relacionamento.',
      price: 80,
      priceLabel: 'R$ 80,00',
      isCustomPrice: false,
      icon: 'copy'
    },
    {
      id: 'catalog_fluxo_abundancia',
      category: 'catalogo',
      title: 'Fluxo de Abundância',
      subtitle: 'Coleção Finanças & Abundância | 5 cartas',
      description: 'Diagnóstico rápido para identificar o que está travando seus recursos e onde existe saída.',
      price: 35,
      priceLabel: 'R$ 35,00',
      isCustomPrice: false,
      icon: 'coins'
    },
    {
      id: 'catalog_caminhos_prosperidade',
      category: 'catalogo',
      title: 'Caminhos da Prosperidade',
      subtitle: 'Coleção Finanças & Abundância | 8 cartas',
      description: 'Foco em novas fontes de renda, oportunidades ocultas e atitudes para atrair crescimento.',
      price: 50,
      priceLabel: 'R$ 50,00',
      isCustomPrice: false,
      icon: 'trending-up'
    },
    {
      id: 'catalog_soberania_financeira',
      category: 'catalogo',
      title: 'Soberania Financeira',
      subtitle: 'Coleção Finanças & Abundância | 12 cartas',
      description: 'Mapeamento estratégico da vida financeira, cobrindo bloqueios, padrões, trabalho e visão de médio prazo.',
      price: 80,
      priceLabel: 'R$ 80,00',
      isCustomPrice: false,
      icon: 'scale'
    },
    {
      id: 'catalog_direcionamento_carreira',
      category: 'catalogo',
      title: 'Direcionamento de Carreira',
      subtitle: 'Coleção Carreira & Negócios | 5 cartas',
      description: 'Clareza imediata sobre o momento profissional e o que precisa ser destravado.',
      price: 35,
      priceLabel: 'R$ 35,00',
      isCustomPrice: false,
      icon: 'briefcase-business'
    },
    {
      id: 'catalog_proposito_acao',
      category: 'catalogo',
      title: 'Propósito & Ação',
      subtitle: 'Coleção Carreira & Negócios | 8 cartas',
      description: 'Orientação prática para mudança de cargo, novas vagas, entrevistas ou novos projetos.',
      price: 50,
      priceLabel: 'R$ 50,00',
      isCustomPrice: false,
      icon: 'chart-no-axes-combined'
    },
    {
      id: 'catalog_jornada_profissional',
      category: 'catalogo',
      title: 'Jornada Profissional',
      subtitle: 'Coleção Carreira & Negócios | 12 cartas',
      description: 'Leitura ampla da sua trajetória de trabalho, potenciais não explorados e tendências para o futuro.',
      price: 80,
      priceLabel: 'R$ 80,00',
      isCustomPrice: false,
      icon: 'briefcase-business'
    },
    {
      id: 'catalog_conexao_energia',
      category: 'catalogo',
      title: 'Conexão & Energia',
      subtitle: 'Coleção Energia & Espiritualidade | 5 cartas',
      description: 'Leitura para reconhecer seu momento energético e fortalecer a conexão interior.',
      price: 35,
      priceLabel: 'R$ 35,00',
      isCustomPrice: false,
      icon: 'sparkles'
    },
    {
      id: 'catalog_desvendar_sombras',
      category: 'catalogo',
      title: 'Desvendar das Sombras',
      subtitle: 'Coleção Energia & Espiritualidade | 8 cartas',
      description: 'Investigação acolhedora sobre influências externas, bloqueios sutis e padrões a serem transformados.',
      price: 50,
      priceLabel: 'R$ 50,00',
      isCustomPrice: false,
      icon: 'lightbulb'
    },
    {
      id: 'catalog_jornada_alma',
      category: 'catalogo',
      title: 'Jornada da Alma',
      subtitle: 'Coleção Energia & Espiritualidade | 12 cartas',
      description: 'Imersão profunda na sua evolução espiritual, aprendizados de vida, dons e direcionamento.',
      price: 80,
      priceLabel: 'R$ 80,00',
      isCustomPrice: false,
      icon: 'scale'
    },
    {
      id: 'catalog_luz_momento',
      category: 'catalogo',
      title: 'Luz do Momento (Conselho Rápido)',
      subtitle: 'Formatos Especiais & Gerais | 1 pergunta',
      description: '1 Pergunta pontual com resposta direta e objetiva para decisões do dia a dia.',
      price: 20,
      priceLabel: 'R$ 20,00',
      isCustomPrice: false,
      icon: 'search'
    },
    {
      id: 'catalog_ventos_mes',
      category: 'catalogo',
      title: `Ventos de ${catalogMonth} (Tiragem Temporal)`,
      subtitle: 'Formatos Especiais & Gerais | Próximos 30 dias',
      description: 'Previsões, tendências energéticas e orientações práticas para conduzir os seus próximos 30 dias.',
      price: 60,
      priceLabel: 'R$ 60,00',
      isCustomPrice: false,
      icon: 'clock-3'
    },
    {
      id: 'catalog_farol_vida',
      category: 'catalogo',
      title: 'Farol da Vida (Tiragem Geral 360°)',
      subtitle: 'Formatos Especiais & Gerais | Visão geral 360°',
      description: 'Panorama completo integrando Amor, Trabalho, Finanças e Saúde/Energia num único atendimento.',
      price: 100,
      priceLabel: 'R$ 100,00',
      isCustomPrice: false,
      icon: 'compass'
    }
  ];

  window.VISOES_STORAGE_KEYS = STORAGE_KEYS;
  window.VISOES_SERVICES = services;
  window.readSharedCart = function () {
    const storedCart = localStorage.getItem(STORAGE_KEYS.cart);
    if (storedCart === null) return ['consulta_rapida'];

    try {
      const parsedCart = JSON.parse(storedCart);
      if (!Array.isArray(parsedCart)) throw new TypeError('O carrinho salvo não é uma lista.');
      return parsedCart.filter(id => services.some(service => service.id === id));
    } catch (error) {
      console.error('Não foi possível ler o carrinho salvo.', error);
      return ['consulta_rapida'];
    }
  };
  window.writeSharedCart = function (cart) {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  };

  const profiles = {
    hover: { notes: [740], duration: 0.16, volume: 0.025, wave: 'sine', glide: 1.08 },
    click: { notes: [392, 587], duration: 0.18, volume: 0.045, wave: 'sine', glide: 1.2 },
    navigate: { notes: [523, 659], duration: 0.24, volume: 0.05, wave: 'triangle', glide: 1.12 },
    add: { notes: [440, 554, 659], duration: 0.42, volume: 0.07, wave: 'sine', glide: 1.15 },
    remove: { notes: [659, 494, 330], duration: 0.4, volume: 0.065, wave: 'triangle', glide: 0.86 },
    alert: { notes: [294, 247], duration: 0.28, volume: 0.04, wave: 'sine', glide: 0.92 },
    confirm: { notes: [523, 659, 784, 1047], duration: 0.75, volume: 0.08, wave: 'sine', glide: 1.04 },
    success: { notes: [659, 784, 988], duration: 0.55, volume: 0.07, wave: 'sine', glide: 1.08 }
  };

  let soundsMuted = localStorage.getItem(STORAGE_KEYS.soundMuted) === 'true';
  let audioContext;

  function updateSoundToggle() {
    const button = document.getElementById('soundToggle');
    if (!button) return;

    const label = soundsMuted ? 'Ativar efeitos sonoros' : 'Desativar efeitos sonoros';
    button.setAttribute('aria-pressed', String(soundsMuted));
    button.setAttribute('aria-label', label);
    button.title = label;
    const textLabel = document.getElementById('soundToggleLabel');
    if (textLabel) textLabel.textContent = soundsMuted ? 'Som desligado' : 'Som ligado';
  }

  function getAudioContext() {
    if (soundsMuted) return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    audioContext ||= new AudioContext();
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  function playMagicSound(type = 'click') {
    const ctx = getAudioContext();
    if (!ctx) return;

    const profile = profiles[type] || profiles.click;
    const start = ctx.currentTime;
    const noteGap = profile.duration / profile.notes.length;

    profile.notes.forEach((frequency, index) => {
      const noteStart = start + index * noteGap * 0.78;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = profile.wave;
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency * profile.glide), noteStart + profile.duration * 0.7);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(profile.volume, noteStart + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + profile.duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + profile.duration + 0.03);
    });
  }

  function toggleSoundPreference() {
    soundsMuted = !soundsMuted;
    localStorage.setItem(STORAGE_KEYS.soundMuted, String(soundsMuted));
    updateSoundToggle();
  }

  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEYS.soundMuted) return;
    soundsMuted = event.newValue === 'true';
    updateSoundToggle();
  });

  window.playMagicSound = playMagicSound;
  window.getMagicAudioContext = getAudioContext;
  window.isMagicSoundMuted = () => soundsMuted;
  window.updateSoundToggle = updateSoundToggle;
  window.toggleSoundPreference = toggleSoundPreference;
})();
