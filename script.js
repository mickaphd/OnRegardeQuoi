/* OnRegardeQuoi.com: a lightweight and open-source web app for discovering movies and TV shows */
/* Made with ❤ by micka from Paris */
/* v2.0 */


"use strict";

/* =========================================
   1. API CONFIGURATION & CORE UTILS
   Base settings to connect to the Movie Database (TMDB)
========================================= */
const API_CONFIG = {
  devKey: '', // Personal API Key
  tmdbDirectUrl: 'https://api.themoviedb.org/3', // Official TMDB URL
  vercelProxyUrl: '/api/tmdb-api' // Vercel proxy for deployment
};
const IMAGE_BASE = 'https://image.tmdb.org/t/p';
// A simple security utility to neutralize malicious hacker code injected into movie texts
const safeHTML = (str) => {
    if (!str) return 'N/A';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Automatically figures out the user's country
const getUserCountry = () => {
    try { return localStorage.getItem('orq_country') || navigator.language.split('-')[1]?.toUpperCase() || 'US'; }
    catch { return 'US'; }
};

// Creates and shows a small popup message at the bottom right of the screen
const showNotification = (message, type = 'error') => {
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 2000); // Disappears after 2 seconds
};

// Helper function to easily calculate dates for the API
const getFormattedDate = (daysOffset = 0, monthsOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setMonth(date.getMonth() + monthsOffset);
    return date.toISOString().split('T')[0];
};

/* =========================================
   2. DATA FILTERS & CACHE MANAGER
   Rules for API categories and local bookmarks management
========================================= */
// The exact rules sent to TMDB to build the Trending, Upcoming, and Top Rated lists
const DISCOVER_FILTERS = {
  movie: {
      trending: { sort_by: 'popularity.desc', 'primary_release_date.gte': getFormattedDate(-120), 'primary_release_date.lte': getFormattedDate(0), 'vote_count.gte': 50, 'vote_average.gte': 5 },
      upcoming: { sort_by: 'popularity.desc', 'primary_release_date.gte': getFormattedDate(1), 'primary_release_date.lte': getFormattedDate(0, 6) },
      top_rated: { sort_by: 'vote_average.desc', 'vote_count.gte': 5000 }
  },
  tv: {
      trending: { sort_by: 'popularity.desc', 'air_date.gte': getFormattedDate(-30), 'air_date.lte': getFormattedDate(0), 'vote_count.gte': 50, 'vote_average.gte': 5 },
      on_the_air: { sort_by: 'popularity.desc', 'first_air_date.gte': getFormattedDate(1), 'first_air_date.lte': getFormattedDate(0, 6) },
      top_rated: { sort_by: 'vote_average.desc', 'vote_count.gte': 2000 }
  }
};

// Handles saving, removing, and checking if a movie is in the user's Bookmarks
const cacheManager = {
  bookmarks: JSON.parse(localStorage.getItem('orq_bookmarks')) || [],
  saveBookmarks() { localStorage.setItem('orq_bookmarks', JSON.stringify(this.bookmarks)); },
  toggleBookmark(item) {
    const idx = this.bookmarks.findIndex(b => b.id === item.id);
    if (idx === -1) {
      this.bookmarks.push(item);
      showNotification(`${item.title || item.name} saved!`, 'success');
    } else {
      this.bookmarks.splice(idx, 1);
      showNotification(`${item.title || item.name} removed!`, 'success');
    }
    this.saveBookmarks();
  },
  isBookmarked(id) { return this.bookmarks.some(b => b.id === id); }
};

/* =========================================
   3. DOM SELECTORS & MODAL CONTROLLERS
   Connects JS to HTML elements and manages Popups
========================================= */
const SELECTORS = {
  GRID: 'poster-grid', CONTAINER: 'grid-container', MENU: 'menu', OVERLAY: 'overlay',
  SEARCH_INPUT: 'search-input', MOVIES_SUBMENU: 'movies-submenu', TV_SUBMENU: 'tv-submenu',
  MOVIES_ICON: 'movies-icon', TV_ICON: 'tv-icon', BTN: 'btn',
  MODAL_INFO: 'modal-info', MODAL_WATCH: 'modal-watch', MODAL_VIDEOS: 'modal-videos',
  MODAL_SETTINGS: 'modal-settings'
};

let selectedBtn = null;
let useInvidious = localStorage.getItem('orq_invidious') === 'true'; // Global state for Invidious player
let isLightMode = localStorage.getItem('orq_theme') === 'light'; // Global tracker for light layout setup

// A tool that creates open/close logic for any Modal (Popup) we need
const createModalController = (modalId) => ({
  open(item) {
    document.getElementById(modalId).classList.remove('hidden');
    document.body.classList.add('menu-open');
  },
   
  close(event) {
    if (event && event.target.id !== modalId) return; // Only close if clicking outside the modal
    document.getElementById(modalId).classList.add('hidden');
    document.body.classList.remove('menu-open');
  }
});

// All our specific popups and their behaviors
const modals = {
  info: createModalController(SELECTORS.MODAL_INFO),
  watch: createModalController(SELECTORS.MODAL_WATCH),
  videos: createModalController(SELECTORS.MODAL_VIDEOS),
  settings: createModalController(SELECTORS.MODAL_SETTINGS),
  openInfo(item) { this.info.open(item); loadAndRenderInfo(item); },
  closeInfo(event) { this.info.close(event); },
  openWatch(item) { this.watch.open(item); loadAndRenderWatch(item); },
  closeWatch(event) { this.watch.close(event); },
  openVideos(item) { this.videos.open(item); loadAndRenderVideos(item); },
  closeVideos(event) { this.videos.close(event); },
  openSettings() { this.settings.open(); updateInvidiousUI(); updateThemeUI(); }, // Refreshes button state when opening settings
  closeSettings(event) { this.settings.close(event); }
};

