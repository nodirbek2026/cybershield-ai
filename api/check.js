export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, type } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  const prompt = type === 'link'
    ? `Siz kiberxavfsizlik mutaxassisisiz. Quyidagi URL havolani tahlil qiling va xavfsiz yoki xavfli ekanini aniqlang.

Havola: ${text}

Tahlil qiling:
1. Domen nomi shubhalimi?
2. Fishing yoki scam belgilari bormi?
3. Qisqartirilgan havola (bit.ly, tinyurl va h.k.) mi?
4. Soxta bank/davlat saytimi?

Javobni FAQAT quyidagi JSON formatda bering, boshqa hech narsa yozmang:
{"xavfli": true/false, "daraja": "xavfsiz/shubhali/xavfli", "sabab": "qisqa sabab o'zbek tilida", "maslahat": "nima qilish kerak o'zbek tilida"}`
    : `Siz kiberxavfsizlik mutaxassisisiz. Quyidagi xabarni tahlil qiling va fishing, scam yoki manipulyatsiya belgilarini aniqlang.

Xabar: ${text}

Tahlil qiling:
1. Psixologik bosim bor mi? ("tezda", "hoziroq", "faqat bugun")
2. Pul yoki sovg'a va'dasi bormi?
3. Shaxsiy ma'lumot so'rayaptimi?
4. Qo'rqitish yoki shoshiltirish bormi?

Javobni FAQAT quyidagi JSON formatda bering, boshqa hech narsa yozmang:
{"xavfli": true/false, "daraja": "xavfsiz/shubhali/xavfli", "sabab": "qisqa sabab o'zbek tilida", "maslahat": "nima qilish kerak o'zbek tilida"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw = data.content?.[0]?.text || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      xavfli: false,
      daraja: 'shubhali',
      sabab: 'Tahlil vaqtida xatolik yuz berdi.',
      maslahat: 'Ehtiyot bo\'ling va shaxsiy ma\'lumot bermang.'
    });
  }
}
