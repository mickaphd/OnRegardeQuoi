/* ===== API CONFIGURATION ===== */
// Dev mode: Add your API key here for local testing
// Prod mode: Leave devKey empty - uses Vercel proxy with server-side env var
const API_CONFIG = {
  devKey: 'fe728e34b4e492c1e47161b6a939683f', // EMPTY for production (uses Vercel), add key for local dev
  tmdbDirectUrl: 'https://api.themoviedb.org/3',
  vercelProxyUrl: '/api/tmdb-api'
};

const IMAGE_BASE = 'https://image.tmdb.org/t/p';


/* ===== UI SELECTORS ===== */
const SELECTORS = {
  GRID: 'grid-container',
  MENU: 'menu',
  OVERLAY: 'overlay',
  SEARCH_INPUT: 'search-input',
  MOVIES_SUBMENU: 'movies-submenu',
  TV_SUBMENU: 'tv-submenu',
  MOVIES_ICON: 'movies-icon',
  TV_ICON: 'tv-icon',
  BTN: 'btn',
  MODAL_INFO: 'modal-info',
  MODAL_WATCH: 'modal-watch',
  MODAL_VIDEOS: 'modal-videos'
};

/* ===== GLOBAL STATE ===== */
let selectedBtn = null;
let currentPosterData = null;

/* ===== UTILITY: NOTIFICATIONS ===== */
const showNotification = (message, type = 'error') => {
  const div = document.createElement('div');
  div.className = `notification ${type}`;
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
};

/* ===== UTILITY: GENERIC MODAL CONTROLLER ===== */
const createModalController = (modalId) => ({
  open(item) {
    currentPosterData = item;
    document.getElementById(modalId).classList.remove('hidden');
    document.body.classList.add('menu-open');
  },
  close(event) {
    if (event && event.target.id !== modalId) return;
    document.getElementById(modalId).classList.add('hidden');
    document.body.classList.remove('menu-open');
  }
});

/* ============================================
   MODALS MANAGEMENT OBJECT
   Handles opening and closing of all modal windows
   ============================================ */
const modals = {
  info: createModalController(SELECTORS.MODAL_INFO),
  watch: createModalController(SELECTORS.MODAL_WATCH),
  videos: createModalController(SELECTORS.MODAL_VIDEOS),

  openInfo(item) {
    this.info.open(item);
    loadAndRenderInfo(item);
  },
  closeInfo(event) {
    this.info.close(event);
  },
  openWatch(item) {
    this.watch.open(item);
    loadAndRenderWatch(item);
  },
  closeWatch(event) {
    this.watch.close(event);
  },
  openVideos(item) {
    this.videos.open(item);
    loadAndRenderVideos(item);
  },
  closeVideos(event) {
    this.videos.close(event);
  }
};

/* ============================================
   API FUNCTIONS
   Centralized fetch wrapper & data fetching
   ============================================ */

/**
 * Fetch data from TMDB API
 * If devKey exists: uses direct API (dev mode)
 * If devKey empty: uses Vercel proxy (prod mode)
 */
async function apiFetch(tmdbEndpoint, params = {}) {
  try {
    if (API_CONFIG.devKey) {
      // Development: Direct API call with hardcoded key
      const allParams = {
        api_key: API_CONFIG.devKey,
        language: 'en-US',
        ...params
      };
      const url = new URL(API_CONFIG.tmdbDirectUrl + tmdbEndpoint);
      url.search = new URLSearchParams(allParams).toString();
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
      
    } else {
      // Production: Use Vercel proxy with server-side API key
      const response = await fetch(API_CONFIG.vercelProxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbEndpoint,
          queryParams: params
        })
      });
      
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return await response.json();
    }
  } catch (error) {
    console.error('API fetch error:', error);
    return null;
  }
}


/**
 * Fetch complete details for a movie or TV show
 */
async function fetchDetails(type, id) {
  return await apiFetch(`/${type}/${id}`);
}

/**
 * Fetch credits (cast and crew) for a movie or TV show
 */
async function fetchCredits(type, id) {
  return await apiFetch(`/${type}/${id}/credits`);
}

/**
 * Fetch all videos and sort by type and date
 * Priority: Trailer > Teaser > Featurette > Clip > BTS > Promo > Spot
 */
