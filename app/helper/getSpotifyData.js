import axios from 'axios';

const apiUrl = 'https://api.spotify.com/v1/me/top/';


const fetchData = async (type, term) => {
    const response = await axios.get(`${apiUrl}${type}?time_range=${term}_term&limit=50`);
    return response.data.items.map(item => ([item.id, 0]));
};

const getData = async (token) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const data = {
        "tracksLong": await fetchData('tracks', 'long'),
        "tracksMedium": await fetchData('tracks', 'medium'),
        "tracksShort": await fetchData('tracks', 'short'),
        "artistsLong": await fetchData('artists', 'long'),
        "artistsMedium": await fetchData('artists', 'medium'),
        "artistsShort": await fetchData('artists', 'short'),
    };

    return data;
};

module.exports = { getData };
