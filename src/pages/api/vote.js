import { voteForApp } from '../../lib/db.js';
import { getApp, monthlyMRR } from '../../lib/apps.js';
import { getVoteCounts } from '../../lib/db.js';

export const prerender = false;

function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
    const slug = String(body.slug || '').trim();
    if (!getApp(slug)) {
      return Response.json({ message: 'Unknown app.' }, { status: 404 });
    }
    const result = voteForApp(slug, clientIp(request));
    const counts = getVoteCounts();
    return Response.json({
      accepted: result.accepted,
      count: result.count,
      collectiveMRR: monthlyMRR(counts),
      message: result.accepted ? 'Vote recorded.' : 'Your vote was already counted this month.'
    }, { status: result.accepted ? 201 : 200 });
  } catch (error) {
    console.error('vote_error', error);
    return Response.json({ message: 'Vote could not be recorded.' }, { status: 500 });
  }
}
