(() => {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  // Бургер-меню
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Плавная прокрутка колесом и тачпадом. На телефонах свайп остаётся родным,
  // а Lenis только плавно возит к якорям. Своя анимация не зависит от настройки
  // «уменьшить движение» в системе, из-за которой браузер прыгал к блокам рывком
  const lenis = window.Lenis ? new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 }) : null;
  if (lenis) {
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToEl = (el) => {
    if (lenis) lenis.scrollTo(el, { duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Якорные ссылки: плавно едем к блоку, но не оставляем #блок в адресной строке
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || e.defaultPrevented) return;
    const id = link.getAttribute('href').slice(1);
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollToEl(target);
  });

  // Кнопки услуг сразу отмечают услугу в анкете
  const pickService = (value) => {
    const box = document.querySelector(`#brief input[name="need"][value="${value}"]`);
    if (box) box.checked = true;
    return box;
  };
  document.querySelectorAll('[data-service]').forEach((el) => {
    el.addEventListener('click', () => pickService(el.dataset.service));
  });

  // Пришли со страницы услуги (/?service=design) или по ссылке вида /#cases:
  // отмечаем услугу, едем к нужному блоку и чистим адресную строку
  const SERVICES = { design: 'Дизайн', project: 'Проектирование', build: 'Строительно-монтажные работы', supply: 'Снабжение', support: 'Сопровождение', turnkey: 'Под ключ' };
  const fromService = SERVICES[new URLSearchParams(location.search).get('service')];
  const landing = fromService && pickService(fromService) ? 'brief' : location.hash.slice(1);
  if (location.hash || location.search) history.replaceState(null, '', location.pathname);
  const landOn = document.getElementById(landing);
  if (landOn) {
    landOn.scrollIntoView({ behavior: 'instant', block: 'start' });
    window.addEventListener('load', () => landOn.scrollIntoView({ behavior: 'instant', block: 'start' }), { once: true });
  }

  // Фильтр кейсов (есть только на главной)
  if (document.getElementById('casesGrid')) {
    const chips = document.querySelectorAll('.filter .chip');
    const allCases = document.querySelectorAll('#cases .case');
    const grid = document.getElementById('casesGrid');
    const more = document.getElementById('casesMore');
    const empty = document.querySelector('.cases__empty');
    const mobile = window.matchMedia('(max-width: 860px)');
    let expanded = false;

    // Можно выбрать несколько направлений: показываем кейсы, у которых есть все выбранные.
    // «Все» сбрасывает выбор, а если снять все направления, снова включается «Все».
    const selected = new Set();

    const applyFilter = () => {
      const limit = mobile.matches ? 2 : 3;
      let shown = 0;
      let gridShown = 0;
      allCases.forEach((c) => {
        const ok = !selected.size || [...selected].every((t) => c.dataset.tags.split(' ').includes(t));
        c.hidden = !ok;
        if (ok) shown++;
        if (c.parentElement === grid) {
          c.classList.toggle('is-extra', ok && gridShown >= limit);
          if (ok) gridShown++;
        }
      });
      empty.hidden = shown > 0;
      const hasExtra = gridShown > limit;
      grid.classList.toggle('is-collapsed', hasExtra && !expanded);
      more.hidden = !hasExtra || expanded;
    };

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const tag = chip.dataset.filter;
        if (tag === 'all') selected.clear();
        else if (selected.has(tag)) selected.delete(tag);
        else selected.add(tag);
        chips.forEach((c) => {
          const on = c.dataset.filter === 'all' ? !selected.size : selected.has(c.dataset.filter);
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', String(on));
        });
        expanded = false;
        applyFilter();
      });
    });
    more.addEventListener('click', () => { expanded = true; applyFilter(); });
    mobile.addEventListener('change', applyFilter);
    applyFilter();
  }

  // Вопросы: открыт только один ответ, открытие и закрытие плавные
  const faq = document.querySelectorAll('.acc details');
  const slide = (d, open) => {
    const body = d.querySelector('.acc__body');
    body.getAnimations().forEach((a) => a.cancel());
    if (open) d.open = true;
    const h = body.scrollHeight;
    const anim = body.animate(
      open ? [{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }]
           : [{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: open ? 320 : 240, easing: 'cubic-bezier(.4, 0, .2, 1)' },
    );
    if (!open) anim.onfinish = () => { d.open = false; };
  };
  faq.forEach((d) => {
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      faq.forEach((o) => { if (o !== d && o.classList.contains('is-open')) { o.classList.remove('is-open'); slide(o, false); } });
      const willOpen = !d.classList.contains('is-open');
      d.classList.toggle('is-open', willOpen);
      slide(d, willOpen);
    });
    d.classList.toggle('is-open', d.open);
  });

  // Поле «Другое» в анкете
  document.querySelectorAll('input[data-other]').forEach((box) => {
    const field = box.closest('fieldset').querySelector('.field--other');
    box.addEventListener('change', () => {
      field.hidden = !box.checked;
      if (box.checked) field.querySelector('input').focus();
    });
  });

  // Отправка анкет
  document.querySelectorAll('form.form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = form.querySelector('.form__status');
      const btn = form.querySelector('button[type="submit"]');
      status.classList.remove('is-err');

      let valid = true;
      form.querySelectorAll('[required]').forEach((input) => {
        const bad = !input.value.trim();
        input.closest('.field').classList.toggle('is-err', bad);
        if (bad) valid = false;
      });
      if (!valid) {
        status.textContent = 'Заполните имя и контакт, чтобы мы могли ответить.';
        status.classList.add('is-err');
        return;
      }

      const data = { kind: form.dataset.kind };
      new FormData(form).forEach((value, key) => {
        if (data[key]) data[key] = [].concat(data[key], value);
        else data[key] = value;
      });

      btn.disabled = true;
      status.textContent = 'Отправляем…';
      try {
        const res = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(String(res.status));
        form.reset();
        location.href = form.dataset.kind === 'job' ? '/thanks-job' : '/thanks';
      } catch (err) {
        status.textContent = 'Не получилось отправить. Напишите нам в Telegram @komo_consulting или на komoconsalting@yandex.ru.';
        status.classList.add('is-err');
        btn.disabled = false;
      }
    });
  });
})();
