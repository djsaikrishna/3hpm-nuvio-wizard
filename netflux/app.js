const WORKER_BASE = "https://netflux-api.the-geek.workers.dev";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const MAX_PAGES_PER_BATCH = 3;
const VERIFY_BATCH_SIZE = 4;
const VERIFY_RETRIES = 2;

const state = {
  type: "movie",
  direction: "us-only",
  nextPage: 1,
  seen: new Set(),
  exhausted: false,
  loading: false
};

const els = {
  compareButton: document.querySelector("#compareButton"),
  loadMoreButton: document.querySelector("#loadMoreButton"),
  sortBy: document.querySelector("#sortBy"),
  minRating: document.querySelector("#minRating"),
  yearFrom: document.querySelector("#yearFrom"),
  results: document.querySelector("#results"),
  resultsHeading: document.querySelector("#resultsHeading"),
  statusText: document.querySelector("#statusText"),
  cardTemplate: document.querySelector("#cardTemplate"),
  segments: [...document.querySelectorAll(".segment")],
  directionButtons: [...document.querySelectorAll(".direction-button")],
  heroHeading: document.querySelector("#heroHeading"),
  sourceCode: document.querySelector("#sourceCode"),
  sourceCountry: document.querySelector("#sourceCountry"),
  excludedCode: document.querySelector("#excludedCode"),
  excludedCountry: document.querySelector("#excludedCountry")
};

initialize();

function initialize() {
  populateYears();
  els.compareButton.addEventListener("click", startComparison);
  els.loadMoreButton.addEventListener("click", loadBatch);

  els.segments.forEach(button => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      els.segments.forEach(item => item.classList.toggle("active", item === button));
      updateSortOptions();
    });
  });

  els.directionButtons.forEach(button => {
    button.addEventListener("click", () => {
      state.direction = button.dataset.direction;
      els.directionButtons.forEach(item => {
        item.classList.toggle("active", item === button);
      });
      updateDirectionDisplay();
    });
  });
}

