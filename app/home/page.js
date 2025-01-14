// /pages/home.js
'use client'
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function HomePage() {
  const [spotifyData, setSpotifyData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const userName = Cookies.get('user_name');
      if (!userName) {
        setError('User name cookie is missing');
        return;
      }

      try {
        const response = await axios.post('/api/userTracks', { user_name: userName });
        setSpotifyData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data');
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Home</h1>
      <p>You have successfully logged in with Spotify!</p>
      {error && <p>Error: {error}</p>}
      {spotifyData ? (
        <div>
          <h2>Spotify Data</h2>
          <pre>{JSON.stringify(spotifyData, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
