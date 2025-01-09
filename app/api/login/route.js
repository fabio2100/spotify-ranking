import axios from 'axios';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import pool from '../../../db'; // Importamos el pool de conexiones

export async function GET(req, res) {
    const cookieStore = await cookies();
    let redirectPath = null;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) {
        redirectPath = `/`;
    }

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
                client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const { access_token, refresh_token } = response.data;
        cookieStore.set('spotify_access_token', access_token, { maxAge: 0 });
        cookieStore.set('spotify_refresh_token', refresh_token, { maxAge: 0 });

        const userProfileResponse = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const userId = userProfileResponse.data.id;
        const userName = userProfileResponse.data.display_name;

        // Conectar a PostgreSQL y realizar la consulta
        const client = await pool.connect();
        const queryText = 'SELECT * FROM user_data_spotify WHERE user_name = $1';
        const queryValues = [userId];
        const dbResponse = await client.query(queryText, queryValues);
        client.release();

        console.log(`User ID: ${userId}, User Name: ${userName}`);
        console.log(dbResponse.rows);

        redirectPath = `/home`;
    } catch (error) {
        console.error('Error obtaining Spotify token or user profile, or querying the database:', error);
        redirectPath = `/`;
    } finally {
        redirect(redirectPath);
    }
}
