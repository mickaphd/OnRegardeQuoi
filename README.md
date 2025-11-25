# OnRegardeQuoi
<p align="center">
  <img width="250" height="180" alt="OnRegardeQuoi" src="https://github.com/user-attachments/assets/62c02ac3-a72c-4aa3-81d6-4b27440c8fc4" />
  <br /><br />
  <strong>Status:</strong> Maintained | <strong>Version:</strong> 1.3
  <br />
  <a href="https://www.onregardequoi.com/"><strong>onregardequoi.com</strong></a>
</p>

**OnRegardeQuoi** is a free, open-source, and minimalist web app that helps you discover movies and TV shows through their trailers. It takes its name from the French phrase 'On regarde quoi ?', meaning 'What are we watching?'. The goal is to provide a simple, trailer-focused experience, not to replace more comprehensive movie databases.

---

## ✨ Features

- **Browse Movies & TV Shows** – Easily switch between dedicated sections for movies and television series
- **Smart Categories** – Discover content through Trending Now, Coming Soon, and All-Time Greats
- **Instant Trailer Playback** – Watch the best available trailer directly in the app, with access to all available videos
- **Powerful Search** – Instantly search for any movie or TV show across the entire TMDB database
- **Responsive Design** – Seamless experience on desktop, tablet, or phone
- **Fast & Lightweight** – Built with HTML, CSS and JavaScript with no heavy frameworks
- **Smart Caching** – Time-based local storage caching for faster loading on return visits
- **Detailed Information** – Access synopsis, genres, runtime, rating, cast, and director for any title
- **Watch Later** – Save your selected items to view them later

## 🚀 Getting Started

### Option 1: Use the Official Instance

Simply visit **[onregardequoi.com](https://www.onregardequoi.com/)** and start exploring! No setup required.

### Option 2: Run Locally

Run this project locally with a free API key from [The Movie Database (TMDB)](https://www.themoviedb.org/signup):

1. Download the `index.html` file
2. Edit the file and paste your API key into the `devKey` constant:
```javascript
   devKey = 'YOUR_TMDB_API_KEY_GOES_HERE';
```
3. Run the `index.html` file in your web browser

### Option 3: Deploy Your Own Instance

Deploy your own instance for free on Vercel:

1. Fork this repository
2. Sign up for a free account at [Vercel](https://vercel.com/)
3. Import your forked repository
4. Add your TMDB API key as an environment variable named `TMDB_API_KEY`
5. Deploy! Your app will be live in seconds

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mickaphd/OnRegardeQuoi)

## 🎯 How Content is Selected

**OnRegardeQuoi** uses specific filters for each category to ensure high-quality, relevant content. This is why listings may differ from the main TMDB website.

**Trending Now**
- Movies: Last 3 months, rating ≥5/10, ≥100 votes, sorted by popularity
- TV Shows: Last 6 months, rating ≥5/10, ≥100 votes, sorted by popularity

**Coming Soon**
- Movies: Next 6 months, sorted by popularity
- TV Shows: Next year, sorted by popularity

**All-Time Greats**
- Movies: ≥5,000 votes, sorted by user rating
- TV Shows: ≥2,000 votes, sorted by user rating

*These criteria will certainly evolve over time*

## 🔒 Privacy Policy

- **No Personal Data** – No collection, storage, or transmission of personal information. No user accounts, analytics, or trackers
- **Local Storage** – Movie and TV show data cached locally on your device for performance. Can be cleared anytime from browser settings or the app's "Refresh ↻" button
- **Third-Party Services** – Videos stream via YouTube's privacy-enhanced mode (`youtube-nocookie.com`), subject to YouTube's privacy policy

## 🐛 Issues

Found a bug or have a feature request? [Open an issue](https://github.com/mickaphd/OnRegardeQuoi/issues).

## 🙏 Acknowledgment

- [The Movie Database (TMDB)](https://www.themoviedb.org/) – Comprehensive movie and TV show data
- [Vercel](https://vercel.com/) – Seamless and free hosting
