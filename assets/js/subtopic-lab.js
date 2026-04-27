(function setupSubtopicLearningLab() {
  const root = document.querySelector('[data-quiz-id]');
  if (!root) return;

  const quizId = root.getAttribute('data-quiz-id');

  const LEVEL_LABELS = { 1: 'Mengingat', 2: 'Memahami', 3: 'Mengaplikasi', 4: 'Menganalisis', 5: 'Menilai' };
  const LEVEL_COLORS = { 1: '#3e5f8a', 2: '#2f7a67', 3: '#8a7158', 4: '#6a7b5a', 5: '#9a5a5a' };

  const screens = {
    game:   root.querySelector('[data-lab-screen="game"]'),
    result: root.querySelector('[data-lab-screen="result"]'),
  };

  const progressEl   = root.querySelector('[data-lab-progress]');
  const progressFill = root.querySelector('[data-lab-progress-fill]');
  const typeEl       = root.querySelector('[data-lab-type]');
  const levelEl      = root.querySelector('[data-lab-level]');
  const promptEl     = root.querySelector('[data-lab-prompt]');
  const helpEl       = root.querySelector('[data-lab-help]');
  const optionsEl    = root.querySelector('[data-lab-options]');
  const feedbackWrap  = root.querySelector('[data-lab-feedback-wrap]');
  const feedbackBox   = root.querySelector('[data-lab-feedback-box]');
  const feedbackTitle = root.querySelector('[data-lab-feedback-title]');
  const feedbackText  = root.querySelector('[data-lab-feedback-text]');
  const tipEl         = root.querySelector('[data-lab-tip]');
  const summaryList   = root.querySelector('[data-lab-summary-list]');
  const resultBox     = root.querySelector('[data-lab-result-box]');
  const resultTitle   = root.querySelector('[data-lab-result-title]');
  const resultText    = root.querySelector('[data-lab-result-text]');
  const bestScoreEl   = root.querySelector('[data-lab-best-score]');
  const checkBtn      = root.querySelector('[data-lab-action="check"]');
  const nextBtn       = root.querySelector('[data-lab-action="next"]');

  const state = {
    questions: [],
    qIndex: 0,
    score: 0,
    history: [],
    locked: false,
    selected: null,
  };

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  function getBestScore(id) {
    return parseInt(localStorage.getItem('zymnotes-quiz-best-' + id) || '0', 10);
  }

  function saveBestScore(id, score) {
    if (score > getBestScore(id)) localStorage.setItem('zymnotes-quiz-best-' + id, score);
  }

  function buildQuestionSet(allQuestions) {
    const byLevel = {};
    allQuestions.forEach(function(q) {
      if (!byLevel[q.level]) byLevel[q.level] = [];
      byLevel[q.level].push(q);
    });
    const set = [];
    [1, 2, 3, 4, 5].forEach(function(level) {
      const pool = byLevel[level] || [];
      if (!pool.length) return;
      const picked = pool[Math.floor(Math.random() * pool.length)];
      set.push(Object.assign({}, picked, { shuffledOptions: shuffle(picked.options) }));
    });
    return set;
  }

  function switchScreen(name) {
    Object.keys(screens).forEach(function(key) {
      if (screens[key]) screens[key].classList.toggle('is-hidden', key !== name);
    });
  }

  function currentQuestion() {
    return state.questions[state.qIndex];
  }

  function renderProgress() {
    const total   = state.questions.length;
    const current = state.qIndex + 1;
    if (progressEl)   progressEl.textContent = 'Soalan ' + current + ' / ' + total;
    if (progressFill) progressFill.style.width = (((current - 1) / total) * 100) + '%';
  }

  function updateCheckButtonState() {
    if (!checkBtn) return;
    checkBtn.classList.toggle('is-disabled', state.locked || !state.selected);
  }

  function resetInteractionState() {
    state.selected = null;
    state.locked   = false;
    if (feedbackWrap) {
      feedbackWrap.classList.add('is-hidden');
    }
    if (feedbackBox) feedbackBox.classList.remove('is-wrong');
    if (checkBtn)    checkBtn.classList.remove('is-disabled');
  }

  function renderOptions() {
    const q = currentQuestion();
    if (!q || !optionsEl) return;

    optionsEl.innerHTML = q.shuffledOptions.map(function(option) {
      const isPicked = state.selected === option;
      let cls = 'learning-lab-option';

      if (state.locked) {
        if (option === q.answer)            cls += ' is-correct';
        else if (state.selected === option) cls += ' is-wrong';
        else                                cls += ' is-muted';
      } else if (isPicked) {
        cls += ' is-active';
      }

      const icon = state.locked
        ? (option === q.answer ? '✅' : state.selected === option ? '❌' : '•')
        : (isPicked ? '▶' : '▸');

      return '<button class="' + cls + '" type="button" data-option="' +
        option.replace(/"/g, '&quot;') + '">' +
        '<span class="learning-lab-option-inner">' +
        '<span>' + icon + '</span><span>' + option + '</span>' +
        '</span></button>';
    }).join('');

    if (!state.locked) {
      optionsEl.querySelectorAll('[data-option]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          state.selected = btn.getAttribute('data-option');
          renderOptions();
          updateCheckButtonState();
        });
      });
    }
  }

  function renderQuestion() {
    const q = currentQuestion();
    if (!q) return;

    renderProgress();

    if (typeEl) {
      /* Nama jenis soalan: lalai objektif; boleh set per soalan dalam JSON (cth. "Objektif", "Benar / Palsu") */
      typeEl.textContent      = q.type && String(q.type).trim() ? String(q.type).trim() : 'Objektif';
      typeEl.style.color      = '#3e5f8a';
      typeEl.style.background = 'rgba(62,95,138,0.1)';
    }

    if (levelEl) {
      const color = LEVEL_COLORS[q.level];
      levelEl.textContent      = 'Aras ' + q.level + ' · ' + LEVEL_LABELS[q.level];
      levelEl.style.color      = color;
      levelEl.style.background = color + '18';
    }

    if (promptEl) promptEl.textContent = q.prompt;
    if (helpEl)   helpEl.textContent   = q.help || 'Pilih jawapan yang paling sesuai — tiada tekanan masa, ambil masa berfikir.';

    renderOptions();
    updateCheckButtonState();
  }

  function renderFeedback(ok) {
    const q = currentQuestion();
    if (!feedbackWrap) return;

    feedbackWrap.classList.remove('is-hidden');

    if (feedbackBox) feedbackBox.classList.toggle('is-wrong', !ok);

    if (feedbackTitle) {
      feedbackTitle.textContent = ok ? '🎉 Betul!' : '😔 Belum tepat.';
      feedbackTitle.style.color = ok ? '#2f7a67' : '#9a5a5a';
    }

    if (feedbackText) feedbackText.textContent = q.explanation;
    if (tipEl)        tipEl.textContent = q.tip;

    if (nextBtn) {
      nextBtn.textContent = state.qIndex + 1 < state.questions.length
        ? 'Soalan Seterusnya →'
        : 'Lihat Keputusan →';
    }
  }

  function submitAnswer() {
    if (state.locked || !state.selected) return;
    const q  = currentQuestion();
    const ok = state.selected === q.answer;

    state.locked = true;
    if (ok) state.score++;
    state.history.push({ question: q, ok: ok });

    if (progressFill) {
      progressFill.style.width = (((state.qIndex + 1) / state.questions.length) * 100) + '%';
    }

    renderOptions();
    updateCheckButtonState();
    renderFeedback(ok);
  }

  function nextQuestion() {
    state.qIndex++;
    if (state.qIndex >= state.questions.length) {
      renderResult();
      switchScreen('result');
      return;
    }
    resetInteractionState();
    renderQuestion();
  }

  function renderResult() {
    const total    = state.questions.length;
    const score    = state.score;
    const prevBest = getBestScore(quizId);
    const isRecord = score > prevBest;

    saveBestScore(quizId, score);
    const newBest = isRecord ? score : prevBest;

    let title, titleColor, bg, border;
    if (score === total) {
      title = 'Cemerlang! Skor penuh! 🏆';
      titleColor = '#2f7a67'; bg = 'rgba(47,122,103,0.07)'; border = 'rgba(47,122,103,0.16)';
    } else if (score >= 4) {
      title = 'Bagus! Hampir sempurna 🎖️';
      titleColor = '#3e5f8a'; bg = 'rgba(62,95,138,0.07)'; border = 'rgba(62,95,138,0.16)';
    } else if (score >= 3) {
      title = 'Baik! Teruskan ulang kaji 📚';
      titleColor = '#8a7158'; bg = 'rgba(138,113,88,0.07)'; border = 'rgba(138,113,88,0.16)';
    } else {
      title = 'Semak semula nota dan cuba lagi 💪';
      titleColor = '#9a5a5a'; bg = 'rgba(154,90,90,0.07)'; border = 'rgba(154,90,90,0.16)';
    }

    if (resultBox)   { resultBox.style.background = bg; resultBox.style.borderColor = border; }
    if (resultTitle) { resultTitle.textContent = title; resultTitle.style.color = titleColor; }
    if (resultText)  resultText.textContent = score + ' / ' + total + ' soalan betul (' + Math.round(score / total * 100) + '%)';

    if (bestScoreEl) {
      bestScoreEl.textContent = 'Rekod terbaik: ' + newBest + ' / ' + total + (isRecord ? ' 🎉 Rekod Baru!' : '');
      bestScoreEl.style.color = '';
      bestScoreEl.classList.toggle('is-record', isRecord);
    }

    if (progressFill) progressFill.style.width = '100%';
    if (progressEl)   progressEl.textContent = 'Selesai!';

    if (summaryList) {
      summaryList.innerHTML = state.history.map(function(item, i) {
        const color = LEVEL_COLORS[item.question.level];
        const label = LEVEL_LABELS[item.question.level];
        return '<div class="learning-lab-summary-item">' +
          '<div class="learning-lab-summary-left">' +
          '<span class="learning-lab-summary-dot" style="background:' + color + ';"></span>' +
          '<span class="learning-lab-summary-qnum">Soalan ' + (i + 1) + '</span>' +
          '<span class="learning-lab-summary-level" data-level="' + item.question.level + '">Aras ' + item.question.level + ' · ' + label + '</span>' +
          '</div>' +
          '<span class="learning-lab-summary-right' + (item.ok ? ' is-correct' : ' is-wrong') + '">' +
          (item.ok ? '✓ Betul' : '✗ Salah') + '</span></div>';
      }).join('');

      const wrong = state.history.filter(function(item) { return !item.ok; });
      if (wrong.length) {
        summaryList.innerHTML += '<div class="learning-lab-tip" style="margin-top:0.55rem;">' +
          '<p class="learning-lab-tip-label">📖 Perkara yang patut ulang kaji</p>' +
          wrong.map(function(item) {
            return '<p class="learning-lab-tip-text" style="margin:0 0 0.22rem;">• ' + item.question.tip + '</p>';
          }).join('') + '</div>';
      }
    }
  }

  function startGame(allQuestions) {
    state.questions = buildQuestionSet(allQuestions);
    state.qIndex    = 0;
    state.score     = 0;
    state.history   = [];
    resetInteractionState();
    renderQuestion();
    switchScreen('game');
  }

  // Mark notice button as loading until questions are ready
  var noticeBtn = document.getElementById('lab-notice-start');
  if (noticeBtn) {
    noticeBtn.disabled    = true;
    noticeBtn.textContent = 'Memuatkan...';
  }

  fetch('/data/quiz/' + quizId + '.json')
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      var allQuestions = data.questions;

      // Ready — expose global start hook and enable notice button
      window.__labStartQuiz = function() { startGame(allQuestions); };

      if (noticeBtn) {
        noticeBtn.disabled    = false;
        noticeBtn.textContent = 'Mulakan Kuiz 🧩';
      }

      root.querySelector('[data-lab-action="restart"]').addEventListener('click', function() {
        startGame(allQuestions);
      });

      if (checkBtn) checkBtn.addEventListener('click', submitAnswer);
      if (nextBtn)  nextBtn.addEventListener('click', nextQuestion);

      // Show best score on notice screen if exists
      var best = getBestScore(quizId);
      if (best > 0) {
        var bestEl = document.getElementById('lab-notice-best');
        if (bestEl) {
          bestEl.textContent = 'Rekod terbaik anda: ' + best + ' / 5';
          bestEl.style.display = 'flex';
        }
      }
    })
    .catch(function(err) {
      if (noticeBtn) {
        noticeBtn.disabled    = false;
        noticeBtn.textContent = '⚠️ Gagal memuatkan — cuba semula';
      }
      console.error('Gagal memuatkan soalan:', err);
    });

  const actions = document.querySelector('[data-learning-actions]');
  if (actions) {
    var labBtn = actions.querySelector('[data-learning-action="lab"]');
    var topBtn = actions.querySelector('[data-learning-action="top"]');
    if (labBtn) {
      labBtn.addEventListener('click', function() {
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
        labBtn.setAttribute('data-state', 'active');
        window.setTimeout(function() { labBtn.removeAttribute('data-state'); }, 1200);
      });
    }
    if (topBtn) {
      topBtn.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
  }
})();