function updateDirectionDisplay() {
  const canadaOnly = state.direction === "ca-only";

  els.sourceCode.textContent = canadaOnly ? "CA" : "US";
  els.sourceCountry.textContent = canadaOnly ? "Canada" : "United States";
  els.excludedCode.textContent = canadaOnly ? "US" : "CA";
  els.excludedCountry.textContent = canadaOnly ? "United States" : "Canada";

  els.heroHeading.textContent = canadaOnly
    ? "Find titles available on Canadian Netflix but missing from US Netflix."
    : "Find titles available on US Netflix but missing from Canadian Netflix.";

  setStatus(
    "Ready to compare",
    canadaOnly
      ? "Find titles confirmed on Canadian Netflix but not US Netflix."
      : "Find titles confirmed on US Netflix but not Canadian Netflix."
  );
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

async function startComparison() {
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
  setStatus("Verifying catalogue availability…", "Checking titles in small batches to reduce fetch failures.");

  try {
    let added = 0;
    let pagesChecked = 0;
    let failedBatches = 0;

    while (pagesChecked < MAX_PAGES_PER_BATCH && !state.exhausted) {
      const page = state.nextPage;
      const sourceRegion = state.direction === "ca-only" ? "CA" : "US";
      const excludedRegion = state.direction === "ca-only" ? "US" : "CA";

      const candidateData = await getCandidates(sourceRegion, page);
      const candidates = candidateData.results || [];
      const verifiedIds = new Set();

      for (const batch of chunk(candidates, VERIFY_BATCH_SIZE)) {
        try {
          const result = await verifyBatch(
            batch.map(item => item.id),
            sourceRegion,
            excludedRegion
          );

          for (const id of result.verified_ids || []) {
            verifiedIds.add(id);
          }
        } catch (error) {
          console.warn("Verification batch failed:", error);
          failedBatches++;
        }
      }

      for (const item of candidates) {
        if (!verifiedIds.has(item.id)) continue;

        const key = `${state.type}:${item.id}`;
        if (!state.seen.has(key)) {
          state.seen.add(key);
          renderCard(item);
          added++;
        }
      }

      state.nextPage++;
      pagesChecked++;

      const maxPage = Math.min(candidateData.total_pages || 1, 500);
      if (state.nextPage > maxPage) state.exhausted = true;
    }

    const totalShown = state.seen.size;
    const regionLabel = state.direction === "ca-only" ? "Canada-only" : "US-only";

    els.resultsHeading.textContent =
      `${totalShown} verified ${regionLabel} ${state.type === "movie" ? "movies" : "TV shows"}`;

    if (failedBatches > 0) {
      els.statusText.textContent =
        `Verified through source page ${state.nextPage - 1}. ${failedBatches} small verification batch${failedBatches === 1 ? "" : "es"} could not be checked and can be retried with Load More.`;
    } else if (added > 0) {
      els.statusText.textContent =
        `Verified through source page ${state.nextPage - 1}. Load more to continue.`;
    } else {
      els.statusText.textContent =
        `No additional verified exclusives found in the latest ${pagesChecked} pages checked.`;
    }

    els.loadMoreButton.classList.toggle("hidden", state.exhausted);

    if (!totalShown) {
      renderMessage("No verified exclusives found yet. Try another sort order or load more pages.");
    }
  } catch (error) {
    console.error(error);
    renderMessage(error.message || "The comparison failed. Please try again.", true);
    setStatus("Comparison failed", "The catalogue service could not complete this request.");
  } finally {
    state.loading = false;
    els.compareButton.disabled = false;
    els.loadMoreButton.disabled = false;
  }
}

async function getCandidates(region, page) {
  const params = new URLSearchParams({
    type: state.type,
    region,
    page: String(page),
    sort_by: els.sortBy.value,
    min_rating: els.minRating.value,
    year_from: els.yearFrom.value
  });

  return fetchJsonWithRetry(`${WORKER_BASE}/candidates?${params}`, VERIFY_RETRIES);
}

async function verifyBatch(ids, sourceRegion, excludedRegion) {
  const params = new URLSearchParams({
    type: state.type,
    source_region: sourceRegion,
    excluded_region: excludedRegion,
    ids: ids.join(",")
  });

  return fetchJsonWithRetry(`${WORKER_BASE}/verify-batch?${params}`, VERIFY_RETRIES);
}

async function fetchJsonWithRetry(url, retries) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json" }
      });

      if (response.status === 429) {
        throw new Error("Too many requests were made at once.");
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Catalogue service returned HTTP ${response.status}.`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(350 * (attempt + 1));
      }
    }
  }

  throw lastError;
}

function renderCard(item) {
  const fragment = els.cardTemplate.content.cloneNode(true);
  const title = state.type === "movie" ? item.title : item.name;
  const date = state.type === "movie" ? item.release_date : item.first_air_date;
  const year = date ? date.slice(0, 4) : "Year unknown";
  const availabilityText = state.direction === "ca-only"
    ? "CANADIAN NETFLIX · VERIFIED NOT IN THE US"
    : "US NETFLIX · VERIFIED NOT IN CANADA";
  const poster = fragment.querySelector(".poster");

  poster.src = item.poster_path
    ? `${IMAGE_BASE}${item.poster_path}`
    : makePlaceholder(title);
  poster.alt = `${title} poster`;
  poster.loading = "lazy";

  fragment.querySelector(".availability").textContent = availabilityText;
  fragment.querySelector(".rating").textContent = item.vote_average
    ? `★ ${item.vote_average.toFixed(1)}`
    : "No rating";
  fragment.querySelector(".title").textContent = title;
  fragment.querySelector(".meta").textContent =
    `${year} · ${state.type === "movie" ? "Movie" : "TV Series"}`;
  fragment.querySelector(".overview").textContent =
    item.overview || "No synopsis is currently available.";
  fragment.querySelector(".details-link").href =
    `https://www.themoviedb.org/${state.type}/${item.id}`;

  els.results.append(fragment);
}

function renderMessage(message, isError = false) {
  const box = document.createElement("div");
  box.className = isError ? "error-card" : "empty-card";
  box.textContent = message;
  els.results.append(box);
}

function makePlaceholder(title) {
  const safeTitle = (title || "No Poster").replace(/[<>&'\"]/g, "");
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

function setStatus(heading, text) {
  els.resultsHeading.textContent = heading;
  els.statusText.textContent = text;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
