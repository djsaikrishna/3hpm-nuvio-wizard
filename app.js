const instanceNotes = {
  'https://cometfortheweebs.midnightignite.me': 'Default uses the Midnightignite instance you tested successfully in Nuvio.',
  'https://comet.feels.legal': 'Official Comet instance. Use this if it works better for your region or device.',
  'https://cometa.stremx.net': 'Community instance. Test in Nuvio before sharing as recommended.',
  'https://comet.stremio.ru': 'Community instance. Test in Nuvio before sharing as recommended.'
};

const resolutionKeys = ['r2160p', 'r1440p', 'r1080p', 'r720p', 'r576p', 'r480p', 'r360p', 'r240p', 'unknown'];
const torrentioQualityMap = { r2160p: '4k', r1080p: '1080p', r720p: '720p', r480p: '480p', unknown: 'unknown' };
const nuvioAddonsUrl = 'https://nuvioapp.space/account?tab=addons';
const torrentioBaseUrl = 'https://torrentio.strem.fun';
const stremthruTorzManifestUrl = 'https://stremthru.13377001.xyz/stremio/torz/eyJpbmRleGVycyI6bnVsbCwic3RvcmVzIjpbeyJjIjoicDJwIiwidCI6IiJ9XSwiY2FjaGVkIjp0cnVlfQ==/manifest.json';

const presets = {
  beginner: {
    description: 'A clean starter setup. Cached results only, trash releases removed, no fallback links, and account library scraping enabled. Best for people who just want it to work.',
    maxResultsPerResolution: 5,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: true,
    scrapeDebridAccountTorrents: true,
    resolutions: ['r2160p', 'r1440p', 'r1080p', 'r720p']
  },
  quality: {
    description: 'Prioritizes higher quality cached results while keeping junk filtered out. 4K, 1440p, and 1080p only, no size cap, dedupe enabled.',
    maxResultsPerResolution: 10,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: true,
    scrapeDebridAccountTorrents: true,
    resolutions: ['r2160p', 'r1440p', 'r1080p']
  },
  lowBandwidth: {
    description: 'Keeps results lighter. Cached only, trash removed, dedupe enabled, 1080p and 720p only, and a 12 GB size cap.',
    maxResultsPerResolution: 5,
    maxSize: 12,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: true,
    scrapeDebridAccountTorrents: true,
    resolutions: ['r1080p', 'r720p']
  },
  maximum: {
    description: 'More results without opening the floodgates. Cached only, trash removed, dedupe enabled, 10 results per resolution, all resolutions enabled, and no size cap.',
    maxResultsPerResolution: 10,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: true,
    enableTorrent: false,
    deduplicateStreams: true,
    scrapeDebridAccountTorrents: true,
    resolutions: resolutionKeys
  },
  nuvioControlled: {
    description: 'Firehose - Let Nuvio Control The Flow: gives Nuvio the broadest cached result pool and lets Nuvio’s own Connected Services filters do the sorting, quality filtering, formatting, and cleanup.',
    maxResultsPerResolution: 0,
    maxSize: 0,
    cachedOnly: true,
    removeTrash: false,
    enableTorrent: false,
    deduplicateStreams: false,
    scrapeDebridAccountTorrents: true,
    resolutions: resolutionKeys
  }
};

function updatePageCopy() {
  document.title = '3HPM Nuvio Connected Services Wizard';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', 'Generate one or more keyless Comet, Torrentio, and StremThru Torz manifests for Nuvio Connected Services.');

  const heroTitle = document.querySelector('header h1');
  if (heroTitle) heroTitle.innerHTML = 'The <em>multi-addon</em> manifest wizard for Nuvio.';

  const lede = document.querySelector('header .lede');
  if (lede) lede.innerHTML = 'Build one or more clean, keyless manifests for Comet, Torrentio, and StremThru Torz. Connect TorBox in Nuvio first, make sure <em>Resolve playable links</em> is enabled, then generate the addon URLs. <strong>No TorBox API key</strong> goes into this wizard.';

  const instanceLabel = document.querySelector('label[for="instance"]');
  if (instanceLabel) instanceLabel.textContent = 'Comet instance';

  const maxResultsHelp = document.querySelector('#maxResults')?.closest('.field')?.querySelector('small');
  if (maxResultsHelp) maxResultsHelp.textContent = '10 is a strong tested value. 0 means unlimited. This setting applies to Comet only.';

  const nuvioFilterStamp = [...document.querySelectorAll('.notice .stamp')].find(el => el.textContent.trim() === 'Nuvio filters');
  if (nuvioFilterStamp?.nextElementSibling) {
    nuvioFilterStamp.nextElementSibling.textContent = 'The wizard controls what Comet and Torrentio send to Nuvio. StremThru Torz uses its fixed tested manifest. After installing, use Nuvio’s Connected Services settings for final sorting, quality filtering, formatting, and cleanup.';
  }
}

