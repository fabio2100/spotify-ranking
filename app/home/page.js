// /pages/home.js
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function HomePage() {
  const [spotifyData, setSpotifyData] = useState(null);
  const [error, setError] = useState(null);
  const [type, setType] = useState("tracks");
  const [period, setPeriod] = useState("short");
  const [itemsData, setItemsData] = useState([]);
  const [accessToken, setAccessToken] = useState();

  useEffect(() => {
    const fetchData = async () => {
      const userName = Cookies.get("user_name");
      if (!userName) {
        setError("User name cookie is missing");
        return;
      }

      setAccessToken(Cookies.get("spotify_access_token"));

      try {
        const response = await axios.post("/api/userTracks", {
          user_name: userName,
        });
        setSpotifyData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchItemData = async () => {
      if (!spotifyData) return;

      const key = `${type}${period.charAt(0).toUpperCase() + period.slice(1)}`;
      const data = spotifyData[key];

      const requests = data.map((item) => {
        const id = item[0];
        const url =
          type === "tracks"
            ? `https://api.spotify.com/v1/tracks/${id}`
            : `https://api.spotify.com/v1/artists/${id}`;
        return axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Reemplaza con tu token de acceso
          },
        });
      });

      try {
        const responses = await Promise.all(requests);
        setItemsData(responses.map((response) => response.data));
        console.log(itemsData);
      } catch (error) {
        console.error("Error fetching item data:", error);
      }
    };

    fetchItemData();
  }, [type, period, spotifyData]);

  const handleTypeChange = (e) => {
    setType(e.target.value);
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
  };

  const renderList = () => {
    if (!itemsData.length) return <p>Loading data...</p>;
    return (
      <>
        <List>
          {itemsData.map((item, index) => {
            console.log(item)
            return <ListItem key={item.index}
              secondaryAction={
                <IconButton edge="end" aria-label="delete">
                  {index+1}
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Avatar>12</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Single-line item"
                secondary="Secondary text"
              />
            </ListItem>;
          })}
        </List>
      </>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div>
        <h1>Home</h1>
        <p>You have successfully logged in with Spotify!</p>
        {error && <p>Error: {error}</p>}
        {spotifyData ? (
          <div>
            <h2>Spotify Data</h2>
            <div>
              <label htmlFor="type">Type: </label>
              <select id="type" value={type} onChange={handleTypeChange}>
                <option value="tracks">Tracks</option>
                <option value="artists">Artists</option>
              </select>
            </div>
            <div>
              <label htmlFor="period">Period: </label>
              <select id="period" value={period} onChange={handlePeriodChange}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            {renderList()}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </ThemeProvider>
  );
}