async function fetchAndSortVideos(type, id) {
  const data = await apiFetch(`/${type}/${id}/videos`);
  
  if (!data?.results || data.results.length === 0) return [];

  const videoPriority = {
    'Trailer': 6,
    'Teaser': 5,
    'Featurette': 4,
    'Clip': 3,
    'Behind the Scenes': 2,
    'Promo': 1,
    'Spot': 0
  };

  return data.results
    .filter(v => v.site === 'YouTube')
    .sort((a, b) => {
      const priorityDiff = (videoPriority[b.type] || -1) - (videoPriority[a.type] || -1);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.published_at) - new Date(a.published_at);
    });
}

/**
 * Fetch watch providers (streaming, rent, buy) from TMDB
 */
async function fetchWatchProviders(type, id) {
  const data = await apiFetch(`/${type}/${id}/watch/providers`);
  return data?.results || null;
}

/* ============================================
   RENDER FUNCTIONS FOR MODALS
   Format and display fetched data
   ============================================ */

/**
 * Load and render the info modal with all details
 */
async function loadAndRenderInfo(item) {
  const infoContent = document.querySelector('#modal-info .overflow-y-auto');
  infoContent.innerHTML = '<p class="text-gray-400">Loading...</p>';

  const type = item.media_type || (item.title ? 'movie' : 'tv');
  const id = item.id;

  const details = await fetchDetails(type, id);
  const credits = await fetchCredits(type, id);

  if (!details) {
    infoContent.innerHTML = '<p class="text-gray-400">Failed to load details.</p>';
    return;
  }

  renderInfoModal(details, credits, type);
}

/**
 * Render info modal content
 */
