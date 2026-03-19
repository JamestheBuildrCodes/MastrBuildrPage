// ─────────────────────────────────────────────────────────────────
// Netlify Function: /.netlify/functions/projects
//   GET  → returns current live project count
//   POST → updates the count (admin protected with secret key)
// ─────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration' }) };
  }

  // ── GET: Return the current project count ─────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/project_counter?id=eq.1&select=count,updated_at`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Supabase responded with ${res.status}`);
      }

      const rows = await res.json();

      if (!rows || rows.length === 0) {
        // No row yet — return default starting value
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ count: 7, updated_at: new Date().toISOString() }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ count: rows[0].count, updated_at: rows[0].updated_at }),
      };
    } catch (err) {
      console.error('GET error:', err);
      // Graceful fallback — site still works even if DB is down
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ count: 7, updated_at: new Date().toISOString(), fallback: true }),
      };
    }
  }

  // ── POST: Update the project count (admin only) ───────────────
  if (event.httpMethod === 'POST') {
    const ADMIN_KEY = process.env.ADMIN_SECRET_KEY;
    const providedKey = event.headers['x-admin-key'];

    if (!ADMIN_KEY || providedKey !== ADMIN_KEY) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    let count;
    try {
      const body = JSON.parse(event.body || '{}');
      count = parseInt(body.count, 10);
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (isNaN(count) || count < 0 || count > 999) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Count must be a number between 0 and 999' }) };
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/project_counter?id=eq.1`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ count, updated_at: new Date().toISOString() }),
      });

      if (!res.ok) {
        throw new Error(`Supabase responded with ${res.status}`);
      }

      const rows = await res.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, count: rows[0]?.count ?? count }),
      };
    } catch (err) {
      console.error('POST error:', err);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to update count' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};
