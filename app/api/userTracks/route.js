// pages/api/getSpotifyData.js
import pool from "../../../db"; 
import { NextResponse } from 'next/server';
import { prevUpdate } from "../../helper/getSpotifyData";


export async function POST(req) {

  const { user_name,access_token } = await req.json();
  if (!user_name) {
    return NextResponse.json({ error: 'User name is required' }, { status: 400 });
  }
  if(!access_token){
    return NextResponse.json({ error: 'Access token is required' }, { status: 400 });  
  }

  try {    
    const queryTextFirst = `SELECT data, (NOW() - INTERVAL '${process.env.UPDATE_DAYS || "2 days"}' >= created_at) AS actualizar FROM user_data_spotify WHERE user_name = $1;`;
    const queryValuesFirst = [user_name];
    const dbResponse = await pool.query(queryTextFirst, queryValuesFirst);
    const actualizar = dbResponse.rows[0].actualizar;
    console.log({actualizar})
    if(actualizar){
      prevUpdate(user_name,access_token);
      console.log('si actualiza esto va primero')
    }
    console.log('y esto va despues')
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