function removeBrokenCometInstance() {
  const option = document.querySelector('#instance option[value="https://comet.forthewizards.uk"]');
  if (option) option.remove();
}

function replaceAddonSelector() {
  const addonSelect = document.getElementById('addon');
  const field = addonSelect?.closest('.field');
  if (!field) return;

  field.innerHTML = `
    <label>Scraper addons</label>
    <div class="addonPicker" role="group" aria-label="Select one or more scraper addons">
      <label class="addonChoice">
        <input class="addonOption" type="checkbox" value="comet" checked />
        <span><strong>Comet</strong><small>Generated from your selected instance, preset, resolutions, and limits.</small></span>
      </label>
      <label class="addonChoice">
        <input class="addonOption" type="checkbox" value="torrentio" />
        <span><strong>Torrentio</strong><small>Generated from your resolution, trash, and size choices.</small></span>
      </label>
      <label class="addonChoice">
        <input class="addonOption" type="checkbox" value="stremthru" />
        <span><strong>StremThru Torz</strong><small>Uses the fixed tested cached P2P manifest supplied by 3HPM.</small></span>
      </label>
    </div>
    <div class="addonPickerActions">
      <button id="selectAllAddons" type="button" class="smallBtn">Select all addons</button>
      <button id="clearAddons" type="button" class="smallBtn">Clear selection</button>
    </div>
    <p id="addonSettingsNote" class="addonSettingsNote"></p>
  `;
}

function injectLanguageFilter() {
  if (document.getElementById('languageFilter')) return;
  const presetField = document.getElementById('preset')?.closest('.field');
  if (!presetField) return;
  const field = document.createElement('div');
  field.className = 'field cometOnlyField';
  field.innerHTML = '<label for="languageFilter">Language preference</label><select id="languageFilter" name="languageFilter"><option value="any" selected>Any language · recommended</option><option value="englishPreferred">English preferred</option><option value="englishOnly">English only · fewer results</option></select><small>This language setting applies to Comet only.</small>';
  presetField.insertAdjacentElement('afterend', field);
}

function injectNuvioControlledPreset() {
  const preset = document.getElementById('preset');
  if (!preset || preset.querySelector('option[value="nuvioControlled"]')) return;
  const option = document.createElement('option');
  option.value = 'nuvioControlled';
  option.textContent = 'Firehose - Let Nuvio Control The Flow';
  preset.appendChild(option);
}

function prepareOutputArea() {
  const manifestBox = document.querySelector('#step3 .manifestBox');
  if (manifestBox) {
    manifestBox.innerHTML = `
      <div class="manifestHeader">
        <span class="ribbon">Manifests · Ready</span>
        <span>Selected addons · TorBox · Instant</span>
      </div>
      <div id="manifestList" class="manifestList"></div>
      <div class="copyAllRow">
        <button id="copyAllManifests" type="button" class="btn primary">Copy All Manifest URLs</button>
      </div>
    `;
  }

  const renameBox = document.querySelector('#step3 .renameBox');
  if (renameBox) renameBox.remove();

  const qrWrap = document.querySelector('#step3 .qrWrap');
  if (qrWrap) {
    qrWrap.classList.add('fullWidth');
    const helper = qrWrap.querySelector('small');
    if (helper) helper.textContent = 'Copy your manifest URLs first, then scan this to open Nuvio’s addon page and paste them one at a time.';
  }

  const finalSteps = document.querySelector('#step3 .finalSteps ol');
  if (finalSteps) {
    finalSteps.innerHTML = `
      <li><span class="num">1</span><span>Add each generated manifest URL to Nuvio.</span></li>
      <li><span class="num">2</span><span>Enable each new addon.</span></li>
      <li><span class="num">3</span><span>Rename each addon to its suggested 3HPM name in the Nuvio web account.</span></li>
      <li><span class="num">4</span><span>Optional — format your Connected Services feed in Nuvio's website editor or mobile editor. Start from the 3HPM CrispyDuck format at <a href="https://crispyduck.xyz/?load=4afgx3vf" target="_blank" rel="noopener">crispyduck.xyz/?load=4afgx3vf</a>, or create your own.</span></li>
    `;
  }
}

