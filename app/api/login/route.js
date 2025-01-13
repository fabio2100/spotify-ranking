import axios from "axios";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import pool from "../../../db"; // Importamos el pool de conexiones
import { getData,updateData } from "../../helper/getSpotifyData";

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
    const queryText = `SELECT data, (NOW() - INTERVAL '7 days' >= created_at) AS actualizar FROM user_data_spotify WHERE user_name = $1;`;
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
      //el usuario existe, comprobar si hay el guardado tiene mas de una semana, si NO solo enviar las tracks, si SI buscar las tracks y despues guardar todo sin cambios
      console.log("user exists");
      const actualizar = dbResponse.rows[0].actualizar;
      if (actualizar) {
        //actualizar los cambios en las tracks
        console.log("actualizar");
        try {
          const queryText =
            "SELECT data FROM user_data_spotify WHERE user_name = $1;";
          const queryValues = [userId];
          const res = await client.query(queryText, queryValues);
          const dataDb = res.rows[0].data;
          const updated = await updateData(access_token,dataDb);
          const queryUpdated = "UPDATE user_data_spotify SET data = $2, created_at = CURRENT_TIMESTAMP WHERE user_name = $1";
          const queryUpdatedValues = [userId,JSON.stringify(updated)];
          const resUpdate = await client.query(queryUpdated, queryUpdatedValues)
          console.log('updated: ', resUpdate.rows)
        } catch (error) {
          console.error("Error inserting data:", error);
        } finally {
          client.release();
        }
      }
    }

    cookieStore.set("spotify_access_token", access_token, { maxAge: 3600 });
    cookieStore.set("spotify_refresh_token", refresh_token);
    cookieStore.set("user_name", userId);
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
