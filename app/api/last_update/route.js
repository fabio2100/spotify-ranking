// pages/api/getSpotifyData.js
import pool from "../../../db"; 
import { NextResponse } from 'next/server';


export async function POST(req) {

  const { user_name } = await req.json();
  if (!user_name) {
    return NextResponse.json({ error: 'User name is required' }, { status: 400 });
  }

  try {    
    
    const queryText = 'SELECT NOW() - created_at AS time_since_update FROM user_data_spotify WHERE user_name = $1';
    const queryValues = [user_name];

    const result = await pool.query(queryText, queryValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0].time_since_update);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
