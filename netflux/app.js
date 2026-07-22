const TMDB_BASE = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const TOKEN_KEY = "netflixCompareTmdbToken";
const NETFLIX_PROVIDER_ID = 8;
const MAX_PAGES_PER_BATCH = 3;

const state = {
  type: "movie",
  nextPage: 1,
  seen: new Set(),
  exhausted: false,
  loading: false
};

const els = {
  settingsButton: document.querySelector("#settingsButton"),
  settingsDialog: document.querySelector("#settingsDialog"),
  apiToken: document.querySelector("#apiToken"),
  saveTokenButton: document.querySelector("#saveTokenButton"),
  clearTokenButton: document.querySelector("#clearTokenButton"),
  compareButton: document.querySelector("#compareButton"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  sortBy: document.querySelector("#sortBy"),
  minRating: document.querySelector("#minRating"),
  yearFrom: document.querySelector("#yearFrom"),
  results: document.querySelector("#results"),
  resultsHeading: document.querySelector("#resultsHeading"),
  statusText: document.querySelector("#statusText"),
  cardTemplate: document.querySelector("#cardTemplate"),
  segments: [...document.querySelectorAll(".segment")]
};

initialize();

function initialize() {
  populateYears();
  els.apiToken.value = localStorage.getItem(TOKEN_KEY) || "";
  els.settingsButton.addEventListener("click", () => els.settingsDialog.showModal());
  els.saveTokenButton.addEventListener("click", saveToken);
  els.clearTokenButton.addEventListener("click", clearToken);
  els.compareButton.addEventListener("click", startComparison);
  els.loadMoreButton.addEventListener("click", loadBatch);

  els.segments.forEach(button => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      els.segments.forEach(item => item.classList.toggle("active", item === button));
      updateSortOptions();
    });
  });
}

function populateYears() {
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1950; year -= 5) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `${year}+`;
    els.yearFrom.append(option);
  }
}

function updateSortOptions() {
  const dateOption = els.sortBy.querySelector('option[value$="_date.desc"]');
  const titleOption = els.sortBy.querySelector('option[value$="_title.asc"]');

  if (state.type === "tv") {
    dateOption.value = "first_air_date.desc";
    titleOption.value = "original_name.asc";
  } else {
    dateOption.value = "primary_release_date.desc";
    titleOption.value = "original_title.asc";
  }
}

function saveToken(event) {
  event.preventDefault();
  const token = els.apiToken.value.trim();
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    setStatus("Token removed", "Add a TMDB token before comparing catalogues.");
  } else {
    localStorage.setItem(TOKEN_KEY, token);
    setStatus("Token saved", "Your token is stored only in this browser.");
  }
  els.settingsDialog.close();
}

function clearToken() {
  els.apiToken.value = "";
  localStorage.removeItem(TOKEN_KEY);
  setStatus("Token cleared", "Add a TMDB token before comparing catalogues.");
}

async function startComparison() {
  if (!getToken()) {
    els.settingsDialog.showModal();
    setStatus("TMDB token required", "Paste your API Read Access Token in API Settings.");
    return;
  }

  state.nextPage = 1;
  state.seen.clear();
  state.exhausted = false;
  els.results.replaceChildren();
  await loadBatch();
}

