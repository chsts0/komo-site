(() => {
  const header = document.querySelector('.header');
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  // Шапка темнеет после первого экрана
  const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Бургер-меню
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Кнопки услуг сразу отмечают услугу в анкете
  document.querySelectorAll('[data-service]').forEach((el) => {
    el.addEventListener('click', () => {
      const box = document.querySelector(`#brief input[name="need"][value="${el.dataset.service}"]`);
      if (box) box.checked = true;
    });
  });

  // Фильтр кейсов
  const chips = document.querySelectorAll('.filter .chip');
  const allCases = document.querySelectorAll('#cases .case');
  const grid = document.getElementById('casesGrid');
  const more = document.getElementById('casesMore');
  const empty = document.querySelector('.cases__empty');
  const mobile = window.matchMedia('(max-width: 860px)');
  let expanded = false;

  // Можно выбрать несколько направлений: показываем кейсы, где есть хотя бы одно из них.
  // «Все» сбрасывает выбор, а если снять все направления, снова включается «Все».
  const selected = new Set();

  const applyFilter = () => {
    const limit = mobile.matches ? 2 : 3;
    let shown = 0;
    let gridShown = 0;
    allCases.forEach((c) => {
      const ok = !selected.size || c.dataset.tags.split(' ').some((t) => selected.has(t));
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

  // В вопросах открыт только один ответ. Новые браузеры делают это сами по name у details,
  // для старых закрываем остальные вручную.
  const faq = document.querySelectorAll('details[name="faq"]');
  faq.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) faq.forEach((o) => { if (o !== d) o.open = false; });
  }));

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
        form.querySelectorAll('.field--other').forEach((f) => { f.hidden = true; });
        status.textContent = 'Спасибо! Анкета у нас, скоро свяжемся.';
      } catch (err) {
        status.textContent = 'Не получилось отправить. Напишите нам в Telegram @komo_consulting или на komoconsalting@yandex.ru.';
        status.classList.add('is-err');
      } finally {
        btn.disabled = false;
      }
    });
  });
})();