function renderInfoModal(details, credits, type) {
  const infoContent = document.querySelector('#modal-info .overflow-y-auto');
  
  const year = (details.release_date || details.first_air_date || '').substring(0, 4);
  const genres = details.genres?.map(g => g.name).join(', ') || 'N/A';
  const runtime = details.runtime ? `${details.runtime} min` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]} min/ep` : 'N/A');
  const director = credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A';
  const cast = credits?.cast?.slice(0, 5).map(a => a.name).join(', ') || 'N/A';
  const rating = details.vote_average ? `${details.vote_average.toFixed(1)}/10` : 'N/A';
  const votes = details.vote_count ? `(${details.vote_count.toLocaleString()} votes)` : '';

  let html = `
    <div class="details-grid">
      <div class="detail-row">
        <span class="detail-label">Year</span>
        <span class="detail-value">${year}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Genres</span>
        <span class="detail-value">${genres}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Runtime</span>
        <span class="detail-value">${runtime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Rating</span>
        <span class="detail-value">${rating} ${votes}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value">${details.status || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Director</span>
        <span class="detail-value">${director}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Cast</span>
        <span class="detail-value">${cast}</span>
      </div>
  `;

  if (details.budget > 0) {
    html += `
      <div class="detail-row">
        <span class="detail-label">Budget</span>
        <span class="detail-value">$${(details.budget / 1000000).toFixed(1)}M</span>
      </div>
    `;
  }

  if (details.revenue > 0) {
    html += `
      <div class="detail-row">
        <span class="detail-label">Revenue</span>
        <span class="detail-value">$${(details.revenue / 1000000).toFixed(1)}M</span>
      </div>
    `;
  }

  if (details.production_companies?.length > 0) {
    html += `
      <div class="detail-row">
        <span class="detail-label">Production</span>
        <span class="detail-value">${details.production_companies.map(c => c.name).join(', ')}</span>
      </div>
    `;
  }

  if (type === 'tv') {
    html += `
      <div class="detail-row">
        <span class="detail-label">Seasons</span>
        <span class="detail-value">${details.number_of_seasons || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Episodes</span>
        <span class="detail-value">${details.number_of_episodes || 'N/A'}</span>
      </div>
    `;
  }

  html += `
    <div class="detail-row detail-synopsis">
      <span class="detail-label">Synopsis</span>
      <span class="detail-value">${details.overview || 'No synopsis available.'}</span>
    </div>
    </div>
  `;

  infoContent.innerHTML = html;
}

/**
 * Load and render the watch modal with streaming providers
 */
async function loadAndRenderWatch(item) {
  const watchContent = document.querySelector('#modal-watch .overflow-y-auto');
  watchContent.innerHTML = '<p class="text-gray-400">Loading...</p>';

  const type = item.media_type || (item.title ? 'movie' : 'tv');
  const id = item.id;

  const providers = await fetchWatchProviders(type, id);
  renderWatchModal(providers);
}

/**
 * Render watch modal content with streaming providers
 */
function renderWatchModal(providers) {
  const watchContent = document.querySelector('#modal-watch .overflow-y-auto');

  if (!providers || Object.keys(providers).length === 0) {
    watchContent.innerHTML = '<p class="text-gray-400">No watch providers found for any region.</p>';
    return;
  }

  let html = '';
  const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

  for (const [countryCode, data] of Object.entries(providers)) {
    const countryName = countryNames.of(countryCode) || countryCode;
    
    html += `<div class="provider-section">
      <h3 class="provider-country">${countryName}</h3>
      <div class="provider-grid">
    `;

    if (data.flatrate?.length > 0) {
      html += `<div class="provider-type"><span class="provider-label">Stream</span>`;
      data.flatrate.forEach(p => {
        html += `<div class="provider-item" title="${p.provider_name}">
          <img src="${IMAGE_BASE}/w92${p.logo_path}" alt="${p.provider_name}" loading="lazy">
        </div>`;
      });
      html += `</div>`;
    }

    if (data.rent?.length > 0) {
      html += `<div class="provider-type"><span class="provider-label">Rent</span>`;
      data.rent.forEach(p => {
        html += `<div class="provider-item" title="${p.provider_name}">
          <img src="${IMAGE_BASE}/w92${p.logo_path}" alt="${p.provider_name}" loading="lazy">
        </div>`;
      });
      html += `</div>`;
    }

    if (data.buy?.length > 0) {
      html += `<div class="provider-type"><span class="provider-label">Buy</span>`;
      data.buy.forEach(p => {
        html += `<div class="provider-item" title="${p.provider_name}">
          <img src="${IMAGE_BASE}/w92${p.logo_path}" alt="${p.provider_name}" loading="lazy">
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div></div>`;
  }

  watchContent.innerHTML = html || '<p class="text-gray-400">No watch providers available.</p>';
}

/**
 * Load and render the videos modal with sorted videos
 */
async function loadAndRenderVideos(item) {
  const videosContent = document.querySelector('#modal-videos .overflow-y-auto');
  videosContent.innerHTML = '<p class="text-gray-400">Loading...</p>';

  const type = item.media_type || (item.title ? 'movie' : 'tv');
  const id = item.id;

  const videos = await fetchAndSortVideos(type, id);
  renderVideoModal(videos);
}

/**
 * Render videos modal content with sorted list
 * Videos play in lite-youtube-embed player
 */
function renderVideoModal(videos) {
  const videosContent = document.querySelector('#modal-videos .overflow-y-auto');

  if (!videos || videos.length === 0) {
    videosContent.innerHTML = '<p class="text-gray-400">No videos available.</p>';
    return;
  }

  let html = '<div class="videos-list">';
  
  videos.forEach(video => {
    const date = new Date(video.published_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    html += `
      <div class="video-item" data-video-key="${video.key}" data-video-title="${video.name.replace(/"/g, '&quot;')}">
        <div class="video-info">
          <div class="video-title">${video.name}</div>
          <div class="video-date">${date}</div>
        </div>
        <span class="video-badge">${video.type}</span>
      </div>
    `;
  });

  html += '</div>';
  videosContent.innerHTML = html;
  
  // Attach event listeners
  document.querySelectorAll('.video-item').forEach(item => {
    item.addEventListener('click', () => {
      const videoKey = item.getAttribute('data-video-key');
      const videoTitle = item.getAttribute('data-video-title');
      modals.closeVideos();
      playVideoWithPlayer(videoKey, videoTitle);
    });
  });
}

/* ============================================
   MAIN APPLICATION OBJECT
   Core functionality: API calls, rendering,
   menu management, search, pagination
   ============================================ */
const app = {
  menu: document.getElementById(SELECTORS.MENU),
  overlay: document.getElementById(SELECTORS.OVERLAY),
  gridContainer: document.getElementById(SELECTORS.GRID),
  searchInput: document.getElementById(SELECTORS.SEARCH_INPUT),

  cache: {},
  currentType: null,
  currentCategory: null,
  currentPage: 1,
  items: [],
  loading: false,

  /**
   * Toggle menu and overlay visibility
   */
  toggleMenu() {
    this.menu.classList.toggle('hidden');
    this.overlay.classList.toggle('hidden');
    this.menu.classList.toggle('open');
    document.body.classList.toggle('menu-open');

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

  /**
   * Toggle submenu visibility (movies or TV shows)
   * @param {string} name - 'movies' or 'tv'
   */
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

  /**
   * Load content based on type and category
   * @param {string} type - 'movie' or 'tv'
   * @param {string} category - 'trending', 'upcoming', etc.
   */
  async load(type, category) {
    this.currentType = type;
    this.currentCategory = category;
    this.currentPage = 1;
    this.items = [];
    this.gridContainer.scrollTop = 0;
    await this.fetchMore();
  },

  /**
   * Load content and close menu
   * @param {string} type - 'movie' or 'tv'
   * @param {string} category - Content category
   */
  async loadAndToggle(type, category) {
    await this.load(type, category);
    this.searchInput.value = '';
    this.toggleMenu();
  },

  /**
   * Fetch more content from API (pagination)
   * Implements caching to avoid duplicate API calls
   */
  async fetchMore() {
    if (this.loading) return;
    this.loading = true;
    const itemsBefore = this.items.length;
    const cacheKey = `${this.currentType}-${this.currentCategory}-${this.currentPage}`;

    try {
      if (!this.cache[cacheKey]) {
        const isTrending = this.currentCategory === 'trending';
        const endpoint = isTrending
          ? `/trending/${this.currentType}/week`
          : `/${this.currentType}/${this.currentCategory}`;

        const data = await apiFetch(endpoint, { page: this.currentPage });
        if (!data) throw new Error('API returned no data');

        this.cache[cacheKey] = (data.results || []).filter(r => r.poster_path);
      }

      const existingIds = new Set(this.items.map(i => i.id));
      const newItems = this.cache[cacheKey].filter(item => !existingIds.has(item.id));
      this.items.push(...newItems);

      this.render(itemsBefore);
      this.currentPage++;
    } catch (error) {
      console.error('Fetch error:', error);
      showNotification('Failed to load content. Please try again.', 'error');
    }

    this.loading = false;
  },

  /**
   * Search movies and TV shows by query
   * @param {string} query - Search term
   */
  async search(query) {
    if (!query.trim()) return;
    this.currentType = null;
    this.currentCategory = null;
    this.items = [];
    this.gridContainer.scrollTop = 0;

    try {
      const data = await apiFetch('/search/multi', { query });
      if (!data) throw new Error('API returned no data');

      this.items = (data.results || []).filter(r => r.poster_path);
      this.render(0);

      if (this.items.length === 0) {
        showNotification(`No results for "${query}"`, 'success');
      }
    } catch (error) {
      console.error('Search error:', error);
      showNotification('Search failed. Please try again.', 'error');
    }
  },

  /**
   * Generate HTML for a poster card with action buttons
   * @param {object} item - Movie or TV show object
   * @returns {string} HTML string
   */
  createPosterHTML(item) {
    if (!item.poster_path) {
      return `<div class="poster placeholder" data-id="${item.id}">
        <div style="text-align: center; color: #666;">
          <i class="fas fa-film"></i>
          <div style="font-size: 12px; margin-top: 8px;">No image</div>
        </div>
      </div>`;
    }

    const itemStr = JSON.stringify(item).replace(/\"/g, '&quot;');
    return `<div class="poster" data-id="${item.id}">
      <img srcset="${IMAGE_BASE}/w185${item.poster_path} 185w, ${IMAGE_BASE}/w342${item.poster_path} 342w, ${IMAGE_BASE}/w500${item.poster_path} 500w"
           src="${IMAGE_BASE}/w342${item.poster_path}"
           alt="${item.title || item.name}"
           loading="lazy">
      <div class="poster-actions">
        <button class="action-btn" onclick="event.stopPropagation(); modals.openInfo(${itemStr})">
          <i class="fas fa-lightbulb"></i>
        </button>
        <button class="action-btn" onclick="event.stopPropagation(); modals.openWatch(${itemStr})">
          <i class="fas fa-eye"></i>
        </button>
        <button class="action-btn" onclick="event.stopPropagation(); modals.openVideos(${itemStr})">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    </div>`;
  },

  /**
   * Render posters to the grid container
   * @param {number} itemsBefore - Number of items before render (for pagination)
   */
  render(itemsBefore = 0) {
    if (itemsBefore === 0 && this.items.length === 0) {
      this.gridContainer.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    if (itemsBefore === 0) {
      this.gridContainer.innerHTML = `<div class="poster-grid">${this.items.map(item => this.createPosterHTML(item)).join('')}</div>`;
    } else {
      const grid = document.querySelector('.poster-grid');
      if (grid) {
        this.items.slice(itemsBefore).forEach(item =>
          grid.insertAdjacentHTML('beforeend', this.createPosterHTML(item))
        );
      }
    }

    this.addPosterListeners();
  },

  /**
   * Attach click listeners to poster cards
   * Handles active state toggling
   */
  addPosterListeners() {
    document.querySelectorAll('.poster').forEach(poster => {
      poster.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn')) return;
        const wasActive = poster.classList.contains('active');
        document.querySelectorAll('.poster.active').forEach(p => p.classList.remove('active'));
        if (!wasActive) poster.classList.add('active');
      });
    });
  }
};

/* ============================================
   VIDEO PLAYER FUNCTIONS
   Lite YouTube Embed integration
   ============================================ */

/**
 * Play a video using lite-youtube-embed
 */
function playVideoWithPlayer(videoKey, videoTitle) {
  const playerContainer = document.getElementById('player-container');
  const playerModal = document.getElementById('modal-player');
  
  // Clear previous player
  playerContainer.innerHTML = '';
  
  // Create lite-youtube element
  const player = document.createElement('lite-youtube');
  player.setAttribute('videoid', videoKey);
  player.setAttribute('title', videoTitle);
  
  playerContainer.appendChild(player);
  
  // Show modal
  playerModal.classList.remove('hidden');
  document.body.classList.add('menu-open');
}

/**
 * Close the video player modal
 */
function closeVideoPlayer(event) {
  if (event && event.target.id !== 'modal-player') return;
  document.getElementById('modal-player').classList.add('hidden');
  document.body.classList.remove('menu-open');
}

// Close player with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !document.getElementById('modal-player').classList.contains('hidden')) {
    closeVideoPlayer();
  }
}, { passive: true });

/* ============================================
   EVENT LISTENERS SECTION
   All DOM event handling organized by type
   ============================================ */

document.getElementById(SELECTORS.BTN).addEventListener('click', (e) => {
  e.stopPropagation();
  app.toggleMenu();
});

app.overlay.addEventListener('click', () => app.toggleMenu());

document.addEventListener('click', (e) => {
  if (!app.menu.contains(e.target) && !app.menu.classList.contains('hidden')) {
    app.toggleMenu();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !app.menu.classList.contains('hidden')) {
    app.toggleMenu();
  }
});

app.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    app.search(app.searchInput.value);
    app.toggleMenu();
  }
});

app.gridContainer.addEventListener('scroll', () => {
  const { scrollTop, scrollHeight, clientHeight } = app.gridContainer;
  if (scrollHeight - scrollTop - clientHeight < 500 && app.currentType) {
    app.fetchMore();
  }
});

/* ===== KEYBOARD SHORTCUTS ===== */
document.addEventListener('keydown', (e) => {
  if (e.target === app.searchInput && e.key !== ' ') return;

  if (e.key === 'm' || e.key === 'M') {
    e.preventDefault();
    app.searchInput.blur();
    if (selectedBtn) selectedBtn.classList.remove('text-yellow-500');
    if (app.menu.classList.contains('hidden')) app.toggleMenu();
    const sub = document.getElementById(SELECTORS.MOVIES_SUBMENU);
    const tvSub = document.getElementById(SELECTORS.TV_SUBMENU);
    if (!tvSub.classList.contains('hidden')) {
      tvSub.classList.add('hidden');
      document.getElementById(SELECTORS.TV_ICON).classList.remove('rotate-180');
    }
    if (sub.classList.contains('hidden')) app.toggle('movies');
    selectedBtn = sub.querySelector('button');
    selectedBtn.classList.add('text-yellow-500');
  }

  if (e.key === 't' || e.key === 'T') {
    e.preventDefault();
    app.searchInput.blur();
    if (selectedBtn) selectedBtn.classList.remove('text-yellow-500');
    if (app.menu.classList.contains('hidden')) app.toggleMenu();
    const sub = document.getElementById(SELECTORS.TV_SUBMENU);
    const moviesSub = document.getElementById(SELECTORS.MOVIES_SUBMENU);
    if (!moviesSub.classList.contains('hidden')) {
      moviesSub.classList.add('hidden');
      document.getElementById(SELECTORS.MOVIES_ICON).classList.remove('rotate-180');
    }
    if (sub.classList.contains('hidden')) app.toggle('tv');
    selectedBtn = sub.querySelector('button');
    selectedBtn.classList.add('text-yellow-500');
  }

  if (e.key === ' ' && e.target !== app.searchInput) {
    e.preventDefault();
    if (app.menu.classList.contains('hidden')) app.toggleMenu();
    setTimeout(() => app.searchInput.focus(), 100);
  }

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

  if (e.key === 'ArrowDown' && !selectedBtn) app.gridContainer.scrollTop += 200;
  if (e.key === 'ArrowUp' && !selectedBtn) app.gridContainer.scrollTop -= 200;
});

/* ===== INITIALIZATION ===== */
app.load('movie', 'trending');