async function loadBatch() {
  if (state.loading || state.exhausted) return;

  state.loading = true;
  els.compareButton.disabled = true;
  els.loadMoreButton.disabled = true;
  setStatus("Comparing catalogues…", "Checking matching pages for US and Canadian Netflix.");

  try {
    let added = 0;
    let pagesChecked = 0;

    while (pagesChecked < MAX_PAGES_PER_BATCH && !state.exhausted) {
      const page = state.nextPage;
      const [usData, caData] = await Promise.all([
        discover("US", page),
        discover("CA", page)
      ]);

      const caIds = new Set(caData.results.map(item => item.id));
      const uniqueToUs = usData.results.filter(item => !caIds.has(item.id));

      for (const item of uniqueToUs) {
        const key = `${state.type}:${item.id}`;
        if (!state.seen.has(key)) {
          state.seen.add(key);
          renderCard(item);
          added++;
        }
      }

      state.nextPage++;
      pagesChecked++;

      const maxPage = Math.min(usData.total_pages || 1, 500);
      if (state.nextPage > maxPage) state.exhausted = true;
    }

    const totalShown = state.seen.size;
    els.resultsHeading.textContent = `${totalShown} likely US-only ${state.type === "movie" ? "movies" : "TV shows"}`;
    els.statusText.textContent = added
      ? `Checked through page ${state.nextPage - 1}. Load more to continue comparing.`
      : `No additional differences found in the latest ${pagesChecked} pages checked.`;

    els.loadMoreButton.classList.toggle("hidden", state.exhausted);

    if (!totalShown) {
      renderMessage("No differences found yet. Try another sort order or load a wider date range.");
    }
  } catch (error) {
    console.error(error);
    renderMessage(error.message || "The comparison failed. Check your token and try again.", true);
    setStatus("Comparison failed", "Check the error below and verify your TMDB token.");
  } finally {
    state.loading = false;
    els.compareButton.disabled = false;
    els.loadMoreButton.disabled = false;
  }
}

async function discover(region, page) {
  const endpoint = state.type === "movie" ? "/discover/movie" : "/discover/tv";
  const params = new URLSearchParams({
    language: "en-CA",
    page: String(page),
    sort_by: els.sortBy.value,
    watch_region: region,
    with_watch_providers: String(NETFLIX_PROVIDER_ID),
    with_watch_monetization_types: "flatrate",
    include_adult: "false",
    "vote_average.gte": els.minRating.value,
    "vote_count.gte": els.minRating.value === "0" ? "0" : "30"
  });

  const year = els.yearFrom.value;
  if (year) {
    const dateField = state.type === "movie" ? "primary_release_date.gte" : "first_air_date.gte";
    params.set(dateField, `${year}-01-01`);
  }

  const response = await fetch(`${TMDB_BASE}${endpoint}?${params}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      accept: "application/json"
    }
  });

  if (response.status === 401) throw new Error("TMDB rejected the token. Use the API Read Access Token, not the shorter API key.");
  if (!response.ok) throw new Error(`TMDB returned HTTP ${response.status}. Please try again.`);

  return response.json();
}

function renderCard(item) {
  const fragment = els.cardTemplate.content.cloneNode(true);
  const title = state.type === "movie" ? item.title : item.name;
  const date = state.type === "movie" ? item.release_date : item.first_air_date;
  const year = date ? date.slice(0, 4) : "Year unknown";
  const poster = fragment.querySelector(".poster");

  poster.src = item.poster_path
    ? `${IMAGE_BASE}${item.poster_path}`
    : makePlaceholder(title);
  poster.alt = `${title} poster`;
  poster.loading = "lazy";

  fragment.querySelector(".rating").textContent = item.vote_average
    ? `★ ${item.vote_average.toFixed(1)}`
    : "No rating";
  fragment.querySelector(".title").textContent = title;
  fragment.querySelector(".meta").textContent = `${year} · ${state.type === "movie" ? "Movie" : "TV Series"}`;
  fragment.querySelector(".overview").textContent = item.overview || "No synopsis is currently available.";
  fragment.querySelector(".details-link").href = `https://www.themoviedb.org/${state.type}/${item.id}`;

  els.results.append(fragment);
}

function renderMessage(message, isError = false) {
  const box = document.createElement("div");
  box.className = isError ? "error-card" : "empty-card";
  box.textContent = message;
  els.results.append(box);
}

function makePlaceholder(title) {
  const safeTitle = (title || "No Poster").replace(/[<>&'"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="750">
      <rect width="100%" height="100%" fill="#111a16"/>
      <text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle"
        fill="#9aa9a0" font-family="Arial" font-size="26">No Poster</text>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
        fill="#22c55e" font-family="Arial" font-size="18">${safeTitle.slice(0, 36)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY)?.trim() || "";
}

function setStatus(heading, text) {
  els.resultsHeading.textContent = heading;
  els.statusText.textContent = text;
}
