export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, type } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  const prompt = type === 'link'
    ? `Siz kiberxavfsizlik mutaxassisisiz. Quyidagi URL havolani tahlil qiling.

Havola: ${text}

Javobni FAQAT quyidagi JSON formatda bering, boshqa hech narsa yozmang:
{"xavfli": true, "daraja": "xavfli", "sabab": "sabab shu yerda", "maslahat": "maslahat shu yerda"}

Misol javob:
{"xavfli": false, "daraja": "xavfsiz", "sabab": "Havola ishonchli ko'rinadi, shubhali belgilar yo'q.", "maslahat": "Baribir shaxsiy ma'lumotlaringizni baham ko'rmang."}`
    : `Siz kiberxavfsizlik mutaxassisisiz. Quyidagi xabarni tahlil qiling.

Xabar: ${text}

Javobni FAQAT quyidagi JSON formatda bering, boshqa hech narsa yozmang:
{"xavfli": true, "daraja": "xavfli", "sabab": "sabab shu yerda", "maslahat": "maslahat shu yerda"}

Misol javob:
{"xavfli": true, "daraja": "xavfli", "sabab": "Bu xabar scam belgilarini o'z ichiga oladi.", "maslahat": "Hech qanday ma'lumot bermang va havolani ochmang."}`;

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
    
    // API xatosi bo'lsa
    if (data.error) {
      return res.status(200).json({
        xavfli: false,
        daraja: 'shubhali',
        sabab: 'AI tahlil qila olmadi: ' + (data.error.message || 'noma\'lum xato'),
        maslahat: 'Ehtiyot bo\'ling va shaxsiy ma\'lumotlaringizni baham ko\'rmang.'
      });
    }

    const raw = (data.content && data.content[0] && data.content[0].text) ? data.content[0].text : '';
    
    if (!raw) {
      return res.status(200).json({
        xavfli: false,
        daraja: 'shubhali',
        sabab: 'AI javob bermadi.',
        maslahat: 'Ehtiyot bo\'ling va shaxsiy ma\'lumotlaringizni baham ko\'rmang.'
      });
    }

    // JSON ni topib olish
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({
        xavfli: false,
        daraja: 'shubhali', 
        sabab: 'Natija aniqlanmadi.',
        maslahat: 'Ehtiyot bo\'ling.'
      });
    }

    const result = JSON.parse(jsonMatch[0]);
    
    // Maydonlar borligini tekshirish
    return res.status(200).json({
      xavfli: result.xavfli || false,
      daraja: result.daraja || 'shubhali',
      sabab: result.sabab || 'Tahlil qilindi.',
      maslahat: result.maslahat || 'Ehtiyot bo\'ling.'
    });

  } catch (err) {
    return res.status(200).json({
      xavfli: false,
      daraja: 'shubhali',
      sabab: 'Texnik xatolik yuz berdi.',
      maslahat: 'Ehtiyot bo\'ling va shaxsiy ma\'lumotlaringizni baham ko\'rmang.'
    });
  }
}
