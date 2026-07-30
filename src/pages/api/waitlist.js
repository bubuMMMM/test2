import { joinWaitlist } from '../../lib/db.js';

export const prerender = false;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST({ request }) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());

    if (String(body.company || '').trim()) {
      return Response.json({ message: 'Thanks. You are on the list.' }, { status: 201 });
    }

    const email = String(body.email || '').trim().toLowerCase();
    const source = String(body.source || 'homepage').trim();
    if (!emailPattern.test(email) || email.length > 254) {
      return Response.json({ message: 'Enter a valid email address.' }, { status: 400 });
    }

    const result = joinWaitlist(email, source);
    return Response.json({
      accepted: result.accepted,
      message: result.accepted ? 'Confirmed. No spam. Just new teardown alerts.' : 'You are already on the waitlist.'
    }, { status: result.accepted ? 201 : 200 });
  } catch (error) {
    console.error('waitlist_error', error);
    return Response.json({ message: 'Could not join right now. Try again.' }, { status: 500 });
  }
}
