// Vercel Serverless Function
// Lives at: /api/diagnostic
// This keeps the Anthropic API key on the server, never exposed to the browser.
//
// SETUP REQUIRED before this works:
// 1. In your Vercel project settings, go to Settings -> Environment Variables
// 2. Add a new variable: ANTHROPIC_API_KEY = [your actual Anthropic API key]
// 3. Redeploy the site after adding it (Vercel does not pick up new env vars
//    on an already-running deployment, it needs a fresh deploy).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server is not configured correctly.' });
  }

  const { pillarName, pillarAnswers } = req.body || {};

  if (!pillarName || !pillarAnswers) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const prompt =
    "You are writing one single opening sentence for a personalised business diagnosis, in the voice of Chibuzor Mordi, known as The Income Architect. " +
    "Style rules: British English, active voice, short sentences, conversational and direct, no em dashes, no hashtags, no markdown formatting. " +
    "Never use these words: can, may, just, that, very, really, literally, actually, certainly, probably, basically, could, maybe. " +
    "The sentence must reference the person's specific answers below, not generic advice. It should read as an observant diagnosis, not a compliment or a judgement. Write one sentence only.\n\n" +
    "Their weakest area is: " + pillarName + ".\n" +
    "Their answers in this area were:\n" + pillarAnswers + "\n\n" +
    "Respond only with JSON in this exact format, no preamble, no markdown fences: {\"opening_line\": \"...\"}";

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    let openingLine = '';
    try {
      const textBlock = data.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('');
      const clean = textBlock.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      openingLine = parsed.opening_line || '';
    } catch (parseErr) {
      openingLine = '';
    }

    return res.status(200).json({ opening_line: openingLine });
  } catch (err) {
    return res.status(500).json({ error: 'Could not generate a response right now.', opening_line: '' });
  }
}