/* =========================================
   4. API FETCHING LOGIC
   The actual functions that reach out to the internet to get data
========================================= */
// The core fetch engine (chooses between direct connection or secure proxy)
async function apiFetch(tmdbEndpoint, params = {}) {
  try {
    if (API_CONFIG.devKey) {
      const url = new URL(API_CONFIG.tmdbDirectUrl + tmdbEndpoint);
      // NOTE: language is hardcoded to 'en-US' for now
      url.search = new URLSearchParams({ api_key: API_CONFIG.devKey, language: 'en-US', ...params }).toString();
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    } else {
      const res = await fetch(API_CONFIG.vercelProxyUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbEndpoint, queryParams: params })
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    }
  } catch (error) { 
      showNotification('Connection error...', 'error');
      return null; 
  }
}

// Specific fetch calls for different types of data needed in Modals
async function fetchDetails(type, id) { return await apiFetch(`/${type}/${id}`); }
async function fetchCredits(type, id) { return await apiFetch(`/${type}/${id}/credits`); }
async function fetchWatchProviders(type, id) {
  const data = await apiFetch(`/${type}/${id}/watch/providers`);
  return data?.results || null;
}
// Gets videos and sorts them logically (Trailer first, Featurettes last)
async function fetchAndSortVideos(type, id) {
  const data = await apiFetch(`/${type}/${id}/videos`);
  if (!data?.results || data.results.length === 0) return [];
  const priority = { 'Trailer': 7, 'Teaser': 6, 'Clip': 5, 'Featurette': 4, 'Behind the Scenes': 3, 'Promo': 2, 'Spot': 1 };
  return data.results.filter(v => v.site === 'YouTube').sort((a, b) => {
    const diff = (priority[b.type] || 0) - (priority[a.type] || 0);
    return diff !== 0 ? diff : new Date(b.published_at) - new Date(a.published_at);
  });
}

/* =========================================
   5. UI RENDERING (MODALS & PLAYER LOGIC)
   Takes the downloaded data and creates HTML inside popups & video player
========================================= */

