# OnRegardeQuoi
<p align="center">
  <img width="250" height="180" alt="OnRegardeQuoi" src="https://github.com/user-attachments/assets/62c02ac3-a72c-4aa3-81d6-4b27440c8fc4" />
  <br /><br />
  <strong>Status:</strong> Maintained | <strong>Version:</strong> 1.5
  <br />
  <a href="https://www.onregardequoi.com/"><strong>onregardequoi.com</strong></a>
</p>

**OnRegardeQuoi** is a free, open-source, and minimalist web app that helps you discover movies and TV shows through their trailers. 
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
  
## 🎨 Screenshots

<img width="80%" alt="Desktop - Home Page" src="https://github.com/user-attachments/assets/cbfb334a-3cba-457f-92d3-8a72c3270f73" />

<details>
<summary><strong>🌐 Web App</strong></summary>
<img width="75%" alt="Desktop - Movie Details" src="https://github.com/user-attachments/assets/44dd74d2-4a63-4dab-9992-b3a093fc8c95" />
<img width="75%" alt="Desktop - Search" src="https://github.com/user-attachments/assets/2c34ab8a-7e64-4fa5-823a-5448ddb2c9a2" />
</details>

<details>
<summary><strong>📱 iPhone Bookmark</strong></summary>
<img width="30%" alt="iPhone - Home Screen Bookmark/App" src="https://github.com/user-attachments/assets/f011e873-3405-4842-afc8-17da4d6fbef3" />
<img width="30%" alt="iPhone - Home" src="https://github.com/user-attachments/assets/e442ec2b-2ddf-4d82-a8ab-2722b3b8e636" />
<img width="30%" alt="iPhone - Search" src="https://github.com/user-attachments/assets/fd20ae2c-636c-4319-8577-6d244af9d5aa" />
</details>

<details>
<summary><strong>🖥️ macOS Desktop</strong></summary>
<img width="75%" alt="macOS App" src="https://github.com/user-attachments/assets/d9992ffd-f616-42d5-9f8c-31de3760e922"/>
<img width="75%" alt="macOS App" src="https://github.com/user-attachments/assets/5ec2ddcd-8b04-4f72-a8fa-644c811614fe"/>
</details>

<details>
<summary><strong>🖥️ Raycast</strong></summary>
<img width="20%" alt="macOS App" src="https://github.com/user-attachments/assets/087de7a2-6f89-4751-9918-345c27fd76c2"/>
<img width="70%" alt="macOS App" src="https://github.com/user-attachments/assets/5bf42bfd-0657-4ec8-b862-d4818fdc62f3"/>
</details>

## 🚀 Getting Started

### Option 1: Use the Official Instance

Simply visit **[onregardequoi.com](https://www.onregardequoi.com/)** and start exploring, no setup required.

### Option 2: Use the Desktop apps

Use the amazing [Pake](https://github.com/tw93/Pake) command line to create your own lightweight and fast desktop app for OnRegardeQuoi on macOS, Windows, or Linux. 
Check the Pake GitHub for more information about this very useful tool.
Additionally, you can download these desktop apps that I created myself:
- 🍎 macOS: [Download](https://github.com/mickaphd/Pake/actions/runs/21400998265/artifacts/5273300455)
- 💻 Windows: [Download](https://github.com/mickaphd/Pake/actions/runs/21402379220/artifacts/5273967324)

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

## 🎯 How Content is Selected

**OnRegardeQuoi** uses specific filters for each category to ensure high-quality and relevant content, such as a minimum rating or vote count. This is why listings may differ from those on the main TMDB website. These criteria will certainly evolve over time (Feel free to share your thoughts on this matter; I'm open to suggestions!).

## 🔒 Privacy Policy

- **No Personal Data** – There is no collection, storage, or transmission of any information, and no cookies or trackers are used. Only the privacy friendly script [GoatCounter](https://github.com/arp242/goatcounter) is tested 
- **Local Storage** – Movie and TV show data cached locally on your device for performance. Can be cleared anytime from browser settings or the app's "Refresh ↻" button
- **Third-Party Services** – Videos stream via YouTube's privacy-enhanced mode (`youtube-nocookie.com`), subject to YouTube's privacy policy obviously..

## 🐛 Issues

Found a bug or have a feature request? [Open an issue](https://github.com/mickaphd/OnRegardeQuoi/issues).

## 🙏 Acknowledgment

- [The Movie Database (TMDB)](https://www.themoviedb.org/) – Comprehensive movie and TV show data
- [JustWatch](https://www.justwatch.com/)(via TMDB API) for streaming availability
- [Vercel](https://vercel.com/) – Seamless and free hosting
- [Pake](https://github.com/tw93/Pake) - Turn any webpage into a desktop app 
