/**
 * Enigma Junior — level quiz (prototype B) - VERSION 0.2
 *
 * v0.2 - «Пока рано» result leads to Enigma Start (course of basics)
 *
 * v0.1 - Initial quiz:
 * - 5 placeholder knowledge questions + 2 profile questions
 * - Result routing: early / junior / junior fast track / main fund
 * - Answer review as value before application, prefill of the apply form
 */

(function () {
  'use strict';

  // Placeholder questions — real ones come from the methodologist
  const KNOWLEDGE = [
    {
      q: 'Сколько игроков максимум сидит за столом 6-max?',
      options: ['6', '9', '2'],
      correct: 0,
      why: '6-max — до шести игроков за столом.',
    },
    {
      q: 'Что такое ауты?',
      options: ['Карты, которые улучшат твою руку', 'Карты, которые ушли в сброс', 'Игроки, выбывшие из раздачи'],
      correct: 0,
      why: 'Ауты — оставшиеся в колоде карты, которые сделают твою руку сильнее.',
    },
    {
      q: 'В банке 100, оппонент ставит 50. Сколько эквити нужно для колла?',
      options: ['25%', '50%', '10%'],
      correct: 0,
      why: 'Ты коллируешь 50, чтобы выиграть банк 200: 50 / 200 = 25%.',
    },
    {
      q: 'Какая позиция действует последней на постфлопе?',
      options: ['Баттон', 'Малый блайнд', 'UTG'],
      correct: 0,
      why: 'Баттон ходит последним на флопе, тёрне и ривере — это главное преимущество позиции.',
    },
    {
      q: 'Что показывает стат VPIP?',
      options: ['Как часто игрок добровольно вкладывает деньги в банк до флопа', 'Процент выигранных раздач', 'Средний размер ставки'],
      correct: 0,
      why: 'VPIP — доля раздач, в которых игрок сам положил деньги в банк префлоп.',
    },
  ];

  const PROFILE = [
    {
      key: 'limit',
      q: 'Какой лимит играешь сейчас?',
      options: ['NL2', 'NL5', 'NL10', 'NL16–NL25', 'Выше NL25', 'Пока не играю на деньги'],
    },
    {
      key: 'volume',
      q: 'Сколько рук играешь в месяц?',
      options: ['до 10k', '10–30k', '30–60k', '60k+'],
    },
  ];

  const LOW_LIMITS = ['NL2', 'NL5', 'NL10'];
  const HIGH_LIMITS = ['NL16–NL25', 'Выше NL25'];

  const root = document.querySelector('[data-quiz]');
  if (!root) return;

  const steps = KNOWLEDGE.length + PROFILE.length;
  let step = 0;
  const answers = [];
  const profile = {};

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Shuffle options once per question so the correct answer is not always first
  const order = KNOWLEDGE.map((k) => k.options.map((_, i) => i).sort(() => Math.random() - 0.5));

  function renderQuestion() {
    const isKnowledge = step < KNOWLEDGE.length;
    const item = isKnowledge ? KNOWLEDGE[step] : PROFILE[step - KNOWLEDGE.length];
    const opts = isKnowledge ? order[step].map((i) => ({ i, text: item.options[i] })) : item.options.map((text, i) => ({ i, text }));
    root.innerHTML = `
      <div class="quiz-top">
        <span class="mono">${isKnowledge ? 'Вопрос' : 'О тебе'} ${step + 1} / ${steps}</span>
        ${step > 0 ? '<button class="quiz-back" type="button" data-quiz-back>← Назад</button>' : ''}
      </div>
      <div class="quiz-bar"><i style="width:${(step / steps) * 100}%"></i></div>
      <h3 class="quiz-q">${esc(item.q)}</h3>
      <div class="quiz-options">
        ${opts.map((o) => `<button class="quiz-opt" type="button" data-opt="${o.i}">${esc(o.text)}</button>`).join('')}
      </div>`;
  }

  function score() {
    return answers.reduce((s, a, i) => s + (a === KNOWLEDGE[i].correct ? 1 : 0), 0);
  }

  function route(sc) {
    if (sc <= 1 || profile.limit === 'Пока не играю на деньги') return 'early';
    if (sc === KNOWLEDGE.length && HIGH_LIMITS.includes(profile.limit)) return 'main';
    if (sc === KNOWLEDGE.length && LOW_LIMITS.includes(profile.limit)) return 'fast';
    return 'junior';
  }

  const RESULTS = {
    early: {
      tag: 'Пока рано',
      title: 'Начни с базы — вот с чего лучше стартовать',
      text: 'Программа Junior рассчитана на тех, кто уже играет и знает основы. Начни с Enigma Start — курса азов: лучших по финальному тесту зовём на отбор в Junior.',
      primary: { label: 'Курс азов Enigma Start', href: '../start/' },
      secondary: { label: 'Всё равно подать заявку', apply: true },
      extra: { label: 'Забрать префлоп-чарты', href: '../lead-magnet.html' },
    },
    junior: {
      tag: 'Тебе подходит Junior',
      title: 'Твой путь: NL5 → NL25 за ~3 месяца',
      text: 'База у тебя есть, программа закроет пробелы и выстроит систему. Начнёшь с уровня 1 вместе с группой.',
      primary: { label: 'Подать заявку', apply: true },
      secondary: { label: 'Посмотреть программу', href: '#program' },
    },
    fast: {
      tag: 'Тебе подходит Junior · быстрый темп',
      title: 'Базу знаешь — пройдёшь программу быстрее',
      text: 'Теория у тебя крепкая. Скорее всего, первый уровень пролетишь быстро и сосредоточишься на постфлопе и диапазонах.',
      primary: { label: 'Подать заявку', apply: true },
      secondary: { label: 'Посмотреть программу', href: '#program' },
    },
    main: {
      tag: 'Похоже, тебе в основу',
      title: 'С твоим уровнем стоит подаваться сразу в основной состав',
      text: 'Знания и лимит выше уровня Junior. Подай заявку в основу фонда — там бэкинг и тренер основы.',
      primary: { label: 'Заявка в основу фонда', href: 'https://enigmapoker.pro', external: true },
      secondary: { label: 'Всё равно в Junior', apply: true },
    },
  };

  function btn(b, cls) {
    if (b.apply) return `<button class="btn ${cls}" type="button" data-open-apply data-quiz-apply>${esc(b.label)}</button>`;
    return `<a class="btn ${cls}" href="${b.href}"${b.external ? ' target="_blank" rel="noopener"' : ''}>${esc(b.label)}</a>`;
  }

  function renderResult() {
    const sc = score();
    const r = Object.assign({}, RESULTS[route(sc)]);
    if (route(sc) === 'junior' && LOW_LIMITS.includes(profile.limit)) r.title = `Твой путь: ${profile.limit} → NL25 за ~3 месяца`;
    const review = KNOWLEDGE.map((k, i) => {
      const ok = answers[i] === k.correct;
      return `<li class="${ok ? 'ok' : 'miss'}"><span class="mark">${ok ? '✓' : '✗'}</span><span><b>${esc(k.q)}</b><br>${ok ? '' : `Правильно: ${esc(k.options[k.correct])}. `}${esc(k.why)}</span></li>`;
    }).join('');
    root.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-score mono">${sc} / ${KNOWLEDGE.length}</div>
        <div class="eyebrow" style="margin:0">${esc(r.tag)}</div>
        <h3>${esc(r.title)}</h3>
        <p class="muted">${esc(r.text)}</p>
        <div class="quiz-cta">
          ${btn(r.primary, 'btn-primary')}
          ${btn(r.secondary, 'btn-ghost')}
          ${r.extra ? btn(r.extra, 'btn-ghost') : ''}
        </div>
        <details class="quiz-review">
          <summary>Разбор ответов</summary>
          <ul>${review}</ul>
        </details>
        <button class="quiz-back" type="button" data-quiz-restart>Пройти заново</button>
      </div>`;
  }

  // Prefill the apply form (rendered by main.js inside the modal) with quiz data
  function prefillApply() {
    setTimeout(() => {
      const form = document.querySelector('[data-modal] form');
      if (!form) return;
      const map = { 'Пока не играю на деньги': '' };
      const lim = profile.limit in map ? map[profile.limit] : profile.limit;
      if (form.elements.limit && lim !== undefined) form.elements.limit.value = lim;
      if (form.elements.volume && profile.volume) form.elements.volume.value = profile.volume;
      if (!form.elements.quiz_score) {
        const h = document.createElement('input');
        h.type = 'hidden';
        h.name = 'quiz_score';
        form.appendChild(h);
      }
      form.elements.quiz_score.value = `${score()}/${KNOWLEDGE.length}`;
    }, 60);
  }

  root.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const i = Number(opt.dataset.opt);
      if (step < KNOWLEDGE.length) answers[step] = i;
      else profile[PROFILE[step - KNOWLEDGE.length].key] = PROFILE[step - KNOWLEDGE.length].options[i];
      opt.classList.add('picked');
      setTimeout(() => {
        step += 1;
        if (step < steps) renderQuestion();
        else renderResult();
      }, 180);
      return;
    }
    if (e.target.closest('[data-quiz-back]')) { step = Math.max(0, step - 1); renderQuestion(); return; }
    if (e.target.closest('[data-quiz-restart]')) { step = 0; answers.length = 0; renderQuestion(); return; }
    if (e.target.closest('[data-quiz-apply]')) prefillApply();
  });

  renderQuestion();
})();