function base64EncodeUnicode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function getSelectedAddons() {
  return new Set([...document.querySelectorAll('.addonOption:checked')].map(input => input.value));
}

function getSelectedInstance() {
  return document.getElementById('instance').value.replace(/\/$/, '');
}

function getSelectedResolutions() {
  const checked = [...document.querySelectorAll('.resolutionOption:checked')].map(input => input.value);
  return checked.length ? checked : resolutionKeys;
}

function setSelectedResolutions(selectedKeys) {
  const selected = new Set(selectedKeys);
  document.querySelectorAll('.resolutionOption').forEach(input => { input.checked = selected.has(input.value); });
}

function buildResolutionsConfig() {
  const selected = new Set(getSelectedResolutions());
  return resolutionKeys.reduce((config, key) => {
    config[key] = selected.has(key);
    return config;
  }, {});
}

function buildLanguageConfig() {
  const value = document.getElementById('languageFilter')?.value || 'any';
  if (value === 'englishPreferred') return { required: [], allowed: [], exclude: [], preferred: ['English'] };
  if (value === 'englishOnly') return { required: [], allowed: ['English'], exclude: [], preferred: ['English'] };
  return { required: [], allowed: [], exclude: [], preferred: [] };
}

function buildCometConfig() {
  const maxSizeGb = Number(document.getElementById('maxSize').value) || 0;
  const maxSizeBytes = maxSizeGb > 0 ? maxSizeGb * 1024 * 1024 * 1024 : 0;

  return {
    maxResultsPerResolution: Number(document.getElementById('maxResults').value) || 0,
    maxSize: maxSizeBytes,
    cachedOnly: document.getElementById('cachedOnly').checked,
    sortCachedUncachedTogether: false,
    removeTrash: document.getElementById('removeTrash').checked,
    resultFormat: ['all'],
    debridServices: [],
    enableTorrent: document.getElementById('enableTorrent').checked,
    deduplicateStreams: document.getElementById('dedupe').checked,
    scrapeDebridAccountTorrents: document.getElementById('scrapeAccount').checked,
    debridStreamProxyPassword: '',
    languages: buildLanguageConfig(),
    resolutions: buildResolutionsConfig(),
    options: {
      remove_ranks_under: -10000000000,
      allow_english_in_languages: false,
      remove_unknown_languages: false
    }
  };
}

function buildCometManifestUrl() {
  const encoded = base64EncodeUnicode(JSON.stringify(buildCometConfig()));
  return `${getSelectedInstance()}/${encoded}/manifest.json`;
}

function buildTorrentioManifestUrl() {
  const selected = new Set(getSelectedResolutions());
  const excluded = [];

  Object.entries(torrentioQualityMap).forEach(([key, value]) => {
    if (!selected.has(key)) excluded.push(value);
  });

  if (document.getElementById('removeTrash').checked) {
    ['scr', 'cam', 'threed'].forEach(value => {
      if (!excluded.includes(value)) excluded.push(value);
    });
  }

  const parts = ['sort=qualitysize'];
  if (excluded.length) parts.push(`qualityfilter=${excluded.join(',')}`);

  const size = Number(document.getElementById('maxSize').value) || 0;
  if (size > 0) parts.push(`sizefilter=${size}`);

  parts.push('debridoptions=nodownloadlinks,nocatalog');
  return `${torrentioBaseUrl}/${parts.join('|')}/manifest.json`;
}

