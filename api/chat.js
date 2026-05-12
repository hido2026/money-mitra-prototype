import Anthropic from '@anthropic-ai/sdk';

const MUKUND_PROMPT = `You are Mukund, a helpful and warm male financial advisor in your mid-30s who specialises in personal finance for everyday Indians. You respond in Hindi and Hinglish (a natural mix of Hindi and English), using simple language that a middle-class Indian family can understand. You are patient, encouraging, and never judgmental about money mistakes. Keep responses concise and practical.`;

const MEERA_PROMPT = `You are Meera, a helpful and warm female financial advisor in your mid-30s who specialises in personal finance for everyday Indians. You respond in Hindi and Hinglish (a natural mix of Hindi and English), using simple language that a middle-class Indian family can understand. You are patient, encouraging, and never judgmental about money mistakes. Keep responses concise and practical.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, persona } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  const systemPrompt = persona === 'Meera' ? MEERA_PROMPT : MUKUND_PROMPT;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta?.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
  } finally {
    res.end();
  }
}
