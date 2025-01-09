// /pages/index.js
'use client'
import React from 'react';

export default function Home() {
    const redirectToSpotify = () => {
        const scope = 'user-read-private user-read-email';
        const url = `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI)}`;
        window.location.href = url;
    };

    return (
        <div>
            <h1>Spotify Login</h1>
            <button onClick={redirectToSpotify}>Authorize with Spotify</button>
        </div>
    );
}
