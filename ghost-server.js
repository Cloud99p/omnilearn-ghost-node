#!/usr/bin/env node
// OmniLearn Ghost Node Server
// Accepts distributed tasks from the primary OmniLearn instance

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const SECRET = process.env.GHOST_NODE_SECRET;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const NODE_NAME = process.env.GHOST_NODE_NAME || 'Ghost Node';
const REGION = process.env.GHOST_NODE_REGION || 'unknown';

if (!SECRET) { console.error('[ghost-node] ERROR: GHOST_NODE_SECRET is required'); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error('[ghost-node] ERROR: ANTHROPIC_API_KEY is required'); process.exit(1); }

let Anthropic;
try { Anthropic = require('@anthropic-ai/sdk'); } catch {
  console.error('[ghost-node] ERROR: Run "npm install" first');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check — called by primary OmniLearn to verify liveness
app.get('/api/ghost/health', (req, res) => {
  res.json({
    status: 'online',
    name: NODE_NAME,
    region: REGION,
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Execute task — receives work from primary OmniLearn instance
app.post('/api/ghost/execute', async (req, res) => {
  const incomingSecret = req.headers['x-ghost-secret'];
  if (!incomingSecret || incomingSecret !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, history = [], systemPrompt, requestId } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message is required' });

  const startTime = Date.now();
  console.log(`[ghost-node] Executing task ${requestId || '?'} — "${message.slice(0, 60)}"`);

  try {
    const messages = [...history, { role: 'user', content: message }];
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt || 'You are Omni, the AI agent built by Emmanuel Nenpan Hosea, creator of OmniLearn. You are running as a distributed ghost node.',
      messages,
    });

    const text = response.content.find(c => c.type === 'text')?.text || '';
    const processingMs = Date.now() - startTime;
    console.log(`[ghost-node] Task ${requestId || '?'} completed in ${processingMs}ms`);

    res.json({ response: text, model: response.model, processingMs, requestId, nodeName: NODE_NAME });
  } catch (err) {
    console.error(`[ghost-node] Task ${requestId || '?'} failed:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  OmniLearn Ghost Node "${NODE_NAME}" (region: ${REGION})`);
  console.log(`  Listening on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/ghost/health\n`);
});
