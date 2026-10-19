/**
 * Enigma Junior — prototype scripts - VERSION 0.6
 *
 * v0.6 - MTT version support:
 * - Form fields switch by <body data-discipline> (cash / mtt)
 *
 * v0.5 - Rudolf feedback: promo/referral field, figure level names
 *
 * v0.4 - Feedback round 3:
 * - Coaches/cases carousels switched to arrows + swipe
 * - Program scroll more sensitive (40vh per slide)
 *
 * v0.3 - Feedback round 2:
 * - Horizontal card carousels (coaches, cases) driven by vertical scroll
 *
 * v0.2 - Feedback round 1:
 * - Generic scroll-driven carousel for program, coaches and cases
 * - Character figure levels synced with program steps
 *
 * v0.1 - Initial prototype:
 * - Apply form (modal + inline): validation, success state, UTM hidden fields
 * - Lead magnet form
 * - Sticky scroll "path by months" scene
 * - Reveal on scroll, mobile sticky CTA
 */

(function () {
  'use strict';

  // Placeholder: manager contact is not known yet
  const MANAGER_URL = '';
  const TG_CHANNEL_URL = 'https://t.me/enigmapoker';
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- UTM ----------
  const params = new URLSearchParams(location.search);
  const utm = {};
  UTM_KEYS.forEach((k) => { if (params.get(k)) utm[k] = params.get(k); });

  function utmInputs() {
    return UTM_KEYS.map((k) => `<input type="hidden" name="${k}" value="${escapeHtml(utm[k] || '')}">`).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Validation ----------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const validators = {
    name: (v) => v.trim().length >= 2 || 'Как к тебе обращаться?',
    contact: (v, form) => {
      const type = form.elements.messenger ? form.elements.messenger.value : 'telegram';
      const s = v.trim();
      if (!s) return 'Укажи контакт, чтобы мы могли написать';
      if (type === 'telegram' && !/^@?[a-zA-Z0-9_]{5,32}$/.test(s)) return 'Ник в Telegram: 5–32 символа, латиница, цифры, _';
      if (type === 'whatsapp' && s.replace(/\D/g, '').length < 10) return 'Номер с кодом страны, например +7 900 000 00 00';
      if (type === 'discord' && s.length < 2) return 'Укажи ник в Discord';
      return true;
    },
    email: (v) => EMAIL_RE.test(v.trim()) || 'Проверь email — это запасной канал, если в контакте опечатка',
    limit: (v) => !!v || 'Выбери текущий лимит или ABI',
  };

  function validateField(form, name) {
    const el = form.elements[name];
    if (!el || !validators[name]) return true;
    const res = validators[name](el.value, form);
    const field = el.closest('.field');
    const err = field && $('.err', field);
    if (res === true) {
      field && field.classList.remove('invalid');
      return true;
    }
    field && field.classList.add('invalid');
    if (err) err.textContent = res;
    return false;
  }

  function bindValidation(form, names) {
    names.forEach((n) => {
      const el = form.elements[n];
      if (!el) return;
      el.addEventListener('blur', () => { if (el.value) validateField(form, n); });
      el.addEventListener('input', () => {
        if (el.closest('.field').classList.contains('invalid')) validateField(form, n);
      });
    });
  }

  // ---------- Apply form ----------
  const CONTACT_PLACEHOLDER = { telegram: '@nickname', discord: 'nickname', whatsapp: '+7 900 000 00 00' };

  // Discipline-specific form fields: <body data-discipline="mtt"> switches to the MTT set
  const FORM_CONFIG = {
    cash: {
      title: 'Заявка в Enigma Junior',
      limitLabel: 'Текущий лимит',
      limits: ['NL2', 'NL5', 'NL10', 'NL16–NL25', 'Выше NL25', 'Играю MTT'],
      volumeLabel: 'Рук в месяц',
      volumes: ['до 10k', '10–30k', '30–60k', '60k+'],
    },
    mtt: {
      title: 'Заявка в Enigma Junior MTT',
      limitLabel: 'Текущий ABI',
      limits: ['до $2', '$2–5', '$5–11', '$11–22', 'Выше $22', 'Играю кэш'],
      volumeLabel: 'Турниров в месяц',
      volumes: ['до 300', '300–800', '800–1500', '1500+'],
    },
  };
  const FORM = FORM_CONFIG[document.body.dataset.discipline] || FORM_CONFIG.cash;
  const options = (list) => list.map((x) => `<option>${x}</option>`).join('');

  function applyFormHtml(inModal) {
    return `
      ${inModal ? '<button class="modal-close" type="button" data-close-modal aria-label="Закрыть">×</button>' : ''}
      <form novalidate>
        <h3>${FORM.title}</h3>
        <p class="hint">Менеджер напишет тебе в выбранный мессенджер</p>
        <div class="field">
          <label>Имя</label>
          <input class="input" name="name" autocomplete="given-name" placeholder="Как к тебе обращаться">
          <span class="err"></span>
        </div>
        <div class="field">
          <label>Мессенджер и контакт</label>
          <div class="field-row">
            <select class="select" name="messenger">
              <option value="telegram">Telegram</option>
              <option value="discord">Discord</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <input class="input" name="contact" placeholder="${CONTACT_PLACEHOLDER.telegram}" autocomplete="off">
          </div>
          <span class="err"></span>
        </div>
        <div class="field">
          <label>Email <span class="opt">— запасной канал связи</span></label>
          <input class="input" name="email" type="email" autocomplete="email" placeholder="you@mail.com">
          <span class="err"></span>
        </div>
        <div class="field-2">
          <div class="field">
            <label>${FORM.limitLabel}</label>
            <select class="select" name="limit">
              <option value="">Выбери</option>
              ${options(FORM.limits)}
            </select>
            <span class="err"></span>
          </div>
          <div class="field">
            <label>${FORM.volumeLabel} <span class="opt">(примерно)</span></label>
            <select class="select" name="volume">
              <option value="">Не знаю</option>
              ${options(FORM.volumes)}
            </select>
          </div>
        </div>
        <div class="field">
          <label>Откуда узнал о нас <span class="opt">(необязательно)</span></label>
          <select class="select" name="source">
            <option value="">—</option>
            <option>YouTube Enigma</option>
            <option>Telegram-канал</option>
            <option>Стрим / тренер</option>
            <option>Посоветовал друг</option>
            <option>Поиск / реклама</option>
            <option>Другое</option>
          </select>
        </div>
        <div class="field">
          <label>Промокод / реферальный код <span class="opt">(если есть)</span></label>
          <input class="input" name="promo" autocomplete="off" placeholder="Например, от стримера или друга">
        </div>
        ${utmInputs()}
        <button class="btn btn-primary btn-block" type="submit">Отправить заявку</button>
        <p class="form-foot">Нажимая кнопку, ты соглашаешься на обработку данных. <span class="ph">[ссылка на политику]</span></p>
      </form>`;
  }

  function applySuccessHtml(data, inModal) {
    const channel = data.messenger === 'telegram' ? 'Telegram' : data.messenger === 'discord' ? 'Discord' : 'WhatsApp';
    return `
      ${inModal ? '<button class="modal-close" type="button" data-close-modal aria-label="Закрыть">×</button>' : ''}
      <div class="success">
        <div class="check">✓</div>
        <h3>Заявка принята, ${escapeHtml(data.name.trim())}</h3>
        <p>Менеджер напишет в ${channel} (<span class="mono">${escapeHtml(data.contact.trim())}</span>) в течение <span class="ph">[N] часов</span>. Если в контакте опечатка — продублируем на ${escapeHtml(data.email.trim())}.</p>
        <div class="btns">
          <a class="btn btn-primary" href="#" data-manager>Написать менеджеру сейчас</a>
          <a class="btn btn-ghost" href="${TG_CHANNEL_URL}" target="_blank" rel="noopener">Пока ждёшь — Telegram-канал</a>
          <a class="btn btn-ghost" href="lead-magnet.html">Забрать префлоп-чарты</a>
        </div>
      </div>`;
  }

  function mountApplyForm(container) {
    const inModal = container.hasAttribute('data-in-modal');
    container.innerHTML = applyFormHtml(inModal);
    const form = $('form', container);
    bindValidation(form, ['name', 'contact', 'email', 'limit']);

    form.elements.messenger.addEventListener('change', (e) => {
      form.elements.contact.placeholder = CONTACT_PLACEHOLDER[e.target.value];
      if (form.elements.contact.value) validateField(form, 'contact');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = ['name', 'contact', 'email', 'limit'].map((n) => validateField(form, n)).every(Boolean);
      if (!ok) {
        const first = $('.field.invalid .input, .field.invalid .select', form);
        first && first.focus();
        return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      // Prototype: no backend. Production target — POST /back/joinRequest (→ Trello)
      console.info('[prototype] apply payload', data);
      container.innerHTML = applySuccessHtml(data, inModal);
    });
  }

  $$('[data-apply-form]').forEach(mountApplyForm);

  // ---------- Lead magnet form ----------
  function mountLeadForm(container) {
    const form = $('form', container);
    if (!form) return;
    const hidden = document.createElement('div');
    hidden.innerHTML = utmInputs();
    form.appendChild(hidden);
    bindValidation(form, ['name', 'channel']);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = ['name', 'channel'].map((n) => validateField(form, n)).every(Boolean);
      if (!ok) return;
      const data = Object.fromEntries(new FormData(form).entries());
      console.info('[prototype] lead magnet payload', data);
      $('[data-lead-success]', container).hidden = false;
      form.hidden = true;
    });
  }

  validators.channel = (v) => {
    const s = v.trim();
    if (!s) return 'Укажи Telegram или email';
    if (s.includes('@') && s.indexOf('@') > 0) return EMAIL_RE.test(s) || 'Проверь email';
    return /^@?[a-zA-Z0-9_]{5,32}$/.test(s) || 'Ник в Telegram (5–32 символа) или email';
  };

  $$('[data-lead-form]').forEach(mountLeadForm);

  // ---------- Modal ----------
  const modal = $('[data-modal]');
  let lastFocus = null;

  function openModal() {
    if (!modal) return;
    const box = $('[data-apply-form]', modal);
    if (!$('form', box)) mountApplyForm(box);
    lastFocus = document.activeElement;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = $('input[name="name"]', modal); f && f.focus(); }, 30);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-apply]')) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('[data-close-modal]')) { closeModal(); return; }
    if (modal && e.target === modal) { closeModal(); return; }
    const mgr = e.target.closest('[data-manager]');
    if (mgr) {
      if (MANAGER_URL) { mgr.href = MANAGER_URL; mgr.target = '_blank'; return; }
      e.preventDefault();
      alert('Прототип: здесь будет прямая ссылка на Telegram менеджера по заявкам.');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
  });

  // ---------- Scroll-driven carousels (program, coaches, cases) ----------
  const STEP_VH = 40; // scroll distance per slide, in vh
  const FIGURE_NAMES = ['Воин', 'Рыцарь', 'Паладин', 'Чемпион стола'];
  const header = $('.header');
  const setHeaderVar = () => document.documentElement.style.setProperty('--header-h', `${header ? header.offsetHeight : 0}px`);
  setHeaderVar();

  const scenes = $$('[data-scene]').map((scene) => {
    const buttons = $$('.scene-rail button', scene);
    const panels = $$('.scene-panel', scene);
    const progress = $('[data-scene-progress]', scene);
    const count = $('[data-scene-count]', scene);
    const figure = $('[data-figure]', scene);
    const figName = $('[data-figure-name]', scene);
    const figBar = $('[data-figure-bar]', scene);
    const n = panels.length;

    const spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.height = `${n * STEP_VH}vh`;
    scene.appendChild(spacer);

    let current = -1;
    const pad = (x) => String(x).padStart(2, '0');

    const setStep = (i) => {
      if (i === current) return;
      current = i;
      buttons.forEach((b, j) => {
        b.classList.toggle('active', j === i);
        b.classList.toggle('done', j < i);
      });
      panels.forEach((p, j) => {
        p.classList.toggle('active', j === i);
        p.classList.toggle('past', j < i);
      });
      scene.classList.toggle('is-last', i === n - 1);
      if (progress) progress.style.width = `${((i + 1) / n) * 100}%`;
      if (count) count.textContent = `${pad(i + 1)} / ${pad(n)}`;
      if (figure) {
        figure.dataset.level = String(i + 1);
        if (figName) figName.textContent = FIGURE_NAMES[i] || '';
        if (figBar) figBar.style.width = `${((i + 1) / n) * 100}%`;
      }
    };

    // Pinned range: from the moment sticky locks until the spacer is scrolled through
    const range = () => {
      const start = scene.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0);
      return { start, len: spacer.offsetHeight };
    };

    const update = () => {
      const { start, len } = range();
      const p = (window.scrollY - start) / len;
      setStep(Math.max(0, Math.min(n - 1, Math.floor(p * n))));
    };

    buttons.forEach((b, j) => b.addEventListener('click', () => {
      const { start, len } = range();
      window.scrollTo({ top: start + ((j + 0.5) / n) * len, behavior: 'smooth' });
    }));

    setStep(0);
    return update;
  });

  // Arrow carousels (coaches, cases): buttons + native swipe with scroll-snap
  $$('[data-carousel]').forEach((box) => {
    const track = $('[data-carousel-track]', box);
    const prev = $('[data-carousel-prev]', box);
    const next = $('[data-carousel-next]', box);
    const bar = $('[data-carousel-progress]', box);
    const count = $('[data-carousel-count]', box);
    const cards = Array.from(track.children);
    const pad = (x) => String(x).padStart(2, '0');

    const currentIndex = () => {
      const left = track.scrollLeft;
      let best = 0;
      cards.forEach((c, i) => {
        if (Math.abs(c.offsetLeft - cards[0].offsetLeft - left) < Math.abs(cards[best].offsetLeft - cards[0].offsetLeft - left)) best = i;
      });
      return best;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      prev.disabled = atStart;
      next.disabled = atEnd || max <= 0;
      const idx = atEnd ? cards.length - 1 : currentIndex();
      if (count) count.textContent = `${pad(idx + 1)} / ${pad(cards.length)}`;
      if (bar) bar.style.width = `${((idx + 1) / cards.length) * 100}%`;
    };

    const go = (dir) => {
      const idx = Math.max(0, Math.min(cards.length - 1, currentIndex() + dir));
      track.scrollTo({ left: cards[idx].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
    };

    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      scenes.forEach((u) => u());
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { setHeaderVar(); onScroll(); });
  onScroll();

  // ---------- Reveal on scroll ----------
  const revealIo = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealIo.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => revealIo.observe(el));

  // ---------- Mobile sticky CTA ----------
  const mobileCta = $('[data-mobile-cta]');
  const hero = $('.hero');
  const apply = $('#apply');
  if (mobileCta && hero) {
    let pastHero = false;
    let atApply = false;
    const update = () => mobileCta.classList.toggle('show', pastHero && !atApply);
    new IntersectionObserver(([en]) => { pastHero = !en.isIntersecting; update(); }).observe(hero);
    if (apply) new IntersectionObserver(([en]) => { atApply = en.isIntersecting; update(); }, { threshold: 0.2 }).observe(apply);
  }
})();
