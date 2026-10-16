// Vercel Serverless Function: принимает анкету с сайта и пересылает её в Telegram.
// Нужны переменные окружения в Vercel: TG_BOT_TOKEN и TG_CHAT_ID.

const LABELS = {
  client: {
    title: 'Новая анкета заказчика',
    fields: [
      ['name', 'Имя'], ['contact', 'Контакт'], ['object', 'Что открывает'],
      ['area', 'Площадь, м²'], ['address', 'Адрес'], ['stage', 'Стадия'],
      ['need', 'Что требуется'], ['need_other', 'Другое'],
      ['budget', 'Бюджет'], ['deadline', 'Сроки открытия'],
    ],
  },
  job: {
    title: 'Новая анкета соискателя',
    fields: [
      ['name', 'Имя'], ['contact', 'Контакт'], ['role', 'Кем хочет работать'],
      ['city', 'Город'], ['experience', 'Опыт, лет'], ['cv', 'Резюме'], ['about', 'О себе'],
    ],
  },
};

const escape = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const clip = (s, n = 1000) => (s.length > n ? s.slice(0, n) + '…' : s);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false });

  // Ловушка для ботов: настоящий человек это поле не видит
  if (body.website) return res.status(200).json({ ok: true });

  const form = LABELS[body.kind];
  if (!form) return res.status(400).json({ ok: false });
  if (!String(body.name || '').trim() || !String(body.contact || '').trim()) {
    return res.status(400).json({ ok: false, error: 'name and contact are required' });
  }

  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;
  if (!token || !chatId) return res.status(500).json({ ok: false, error: 'not configured' });

  const lines = [`<b>${form.title}</b>`];
  for (const [key, label] of form.fields) {
    const raw = body[key];
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw || '').trim();
    if (value) lines.push(`<b>${label}:</b> ${escape(clip(value))}`);
  }

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!tg.ok) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false });
  }
};
