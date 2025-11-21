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
import { useRouter } from "next/navigation";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function HomePage() {
  const router = useRouter();
  const [spotifyData, setSpotifyData] = useState(null);
  const [error, setError] = useState(null);
  const [type, setType] = useState("tracks");
  const [period, setPeriod] = useState("short");
  const [itemsData, setItemsData] = useState([]);
  const [accessToken, setAccessToken] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [unabledRequest, setUnabledRequest] = useState(false);
  const [key, setKey] = useState("tracksShort");
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const user_name = Cookies.get("user_name");
      if (!user_name) {
        router.push("/");
        return;
      }
      await axios.get('/api/checkUserExists')
      if (Cookies.get("spotify_access_token")) {
        setAccessToken(Cookies.get("spotify_access_token"));
        setCheckedAuth(true);
        return;
      }

      const refreshToken = Cookies.get("spotify_refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post("/api/refreshToken", {
            refresh_token: refreshToken,
          });
          Cookies.set("spotify_access_token", response.data.access_token, {
            expires: 1 / 24,
          });
          console.log(
            "Access token refreshed",
            Cookies.get("spotify_access_token")
          );

          setAccessToken(Cookies.get("spotify_access_token"));
          Cookies.set("user_name", user_name, { expires: 7 });
          Cookies.set("spotify_refresh_token", refreshToken, { expires: 7 });
          setCheckedAuth(true);
        } catch (error) {
          console.error("Error fetching access token:", error);
          router.push("/");
        }
      } else {
        router.push("/");
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const userName = Cookies.get("user_name");
      if (!userName) {
        setError("User name cookie is missing");
        return;
      }
      try {
        const response = await axios.post("/api/userTracks", {
          user_name: userName,
          access_token: Cookies.get("spotify_access_token"),
        });
        setSpotifyData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      }
    };
    if (!dataFetched && checkedAuth) {
      fetchData();
      setDataFetched(true);
    }
  }, [checkedAuth]);

  useEffect(() => {
    const fetchItemData = async () => {
      setUnabledRequest(true);
      if (!spotifyData) return;

      const key = `${type}${period.charAt(0).toUpperCase() + period.slice(1)}`;
      const data = spotifyData[key];
      setKey(key);

      // Verificar si data está vacío
      if (!data || data.length === 0) {
        setItemsData([]);
        setIsLoading(false);
        setTimeout(() => {
          setUnabledRequest(false);
        }, 2000);
        return;
      }

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
    window.open(href, "_blank");
  };

  const renderList = () => {
    if (isLoading) {
      return <CircularProgress color="success" />;
    }
    
    if (!itemsData.length) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          color: '#ffffff',
          fontSize: '1.2rem' 
        }}>
          Sin data
        </div>
      );
    }
    
    return (
      <>
        <List>
          {itemsData.map((item, index) => {
            const primaryText = item.name;
            const secondaryText =
              type === "tracks"
                ? item.artists.map((artist) => artist.name).join(", ")
                : null;
            let valueAEvaluar = spotifyData[key][index][1];
            let iconToShow;
            switch (valueAEvaluar) {
              case false:
                iconToShow = <FiberNew style={{color: "#FFD700" }}/>;
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
                    <PlayCircleFilledWhite
                      className={styles.playIcon}
                      onClick={() => {
                        handlePlay(item.external_urls.spotify);
                      }}
                    />
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

  
  const handleLogout = () => {
    Cookies.remove("spotify_access_token");
    Cookies.remove("spotify_refresh_token");
    Cookies.remove("user_name");
    router.push("/");
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <>
        {error && <p>Error: {error}</p>}
        {spotifyData ? (
          <div className={styles.divMain}>
            <div className={styles.header}>
        <h2 style={{ marginTop: ".5em", marginBottom: "0.25em" }}>
          Spotify Data
        </h2>
        <p className={styles.logout} onClick={handleLogout}>
          Logout
        </p>
      </div>
            <div className={styles.divSelects}>
              <select
                className={styles.select}
                disabled={unabledRequest}
                id="type"
                value={type}
                onChange={handleTypeChange}
              >
                <option value="tracks">Tracks</option>
                <option value="artists">Artists</option>
              </select>
              <select
                className={styles.select}
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
