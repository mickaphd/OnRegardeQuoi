/* OnRegardeQuoi: an open-source and minimalist web app for discovering movies and TV shows */
/* Made with ❤ by micka from Paris */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { tmdbEndpoint, queryParams } = request.body;

    if (!tmdbEndpoint) {
      return response.status(400).json({ message: 'Missing TMDB endpoint' });
    }

    // Retrieve the API key from Vercel environment variables
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      console.error('TMDB_API_KEY is not set in environment variables.');
      return response.status(500).json({ message: 'Server configuration error: TMDB API key missing.' });
    }

    // Combine the query parameters from the client with the required API key and language
    const allParams = {
      api_key: apiKey,
      language: 'en-US',
      ...queryParams,
    };

    const url = new URL(`${TMDB_BASE_URL}${tmdbEndpoint}`);
    url.search = new URLSearchParams(allParams).toString();

    const tmdbResponse = await fetch(url.toString());

    if (!tmdbResponse.ok) {
      const errorData = await tmdbResponse.json();
      return response.status(tmdbResponse.status).json(errorData);
    }

    const data = await tmdbResponse.json();
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy error:', error);
    return response.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
