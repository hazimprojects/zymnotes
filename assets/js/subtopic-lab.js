(function setupSubtopicLearningLab() {
  const root = document.querySelector('[data-learning-lab="1-1"]');
  if (!root) return;

  const PARTS = {
    asas:    { label: "Tapak Kerajaan",        color: "#8a7158", emoji: "🏗️" },
    tiang:   { label: "Tiang Pentadbiran",     color: "#6a7b5a", emoji: "🧩" },
    dinding: { label: "Dinding Kedaulatan",    color: "#c8a96b", emoji: "🧱" },
    bumbung: { label: "Bumbung Undang-undang", color: "#3e5f8a", emoji: "🏠" },
    puncak:  { label: "Puncak Kegemilangan",   color: "#2f7a67", emoji: "✨" },
    bendera: { label: "Bendera Warisan",       color: "#9a5a5a", emoji: "🚩" },
  };

  const PART_ORDER = ["asas", "tiang", "dinding", "bumbung", "puncak", "bendera"];

  const TYPE_STYLE = {
    objektif:   { label: "Objektif", color: "#3e5f8a" },
    pilih2:     { label: "Pilih 2 Isi", color: "#2f7a67" },
    lengkapkan: { label: "Lengkapkan Fakta", color: "#8a7158" },
    susun:      { label: "Susun Urutan", color: "#6a7b5a" },
    mini_spm:   { label: "Mini SPM", color: "#9a5a5a" },
  };

  const QUESTIONS = [
    {
      id: "q1",
      part: "asas",
      type: "objektif",
      prompt: "Kerajaan Funan, Champa dan Kedah Tua ialah kerajaan awal di Alam Melayu. Apakah kepentingan kemunculan kerajaan-kerajaan ini?",
      options: [
        "Membuktikan asas negara bangsa telah wujud",
        "Menunjukkan sistem demokrasi telah diamalkan",
        "Membawa pengaruh penjajahan Barat",
        "Menyebarkan Islam ke seluruh Asia Tenggara"
      ],
      answer: "Membuktikan asas negara bangsa telah wujud",
      explanation: "Kerajaan awal seperti Funan, Champa dan Kedah Tua membuktikan bahawa unsur negara bangsa telah wujud di Alam Melayu sebelum kedatangan Barat.",
      tip: "Untuk SPM, kerajaan awal = bukti kewujudan asas negara bangsa. Fokus pada idea 'sudah wujud sebelum Barat'."
    },
    {
      id: "q2",
      part: "tiang",
      type: "pilih2",
      prompt: "Pilih DUA pernyataan yang betul tentang ciri negara bangsa di Alam Melayu.",
      options: [
        "Raja menjadi tonggak utama kerajaan",
        "Wilayah pengaruh menunjukkan pengiktirafan rakyat terhadap pemerintahan raja",
        "Negara bangsa hanya wujud selepas penjajahan Barat",
        "Undang-undang tidak penting dalam kerajaan awal",
        "Rakyat tidak mempunyai hubungan dengan pemerintah"
      ],
      answers: [
        "Raja menjadi tonggak utama kerajaan",
        "Wilayah pengaruh menunjukkan pengiktirafan rakyat terhadap pemerintahan raja"
      ],
      explanation: "Ciri negara bangsa di Alam Melayu termasuk raja, undang-undang, wilayah pengaruh dan rakyat. Raja menjadi tonggak kerajaan, manakala wilayah pengaruh menunjukkan kawasan yang menerima pemerintahan raja.",
      tip: "Soalan pilih dua isi sangat hampir dengan teknik jawab struktur. Pilih yang paling selari dengan definisi sebenar."
    },
    {
      id: "q3",
      part: "dinding",
      type: "lengkapkan",
      prompt: "Lengkapkan fakta berikut:\n\nWilayah pengaruh ialah kawasan yang rakyatnya __________, __________ dan __________ pemerintahan raja.",
      help: "Pilih tiga perkataan yang melengkapkan definisi dengan tepat.",
      options: ["menerima", "mengakui", "mematuhi", "menolak", "memansuhkan", "melawan"],
      answers: ["menerima", "mengakui", "mematuhi"],
      explanation: "Takrif wilayah pengaruh perlu diingat tepat: kawasan yang rakyatnya menerima, mengakui dan mematuhi pemerintahan raja.",
      tip: "Ini ialah ayat hafalan penting. Kalau pelajar kuasai frasa ini, mereka lebih mudah jawab soalan struktur dan objektif."
    },
    {
      id: "q4",
      part: "bumbung",
      type: "susun",
      prompt: "Susun kesinambungan negara bangsa di Alam Melayu daripada yang lebih awal kepada yang kemudian.",
      items: ["Kesultanan Johor-Riau", "Srivijaya", "Kesultanan Melayu Melaka", "Funan / Champa"],
      answerOrder: ["Funan / Champa", "Srivijaya", "Kesultanan Melayu Melaka", "Kesultanan Johor-Riau"],
      explanation: "Urutan kesinambungan negara bangsa: Funan / Champa → Srivijaya → Kesultanan Melayu Melaka → Kesultanan Johor-Riau.",
      tip: "Hafal aliran ini: Funan / Champa → Srivijaya → Melaka → Johor-Riau."
    },
    {
      id: "q5",
      part: "puncak",
      type: "mini_spm",
      prompt: "Mini SPM:\nPilih DUA isi yang paling sesuai untuk menjawab soalan berikut:\n\nNyatakan dua bukti bahawa negara bangsa telah wujud di Alam Melayu sebelum kedatangan Barat.",
      options: [
        "Kemunculan kerajaan awal seperti Funan dan Champa",
        "Kewujudan ciri seperti raja, rakyat, wilayah pengaruh dan undang-undang",
        "Pembentukan Malayan Union",
        "Campur tangan British dalam pentadbiran tempatan",
        "Kemunculan sistem demokrasi moden"
      ],
      answers: [
        "Kemunculan kerajaan awal seperti Funan dan Champa",
        "Kewujudan ciri seperti raja, rakyat, wilayah pengaruh dan undang-undang"
      ],
      explanation: "Untuk jawapan struktur, dua isi paling kuat ialah kewujudan kerajaan awal dan kewujudan ciri negara bangsa yang jelas sebelum kedatangan Barat.",
      tip: "Apabila soalan minta dua bukti, pilih isi yang paling terus menjawab soalan."
    },
    {
      id: "q6",
      part: "bendera",
      type: "objektif",
      prompt: "Kerajaan Majapahit mengamalkan undang-undang tertentu. Apakah nama undang-undang tersebut?",
      options: ["Kutara Manawa", "Hukum Kanun Melaka", "Undang-undang Laut Melaka", "Adat Perpatih"],
      answer: "Kutara Manawa",
      explanation: "Kerajaan Majapahit mengamalkan undang-undang Kutara Manawa. Ini membuktikan unsur undang-undang dalam negara bangsa Alam Melayu.",
      tip: "Majapahit = Kutara Manawa. Hafal sebagai pasangan tetap."
    }
  ];

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  function buildQuestionSet() {
    return QUESTIONS.map(function(q) {
      if (q.type === "objektif" || q.type === "pilih2" || q.type === "lengkapkan" || q.type === "mini_spm") {
        return Object.assign({}, q, { shuffledOptions: shuffle(q.options) });
      }
      if (q.type === "susun") {
        return Object.assign({}, q, { shuffledItems: shuffle(q.items) });
      }
      return Object.assign({}, q);
    });
  }

  function getKingdomSVG(built) {
    // Pre-build pillar HTML for TIANG (6 pillars flanking a central door)
    var pillarXs = [100, 148, 194, 274, 320, 368];
    var pillarHtml = '';
    if (built.includes('tiang')) {
      pillarXs.forEach(function(x) {
        pillarHtml +=
          '<rect x="' + x + '" y="100" width="12" height="39" rx="2" fill="#6a7b5a" opacity="0.88"/>' +
          '<rect x="' + (x - 3) + '" y="97" width="18" height="5" rx="1" fill="#7a9060" opacity="0.72"/>' +
          '<rect x="' + (x - 3) + '" y="136" width="18" height="4" rx="1" fill="#5a6b4a" opacity="0.68"/>';
      });
      pillarHtml += '<rect x="92" y="96" width="296" height="4" rx="1" fill="#5a6b4a" opacity="0.55"/>';
    }

    return `<svg viewBox="0 0 480 178" style="width:100%;display:block;margin:0 auto;">
      <defs>
        <radialGradient id="lbSky" cx="50%" cy="12%" r="70%">
          <stop offset="0%" stop-color="#fef9f0" stop-opacity="0.75"/>
          <stop offset="100%" stop-color="#e8f2ea" stop-opacity="0.04"/>
        </radialGradient>
      </defs>

      <rect width="480" height="178" fill="url(#lbSky)"/>
      <rect x="0" y="163" width="480" height="15" fill="rgba(110,150,75,0.22)"/>
      <ellipse cx="240" cy="163" rx="215" ry="9" fill="rgba(95,135,60,0.13)"/>

      ${built.length === 0 ? `<g opacity="0.055" fill="#556">
        <rect x="60" y="155" width="360" height="9"/>
        <rect x="72" y="145" width="336" height="11"/>
        <rect x="86" y="135" width="308" height="11"/>
        <rect x="86" y="100" width="308" height="37"/>
        <rect x="97" y="100" width="12" height="37"/>
        <rect x="145" y="100" width="12" height="37"/>
        <rect x="191" y="100" width="12" height="37"/>
        <rect x="271" y="100" width="12" height="37"/>
        <rect x="317" y="100" width="12" height="37"/>
        <rect x="365" y="100" width="12" height="37"/>
        <polygon points="40,100 240,62 440,100"/>
        <polygon points="108,76 240,42 372,76"/>
        <polygon points="240,22 248,42 232,42"/>
        <circle cx="240" cy="14" r="8"/>
      </g>` : ''}

      ${built.includes('asas') ? `<g>
        <rect x="60" y="156" width="360" height="9" rx="2" fill="#4a3d28" opacity="0.80"/>
        <rect x="72" y="146" width="336" height="11" rx="2" fill="#6b5840" opacity="0.85"/>
        <rect x="86" y="136" width="308" height="11" rx="2" fill="#8a7158" opacity="0.90"/>
        <rect x="87" y="134" width="306" height="3" rx="1" fill="#c8a96b" opacity="0.46"/>
      </g>` : ''}

      ${pillarHtml}

      ${built.includes('dinding') ? `<g>
        <rect x="87" y="102" width="306" height="36" fill="#c8a96b" opacity="0.82"/>
        <rect x="115" y="106" width="26" height="26" rx="2" fill="#d4b87a" opacity="0.90"/>
        <rect x="160" y="106" width="28" height="26" rx="3" fill="#d4b87a" opacity="0.88"/>
        <path d="M160,120 Q174,106 188,120" fill="#b89448" opacity="0.48"/>
        <rect x="208" y="100" width="64" height="38" rx="4" fill="#9a7228" opacity="0.68"/>
        <path d="M208,124 Q240,100 272,124" fill="#7a5618" opacity="0.62"/>
        <rect x="284" y="106" width="28" height="26" rx="3" fill="#d4b87a" opacity="0.88"/>
        <path d="M284,120 Q298,106 312,120" fill="#b89448" opacity="0.48"/>
        <rect x="337" y="106" width="26" height="26" rx="2" fill="#d4b87a" opacity="0.90"/>
        <rect x="87" y="98" width="306" height="5" rx="1" fill="#e0c060" opacity="0.38"/>
      </g>` : ''}

      ${built.includes('bumbung') ? `<g>
        <polygon points="40,100 240,62 440,100" fill="#3e5f8a" opacity="0.88"/>
        <polygon points="56,100 240,68 424,100" fill="#4a72a8" opacity="0.38"/>
        <path d="M40,100 Q28,100 22,114" stroke="#3e5f8a" stroke-width="3.5" fill="none" opacity="0.60"/>
        <path d="M440,100 Q452,100 458,114" stroke="#3e5f8a" stroke-width="3.5" fill="none" opacity="0.60"/>
        <circle cx="40" cy="100" r="5.5" fill="#4a72a8" opacity="0.70"/>
        <circle cx="440" cy="100" r="5.5" fill="#4a72a8" opacity="0.70"/>
        <polygon points="108,76 240,42 372,76" fill="#2e4d7a" opacity="0.92"/>
        <polygon points="118,76 240,47 362,76" fill="#3a6098" opacity="0.40"/>
        <circle cx="108" cy="76" r="4.5" fill="#3a6098" opacity="0.76"/>
        <circle cx="372" cy="76" r="4.5" fill="#3a6098" opacity="0.76"/>
        <line x1="108" y1="76" x2="372" y2="76" stroke="#c8a96b" stroke-width="1.5" opacity="0.36"/>
        <line x1="40" y1="100" x2="440" y2="100" stroke="#c8a96b" stroke-width="1" opacity="0.25"/>
      </g>` : ''}

      ${built.includes('puncak') ? `<g>
        <polygon points="240,22 249,42 231,42" fill="#2f7a67" opacity="0.92"/>
        <ellipse cx="240" cy="38" rx="10" ry="4.5" fill="#2f7a67" opacity="0.84"/>
        <ellipse cx="240" cy="32" rx="7.5" ry="3.5" fill="#3a9a82" opacity="0.80"/>
        <ellipse cx="240" cy="27" rx="5.5" ry="2.8" fill="#2f7a67" opacity="0.87"/>
        <circle cx="240" cy="14" r="9.5" fill="#c8a96b" opacity="0.88"/>
        <circle cx="240" cy="14" r="5.8" fill="#e8c87a" opacity="0.94"/>
        <circle cx="240" cy="14" r="2.2" fill="#b89040" opacity="0.88"/>
      </g>` : ''}

      ${built.includes('bendera') ? `<g>
        <line x1="240" y1="4" x2="240" y2="22" stroke="#8a7158" stroke-width="2" opacity="0.76"/>
        <polygon points="240,3 244,6 240,8 236,6" fill="#c8a96b" opacity="0.84"/>
        <path d="M240,4 Q263,9 255,13 Q269,17 260,20 L240,20 Z" fill="#9a5a5a" opacity="0.88"/>
        <path d="M240,6 Q254,10 248,13 L240,13 Z" fill="#c8a96b" opacity="0.46"/>
      </g>` : ''}

      ${built.length > 0 ? '<text x="240" y="176" text-anchor="middle" font-size="8.5" font-weight="800" fill="#5d6a79" opacity="0.55" font-family="Nunito,sans-serif">Negara Bangsa Alam Melayu</text>' : ''}
    </svg>`;
  }

  const screens = {
    intro: root.querySelector('[data-lab-screen="intro"]'),
    game: root.querySelector('[data-lab-screen="game"]'),
    result: root.querySelector('[data-lab-screen="result"]')
  };

  const kingdomSlots = root.querySelectorAll('[data-lab-kingdom]');
  const partsSlots = root.querySelectorAll('[data-lab-parts]');
  const typeEl = root.querySelector('[data-lab-type]');
  const rewardEl = root.querySelector('[data-lab-reward]');
  const promptEl = root.querySelector('[data-lab-prompt]');
  const helpEl = root.querySelector('[data-lab-help]');
  const optionsEl = root.querySelector('[data-lab-options]');
  const orderEl = root.querySelector('[data-lab-order]');
  const feedbackWrap = root.querySelector('[data-lab-feedback-wrap]');
  const feedbackBox = root.querySelector('[data-lab-feedback-box]');
  const feedbackTitle = root.querySelector('[data-lab-feedback-title]');
  const feedbackText = root.querySelector('[data-lab-feedback-text]');
  const tipEl = root.querySelector('[data-lab-tip]');
  const summaryList = root.querySelector('[data-lab-summary-list]');
  const resultTitle = root.querySelector('[data-lab-result-title]');
  const resultText = root.querySelector('[data-lab-result-text]');
  const checkBtn = root.querySelector('[data-lab-action="check"]');
  const nextBtn = root.querySelector('[data-lab-action="next"]');

  const state = {
    questions: [],
    qIndex: 0,
    built: [],
    selected: null,
    multiSelected: [],
    orderState: [],
    history: [],
    locked: false,
  };

  function switchScreen(name) {
    Object.keys(screens).forEach(function(key) {
      screens[key].classList.toggle('is-hidden', key !== name);
    });
  }

  function renderKingdom() {
    kingdomSlots.forEach(function(slot) {
      slot.innerHTML = getKingdomSVG(state.built);
    });

    const partsHtml = PART_ORDER.map(function(partKey, index) {
      const built = state.built.includes(partKey);
      return `
        <span class="learning-lab-part ${built ? 'is-built' : ''}" style="${built ? `border-color:${PARTS[partKey].color}30;color:${PARTS[partKey].color};background:${PARTS[partKey].color}18;` : ''}">
          ${built ? '✓' : (index + 1)} ${PARTS[partKey].label}
        </span>
      `;
    }).join('');

    partsSlots.forEach(function(slot) {
      slot.innerHTML = partsHtml;
    });
  }

  function resetInteractionState() {
    state.selected = null;
    state.multiSelected = [];
    state.locked = false;
    feedbackWrap.classList.add('is-hidden');
    feedbackWrap.classList.remove('is-peeking');
    feedbackBox.classList.remove('is-wrong');
    checkBtn.classList.remove('is-disabled');
    // Reset peek bar state
    var peekBtn  = document.getElementById('lab-feedback-peek-btn');
    var peekHint = document.getElementById('lab-feedback-peek-hint');
    if (peekBtn)  peekBtn.textContent  = '🔽';
    if (peekHint) peekHint.textContent = 'Sembunyikan';
  }

  function currentQuestion() {
    return state.questions[state.qIndex];
  }

  function updateCheckButtonState() {
    const q = currentQuestion();
    if (!q || state.locked) {
      checkBtn.classList.add('is-disabled');
      return;
    }

    let enabled = false;

    if (q.type === 'objektif') {
      enabled = !!state.selected;
    } else if (q.type === 'susun') {
      enabled = true;
    } else {
      enabled = state.multiSelected.length === q.answers.length;
    }

    checkBtn.classList.toggle('is-disabled', !enabled);
  }

  function renderOptions() {
    const q = currentQuestion();
    optionsEl.innerHTML = '';
    orderEl.innerHTML = '';

    if (q.type === 'susun') {
      orderEl.innerHTML = state.orderState.map(function(item, index) {
        return `
          <div class="learning-lab-order-item">
            <span class="learning-lab-order-no">${index + 1}</span>
            <span class="learning-lab-order-text">${item}</span>
            ${state.locked ? '' : `
              <div class="learning-lab-order-controls">
                <button class="learning-lab-order-btn" type="button" data-order-move="up" data-order-index="${index}">↑</button>
                <button class="learning-lab-order-btn" type="button" data-order-move="down" data-order-index="${index}">↓</button>
              </div>
            `}
          </div>
        `;
      }).join('');

      orderEl.querySelectorAll('[data-order-move]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          const index = parseInt(btn.getAttribute('data-order-index'), 10);
          const move = btn.getAttribute('data-order-move');
          if (move === 'up') moveItem(index, -1);
          if (move === 'down') moveItem(index, 1);
        });
      });

      return;
    }

    const options = q.shuffledOptions;
    optionsEl.innerHTML = options.map(function(option) {
      const isPicked = q.type === 'objektif'
        ? state.selected === option
        : state.multiSelected.includes(option);

      let className = 'learning-lab-option';
      if (isPicked && !state.locked) className += ' is-active';

      if (state.locked) {
        if (q.type === 'objektif') {
          const isAnswer = option === q.answer;
          const isWrong = state.selected === option && option !== q.answer;
          if (isAnswer) className += ' is-correct';
          else if (isWrong) className += ' is-wrong';
          else className += ' is-muted';
        } else {
          const isAnswer = q.answers.includes(option);
          const isWrong = state.multiSelected.includes(option) && !isAnswer;
          if (isAnswer) className += ' is-correct';
          else if (isWrong) className += ' is-wrong';
          else className += ' is-muted';
        }
      }

      const icon = state.locked
        ? (q.type === 'objektif'
            ? (option === q.answer ? '✅' : state.selected === option ? '❌' : '•')
            : (q.answers.includes(option) ? '✅' : state.multiSelected.includes(option) ? '❌' : '•'))
        : (q.type === 'objektif'
            ? '▸'
            : isPicked ? '☑️' : '⬜');

      return `
        <button class="${className}" type="button" data-option="${option.replace(/"/g, '&quot;')}">
          <span class="learning-lab-option-inner">
            <span>${icon}</span>
            <span>${option}</span>
          </span>
        </button>
      `;
    }).join('');

    optionsEl.querySelectorAll('[data-option]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (state.locked) return;
        const value = btn.getAttribute('data-option');

        if (q.type === 'objektif') {
          state.selected = value;
        } else {
          toggleMulti(value);
          return;
        }

        renderOptions();
        updateCheckButtonState();
      });
    });
  }

  function toggleMulti(option) {
    const q = currentQuestion();
    if (!q || state.locked) return;

    const maxPick = q.answers.length;
    const exists = state.multiSelected.includes(option);

    if (exists) {
      state.multiSelected = state.multiSelected.filter(function(item) {
        return item !== option;
      });
    } else if (state.multiSelected.length < maxPick) {
      state.multiSelected = state.multiSelected.concat(option);
    }

    renderOptions();
    updateCheckButtonState();
  }

  function moveItem(index, delta) {
    if (state.locked) return;
    const newIndex = index + delta;
    if (newIndex < 0 || newIndex >= state.orderState.length) return;

    const copy = state.orderState.slice();
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;
    state.orderState = copy;
    renderOptions();
  }

  function isCorrectAnswer() {
    const q = currentQuestion();
    if (!q) return false;

    if (q.type === 'objektif') {
      return state.selected === q.answer;
    }

    if (q.type === 'susun') {
      return JSON.stringify(state.orderState) === JSON.stringify(q.answerOrder);
    }

    if (state.multiSelected.length !== q.answers.length) return false;
    const a = state.multiSelected.slice().sort();
    const b = q.answers.slice().sort();
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function renderQuestion() {
    const q = currentQuestion();
    if (!q) return;

    const type = TYPE_STYLE[q.type];
    const part = PARTS[q.part];

    typeEl.textContent = type.label;
    typeEl.style.color = type.color;
    typeEl.style.background = type.color + '12';

    rewardEl.textContent = `${part.emoji} Bina: ${part.label}`;
    rewardEl.style.color = part.color;
    rewardEl.style.background = part.color + '12';

    promptEl.textContent = q.prompt;
    helpEl.textContent = q.help || (
      q.type === 'susun'
        ? 'Susun item mengikut urutan yang betul.'
        : q.type === 'objektif'
        ? 'Pilih satu jawapan terbaik.'
        : `Pilih ${q.answers.length} jawapan.`
    );

    if (q.type === 'susun') {
      state.orderState = q.shuffledItems.slice();
    }

    renderOptions();
    updateCheckButtonState();
  }

  function renderFeedback(ok) {
    const q = currentQuestion();
    const part = PARTS[q.part];

    feedbackWrap.classList.remove('is-hidden');
    feedbackBox.classList.toggle('is-wrong', !ok);

    feedbackTitle.textContent = ok
      ? `🎉 Betul! ${part.label} berjaya dibina!`
      : `😔 Belum tepat. ${part.label} belum dapat dibina.`;

    feedbackTitle.style.color = ok ? '#2f7a67' : '#9a5a5a';
    feedbackText.textContent = q.explanation;
    tipEl.textContent = q.tip;

    nextBtn.textContent = state.qIndex + 1 < state.questions.length
      ? 'Soalan Seterusnya →'
      : 'Lihat Hasil Akhir 🏰';
  }

  function submitAnswer() {
    if (state.locked) return;
    const q = currentQuestion();
    if (!q) return;

    if (q.type === 'objektif' && !state.selected) return;
    if ((q.type === 'pilih2' || q.type === 'lengkapkan' || q.type === 'mini_spm') && state.multiSelected.length !== q.answers.length) return;

    const ok = isCorrectAnswer();
    state.locked = true;

    if (ok) {
      state.built.push(q.part);
    }

    state.history.push({
      question: q,
      ok: ok
    });

    renderKingdom();
    renderOptions();
    updateCheckButtonState();
    renderFeedback(ok);
  }

  function nextQuestion() {
    state.qIndex += 1;
    if (state.qIndex >= state.questions.length) {
      renderResult();
      switchScreen('result');
      return;
    }

    resetInteractionState();
    renderKingdom();
    renderQuestion();
  }

  function renderResult() {
    const total = state.questions.length;
    const builtCount = state.built.length;
    const pct = Math.round((builtCount / total) * 100);

    let title = 'Teruskan ulang kaji 📚';
    let text = `${builtCount} daripada ${total} bahagian berjaya dibina (${pct}%).`;
    let titleColor = '#8a7158';
    let bg = 'rgba(138,113,88,0.07)';
    let border = 'rgba(138,113,88,0.16)';

    if (pct === 100) {
      title = 'Cemerlang! Semua bahagian berjaya dibina 🏆';
      titleColor = '#2f7a67';
      bg = 'rgba(47,122,103,0.07)';
      border = 'rgba(47,122,103,0.16)';
    } else if (pct >= 67) {
      title = 'Bagus! Tinggal sedikit lagi 🎖️';
      titleColor = '#3e5f8a';
      bg = 'rgba(62,95,138,0.07)';
      border = 'rgba(62,95,138,0.16)';
    }

    const resultBox = root.querySelector('[data-lab-result-box]');
    resultBox.style.background = bg;
    resultBox.style.borderColor = border;
    resultTitle.textContent = title;
    resultTitle.style.color = titleColor;
    resultText.textContent = text;

    renderKingdom();

    summaryList.innerHTML = state.history.map(function(item) {
      const part = PARTS[item.question.part];
      const type = TYPE_STYLE[item.question.type];
      return `
        <div class="learning-lab-summary-item">
          <div class="learning-lab-summary-left">
            <span style="width:7px;height:7px;border-radius:50%;background:${part.color};display:inline-block;flex-shrink:0;"></span>
            <span style="font-size:0.79rem;font-weight:800;color:#24313f;">${part.label}</span>
            <span style="font-size:0.62rem;padding:0.1rem 0.38rem;border-radius:6px;background:${type.color}12;color:${type.color};font-weight:900;">${type.label}</span>
          </div>
          <span class="learning-lab-summary-right" style="color:${item.ok ? '#2f7a67' : '#9a5a5a'};">
            ${item.ok ? '✓ Berjaya' : '✗ Belum'}
          </span>
        </div>
      `;
    }).join('');

    if (state.history.some(function(item) { return !item.ok; })) {
      summaryList.innerHTML += `
        <div class="learning-lab-tip" style="margin-top:0.55rem;">
          <p class="learning-lab-tip-label">📖 Perkara yang patut ulang kaji</p>
          ${
            state.history
              .filter(function(item) { return !item.ok; })
              .map(function(item) {
                return `<p class="learning-lab-tip-text" style="margin:0 0 0.22rem;">• ${item.question.tip}</p>`;
              })
              .join('')
          }
        </div>
      `;
    }
  }

  function startGame() {
    state.questions = buildQuestionSet();
    state.qIndex = 0;
    state.built = [];
    state.history = [];
    resetInteractionState();
    renderKingdom();
    renderQuestion();
    switchScreen('game');
  }

  root.querySelector('[data-lab-action="start"]').addEventListener('click', startGame);
  root.querySelector('[data-lab-action="restart"]').addEventListener('click', startGame);
  checkBtn.addEventListener('click', submitAnswer);
  nextBtn.addEventListener('click', nextQuestion);

  renderKingdom();
  switchScreen('intro');

  const actions = document.querySelector('[data-learning-actions]');
  if (actions) {
    const audioBtn = actions.querySelector('[data-learning-action="audio"]');
    const labBtn = actions.querySelector('[data-learning-action="lab"]');
    const topBtn = actions.querySelector('[data-learning-action="top"]');
    const audioSection = document.querySelector('.note-audio-player');

    if (audioBtn && audioSection) {
      audioBtn.addEventListener('click', function() {
        audioSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    if (labBtn) {
      labBtn.addEventListener('click', function() {
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        labBtn.setAttribute('data-state', 'active');
        window.setTimeout(function() {
          labBtn.removeAttribute('data-state');
        }, 1200);
      });
    }

    if (topBtn) {
      topBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }
})();
