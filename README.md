# OnRegardeQuoi

**OnRegardeQuoi.com** is a free, private, open-source, and minimalist web app that helps you discover movies and TV shows through their trailers. 
<br>It takes its name from the French phrase <i>On regarde quoi ?</i> meaning <i>What are we watching?</i>
<br>The goal is to provide a simple and light trailer-focused experience, not to replace more comprehensive movie databases.

## ✨ Features

- **Browse Movies & TV Shows** – Easily switch between movies and TV Shows
- **Smart Categories** – Discover content in categories such as Trending Now, Coming Soon, All-Time Greats, and more
- **Instant Trailer Playback** – Watch the trailer directly in the app. You can access all available videos from TMDB and find quick links to YouTube or Dailymotion
- **Responsive Design** – Seamless experience on desktop, tablet, or phone
- **Fast & Lightweight** – Built with HTML, CSS and JavaScript with no heavy frameworks
- **Smart Caching** – Time-based local storage caching for faster loading on return visits
- **Detailed Information** – Access synopsis, genres, runtime, rating, cast, and director for any title
- **Watch Later** – Bookmark your selection to view them later
- **Where to Watch** – Find where to stream, buy, or rent through JustWatch integration
- **Quick Search Integration** – Add OnRegardeQuoi as a custom search engine in your browser, Raycast, Alfred, etc. `https://www.onregardequoi.com/?q={query}`
- **No Account** - No account is required and no cookies are used
- <i>v2 is officially out—updates coming soon.</i>
  
## 🎨 Screenshots

<i>v2 is officially out—updates coming soon.</i>

## 🚀 Getting Started

### Option 1: Use the Official Instance

Simply visit **[onregardequoi.com](https://www.onregardequoi.com/)** and start exploring, no setup required.

### Option 2: Generate a desktop app

Use the amazing [Pake](https://github.com/tw93/Pake) command line to create your own lightweight and fast desktop app for OnRegardeQuoi on macOS, Windows, or Linux. 
Check the Pake GitHub for more information about this very useful tool.

### Option 3: Run Locally

Run this project locally with a free API key from [The Movie Database (TMDB)](https://www.themoviedb.org/signup):

1. Download all the files
2. Edit the `index.html` file and paste your API key into the `devKey` constant:
```javascript
   devKey = 'YOUR_TMDB_API_KEY_GOES_HERE';
```
3. Run the `index.html` file in your web browser

### Option 4: Deploy Your Own Instance

Deploy your own instance for free on Vercel:

1. Fork this repository
2. Sign up for a free account at [Vercel](https://vercel.com/)
3. Import your forked repository
4. Add your TMDB API key as an environment variable named `TMDB_API_KEY`
5. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mickaphd/OnRegardeQuoi)

## 🔒 Privacy Policy

- **No Personal Data** – There is no collection, storage, or transmission of any information, and no cookies or trackers are used. Only the privacy friendly script [GoatCounter](https://github.com/arp242/goatcounter) is tested (which is blocked by uBlock Origin anyway 😄) 
- **Local Storage** – Movie and TV show data cached locally on your device for performance. Can be cleared anytime from browser settings or the app's "Refresh ↻" button
- **Third-Party Services** – Videos stream via YouTube's privacy-enhanced mode (`youtube-nocookie.com`), subject to YouTube's privacy policy obviously..

## 🐛 Issues

Found a bug or have a feature request? [Open an issue](https://github.com/mickaphd/OnRegardeQuoi/issues).

## 🙏 Acknowledgment

- [The Movie Database (TMDB)](https://www.themoviedb.org/) – Comprehensive movie and TV show data
- [JustWatch](https://www.justwatch.com/)- Streaming availability
- [Vercel](https://vercel.com/) – Seamless and free hosting
- <i>v2 is officially out—updates coming soon.</i>

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
This project relies on third-party APIs and services such as TMDB, JustWatch, etc.
Users must comply with each service's terms of service when using this application.