// Renders the 'Info' popup (Synopsis, Cast, etc.)
async function loadAndRenderInfo(item) {
  const content = document.querySelector('#modal-info .content-area');
  const bookmarkBtn = document.getElementById('bookmark-btn');
  
  content.innerHTML = '<div class="text-center py-4"><div class="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>';
  
  const iconSolid = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z" clip-rule="evenodd" /></svg>`;
  const iconSlashed = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM20.25 5.507v11.561L5.853 2.671c.15-.043.306-.075.467-.094a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93ZM3.75 21V6.932l14.063 14.063L12 18.088l-7.165 3.583A.75.75 0 0 1 3.75 21Z" /></svg>`;

  const updateBookmarkUI = () => {
    const isSaved = cacheManager.isBookmarked(item.id);
    bookmarkBtn.innerHTML = isSaved ? iconSolid : iconSlashed;
    bookmarkBtn.className = isSaved 
        ? 'text-white hover:text-gray-300 transition-colors' 
        : 'text-gray-500 hover:text-white transition-colors';
  };

  updateBookmarkUI(); 
  
  bookmarkBtn.onclick = () => {
    cacheManager.toggleBookmark(item);
    updateBookmarkUI();
    if (app.currentType === 'bookmarks') app.showBookmarks(); 
  };
  
  try {
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const [details, credits] = await Promise.all([fetchDetails(type, item.id), fetchCredits(type, item.id)]);
    if (!details) throw new Error();
    
    const titleToSearch = encodeURIComponent(item.title || item.name);
    const year = (details.release_date || details.first_air_date || '').substring(0, 4);
    
    // Helpers to create clickable links for tags
    const createTagLink = (tag, val) => `<span class="clickable-meta" onclick="app.quickSearch('${tag}', '${val.replace(/'/g, "\\'")}')">${val}</span>`;
    // Helper to remove duplicates from names array and limit to 3 max
    const getUniqueNames = (arr) => [...new Set(arr.filter(Boolean))].slice(0, 3);

    const origLang = details.original_language ? details.original_language.toUpperCase() : 'N/A';
    const genres = details.genres?.map(g => createTagLink('g', g.name)).join(', ') || 'N/A';
    const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min/ep` : 'N/A');
    const rating = details.vote_average ? `${details.vote_average.toFixed(1)}/10 (${details.vote_count} votes)` : 'N/A';
    
    // People 
    const directorName = credits?.crew?.find(c => c.job === 'Director')?.name;
    const director = directorName ? createTagLink('cr', directorName) : null;
    
    const creators = details.created_by?.length ? details.created_by.slice(0, 3).map(c => createTagLink('cr', c.name)).join(', ') : null;
    
    const writersNames = credits?.crew?.filter(c => ['Screenplay', 'Writer', 'Teleplay'].includes(c.job) || c.department === 'Writing').map(c => c.name) || [];
    const uniqueWriters = getUniqueNames(writersNames);
    const writers = uniqueWriters.length ? uniqueWriters.map(w => createTagLink('cr', w)).join(', ') : null;

    const producersNames = credits?.crew?.filter(c => ['Producer', 'Executive Producer'].includes(c.job)).map(c => c.name) || [];
    const uniqueProducers = getUniqueNames(producersNames);
    const producers = uniqueProducers.length ? uniqueProducers.map(p => createTagLink('cr', p)).join(', ') : null;

    const cast = credits?.cast?.slice(0, 5).map(a => createTagLink('a', a.name)).join(', ') || 'N/A';
    
    const production = details.production_companies?.map(c => c.name).join(', ') || null;
    const status = details.status || 'N/A';
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const budget = details.budget ? formatter.format(details.budget) : null;
    const revenue = details.revenue ? formatter.format(details.revenue) : null;
    const seasons = type === 'tv' && details.number_of_seasons ? `${details.number_of_seasons} S. (${details.number_of_episodes} Ep.)` : null;
    
    content.innerHTML = `<div class="details-grid">
      <div class="detail-row"><span class="detail-label">Year</span><span class="detail-value">${year}</span></div>
      <div class="detail-row"><span class="detail-label">Language</span><span class="detail-value">${origLang}</span></div>
      <div class="detail-row"><span class="detail-label">Genres</span><span class="detail-value">${genres}</span></div>
      <div class="detail-row"><span class="detail-label">Runtime</span><span class="detail-value">${runtime}</span></div>
      <div class="detail-row"><span class="detail-label">Rating</span><span class="detail-value">${rating}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${status}</span></div>
      ${seasons ? `<div class="detail-row"><span class="detail-label">Seasons</span><span class="detail-value">${seasons}</span></div>` : ''}
      
      ${director ? `<div class="detail-row"><span class="detail-label">Director</span><span class="detail-value">${director}</span></div>` : ''}
      ${creators ? `<div class="detail-row"><span class="detail-label">Creator</span><span class="detail-value">${creators}</span></div>` : ''}
      ${writers ? `<div class="detail-row"><span class="detail-label">Writer</span><span class="detail-value">${writers}</span></div>` : ''}
      ${producers ? `<div class="detail-row"><span class="detail-label">Producer</span><span class="detail-value">${producers}</span></div>` : ''}
      
      <div class="detail-row"><span class="detail-label">Cast</span><span class="detail-value">${cast}</span></div>
      ${budget ? `<div class="detail-row"><span class="detail-label">Budget</span><span class="detail-value">${budget}</span></div>` : ''}
      ${revenue ? `<div class="detail-row"><span class="detail-label">Revenue</span><span class="detail-value">${revenue}</span></div>` : ''}
      ${production ? `<div class="detail-row"><span class="detail-label">Production</span><span class="detail-value">${safeHTML(production)}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">Synopsis</span><span class="detail-value">${safeHTML(details.overview)}</span></div>
      
      <div class="detail-row pt-3">
        <span class="detail-label">Shortcuts</span>
        <span class="detail-value flex flex-wrap items-center gap-4">
            <a href="https://www.rottentomatoes.com/search?search=${titleToSearch}" target="_blank" title="Search on Rotten Tomatoes" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/rottentomatoes.svg" alt="Rotten Tomatoes" class="w-5 h-5 invert">
            </a>
            <a href="https://www.imdb.com/find/?q=${titleToSearch}" target="_blank" title="Search on IMDb" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/imdb.svg" alt="IMDb" class="w-5 h-5 invert">
            </a>
            <a href="https://www.metacritic.com/search/${titleToSearch}/" target="_blank" title="Search on Metacritic" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/metacritic.svg" alt="Metacritic" class="w-5 h-5 invert">
            </a>
            <a href="https://www.themoviedb.org/${type}/${item.id}" target="_blank" title="View on TMDB" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/themoviedatabase.svg" alt="TMDB" class="w-5 h-5 invert">
            </a>
            <a href="https://www.youtube.com/results?search_query=${titleToSearch}" target="_blank" title="Search on YouTube" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/youtube.svg" alt="YouTube" class="w-5 h-5 invert">
            </a>
            <a href="https://www.dailymotion.com/search/${titleToSearch}" target="_blank" title="Search on Dailymotion" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/dailymotion.svg" alt="Dailymotion" class="w-5 h-5 invert">
            </a>
            <a href="https://letterboxd.com/search/${titleToSearch}" target="_blank" title="Search on Letterboxd" class="opacity-70 hover:opacity-100 hover:scale-110 transition-all">
                <img src="ressources/letterboxd.svg" alt="Letterboxd" class="w-5 h-5 invert">
            </a>
        </span>
      </div>
      
    </div>`;
  } catch {
    content.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">Data unavailable.</p>';
  }
}

// Renders the 'Where to watch' popup (Streaming platforms)
async function loadAndRenderWatch(item) {
  const content = document.querySelector('#modal-watch .content-area');
  const select = document.getElementById('watch-country');
  content.innerHTML = '<div class="text-center py-4"><div class="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>';
  select.classList.add('hidden');
  
  try {
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const providers = await fetchWatchProviders(type, item.id);
    
    if (!providers || Object.keys(providers).length === 0) {
      content.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">Not available on any streaming service yet.</p>'; return;
    }
    
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const countries = Object.keys(providers).sort((a,b) => (names.of(a)||a).localeCompare(names.of(b)||b));
    let currentCountry = getUserCountry();
    if (!countries.includes(currentCountry)) currentCountry = countries[0];
    
    select.innerHTML = countries.map(c => `<option value="${c}" ${c === currentCountry ? 'selected' : ''}>${names.of(c) || c}</option>`).join('');
    select.classList.remove('hidden');
    
    const renderProviders = (code) => {
      const data = providers[code];
      if (!data) return;
      let html = '<div class="provider-grid">';
      ['flatrate', 'rent', 'buy'].forEach(type => {
        if (data[type]?.length) {
          html += `<div class="provider-type"><span class="provider-label">${type === 'flatrate' ? 'Stream' : type}</span><div class="provider-list">`;
          data[type].forEach(p => { html += `<div class="provider-item" title="${p.provider_name}"><img src="${IMAGE_BASE}/w92${p.logo_path}" alt="${p.provider_name}"></div>`; });
          html += `</div></div>`;
        }
      });
      html += '</div>';
      html += `<div class="mt-6 text-center text-[10px] text-gray-500">Powered by <span class="text-yellow-500 font-semibold">JustWatch</span></div>`;
      content.innerHTML = html;
    };
    
    renderProviders(currentCountry);
    select.onchange = (e) => {
      localStorage.setItem('orq_country', e.target.value);
      renderProviders(e.target.value);
    };
  } catch {
    content.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">Failed to load streaming data.</p>';
  }
}

// Renders the 'Videos' popup (List of additional clips from TMDB)
async function loadAndRenderVideos(item) {
  const content = document.querySelector('#modal-videos .content-area');
  content.innerHTML = '<div class="text-center py-4"><div class="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div></div>';
  
  try {
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const videos = await fetchAndSortVideos(type, item.id);
    
    if (!videos || videos.length === 0) { content.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">No videos available.</p>'; return; }
    
    let html = '<div class="videos-list">';
    videos.forEach(v => {
      const date = new Date(v.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      html += `
        <div class="video-item" data-key="${v.key}" data-title="${v.name.replace(/"/g, '&quot;')}">
          <span class="video-title" title="${v.name}">${v.name}</span>
          <div class="video-meta">
              <span class="video-date">${date}</span>
              <span class="video-badge">${v.type}</span>
          </div>
        </div>`;
    });
    html += '</div>';
    content.innerHTML = html;
    
    content.querySelectorAll('.video-item').forEach(item => {
      item.addEventListener('click', () => {
        modals.closeVideos();
        playVideoWithPlayer(item.dataset.key, item.dataset.title);
      });
    });
  } catch {
    content.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">Failed to load videos.</p>';
  }
}

// Finds the absolute best trailer and launches it (Direct Poster Click)
async function playDirectTrailer(item, posterElement) {
  if (posterElement.dataset.loading) return; 
  posterElement.dataset.loading = "true";
  
  const loader = document.createElement('div');
  loader.className = 'absolute inset-0 bg-black/60 flex items-center justify-center z-20';
  loader.innerHTML = '<div class="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>';
  posterElement.appendChild(loader);
  
  try {
    const type = item.media_type || (item.title ? 'movie' : 'tv');
    const data = await apiFetch(`/${type}/${item.id}/videos`);
    const videos = (data?.results || [])
      .filter(v => v.site === 'YouTube')
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    
    if (videos.length === 0) { showNotification('No video found', 'error'); return; }
    
    const best = videos.find(v => v.name.toLowerCase().includes('official trailer') && !v.name.includes('2') && !v.name.includes('3'))
      || videos.find(v => v.name.toLowerCase().includes('official trailer 2'))
      || videos.find(v => v.name.toLowerCase().includes('final trailer') && !v.name.includes('2') && !v.name.includes('3'))
      || videos.find(v => v.name.toLowerCase().includes('final trailer 2'))
      || videos.find(v => v.type === 'Trailer')
      || videos.find(v => v.type === 'Teaser')
      || videos[0];
      
    playVideoWithPlayer(best.key, best.name);
  } catch (error) { showNotification('Network error, please try again.', 'error');
  } finally { loader.remove(); delete posterElement.dataset.loading; }
}

// Injects the YouTube ID into the HTML player OR opens Invidious if setting is active
function playVideoWithPlayer(key, title) {
  if (useInvidious) {
      window.open(`https://inv.nadeko.net/watch?v=${key}`, '_blank');
      return;
  }
  const container = document.getElementById('player-container');
  container.innerHTML = `<lite-youtube videoid="${key}" title="${title}" nocookie></lite-youtube>`;
  document.getElementById('modal-player').classList.remove('hidden');
  document.body.classList.add('menu-open');
}

// Completely deletes the player to stop sound immediately upon closing
function closeVideoPlayer(e) {
  if (e && e.target.id !== 'modal-player') return;
  document.getElementById('player-container').innerHTML = '';
  document.getElementById('modal-player').classList.add('hidden');
  document.body.classList.remove('menu-open');
}

/* =========================================
   6. SETTINGS & DATA MANAGEMENT
   Export, Import, Invidious Toggle & Cache Clearing
========================================= */

function exportBookmarks() {
    if (cacheManager.bookmarks.length === 0) { showNotification("No bookmarks to export.", "error"); return; }
    // Cleaned up export string: No version info anymore
    const data = { app: "OnRegardeQuoi.com", date: new Date().toISOString(), count: cacheManager.bookmarks.length, bookmarks: cacheManager.bookmarks };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `onregardequoi_bookmarks_${getFormattedDate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification(`Exported ${data.count} bookmarks!`, 'success');
}

document.getElementById('import-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const json = JSON.parse(event.target.result);
            if (!json.bookmarks || !Array.isArray(json.bookmarks)) throw new Error();
            let added = 0;
            json.bookmarks.forEach(item => {
                if (!cacheManager.isBookmarked(item.id)) { cacheManager.bookmarks.push(item); added++; }
            });
            cacheManager.saveBookmarks();
            showNotification(`Imported ${added} new bookmarks!`, 'success');
            if (app.currentType === 'bookmarks') app.showBookmarks();
        } catch (err) { showNotification('Invalid backup file.', 'error'); }
    };
    reader.readAsText(file);
    this.value = ''; 
});

function toggleInvidious() {
    useInvidious = !useInvidious;
    localStorage.setItem('orq_invidious', useInvidious);
    updateInvidiousUI();
}

function updateInvidiousUI() {
    const btn = document.getElementById('btn-invidious');
    if (!btn) return;
    const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" /></svg>`;
    
    if (useInvidious) {
        btn.classList.add('bg-green-500/10', 'text-green-400', 'border-green-500/20');
        btn.classList.remove('bg-white/5', 'text-white', 'border-white/5');
        btn.innerHTML = `Invidious Player: ON ${svgIcon}`;
    } else {
        btn.classList.remove('bg-green-500/10', 'text-green-400', 'border-green-500/20');
        btn.classList.add('bg-white/5', 'text-white', 'border-white/5');
        btn.innerHTML = `Invidious Player: OFF ${svgIcon}`;
    }
}

// Switches theme binary states and saves choice persistently inside the browser cache
function toggleTheme() {
    isLightMode = !isLightMode;
    localStorage.setItem('orq_theme', isLightMode ? 'light' : 'dark');
    applyTheme();
}

// Controls DOM class append configurations on the body wrapper to activate light styles
function applyTheme() {
    if (isLightMode) {
        document.body.classList.add('light');
    } else {
        document.body.classList.remove('light');
    }
    updateThemeUI();
}

// Injects dynamic label descriptions and icon variations inside the layout settings menu
function updateThemeUI() {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    
    // Official solid Heroicons paths sized uniformly at w-4 h-4 for your layout profile
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" /></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clip-rule="evenodd" /></svg>`;
    
    if (isLightMode) {
        btn.innerHTML = `Theme: Light Mode ${sunIcon}`;
    } else {
        btn.innerHTML = `Theme: Dark Mode ${moonIcon}`;
    }
}

/* =========================================
   7. MAIN APPLICATION STATE & ENGINE
========================================= */
const app = {
  menu: document.getElementById(SELECTORS.MENU), overlay: document.getElementById(SELECTORS.OVERLAY),
  grid: document.getElementById(SELECTORS.GRID), container: document.getElementById(SELECTORS.CONTAINER),
  searchInput: document.getElementById(SELECTORS.SEARCH_INPUT),
  
  cache: {}, history: {}, 
  currentType: null, currentCategory: null, currentPage: 1, items: [], loading: false, hasMore: true, currentSearch: null,

  saveCurrentState() {
      if (!this.currentType) return;
      let stateKey = '';
      if (this.currentType === 'search') stateKey = `search-${JSON.stringify(this.currentSearch)}`;
      else if (this.currentType === 'bookmarks') stateKey = 'bookmarks';
      else stateKey = `${this.currentType}-${this.currentCategory}`;

      this.history[stateKey] = {
          items: [...this.items],
          page: this.currentPage,
          scrollY: window.scrollY,
          hasMore: this.hasMore
      };
  },

  toggleMenu() {
    this.menu.classList.toggle('hidden'); this.overlay.classList.toggle('hidden');
    this.menu.classList.toggle('open'); document.body.classList.toggle('menu-open');
    if (this.menu.classList.contains('hidden')) { 
      this.searchInput.value = '';
      document.getElementById(SELECTORS.MOVIES_SUBMENU).classList.add('hidden');
      document.getElementById(SELECTORS.TV_SUBMENU).classList.add('hidden');
      document.getElementById(SELECTORS.MOVIES_ICON).classList.remove('rotate-180');
      document.getElementById(SELECTORS.TV_ICON).classList.remove('rotate-180');
      if (selectedBtn) selectedBtn.classList.remove('text-yellow-500');
      selectedBtn = null;
    }
  },

  toggle(name) {
    const sub = document.getElementById(`${name}-submenu`);
    const isHidden = sub.classList.contains('hidden');
    if (isHidden) {
      const otherName = name === 'movies' ? 'tv' : 'movies';
      const otherSub = document.getElementById(`${otherName}-submenu`);
      if (!otherSub.classList.contains('hidden')) {
        otherSub.classList.add('hidden');
        document.getElementById(`${otherName}-icon`).classList.remove('rotate-180');
      }
    }
    document.getElementById(`${name}-icon`).classList.toggle('rotate-180');
    sub.classList.toggle('hidden');
    if (selectedBtn) selectedBtn.classList.remove('text-yellow-500');
    selectedBtn = null;
  },

  async load(type, category) {
    this.saveCurrentState();
    this.currentType = type; 
    this.currentCategory = category;
    
    const stateKey = `${type}-${category}`;
    const pastState = this.history[stateKey];

    if (pastState) {
        this.items = [...pastState.items];
        this.currentPage = pastState.page;
        this.hasMore = pastState.hasMore;
        this.grid.innerHTML = '';
        this.render(this.items);
        setTimeout(() => window.scrollTo(0, pastState.scrollY), 0);
    } else {
        this.currentPage = 1; this.items = []; this.hasMore = true;
        this.grid.innerHTML = ''; window.scrollTo(0, 0); 
        await this.fetchMore();
    }
  },

  async loadAndToggle(type, category) { await this.load(type, category); this.toggleMenu(); },

  async fetchMore() {
    if (this.loading || !this.hasMore) return;
    this.loading = true;
    
    const cacheKey = this.currentType === 'search' 
        ? `search-${JSON.stringify(this.currentSearch)}-${this.currentPage}`
        : `${this.currentType}-${this.currentCategory}-${this.currentPage}`;
    
    if (Object.keys(this.cache).length > 20) {
      const oldestKey = Object.keys(this.cache)[0];
      delete this.cache[oldestKey];
    }
    
    try {
      if (!this.cache[cacheKey]) {
        const endpoint = this.currentType === 'search' ? this.currentSearch.endpoint : `/discover/${this.currentType}`;
        const params = this.currentType === 'search' 
            ? { ...this.currentSearch.params, page: this.currentPage } 
            : { ...DISCOVER_FILTERS[this.currentType][this.currentCategory], page: this.currentPage };
            
        const data = await apiFetch(endpoint, params);
        this.cache[cacheKey] = (data.results || []).filter(r => r.poster_path && r.media_type !== 'person'); 
        if(this.currentPage >= data.total_pages || data.results.length === 0) this.hasMore = false;
      }
      
      const existingIds = new Set(this.items.map(i => i.id));
      const newItems = this.cache[cacheKey].filter(item => !existingIds.has(item.id));
      this.items.push(...newItems);
      this.render(newItems);
      
      if (this.items.length === 0 && this.currentPage === 1) showNotification('No results found.', 'error');
      this.currentPage++;
      
    } catch (e) { showNotification('Network error.', 'error'); }
    this.loading = false;
  },

  async search(query) {
    if (!query.trim()) return;
    this.saveCurrentState();

    let textStr = query;
    let year = null, genre = null, actor = null, crew = null, country = null, forceType = null;
    
    textStr = textStr.replace(/y:(\d{4})/i, (m, val) => { year = val; return ''; });
    textStr = textStr.replace(/g:([a-zÀ-ÿ\- ]+?)(?=\s+[a-z]:|$)/i, (m, val) => { genre = val.trim(); return ''; });
    textStr = textStr.replace(/a:([a-zÀ-ÿ\- ]+?)(?=\s+[a-z]:|$)/i, (m, val) => { actor = val.trim(); return ''; });
    textStr = textStr.replace(/cr:([a-zÀ-ÿ\- ]+?)(?=\s+[a-z]:|$)/i, (m, val) => { crew = val.trim(); return ''; }); 
    textStr = textStr.replace(/c:([a-zÀ-ÿ\- ]+?)(?=\s+[a-z]:|$)/i, (m, val) => { country = val.trim().toLowerCase(); return ''; }); 
    textStr = textStr.replace(/t:(tv|m)(?=\s|$)/i, (m, val) => { forceType = val.toLowerCase() === 'tv' ? 'tv' : 'movie'; return ''; }); 
    textStr = textStr.trim();

    let endpoint = '/search/multi';
    let params = { query: textStr };

    const isAdvanced = genre || actor || crew || country || (!textStr && year);
    const targetType = forceType || 'movie'; 

    if (isAdvanced) {
        if (textStr) showNotification('Title ignored when using advanced tags.', 'error');
        endpoint = `/discover/${targetType}`;
        params = { sort_by: 'popularity.desc' };
        
        if (year) params[targetType === 'tv' ? 'first_air_date_year' : 'primary_release_year'] = year;
        
        if (country) {
            const COUNTRIES = { fr: 'FR', france: 'FR', us: 'US', usa: 'US', uk: 'GB', gb: 'GB', kr: 'KR', korea: 'KR', jp: 'JP', japan: 'JP', it: 'IT', italy: 'IT', es: 'ES', spain: 'ES', de: 'DE', germany: 'DE', ca: 'CA', canada: 'CA', in: 'IN', india: 'IN' };
            const cKey = Object.keys(COUNTRIES).find(k => country.includes(k) || k.includes(country));
            if (cKey) params.with_origin_country = COUNTRIES[cKey];
            else showNotification(`Country "${country}" not recognized.`, 'error');
        }

        if (genre) {
            const GENRES = { action: 28, adv: 12, anim: 16, com: 35, crim: 80, doc: 99, dram: 18, fam: 10751, fan: 14, hist: 36, hor: 27, mus: 10402, mys: 9648, rom: 10749, sci: 878, sf: 878, thril: 53, war: 10752, west: 37 };
            if (targetType === 'tv') { GENRES.action = 10759; GENRES.adv = 10759; GENRES.sci = 10765; GENRES.sf = 10765; }
            
            const gKey = Object.keys(GENRES).find(k => genre.toLowerCase().includes(k));
            if (gKey) params.with_genres = GENRES[gKey];
            else showNotification(`Genre "${genre}" not recognized.`, 'error');
        }
        
        const getPersonIds = async (name) => {
            const res = await apiFetch('/search/person', { query: name });
            if (!res?.results?.length) return null;
            return res.results.slice(0, 3).map(p => p.id).join('|');
        };

        if (actor) {
            const ids = await getPersonIds(actor);
            if (ids) params.with_cast = ids; else showNotification(`Actor "${actor}" not found.`, 'error');
        }
        if (crew) {
            const ids = await getPersonIds(crew);
            if (ids) params.with_crew = ids; else showNotification(`Crew "${crew}" not found.`, 'error');
        }
    } 
    else if (forceType) {
        endpoint = `/search/${forceType}`;
        if (year) params[forceType === 'tv' ? 'first_air_date_year' : 'primary_release_year'] = year;
    } 
    else if (year && textStr) {
        endpoint = '/search/movie';
        params.primary_release_year = year;
    }
    
    this.currentType = 'search'; this.currentCategory = null; 
    this.currentSearch = { endpoint, params };

    const stateKey = `search-${JSON.stringify(this.currentSearch)}`;
    const pastState = this.history[stateKey];

    if (pastState) {
        this.items = [...pastState.items];
        this.currentPage = pastState.page;
        this.hasMore = pastState.hasMore;
        this.grid.innerHTML = '';
        this.render(this.items);
        setTimeout(() => window.scrollTo(0, pastState.scrollY), 0);
    } else {
        this.currentPage = 1; this.items = []; this.hasMore = true;
        this.grid.innerHTML = ''; window.scrollTo(0, 0); 
        await this.fetchMore();
    }
  },

  // Rapidly triggers a search via a metadata tag (a:, cr:, g:) and closes modal
  quickSearch(tag, value) {
      modals.closeInfo();
      this.searchInput.value = `${tag}:${value}`;
      this.search(this.searchInput.value);
  },

  showBookmarks() {
    this.saveCurrentState();
    this.currentType = 'bookmarks';
    this.currentCategory = null; 

    const pastState = this.history['bookmarks'];
    this.items = cacheManager.bookmarks; 
    this.grid.innerHTML = ''; 
    this.render(this.items);

    if (pastState) {
        setTimeout(() => window.scrollTo(0, pastState.scrollY), 0);
    } else {
        window.scrollTo(0, 0); 
    }
  },
  
  showSettings() { modals.openSettings(); },
  
  async clearCacheAndReset() {
      if (confirm("Are you sure? This will clear all cached data, settings, and bookmarks.")) {
          localStorage.clear();
          sessionStorage.clear();
          if ('caches' in window) {
              try {
                  const cacheNames = await caches.keys();
                  await Promise.all(cacheNames.map(name => caches.delete(name)));
              } catch (e) { console.error('Cache clear failed:', e); }
          }
          window.location.reload();
      }
  },

  render(itemsToRender) {
    const html = itemsToRender.map(item => `
      <div class="poster" data-id="${item.id}">
        <img srcset="${IMAGE_BASE}/w185${item.poster_path} 185w, ${IMAGE_BASE}/w342${item.poster_path} 342w" src="${IMAGE_BASE}/w342${item.poster_path}" loading="lazy" decoding="async" alt="Poster">
        <div class="poster-actions">
          <button class="action-btn" data-action="info" aria-label="Info"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 .75a8.25 8.25 0 0 0-4.135 15.39c.686.398 1.115 1.008 1.134 1.623a.75.75 0 0 0 .577.706c.352.083.71.148 1.074.195.323.041.6-.218.6-.544v-4.661a6.714 6.714 0 0 1-.937-.171.75.75 0 1 1 .374-1.453 5.261 5.261 0 0 0 2.626 0 .75.75 0 1 1 .374 1.452 6.712 6.712 0 0 1-.937.172v4.66c0 .327.277.586.6.545.364-.047.722-.112 1.074-.195a.75.75 0 0 0 .577-.706c.02-.615.448-1.225 1.134-1.623A8.25 8.25 0 0 0 12 .75Z" /><path fill-rule="evenodd" d="M9.013 19.9a.75.75 0 0 1 .877-.597 11.319 11.319 0 0 0 4.22 0 .75.75 0 1 1 .28 1.473 12.819 12.819 0 0 1-4.78 0 .75.75 0 0 1-.597-.876ZM9.754 22.344a.75.75 0 0 1 .824-.668 13.682 13.682 0 0 0 2.844 0 .75.75 0 1 1 .156 1.492 15.156 15.156 0 0 1-3.156 0 .75.75 0 0 1-.668-.824Z" clip-rule="evenodd" /></svg></button>
          <button class="action-btn" data-action="watch" aria-label="Watch"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" /></svg></button>
          <button class="action-btn" data-action="videos" aria-label="Videos"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5"><path d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" /></svg></button>
        </div>
      </div>
    `).join('');
    this.grid.insertAdjacentHTML('beforeend', html);
  }
};

/* =========================================
   8. EVENT LISTENERS & INFINITE SCROLL
========================================= */

app.grid.addEventListener('click', (e) => {
  const poster = e.target.closest('.poster');
  if (!poster) return;
  const id = parseInt(poster.dataset.id);
  const item = app.items.find(i => i.id === id) || cacheManager.bookmarks.find(i => i.id === id);
  if (!item) return;
  
  const btn = e.target.closest('.action-btn');
  if (btn) {
    e.stopPropagation();
    const action = btn.dataset.action;
    if (action === 'info') modals.openInfo(item);
    if (action === 'watch') modals.openWatch(item);
    if (action === 'videos') modals.openVideos(item);
} else {
      // Smart check: If the device uses a mouse (desktop), play instantly on 1 click.
      // If it's a touch screen (mobile), preserve the original 2-tap safety system.
      const isDesktop = window.matchMedia('(hover: hover)').matches;

      if (isDesktop) {
          playDirectTrailer(item, poster);
      } else {
          const wasActive = poster.classList.contains('active');
          
          document.querySelectorAll('.poster.active').forEach(p => p !== poster && p.classList.remove('active'));
          
          if (!wasActive) {
              // 1st touch
              poster.classList.add('active');
          } else {
              // 2nd touch
              playDirectTrailer(item, poster);
          }
      }
    }
});

// Remove stuck active states on scroll or outside click (Fix for touch devices)
window.addEventListener('scroll', () => {
    document.querySelectorAll('.poster.active').forEach(p => p.classList.remove('active'));
}, { passive: true });

document.addEventListener('click', (e) => {
    if (!e.target.closest('.poster')) {
        document.querySelectorAll('.poster.active').forEach(p => p.classList.remove('active'));
    }
});

const observer = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && app.currentType !== 'bookmarks') {
      app.fetchMore();
  }
}, { root: null, threshold: 0.1 }); 
observer.observe(document.getElementById('scroll-sentinel'));

