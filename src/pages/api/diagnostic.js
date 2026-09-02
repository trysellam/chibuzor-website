// src/pages/api/diagnostic.js
// Astro API route. This replaces the old /api/diagnostic.js, which used
// Vercel's plain serverless-function format (req, res). Astro expects its
// own convention, an exported POST function that returns a Response.
//
// SETUP REQUIRED, same as before:
// Vercel project -> Settings -> Environment Variables -> ANTHROPIC_API_KEY

export async function POST({ request }) {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server is not configured correctly.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await request.json().catch(() => null);
  const { pillarName, pillarAnswers } = body || {};

  if (!pillarName || !pillarAnswers) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
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
        model: 'claude-sonnet-5',
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

    return new Response(
      JSON.stringify({ opening_line: openingLine }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Could not generate a response right now.', opening_line: '' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
