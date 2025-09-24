# OnRegardeQuoi

<p align="center">
  <img src="https://github.com/user-attachments/assets/c4e9c40d-cb1b-41da-b300-69fb02cb627a" width="250" height="250" alt="OnRegardeQuoi Logo" />
  <br />
  <strong>Status:</strong> Maintained
  <br>
  <strong>Version:</strong> 1.0
  <br />
  <a href="https://onregardequoi.vercel.app/"><strong>https://onregardequoi.vercel.app/</strong></a>
</p>

**OnRegardeQuoi** is a free, open-source, minimalist web app that helps you discover movies and TV shows through their trailers. It takes its name from the French phrase 'On regarde quoi ?', meaning 'What are we watching?'. The goal is to provide a simple, trailer-focused experience, not to replace more comprehensive movie databases.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [How Content is Selected](#how-content-is-selected)
- [Privacy Policy](#privacy-policy)
- [Issues](#issues)
- [Acknowledgment](#acknowledgment)

## Features

-   **🎬 Browse Movies & TV Shows:** Easily switch between dedicated sections for movies and television series.
-   **🔥 Smart Categories:** Discover content through curated categories:
    -   **Trending Now:** See what's popular right now.
    -   **Coming Soon:** Get a sneak peek at upcoming releases.
    -   **All-Time Greats:** Browse critically acclaimed classics and fan favorites.
-   **▶️ Instant Trailer Playback:** Watch the best available trailer directly in the app. A list of all available videos (trailers, teasers, featurettes) is also accessible.
-   **🔍 Powerful Search:** Instantly search for any movie or TV show across the entire TMDB database.
-   **📱 Responsive Design:** Enjoy a seamless experience whether you're on a desktop, tablet, or phone.
-   **⚡ Fast & Lightweight:** Built with HTML, CSS and JavaScript with no heavy frameworks.
-   **🧠 Smart Caching:** Uses time-based local storage caching to reduce loading times and API calls, providing a faster experience on return visits.
-   **ℹ️ Detailed Information:** Access key details for any title, including synopsis, genres, runtime, rating, cast, and director.

## Screenshots

SOON

## Getting Started

In addition to the official website, you can run this project locally. All you need is a free API key from [The Movie Database (TMDB)](https://www.themoviedb.org/signup).

1.  **Download** the `index.html` file.
2.  **Edit** the file and paste your API key into the `LOCAL_DEV_API_KEY` constant:
    ```javascript
    const LOCAL_DEV_API_KEY = 'YOUR_TMDB_API_KEY_GOES_HERE';
    ```
3.  **Run** the `index.html` file in your web browser.

## How Content is Selected

To ensure a high-quality and relevant discovery experience, **OnRegardeQuoi** doesn't just show everything. It uses specific filters for each category, which is why the listings may differ from the main TMDB website. Here’s a look at the "secret sauce":

| Category | Content Type | Filtering Criteria | Sorted By |
| :--- | :--- | :--- | :--- |
| **🔥 Trending Now** | Movies | Released in the last **3 months**, with a rating of **≥ 5/10** and at least **100 votes**. | Popularity |
| | TV Shows | First aired in the last **6 months**, with a rating of **≥ 5/10** and at least **100 votes**. | Popularity |
| **🕒 Coming Soon** | Movies | Premiering within the next **6 months**. | Popularity |
| | TV Shows | Premiering within the next **year**. | Popularity |
| **⭐ All-Time Greats** | Movies | At least **5,000 votes**. | User Rating |
| | TV Shows | At least **2,000 votes**. | User Rating |

*Note: These criteria will certainly evolve in the future!*

## Privacy Policy

-   **No Personal Data:** This app does **not** collect, store, or transmit any personal information. There are no user accounts, analytics, or trackers.
-   **Local Storage:** The app uses your browser's `localStorage` to cache movie and TV show data (like titles and poster links). This is done solely to improve performance and make the app load faster for you. This data is stored only on your device and contains no personal information. It can be cleared at any time from your browser settings or by using the "Refresh ↻" button in the app's "About" section.
-   **Third-Party Services:** The app streams videos using YouTube's privacy-enhanced mode via the `youtube-nocookie.com` domain. Interacting with the video player is still subject to YouTube's own privacy policy.

## Issues

Found a bug or have a feature request? Please feel free to [open an issue](https://github.com/mickaphd/OnRegardeQuoi/issues). 

## Acknowledgment

This project would not be possible without the amazing free services provided by:

-   [The Movie Database (TMDB)](https://www.themoviedb.org/) for providing the comprehensive movie and TV show data.
-   [Vercel](https://vercel.com/) for seamless and free hosting.
