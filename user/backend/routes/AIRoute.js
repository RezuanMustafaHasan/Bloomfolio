const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Stock = require('../models/Stock');
const ChatSession = require('../models/ChatSession');
const { requireUser } = require('../middleware/AuthMiddleware');

// Utility: build short title from first query
function makeTitle(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= 60) return clean || 'New chat';
  // Trim at word boundary to ~60 chars
  let t = clean.slice(0, 60);
  const lastSpace = t.lastIndexOf(' ');
  if (lastSpace > 20) t = t.slice(0, lastSpace);
  return `${t}...`;
}

// List my chat sessions
router.get('/sessions', requireUser, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('_id title tradingCodes updatedAt');
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load sessions', error: err.message });
  }
});

// Get one session with messages
router.get('/session/:id', requireUser, async (req, res) => {
  try {
    const s = await ChatSession.findOne({ _id: req.params.id, userId: req.userId });
    if (!s) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, data: { _id: s._id, title: s.title, tradingCodes: s.tradingCodes, messages: s.messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load session', error: err.message });
  }
});

// POST /api/ai/chat
// body: { tradingCodes: string[], question: string, model?: string, sessionId?: string }
router.post('/chat', requireUser, async (req, res) => {
  try {
    const { tradingCodes, question, model, sessionId } = req.body || {};
    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, message: 'question must be a non-empty string' });
    }

    // Normalize codes and fetch stocks (allow empty for general questions)
    const codes = Array.isArray(tradingCodes)
      ? tradingCodes.map(c => String(c).toUpperCase().trim()).filter(Boolean)
      : [];
    const stocks = codes.length > 0
      ? await Stock.find({ tradingCode: { $in: codes } })
      : [];

    // Map results by code for quick lookup
    const byCode = Object.fromEntries(stocks.map(s => [String(s.tradingCode).toUpperCase(), s]));

    // Build context array with placeholders for missing ones (when codes provided)
    const context = codes.map(code => {
      const doc = byCode[code];
      if (!doc) {
        return { tradingCode: code, missing: true };
      }
      const plain = JSON.parse(JSON.stringify(doc));
      if (Array.isArray(plain.financialPerformance?.interimEPS)) {
        plain.financialPerformance.interimEPS = plain.financialPerformance.interimEPS.slice(-6);
      }
      if (Array.isArray(plain.shareholding)) {
        plain.shareholding = plain.shareholding.slice(-3);
      }
      return plain;
    });

    // Initialize Gemini client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'GEMINI_API_KEY is not configured' });
    }
    const apiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
    const modelName = typeof model === 'string' && model.trim() ? model.trim() : (process.env.GEMINI_MODEL || 'gemini-2.5-flash');

    // Compose prompt: non-technical, supports general questions without stock selection
    const baseInstruction = [
      'You are a helpful financial advisor focused on the Dhaka Stock Exchange and general investing.',
      'Speak to a non-technical user in plain language.',
      'Do not mention internal data formats (like JSON) or data types.',
      'If specific stock details are unavailable, acknowledge briefly and provide general guidance.',
      'Give concise, practical advice and explanations with examples where useful.'
    ].join(' ');

    let textPrompt;
    if (codes.length > 0) {
      const instruction = baseInstruction + '\nUse the following stock information as internal context. If any field is absent, treat it as not provided and continue.';
      textPrompt = [
        'Stock context (for internal use):',
        JSON.stringify(context, null, 2),
        instruction,
        `User question: ${question}`,
      ].join('\n\n');
    } else {
      textPrompt = [
        baseInstruction,
        `User question: ${question}`,
      ].join('\n\n');
    }

    // Call Gemini REST API with retry and fallback
    async function callGemini(mn, prompt) {
      const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${mn}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      };
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const errText = await r.text();
        const e = new Error(`Gemini HTTP ${r.status}: ${errText}`);
        e.status = r.status;
        e.errText = errText;
        throw e;
      }
      return r.json();
    }

    // Persistent retry until a reply (bounded by max wait)
    let usedModel = modelName;
    let data;
    const startTs = Date.now();
    const maxWaitMs = Number(process.env.AI_MAX_WAIT_MS || 240000); // 4 minutes
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash';
    const modelChain = [modelName, fallbackModel];
    let attempt = 0;
    let lastErrMsg = '';

    while ((Date.now() - startTs) < maxWaitMs) {
      const currentModel = modelChain[attempt % modelChain.length];
      usedModel = currentModel;
      try {
        data = await callGemini(currentModel, textPrompt);
        break; // got a response, proceed to parse
      } catch (e) {
        lastErrMsg = e.errText || e.message || String(e);
        const isOverload = (e.status === 503) || /UNAVAILABLE|overloaded/i.test(lastErrMsg);
        const isRateLimit = (e.status === 429) || /RESOURCE_EXHAUSTED|rate/i.test(lastErrMsg);
        const isTimeout = /timeout|ETIMEDOUT/i.test(lastErrMsg);
        const retriable = isOverload || isRateLimit || isTimeout || (e.status >= 500);
        if (!retriable) {
          throw e;
        }
        attempt += 1;
        const delay = Math.min(10000, Math.round(500 * Math.pow(1.7, attempt))) + Math.floor(Math.random() * 500);
        await new Promise(r => setTimeout(r, delay));
        continue; // try next attempt
      }
    }

    if (!data) {
      const fallbackMsg = lastErrMsg || 'Model overloaded. Please retry shortly.';
      return res.status(200).json({ success: false, message: fallbackMsg, error: lastErrMsg });
    }

    const answer = (data?.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('\n')
      .trim();

    if (!answer) {

      // If no answer, keep polling within remaining time
      let innerAttempts = 0;
      while ((Date.now() - startTs) < maxWaitMs) {
        innerAttempts += 1;
        try {
          const m = modelChain[innerAttempts % modelChain.length];
          usedModel = m;
          const d = await callGemini(m, textPrompt);
          const a = (d?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();
          if (a) {
            return res.json({ success: true, data: { answer: a, model: usedModel, codes, missing: codes.filter(c => !byCode[c]), sessionId: undefined } });
          }
        } catch (e) {
          const msg = e.errText || e.message || '';
          const retriable = /UNAVAILABLE|overloaded|RESOURCE_EXHAUSTED|rate|timeout|503|429/i.test(msg);
          if (!retriable) break;
        }
        const delay = Math.min(8000, Math.round(400 * Math.pow(1.6, innerAttempts))) + Math.floor(Math.random() * 400);
        await new Promise(r => setTimeout(r, delay));
      }
      return res.status(200).json({ success: false, message: 'No answer returned from Gemini. Try rephrasing or asking a smaller question.' });
    }

    // Persist chat session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.userId });
    }
    if (!session) {
      session = new ChatSession({
        userId: req.userId,
        title: makeTitle(question),
        tradingCodes: codes,
        messages: [
          { from: 'user', text: question },
          { from: 'ai', text: answer },
        ],
      });
    } else {
      const merged = Array.from(new Set([...(session.tradingCodes || []), ...codes]));
      session.tradingCodes = merged;
      session.messages.push({ from: 'user', text: question });
      session.messages.push({ from: 'ai', text: answer });
    }
    await session.save();

    return res.json({ success: true, data: { answer, model: usedModel, codes, missing: codes.filter(c => !byCode[c]), sessionId: String(session._id) } });
  } catch (err) {
    console.error('AI chat error:', err);
    const msg = String(err?.message || '');
    if (/503|UNAVAILABLE|overloaded/i.test(msg)) {
      return res.status(200).json({ success: false, message: 'The model is overloaded. Please retry in a few seconds.', error: err.message });
    }
    if (/429|RESOURCE_EXHAUSTED|rate/i.test(msg)) {
      return res.status(200).json({ success: false, message: 'Rate limited. Please slow down and retry.', error: err.message });
    }
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
});

module.exports = router;