import { POST as votePOST } from './vote.js';
import { POST as waitlistPOST } from './waitlist.js';
import { getDb, hashIp } from '../../lib/db.js';

export const prerender = false;

export async function GET({ request }) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const ip = `selftest-${stamp}`;
  const email = `selftest-${stamp}@example.invalid`;
  const db = getDb();

  try {
    const voteResponse = await votePOST({
      request: new Request(new URL('/api/vote', request.url), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': ip
        },
        body: JSON.stringify({ slug: 'calendly' })
      })
    });
    const voteBody = await voteResponse.json();

    const waitlistResponse = await waitlistPOST({
      request: new Request(new URL('/api/waitlist', request.url), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, source: 'deployment-selftest', company: '' })
      })
    });
    const waitlistBody = await waitlistResponse.json();

    const ok = voteResponse.status === 201 && voteBody.accepted === true && waitlistResponse.status === 201 && waitlistBody.accepted === true;
    return Response.json({
      status: ok ? 'ok' : 'failed',
      vote: { status: voteResponse.status, accepted: voteBody.accepted, count: voteBody.count },
      waitlist: { status: waitlistResponse.status, accepted: waitlistBody.accepted },
      sqlite: { selectOne: db.prepare('SELECT 1 AS value').get().value }
    }, { status: ok ? 200 : 500 });
  } catch (error) {
    console.error('selftest_error', error);
    return Response.json({ status: 'failed', message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  } finally {
    db.prepare('DELETE FROM vote_events WHERE ip_hash = ?').run(hashIp(ip));
    db.prepare('DELETE FROM waitlist WHERE email = ?').run(email);
  }
}
