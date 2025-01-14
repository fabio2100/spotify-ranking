// pages/api/getSpotifyData.js
import pool from "../../../db"; 
import { NextResponse } from 'next/server';


export async function POST(req) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { user_name } = await req.json();

  if (!user_name) {
    return NextResponse.json({ error: 'User name is required' }, { status: 400 });
  }

  try {
    const queryText = 'SELECT data FROM user_data_spotify WHERE user_name = $1';
    const queryValues = [user_name];

    const result = await pool.query(queryText, queryValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0].data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