/* =========================================
   9. KEYBOARD SHORTCUTS
========================================= */

document.getElementById(SELECTORS.BTN).addEventListener('click', e => { e.stopPropagation(); app.toggleMenu(); });
app.overlay.addEventListener('click', () => app.toggleMenu());
app.searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { app.search(app.searchInput.value); app.toggleMenu(); } });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!document.getElementById('modal-player').classList.contains('hidden')) { closeVideoPlayer(); }
    else if (!document.getElementById('modal-info').classList.contains('hidden')) { modals.closeInfo(); }
    else if (!document.getElementById('modal-watch').classList.contains('hidden')) { modals.closeWatch(); }
    else if (!document.getElementById('modal-videos').classList.contains('hidden')) { modals.closeVideos(); }
    else if (!document.getElementById('modal-settings').classList.contains('hidden')) { modals.closeSettings(); }
    else if (!app.menu.classList.contains('hidden')) { app.toggleMenu(); }
    return;
  }
  if (e.target === app.searchInput && e.key !== ' ') return;
  if (e.key === ' ' && e.target !== app.searchInput) {
    e.preventDefault();
    if (app.menu.classList.contains('hidden')) app.toggleMenu();
    setTimeout(() => app.searchInput.focus(), 100);
  }
  if (e.key.toLowerCase() === 'm') {
    e.preventDefault(); app.searchInput.blur();
    if (selectedBtn) selectedBtn.classList.remove('text-yellow-500');
    if (app.menu.classList.contains('hidden')) app.toggleMenu();
    const sub = document.getElementById(SELECTORS.MOVIES_SUBMENU);
    const tvSub = document.getElementById(SELECTORS.TV_SUBMENU);
    if (!tvSub.classList.contains('hidden')) { tvSub.classList.add('hidden'); document.getElementById(SELECTORS.TV_ICON).classList.remove('rotate-180'); }
    if (sub.classList.contains('hidden')) app.toggle('movies');
    selectedBtn = sub.querySelector('button');
    if (selectedBtn) selectedBtn.classList.add('text-yellow-500');
  }
  if (e.key.toLowerCase() === 't') {
    e.preventDefault(); app.searchInput.blur();
    if (selectedBtn) selectedBtn.classList.remove('text-yellow-500');
    if (app.menu.classList.contains('hidden')) app.toggleMenu();
    const sub = document.getElementById(SELECTORS.TV_SUBMENU);
    const moviesSub = document.getElementById(SELECTORS.MOVIES_SUBMENU);
    if (!moviesSub.classList.contains('hidden')) { moviesSub.classList.add('hidden'); document.getElementById(SELECTORS.MOVIES_ICON).classList.remove('rotate-180'); }
    if (sub.classList.contains('hidden')) app.toggle('tv');
    selectedBtn = sub.querySelector('button');
    if (selectedBtn) selectedBtn.classList.add('text-yellow-500');
  }
  if (e.key.toLowerCase() === 's') { e.preventDefault(); app.searchInput.blur(); app.showSettings(); if (!app.menu.classList.contains('hidden')) app.toggleMenu(); }
  if (e.key.toLowerCase() === 'b') { e.preventDefault(); app.searchInput.blur(); app.showBookmarks(); if (!app.menu.classList.contains('hidden')) app.toggleMenu(); }
  
  if (e.key === 'Enter' && selectedBtn) selectedBtn.click();
  if (e.key === 'ArrowDown' && selectedBtn) {
    e.preventDefault();
    const buttons = Array.from(selectedBtn.parentElement.querySelectorAll('button'));
    const idx = buttons.indexOf(selectedBtn);
    const next = Math.min(idx + 1, buttons.length - 1);
    selectedBtn.classList.remove('text-yellow-500');
    selectedBtn = buttons[next];
    selectedBtn.classList.add('text-yellow-500');
  }
  if (e.key === 'ArrowUp' && selectedBtn) {
    e.preventDefault();
    const buttons = Array.from(selectedBtn.parentElement.querySelectorAll('button'));
    const idx = buttons.indexOf(selectedBtn);
    const next = Math.max(idx - 1, 0);
    selectedBtn.classList.remove('text-yellow-500');
    selectedBtn = buttons[next];
    selectedBtn.classList.add('text-yellow-500');
  }
  if (e.key === 'ArrowDown' && !selectedBtn) window.scrollBy({ top: 200, behavior: 'smooth' });
  if (e.key === 'ArrowUp' && !selectedBtn) window.scrollBy({ top: -200, behavior: 'smooth' });
});

/* =========================================
   10. APP INITIALIZATION & PWA
========================================= */

const urlParams = new URLSearchParams(window.location.search);
const query = urlParams.get('q');

if (query) {
    app.searchInput.value = query;
    app.search(query);
    window.history.replaceState({}, document.title, window.location.pathname);
} else {
    app.load('movie', 'trending');
}
applyTheme(); // Fire on system boot to trigger local cached theme choices immediately

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('PWA Service Worker registered:', reg.scope))
            .catch(err => console.warn('PWA Registration failed:', err));
    });
}
