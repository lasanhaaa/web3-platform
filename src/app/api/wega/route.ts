/* Wega's live answers. Set ANTHROPIC_API_KEY (and optionally WEGA_MODEL) to turn them on;
   without a key the route answers 501 and the client falls back to its scripted answers. */
export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response('Live answers are not configured.', { status: 501 });
  const { system, messages } = (await req.json()) as { system: string; messages: { role: string; content: string }[] };
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: process.env.WEGA_MODEL || 'claude-sonnet-5-5',
      max_tokens: 700,
      system,
      messages: messages.slice(-10),
      stream: true,
    }),
    signal: req.signal,
  });
  if (!upstream.ok || !upstream.body) return new Response('Upstream error', { status: 502 });
  // Turn the SSE stream into plain text deltas for the panel.
  const reader = upstream.body.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = '';
  const stream = new ReadableStream({
    async pull(ctrl) {
      const { done, value } = await reader.read();
      if (done) return ctrl.close();
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const l of lines) {
        if (!l.startsWith('data:')) continue;
        try {
          const ev = JSON.parse(l.slice(5));
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') ctrl.enqueue(enc.encode(ev.delta.text));
        } catch {}
      }
    },
    cancel() {
      reader.cancel();
    },
  });
  return new Response(stream, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
