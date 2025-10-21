const router = require('express').Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Stock = require('../models/Stock');

// POST /api/ai/chat
// body: { tradingCodes: string[], question: string, model?: string }
router.post('/chat', async (req, res) => {
  try {
    const { tradingCodes, question, model } = req.body || {};
    if (!Array.isArray(tradingCodes) || tradingCodes.length === 0) {
      return res.status(400).json({ success: false, message: 'tradingCodes must be a non-empty array' });
    }
    if (typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, message: 'question must be a non-empty string' });
    }

    // Normalize codes and fetch stocks
    const codes = tradingCodes.map(c => String(c).toUpperCase().trim());
    const stocks = await Stock.find({ tradingCode: { $in: codes } });

    // Map results by code for quick lookup
    const byCode = Object.fromEntries(stocks.map(s => [String(s.tradingCode).toUpperCase(), s]));

    // Build context array with placeholders for missing ones
    const context = codes.map(code => {
      const doc = byCode[code];
      if (!doc) {
        return { tradingCode: code, missing: true };
      }
      // Convert Mongoose doc to plain JSON and prune heavy fields if needed
      const plain = JSON.parse(JSON.stringify(doc));
      // Optionally trim very large arrays to keep prompt size manageable
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

    // Compose prompt: include JSON context first, then instruction and the question
    const instruction = 'Act like the financial advisor for dhaka stock exchange. Datas of queried stock is provided above in json format. If any particular row is missing, consider that company hasn\'t submitted their report.';

    const textPrompt = [
      'JSON stock context:',
      JSON.stringify(context, null, 2),
      instruction,
      `Question: ${question}`,
    ].join('\n\n');

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

    let usedModel = modelName;
    let data;
    try {
      data = await callGemini(modelName, textPrompt);
    } catch (e1) {
      const isOverload = (e1.status === 503) || /UNAVAILABLE|overloaded/i.test(e1.errText || e1.message);
      const isRateLimit = (e1.status === 429) || /RESOURCE_EXHAUSTED|rate/i.test(e1.errText || e1.message);

      if (isOverload || isRateLimit) {
        // One quick retry on the same model
        await new Promise(r => setTimeout(r, 700));
        try {
          data = await callGemini(modelName, textPrompt);
        } catch (e2) {
          // Fallback to a lighter, widely available model
          const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash';
          usedModel = fallbackModel;
          try {
            data = await callGemini(fallbackModel, textPrompt);
          } catch (e3) {
            const msg = isOverload ? 'Model overloaded. Please retry shortly.' : 'Rate limited. Please retry shortly.';
            return res.status(200).json({ success: false, message: msg, error: e3.message });
          }
        }
      } else {
        throw e1;
      }
    }

    const answer = (data?.candidates?.[0]?.content?.parts || [])
      .map(p => p.text || '')
      .join('\n')
      .trim();

    if (!answer) {
      return res.status(200).json({ success: false, message: 'No answer returned from Gemini. Try rephrasing or asking a smaller question.' });
    }

    return res.json({ success: true, data: { answer, model: usedModel, codes, missing: codes.filter(c => !byCode[c]) } });
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