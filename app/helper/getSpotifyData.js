import axios from "axios";

const apiUrl = "https://api.spotify.com/v1/me/top/";

const fetchData = async (type, term) => {
  const response = await axios.get(
    `${apiUrl}${type}?time_range=${term}_term&limit=${process.env.NEXT_PUBLIC_SPOTIFY_LIMIT}`
  );
  return response.data.items.map((item) => [item.id, false]);
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

  actualizarCambios(dataDb,dataSpotify)

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

module.exports = { getData, updateData };
