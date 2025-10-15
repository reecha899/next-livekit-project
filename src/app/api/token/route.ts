import type { NextRequest } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room')?.trim();
    const identity = searchParams.get('identity')?.trim();

    if (!room || !identity) {
      return Response.json({ error: 'Missing required query params: room and identity' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return Response.json({ error: 'Server misconfiguration: LIVEKIT_API_KEY/SECRET not set' }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: 60 * 60 });
    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return Response.json({ token });
  } catch {
    return Response.json({ error: 'Failed to create token' }, { status: 500 });
  }
}