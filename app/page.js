"use client";
import React, { useEffect, useState } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styles from "./page.module.css";
import Cookies from "js-cookie";
import axios from "axios";
import { useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress"; // Importa CircularProgress
import { Button } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingButton, setLoadingButton] = useState(false);
  const router = useRouter();

  const checkAuth = async () => {
    const user_name = Cookies.get("user_name");
    if (!user_name) {
      setIsLoading(false);
      return;
    }
    const accessToken = Cookies.get("spotify_access_token");
    if (accessToken) {
      router.push("/home");
      return;
    }
    const refreshToken = Cookies.get("spotify_refresh_token");
    if (refreshToken) {
      try {
        const response = await axios.post("/api/refreshToken", {
          refresh_token: refreshToken,
        });
        if (response.data.access_token) {
          Cookies.set("spotify_access_token", response.data.access_token, {
            expires: 1 / 24,
          });
          const userName = Cookies.get("user_name");
          Cookies.set("user_name", userName, { expires: 7 });
          Cookies.set("spotify_refresh_token", refreshToken, { expires: 7 });
          router.push("/home");
        } else {
          Cookies.remove("spotify_refresh_token");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching access token:", error);
        // Eliminar la cookie si hubo un error en la solicitud
        Cookies.remove("spotify_refresh_token");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const redirectToSpotify = () => {
    setLoadingButton(true);
    const scope = "user-top-read";
    const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    }&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(
      process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
    )}`;
    router.push(url);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className={styles.page}>
        <h1>Spotify ranking</h1>
        {isLoading ? (
          <CircularProgress color="success" />
        ) : (
          <Button
            onClick={redirectToSpotify}
            className={styles.customButton}
            loading={loadingButton}
          >
            <span className={styles.buttonText}>SIGN WITH </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
              <path
                fill="#1ed760"
                d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
              />
              <path d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z" />
            </svg>
          </Button>
        )}
      </div>
    </ThemeProvider>
  );
}
