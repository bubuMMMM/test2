import { createBuildRequest } from '../../lib/db.js';

export const prerender = false;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const allowedTimes = new Set(['09:00–11:00', '11:00–13:00', '14:00–16:00', '16:00–18:00']);

function clientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

export async function POST({ request }) {
  try {
    const body = await request.json();

    if (String(body.company || '').trim()) {
      return Response.json({ message: 'Request received.' }, { status: 201 });
    }

    const appSlug = String(body.app || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const details = String(body.details || '').trim();
    const preferredDate = String(body.preferredDate || '').trim();
    const preferredTime = String(body.preferredTime || '').trim();

    if (!appSlug || appSlug.length > 120) {
      return Response.json({ message: 'Choose a project to build.' }, { status: 400 });
    }
    if (name.length < 2 || name.length > 100) {
      return Response.json({ message: 'Enter your name.' }, { status: 400 });
    }
    if (!emailPattern.test(email) || email.length > 254) {
      return Response.json({ message: 'Enter a valid email address.' }, { status: 400 });
    }
    if (details.length < 10 || details.length > 2000) {
      return Response.json({ message: 'Tell us a little more about what you want built.' }, { status: 400 });
    }
    if (!datePattern.test(preferredDate)) {
      return Response.json({ message: 'Choose a preferred call date.' }, { status: 400 });
    }
    const chosenDate = new Date(`${preferredDate}T23:59:59Z`);
    if (Number.isNaN(chosenDate.getTime()) || chosenDate.getTime() < Date.now()) {
      return Response.json({ message: 'Choose a future call date.' }, { status: 400 });
    }
    if (!allowedTimes.has(preferredTime)) {
      return Response.json({ message: 'Choose a preferred call window.' }, { status: 400 });
    }

    const result = createBuildRequest({
      appSlug,
      name,
      email,
      details,
      preferredDate,
      preferredTime,
      ip: clientIp(request)
    });

    return Response.json({
      accepted: true,
      requestId: result.id,
      message: 'Request received. We’ll arrange the call using your preferred slot.'
    }, { status: 201 });
  } catch (error) {
    console.error('build_request_error', error);
    return Response.json({ message: 'Could not submit your request. Please try again.' }, { status: 500 });
  }
}
