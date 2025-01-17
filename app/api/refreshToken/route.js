// /pages/api/refreshToken.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const { refresh_token } = body;

  if (!refresh_token) {
    return NextResponse.json({ error: 'Refresh token is required' }, { status: 400 });
  }

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      params: {
        grant_type: 'refresh_token',
        refresh_token,
        client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return NextResponse.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error('Error fetching access token:', error);
    return NextResponse.json({ error: 'Failed to fetch access token' }, { status: 500 });
  }
}
