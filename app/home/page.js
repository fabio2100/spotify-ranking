// /pages/home.js
"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { FiberNew } from "@mui/icons-material";
import { TbCircleArrowUpFilled, TbCircleArrowDownFilled } from "react-icons/tb";
import { FaEquals } from "react-icons/fa";
import styles from "./styles.module.css";
import { PlayCircleFilledWhite } from "@mui/icons-material";
import {
  Avatar,
  CircularProgress,
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
  const [isLoading, setIsLoading] = useState(false);
  const [unabledRequest, setUnabledRequest] = useState(false);
  const [key, setKey] = useState("tracksShort");

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
      setUnabledRequest(true);
      if (!spotifyData) return;

      const key = `${type}${period.charAt(0).toUpperCase() + period.slice(1)}`;
      const data = spotifyData[key];
      setKey(key);

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
        setIsLoading(false);
        setTimeout(() => {
          setUnabledRequest(false);
        }, 2000);
      } catch (error) {
        console.error("Error fetching item data:", error);
      }
    };

    fetchItemData();
  }, [type, period, spotifyData]);

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setIsLoading(true);
  };

  const handlePeriodChange = (e) => {
    setPeriod(e.target.value);
    setIsLoading(true);
  };

  const handlePlay = (href) => {
    window.open(href, '_blank');
  }

  const renderList = () => {
    if (!itemsData.length || isLoading)
      return <CircularProgress color="success" />;
    return (
      <>
        <List>
          {itemsData.map((item, index) => {
            console.log(item);
            const primaryText = item.name;
            const secondaryText =
              type === "tracks"
                ? item.artists.map((artist) => artist.name).join(", ")
                : null;
            let valueAEvaluar = spotifyData[key][index][1];
            let iconToShow;
            switch (valueAEvaluar) {
              case false:
                iconToShow = <FiberNew />;
                break;
              case 0:
                iconToShow = <FaEquals />;
                break;
              default:
                iconToShow = (
                  <>
                    {valueAEvaluar > 0 ? (
                      <TbCircleArrowUpFilled style={{ color: "#078300" }} />
                    ) : (
                      <TbCircleArrowDownFilled style={{ color: "#b80000" }} />
                    )}{" "}
                    {Math.abs(valueAEvaluar)}
                  </>
                );
                break;
            }
            return (
              <ListItem
              className={styles.listItem}
                key={index}
                secondaryAction={
                  <IconButton edge="end" aria-label="delete">
                    <PlayCircleFilledWhite className={styles.playIcon} onClick={()=>{handlePlay(item.external_urls.spotify)}}/>
                    {iconToShow}
                  </IconButton>
                }
              >
                {" "}
                <ListItemAvatar>
                  {" "}
                  <Avatar
                    style={{ backgroundColor: "#0BAD02", color: "white" }}
                  >
                    {index + 1}
                  </Avatar>{" "}
                </ListItemAvatar>{" "}
                <ListItemText primary={primaryText} secondary={secondaryText} />{" "}
              </ListItem>
            );
          })}
        </List>
      </>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <>
        {error && <p>Error: {error}</p>}
        {spotifyData ? (
          <div className={styles.divMain}>
            <h2>Spotify Data</h2>
            <div className={styles.divSelects}>
              <select className={styles.select}
                disabled={unabledRequest}
                id="type"
                value={type}
                onChange={handleTypeChange}
              >
                <option value="tracks">Tracks</option>
                <option value="artists">Artists</option>
              </select>
              <select className={styles.select}
                disabled={unabledRequest}
                id="period"
                value={period}
                onChange={handlePeriodChange}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            {renderList()}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            <CircularProgress color="success" />
          </div>
        )}
      </>
    </ThemeProvider>
  );
}