function buildSelectedManifests() {
  const selected = getSelectedAddons();
  const manifests = [];

  if (selected.has('comet')) {
    manifests.push({
      id: 'comet',
      label: 'Comet',
      name: '3HPM | Comet TB Instant',
      description: 'Generated from your Comet instance and selected wizard settings.',
      url: buildCometManifestUrl()
    });
  }

  if (selected.has('torrentio')) {
    manifests.push({
      id: 'torrentio',
      label: 'Torrentio',
      name: '3HPM | Torrentio TB Instant',
      description: 'Generated from your selected resolutions, trash filter, and size limit.',
      url: buildTorrentioManifestUrl()
    });
  }

  if (selected.has('stremthru')) {
    manifests.push({
      id: 'stremthru',
      label: 'StremThru Torz',
      name: '3HPM | StremThru Torz TB Instant',
      description: 'Fixed tested cached P2P manifest. The settings above do not alter this URL.',
      url: stremthruTorzManifestUrl
    });
  }

  return manifests;
}

function updateSelectionUi() {
  const selected = getSelectedAddons();
  const hasComet = selected.has('comet');
  const hasConfigurable = hasComet || selected.has('torrentio');

  document.getElementById('instance')?.closest('.field')?.classList.toggle('isHiddenForSelection', !hasComet);
  document.getElementById('maxResults')?.closest('.field')?.classList.toggle('isHiddenForSelection', !hasComet);
  document.getElementById('languageFilter')?.closest('.field')?.classList.toggle('isHiddenForSelection', !hasComet);
  document.getElementById('dedupe')?.closest('label')?.classList.toggle('isHiddenForSelection', !hasComet);
  document.getElementById('scrapeAccount')?.closest('label')?.classList.toggle('isHiddenForSelection', !hasComet);
  document.getElementById('enableTorrent')?.closest('details')?.classList.toggle('isHiddenForSelection', !hasComet);

  document.getElementById('preset')?.closest('.field')?.classList.toggle('isHiddenForSelection', !hasConfigurable);
  document.querySelector('.resolutions')?.classList.toggle('isHiddenForSelection', !hasConfigurable);
  document.querySelector('.settingsGrid')?.classList.toggle('isHiddenForSelection', !hasConfigurable);
  document.querySelector('.checks.options')?.classList.toggle('isHiddenForSelection', !hasConfigurable);

  const note = document.getElementById('addonSettingsNote');
  if (note) {
    if (!selected.size) {
      note.textContent = 'Select at least one addon to generate a manifest URL.';
    } else if (selected.size === 1 && selected.has('stremthru')) {
      note.textContent = 'StremThru Torz uses a fixed tested manifest, so no additional scraper settings are required.';
    } else if (selected.has('stremthru')) {
      note.textContent = 'The settings below apply to Comet and Torrentio. StremThru Torz keeps its fixed tested manifest.';
    } else {
      note.textContent = 'The settings below are shared where supported. Comet-specific controls are shown only when Comet is selected.';
    }
  }

  const instanceDescription = document.getElementById('instanceDescription');
  if (instanceDescription && hasComet) {
    const selectedInstance = getSelectedInstance();
    instanceDescription.textContent = instanceNotes[selectedInstance] || 'Test this Comet instance in Nuvio before sharing it as recommended.';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderManifestList() {
  const list = document.getElementById('manifestList');
  const copyAll = document.getElementById('copyAllManifests');
  if (!list) return;

  const manifests = buildSelectedManifests();
  if (!manifests.length) {
    list.innerHTML = '<div class="emptyManifests">Select at least one addon in Step 2.</div>';
    if (copyAll) copyAll.disabled = true;
    return;
  }

  if (copyAll) copyAll.disabled = false;
  list.innerHTML = manifests.map(manifest => `
    <article class="manifestCard" data-manifest-id="${manifest.id}">
      <div class="manifestCardHeader">
        <div>
          <h3>${escapeHtml(manifest.label)}</h3>
          <p>${escapeHtml(manifest.description)}</p>
        </div>
        <span class="ribbon">Ready</span>
      </div>
      <label class="srOnly" for="manifest-${manifest.id}" style="display:none;">${escapeHtml(manifest.label)} manifest URL</label>
      <textarea id="manifest-${manifest.id}" readonly rows="3" spellcheck="false">${escapeHtml(manifest.url)}</textarea>
      <div class="manifestNameRow">
        <input id="name-${manifest.id}" readonly value="${escapeHtml(manifest.name)}" aria-label="Suggested addon name for ${escapeHtml(manifest.label)}" />
        <button type="button" class="smallBtn" data-copy-name="${manifest.id}">Copy name</button>
      </div>
      <div class="manifestCardActions">
        <button type="button" class="btn primary" data-copy-url="${manifest.id}">Copy URL</button>
        <a class="btn ghost" href="${escapeHtml(manifest.url)}" target="_blank" rel="noopener">Open Manifest ↗</a>
      </div>
    </article>
  `).join('');
}

function updateQrCode() {
  const qrCode = document.getElementById('qrCode');
  if (qrCode) qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(nuvioAddonsUrl)}`;
}

function updateOutput() {
  updateSelectionUi();
  renderManifestList();
  updateQrCode();
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
  if (document.getElementById('languageFilter')) document.getElementById('languageFilter').value = 'any';
  setSelectedResolutions(preset.resolutions);
  document.getElementById('presetDescription').textContent = preset.description;
  updateOutput();
}

function showStep(stepId, shouldScroll = true) {
  document.querySelectorAll('.stepCard').forEach(step => {
    step.classList.toggle('active', step.id === stepId);
    step.classList.toggle('collapsed', step.id !== stepId);
  });
  if (shouldScroll) document.getElementById(stepId).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
  }

  if (button) {
    const original = button.textContent;
    button.textContent = 'Copied';
    setTimeout(() => { button.textContent = original; }, 1200);
  }
}

function bindEvents() {
  document.getElementById('preset').addEventListener('change', event => applyPreset(event.target.value));
  document.getElementById('wizardForm').addEventListener('input', updateOutput);
  document.getElementById('wizardForm').addEventListener('change', updateOutput);

  document.querySelectorAll('.nextStep').forEach(button => button.addEventListener('click', () => showStep(button.dataset.next)));
  document.querySelectorAll('.backStep').forEach(button => button.addEventListener('click', () => showStep(button.dataset.prev)));

  document.getElementById('selectAllResolutions').addEventListener('click', () => {
    setSelectedResolutions(resolutionKeys);
    updateOutput();
  });

  document.getElementById('qualityResolutions').addEventListener('click', () => {
    setSelectedResolutions(['r2160p', 'r1440p', 'r1080p']);
    updateOutput();
  });

  document.getElementById('selectAllAddons').addEventListener('click', () => {
    document.querySelectorAll('.addonOption').forEach(input => { input.checked = true; });
    updateOutput();
  });

  document.getElementById('clearAddons').addEventListener('click', () => {
    document.querySelectorAll('.addonOption').forEach(input => { input.checked = false; });
    updateOutput();
  });

  document.getElementById('manifestList').addEventListener('click', event => {
    const copyUrlButton = event.target.closest('[data-copy-url]');
    if (copyUrlButton) {
      const id = copyUrlButton.dataset.copyUrl;
      copyText(document.getElementById(`manifest-${id}`).value, copyUrlButton);
      return;
    }

    const copyNameButton = event.target.closest('[data-copy-name]');
    if (copyNameButton) {
      const id = copyNameButton.dataset.copyName;
      copyText(document.getElementById(`name-${id}`).value, copyNameButton);
    }
  });

  document.getElementById('copyAllManifests').addEventListener('click', event => {
    const urls = buildSelectedManifests().map(manifest => manifest.url).join('\n');
    if (urls) copyText(urls, event.currentTarget);
  });
}

updatePageCopy();
removeBrokenCometInstance();
replaceAddonSelector();
injectLanguageFilter();
injectNuvioControlledPreset();
prepareOutputArea();
bindEvents();
applyPreset('beginner');
showStep('step1', false);