import axios from "axios";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import pool from "../../../db";
import { getData,prevUpdate } from "../../helper/getSpotifyData";

export async function GET(req, res) {
  const cookieStore = await cookies();
  let redirectPath = null;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) {
    redirectPath = `/`;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code: code,
          redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI,
          client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token, refresh_token } = response.data;


    const userProfileResponse = await axios.get(
      "https://api.spotify.com/v1/me",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userId = userProfileResponse.data.id;

    // Conectar a PostgreSQL y realizar la consulta
    const client = await pool.connect();
    const queryText = `SELECT data, (NOW() - INTERVAL '${process.env.UPDATE_DAYS || "2 days"}' >= created_at) AS actualizar FROM user_data_spotify WHERE user_name = $1;`;
    const queryValues = [userId];
    const dbResponse = await client.query(queryText, queryValues);
    let data;
    if(dbResponse.rows.length === 0 || dbResponse.rows[0].actualizar){
      console.log("new user or update");
      data = await getData(access_token,false);
    }

    if (dbResponse.rows.length === 0) {
      console.log("new user");
      try {
        const queryText =
          "INSERT INTO user_data_spotify (user_name, data) VALUES ($1, $2) RETURNING *";
        const queryValues = [userId, JSON.stringify(data)];
        const res = await client.query(queryText, queryValues);
        console.log("Inserted:", res.rows[0]);
      } catch (error) {
        console.error("Error inserting data:", error);
      } finally {
        client.release();
      }
    } else {
      const actualizar = dbResponse.rows[0].actualizar;
      if (actualizar) {
        //actualizar los cambios en las tracks
        try {
          prevUpdate(userId, access_token);
        } catch (error) {
          console.error("Error inserting data:", error);
        } finally {
          client.release();
        }
      }
    }

    cookieStore.set("spotify_access_token", access_token, { maxAge: 3600 });
    cookieStore.set("spotify_refresh_token", refresh_token, { maxAge: 604800});
    cookieStore.set("user_name", userId , {maxAge: 604800});
    redirectPath = `/home`;
  } catch (error) {
    console.error(
      "Error obtaining Spotify token or user profile, or querying the database:",
      error
    );
    redirectPath = `/`;
  } finally {
    redirect(redirectPath);
  }
}
