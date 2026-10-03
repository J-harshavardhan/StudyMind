import { env } from '../config/env.js';

const MAX_MESSAGE_LENGTH = 2000;

export async function askAssistant(req, res, next) {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      const error = new Error(`Message is required and must be ${MAX_MESSAGE_LENGTH} characters or fewer`);
      error.status = 400;
      throw error;
    }

    if (!env.GEMINI_API_KEY) {
      const error = new Error('AI assistant is not configured. Add GEMINI_API_KEY to the server .env file.');
      error.status = 503;
      throw error;
    }

    const response = await globalThis.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: 'You are StudyMind Assistant. Give concise, encouraging, practical study help. Do not claim to be a human. Never ask for passwords, API keys, or other secrets.' }]
          },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 700 }
        })
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(payload.error?.message || 'The AI provider could not answer right now');
      error.status = response.status === 429 ? 429 : 502;
      throw error;
    }

    const answer = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('\n')
      .trim();

    if (!answer) {
      const error = new Error('The AI provider returned an empty response');
      error.status = 502;
      throw error;
    }

    return res.json({ answer });
  } catch (error) {
    return next(error);
  }
}
