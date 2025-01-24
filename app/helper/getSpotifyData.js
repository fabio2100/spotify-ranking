import axios from "axios";
import pool from "../../db";

const apiUrl = "https://api.spotify.com/v1/me/top/";

const fetchData = async (type, term) => {
  try {
    const response = await axios.get(
      `${apiUrl}${type}?time_range=${term}_term&limit=${process.env.NEXT_PUBLIC_SPOTIFY_LIMIT}`
    );
    return response.data.items.map((item) => [item.id, false]);
  } catch (error) {
    
  }

};

const getData = async (token) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const data = {
    tracksLong: await fetchData("tracks", "long"),
    tracksMedium: await fetchData("tracks", "medium"),
    tracksShort: await fetchData("tracks", "short"),
    artistsLong: await fetchData("artists", "long"),
    artistsMedium: await fetchData("artists", "medium"),
    artistsShort: await fetchData("artists", "short"),
  };

  return data;
};

const updateData = async (token, dataDb) => {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const dataSpotify = {
    tracksLong: await fetchData("tracks", "long"),
    tracksMedium: await fetchData("tracks", "medium"),
    tracksShort: await fetchData("tracks", "short"),
    artistsLong: await fetchData("artists", "long"),
    artistsMedium: await fetchData("artists", "medium"),
    artistsShort: await fetchData("artists", "short"),
  };

  actualizarCambios(dataDb, dataSpotify);

  return dataSpotify;
};

function actualizarCambios(dataDB, dataSpotify) {
  for (let categoria in dataSpotify) {
    let itemsSpotify = dataSpotify[categoria];
    let itemsDB = dataDB[categoria];
    itemsSpotify.forEach((itemSpotify, indexSpotify) => {
      let idSpotify = itemSpotify[0];
      let encontrado = false;
      itemsDB.forEach((itemDB, indexDB) => {
        if (idSpotify === itemDB[0]) {
          itemSpotify[1] = indexDB - indexSpotify;
          encontrado = true;
        }
      });
      if (!encontrado) {
        itemSpotify[1] = false;
      }
    });
  }
}

const prevUpdate = async (userId, access_token) => {
  // Conectar a PostgreSQL y realizar la consulta
  const client = await pool.connect();
  const queryText = "SELECT data FROM user_data_spotify WHERE user_name = $1;";
  const queryValues = [userId];
  const res = await client.query(queryText, queryValues);
  const dataDb = res.rows[0].data;
  const updated = await updateData(access_token, dataDb);
  const queryUpdated =
    "UPDATE user_data_spotify SET data = $2, created_at = CURRENT_TIMESTAMP WHERE user_name = $1";
  const queryUpdatedValues = [userId, JSON.stringify(updated)];
  const resUpdate = await client.query(queryUpdated, queryUpdatedValues);
  console.log("updated: ", resUpdate.rows);
};

module.exports = { getData, updateData, prevUpdate };
