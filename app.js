const COMET_BASE_URL = 'https://cometfortheweebs.midnightignite.me';

const presets = {
  beginner: {
    maxResultsPerResolution: 0,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: false,
    scrapeDebridAccountTorrents: true,
  },
  quality: {
    maxResultsPerResolution: 0,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: true,
    scrapeDebridAccountTorrents: true,
  },
  lowBandwidth: {
    maxResultsPerResolution: 5,
    maxSize: 12,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: true,
    scrapeDebridAccountTorrents: true,
  },
  maximum: {
    maxResultsPerResolution: 0,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: false,
    enableTorrent: false,
    deduplicateStreams: false,
    scrapeDebridAccountTorrents: true,
  },
};

function base64EncodeUnicode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function buildCometConfig() {
  return {
    maxResultsPerResolution: Number(document.getElementById('maxResults').value) || 0,
    maxSize: Number(document.getElementById('maxSize').value) || 0,
    cachedOnly: document.getElementById('cachedOnly').checked,
    sortCachedUncachedTogether: false,
    removeTrash: document.getElementById('removeTrash').checked,
    resultFormat: ['all'],
    debridServices: [],
    enableTorrent: document.getElementById('enableTorrent').checked,
    deduplicateStreams: document.getElementById('dedupe').checked,
    scrapeDebridAccountTorrents: document.getElementById('scrapeAccount').checked,
    debridStreamProxyPassword: '',
    languages: {
      required: [],
      allowed: [],
      exclude: [],
      preferred: [],
    },
    resolutions: {},
    options: {
      remove_ranks_under: -10000000000,
      allow_english_in_languages: false,
      remove_unknown_languages: false,
    },
  };
}

function buildManifestUrl() {
  const config = buildCometConfig();
  const encoded = base64EncodeUnicode(JSON.stringify(config));
  return `${COMET_BASE_URL}/${encoded}/manifest.json`;
}

function updateOutput() {
  const manifestUrl = buildManifestUrl();
  const manifestField = document.getElementById('manifestUrl');
  const openManifest = document.getElementById('openManifest');
  const qrCode = document.getElementById('qrCode');

  manifestField.value = manifestUrl;
  openManifest.href = manifestUrl;
  qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(manifestUrl)}`;
}

function applyPreset(name) {
  const preset = presets[name] || presets.beginner;
  document.getElementById('maxResults').value = preset.maxResultsPerResolution;
  document.getElementById('maxSize').value = preset.maxSize;
  document.getElementById('cachedOnly').checked = preset.cachedOnly;
  document.getElementById('removeTrash').checked = preset.removeTrash;
  document.getElementById('enableTorrent').checked = preset.enableTorrent;
  document.getElementById('dedupe').checked = preset.deduplicateStreams;
  document.getElementById('scrapeAccount').checked = preset.scrapeDebridAccountTorrents;
  updateOutput();
}

async function copyValue(selector, button) {
  const element = document.querySelector(selector);
  await navigator.clipboard.writeText(element.value);
  const original = button.textContent;
  button.textContent = 'Copied';
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

document.getElementById('preset').addEventListener('change', (event) => {
  applyPreset(event.target.value);
});

document.getElementById('wizardForm').addEventListener('input', updateOutput);

document.getElementById('copyManifest').addEventListener('click', (event) => {
  copyValue('#manifestUrl', event.currentTarget);
});

document.getElementById('copyName').addEventListener('click', (event) => {
  copyValue('#renameSuggestion', event.currentTarget);
});

applyPreset('beginner');
