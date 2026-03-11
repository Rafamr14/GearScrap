const STORAGE_KEYS = {
  selectedGame: "buildfinder.selectedGame",
  gf2Characters: "buildfinder.gf2.characters",
  genshinCharacters: "buildfinder.genshin.characters"
};

const GF2_LEGACY_RELEASE_ORDER = Object.freeze({
  vepley: 43,
  ullrid: 42,
  daiyan: 41,
  zhaohui: 40,
  faye: 39,
  qiuhua: 38,
  belka: 37,
  sakura: 36,
  lenna: 35,
  suomi: 34,
  dushevnaya: 33,
  centaureissi: 32,
  mechty: 31,
  vector: 30,
  yoohee: 29,
  springfield: 28,
  jiangyu: 27,
  florence: 26,
  makiatto: 25,
  qiongjiu: 24,
  tololo: 23,
  "mosin-nagant": 22,
  papasha: 21,
  peritya: 20,
  klukai: 19,
  nikketa: 18,
  lind: 17,
  leva: 16,
  robella: 15,
  lewis: 14,
  sabrina: 13,
  peri: 12,
  andoris: 11,
  krolik: 10,
  cheeta: 9,
  ksenia: 8,
  colphne: 7,
  nagant: 6,
  sharkry: 5,
  lotta: 4,
  littara: 3,
  nemesis: 2,
  groza: 1
});

const gf2State = {
  sets: [],
  substats: [],
  allCharacters: [],
  selectedSet: null,
  selectedSubstats: new Set(),
  catalogs: null
};

const gf2SetsRoot = document.getElementById("gf2SetsRoot");
const gf2SubstatsRoot = document.getElementById("gf2SubstatsRoot");
const gf2SelectionSummary = document.getElementById("gf2SelectionSummary");
const gf2ResultsCount = document.getElementById("gf2ResultsCount");
const gf2ClearFiltersBtn = document.getElementById("gf2ClearFiltersBtn");
const gf2CharacterGrid = document.getElementById("gf2CharacterGrid");
const gf2EmptyState = document.getElementById("gf2EmptyState");

const gameSelector = document.getElementById("gameSelector");
const gf2View = document.getElementById("gf2View");
const genshinView = document.getElementById("genshinView");
const gameTabs = document.querySelectorAll("[data-game-tab]");
const mobileFiltersToggleBtn = document.getElementById("mobileFiltersToggleBtn");
const filtersScrim = document.getElementById("filtersScrim");
const filterSheets = document.querySelectorAll("[data-filter-sheet]");
const closeFilterButtons = document.querySelectorAll("[data-close-filters]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const genshinState = {
  allCharacters: [],
  selectedFilters: {
    artifactSet: null,
    stats: []
  },
  filtersConfig: null,
  catalogs: null
};

const genshinSetsRoot = document.getElementById("genshinSetsRoot");
const genshinStatsRoot = document.getElementById("genshinStatsRoot");
const genshinSelectionSummary = document.getElementById("genshinSelectionSummary");
const characterGrid = document.getElementById("characterGrid");
const resultsCount = document.getElementById("resultsCount");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const emptyState = document.getElementById("emptyState");
const characterCardTemplate = document.getElementById("characterCardTemplate");
const characterModal = document.getElementById("characterModal");
const characterModalScrim = document.getElementById("characterModalScrim");
const characterModalCloseBtn = document.getElementById("characterModalCloseBtn");
const characterModalImage = document.getElementById("characterModalImage");
const characterModalTitle = document.getElementById("characterModalTitle");
const characterModalGame = document.getElementById("characterModalGame");
const characterModalMeta = document.getElementById("characterModalMeta");
const characterModalSummary = document.getElementById("characterModalSummary");
const characterModalBuilds = document.getElementById("characterModalBuilds");
const characterModalSource = document.getElementById("characterModalSource");

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initMobileFilterSheet();
  initCharacterModal();
  initGf2();
  initGenshin();
});

function initNavigation() {
  if (!gf2View || !genshinView) {
    return;
  }

  const savedGame = getStorageValue(STORAGE_KEYS.selectedGame);
  const initialGame = savedGame === "genshin" ? "genshin" : "gf2";
  if (gameSelector) {
    gameSelector.value = initialGame;
  }
  applyGameSelection(initialGame);

  if (gameSelector) {
    gameSelector.addEventListener("change", () => {
      const selectedGame = gameSelector.value === "genshin" ? "genshin" : "gf2";
      applyGameSelection(selectedGame);
      setStorageValue(STORAGE_KEYS.selectedGame, selectedGame);
    });
  }

  gameTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selectedGame = tab.dataset.gameTab === "genshin" ? "genshin" : "gf2";
      applyGameSelection(selectedGame);
      setStorageValue(STORAGE_KEYS.selectedGame, selectedGame);
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const tabs = Array.from(gameTabs);
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;

      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      }

      const nextTab = tabs[nextIndex];
      if (nextTab) {
        nextTab.focus();
        nextTab.click();
      }
    });
  });
}

function applyGameSelection(game) {
  const showGf2 = game === "gf2";
  if (gameSelector) {
    gameSelector.value = game;
  }
  closeMobileFilterSheet();
  applyGameTheme(game);
  gf2View.classList.toggle("hidden", !showGf2);
  genshinView.classList.toggle("hidden", showGf2);
  gf2View.setAttribute("aria-hidden", showGf2 ? "false" : "true");
  genshinView.setAttribute("aria-hidden", showGf2 ? "true" : "false");
  syncGameNavigation(game);
}

function syncGameNavigation(game) {
  gameTabs.forEach((tab) => {
    const isActive = tab.dataset.gameTab === game;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function applyGameTheme(game) {
  const nextTheme = game === "genshin" ? "genshin" : "gf2";
  document.body.dataset.gameTheme = nextTheme;

  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      "content",
      nextTheme === "genshin" ? "#8c6a2a" : "#243a57"
    );
  }
}

function initMobileFilterSheet() {
  if (!mobileFiltersToggleBtn || !filtersScrim || !filterSheets.length) {
    return;
  }

  mobileFiltersToggleBtn.addEventListener("click", () => {
    const activeGame = gameSelector?.value === "genshin" ? "genshin" : "gf2";
    const activeSheet = Array.from(filterSheets).find(
      (sheet) => sheet.dataset.filterSheet === activeGame
    );

    if (!activeSheet) {
      return;
    }

    if (activeSheet.classList.contains("is-open")) {
      closeMobileFilterSheet();
      return;
    }

    openMobileFilterSheet(activeGame);
  });

  filtersScrim.addEventListener("click", closeMobileFilterSheet);

  closeFilterButtons.forEach((button) => {
    button.addEventListener("click", closeMobileFilterSheet);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileFilterSheet();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMobileFilterSheet();
    }
  });
}

function openMobileFilterSheet(game) {
  document.body.classList.add("filter-sheet-open");
  filtersScrim.classList.remove("hidden");

  filterSheets.forEach((sheet) => {
    sheet.classList.toggle("is-open", sheet.dataset.filterSheet === game);
  });
}

function closeMobileFilterSheet() {
  document.body.classList.remove("filter-sheet-open");
  if (filtersScrim) {
    filtersScrim.classList.add("hidden");
  }

  filterSheets.forEach((sheet) => {
    sheet.classList.remove("is-open");
  });
}

function initCharacterModal() {
  if (!characterModal) {
    return;
  }

  characterModalCloseBtn?.addEventListener("click", closeCharacterModal);
  characterModalScrim?.addEventListener("click", closeCharacterModal);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCharacterModal();
    }
  });
}

async function initGf2() {
  if (
    !gf2SetsRoot ||
    !gf2SubstatsRoot ||
    !gf2SelectionSummary ||
    !gf2ResultsCount ||
    !gf2ClearFiltersBtn ||
    !gf2CharacterGrid ||
    !gf2EmptyState ||
    !characterCardTemplate
  ) {
    return;
  }

  try {
    const data = await fetchGf2Characters();

    gf2State.catalogs = data.catalogs;
    gf2State.sets = data.catalogs.sets.items.map((entry) => ({
      id: entry.id,
      name: entry.name,
      icon: entry.image || ""
    }));
    gf2State.substats = data.catalogs.stats.items.map((entry) => entry.name);
    gf2State.allCharacters = normalizeGf2Characters(data.characters || [], data.catalogs);

    renderGf2SetButtons();
    renderGf2SubstatsButtons();
    updateGf2SelectionSummary();
    renderGf2Characters();
    gf2ClearFiltersBtn.addEventListener("click", clearGf2Filters);
  } catch (error) {
    renderGf2LoadError(error);
  }
}

async function fetchGf2Characters() {
  const baseData = await fetchJson("./data/gf2-characters.json");
  const catalogs = await fetchCatalogs(
    baseData.catalogs,
    baseData.filters
  );
  const localCharacters = getCharactersOverride(STORAGE_KEYS.gf2Characters);

  return {
    ...baseData,
    catalogs,
    characters: mergeCharacterOverrides(baseData.characters || [], localCharacters)
  };
}

function normalizeGf2Characters(rawCharacters, catalogs) {
  if (!Array.isArray(rawCharacters)) {
    return [];
  }

  return rawCharacters
    .map((character) => normalizeGf2Character(character, catalogs))
    .filter(Boolean)
    .sort(compareCharactersByRelease);
}

function normalizeGf2Character(rawCharacter, catalogs) {
  if (!rawCharacter || typeof rawCharacter !== "object") {
    return null;
  }

  const id = String(rawCharacter.id || "").trim();
  const name = String(rawCharacter.name || "").trim();
  const role = String(rawCharacter.role || "").trim();
  const image = String(rawCharacter.image || rawCharacter.images?.card || "").trim();
  const splashImage = String(
    rawCharacter.splashImage || rawCharacter.images?.splash || rawCharacter.remoteImage || image
  ).trim();
  const source = String(rawCharacter.source || "").trim();
  const rarity = Number(rawCharacter.rarity || 0) || undefined;
  const rarityLabel = String(rawCharacter.rarityLabel || "").trim();
  const releaseOrder = Number(rawCharacter.releaseOrder || 0) || undefined;
  const builds = normalizeGf2Builds(rawCharacter.builds || [], catalogs).slice(0, 2);
  const details = normalizeGf2Details(rawCharacter, builds);
  const phase = details.phase || "";
  const attackTypes =
    details.attackTypes.length
      ? details.attackTypes
      : normalizeStringArray(rawCharacter.attackTypes || rawCharacter.tags || []);

  if (!id || !name || !image || !builds.length) {
    return null;
  }

  return {
    id,
    name,
    role,
    phase,
    attackTypes,
    image,
    splashImage,
    source,
    rarity,
    rarityLabel,
    releaseOrder,
    details,
    builds
  };
}

function normalizeGf2Builds(rawBuilds, catalogs) {
  if (!Array.isArray(rawBuilds)) {
    return [];
  }

  return rawBuilds
    .map((build) => {
      if (!build || typeof build !== "object") {
        return null;
      }

      const setEntry = resolveCatalogEntry(
        catalogs?.sets,
        build.setId || build.artifactSetId,
        typeof build.artifactSet === "object"
          ? build.artifactSet?.name || ""
          : build.artifactSet || build.set || ""
      );
      if (catalogs?.sets?.items?.length && !setEntry) {
        return null;
      }
      const mainStatEntry = resolveCatalogEntry(
        catalogs?.stats,
        build.mainStatId,
        build.mainStat || ""
      );
      const substatEntries = normalizeCatalogEntriesFromValues(
        catalogs?.stats,
        build.substatIds,
        build.substats
      );
      const set = setEntry?.name || String(build.set || "").trim();
      const setId = setEntry?.id ?? parseNumericId(build.setId);
      const mainStat = mainStatEntry?.name || String(build.mainStat || "").trim();
      const mainStatId =
        mainStatEntry?.id ?? parseNumericId(build.mainStatId);
      const substats = substatEntries.map((entry) => entry.name);
      const substatIds = substatEntries.map((entry) => entry.id);
      if (!set || !substats.length) {
        return null;
      }

      return { setId, set, mainStatId, mainStat, substatIds, substats };
    })
    .filter(Boolean);
}

function normalizeStringArray(values) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}

function normalizeGf2Details(rawCharacter, builds) {
  const rawDetails =
    rawCharacter?.details && typeof rawCharacter.details === "object"
      ? rawCharacter.details
      : {};
  const firstBuild = Array.isArray(builds) ? builds[0] : null;
  const rawPriority = normalizeStringArray(rawDetails.substatPriority || []);
  const rawRecommendedSetName =
    rawDetails.recommendedSetName || rawDetails.recommendedSet || firstBuild?.set || "";
  const rawRecommendedSetId =
    parseNumericId(rawDetails.recommendedSetId) || parseNumericId(firstBuild?.setId);
  const substatPriority = rawPriority.length
    ? rawPriority
    : normalizeStringArray(firstBuild?.substats || []);

  return {
    phase: String(rawCharacter.phase || rawDetails.phase || "").trim(),
    attackTypes: normalizeStringArray(
      rawCharacter.attackTypes || rawDetails.attackTypes || rawCharacter.tags || []
    ),
    attributes: normalizeStringArray(rawDetails.attributes || []),
    weaknesses: normalizeStringArray(rawDetails.weaknesses || []),
    recommendedSetName: String(rawRecommendedSetName).trim(),
    recommendedSet: String(rawDetails.recommendedSet || rawRecommendedSetName).trim(),
    recommendedSetId: rawRecommendedSetId || null,
    substatPriority
  };
}

function renderGf2SetButtons() {
  gf2SetsRoot.innerHTML = "";

  gf2State.sets.forEach((setItem) => {
    const button = buildChipButton({
      label: setItem.name,
      iconSrc: setItem.icon,
      isActive: gf2State.selectedSet === setItem.name,
      onClick: () => {
        gf2State.selectedSet =
          gf2State.selectedSet === setItem.name ? null : setItem.name;
        onGf2FiltersChanged();
      }
    });
    gf2SetsRoot.appendChild(button);
  });
}

function renderGf2SubstatsButtons() {
  gf2SubstatsRoot.innerHTML = "";

  gf2State.substats.forEach((substat) => {
    const button = buildChipButton({
      label: substat,
      isActive: gf2State.selectedSubstats.has(substat),
      onClick: () => {
        if (gf2State.selectedSubstats.has(substat)) {
          gf2State.selectedSubstats.delete(substat);
        } else {
          gf2State.selectedSubstats.add(substat);
        }
        onGf2FiltersChanged();
      }
    });
    gf2SubstatsRoot.appendChild(button);
  });
}

function buildChipButton({ label, iconSrc, isActive, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `chip${isActive ? " active" : ""}`;
  button.setAttribute("aria-pressed", isActive ? "true" : "false");
  if (iconSrc) {
    button.classList.add("chip-with-icon");
    const icon = document.createElement("img");
    icon.className = "chip-icon";
    icon.src = iconSrc;
    icon.alt = "";
    icon.loading = "lazy";
    icon.addEventListener("error", () => icon.remove());
    button.appendChild(icon);
  }
  const text = document.createElement("span");
  text.textContent = label;
  button.appendChild(text);
  button.addEventListener("click", onClick);
  return button;
}

function onGf2FiltersChanged() {
  renderGf2SetButtons();
  renderGf2SubstatsButtons();
  updateGf2SelectionSummary();
  renderGf2Characters();
}

function clearGf2Filters() {
  gf2State.selectedSet = null;
  gf2State.selectedSubstats.clear();
  onGf2FiltersChanged();
}

function updateGf2SelectionSummary() {
  const selectedSubstats = Array.from(gf2State.selectedSubstats);
  const setText = gf2State.selectedSet || "Ninguno";
  const substatsText = selectedSubstats.length
    ? selectedSubstats.join(", ")
    : "Ninguna";

  gf2SelectionSummary.textContent = `Set seleccionado: ${setText} | Substats: ${substatsText}`;
}

function renderGf2Characters() {
  const filteredCharacters = gf2State.allCharacters
    .filter(isGf2CharacterMatch)
    .sort(compareCharactersByRelease);
  gf2CharacterGrid.innerHTML = "";

  if (filteredCharacters.length === 0) {
    gf2EmptyState.classList.remove("hidden");
  } else {
    gf2EmptyState.classList.add("hidden");
  }

  filteredCharacters.forEach((character, index) => {
    const card = buildGf2CharacterCard(character, index);
    gf2CharacterGrid.appendChild(card);
  });

  const activeCount =
    (gf2State.selectedSet ? 1 : 0) + gf2State.selectedSubstats.size;
  gf2ResultsCount.textContent = `${filteredCharacters.length} personaje(s) GF2${
    activeCount ? ` - ${activeCount} filtro(s) activo(s)` : ""
  }`;
}

function buildGf2CharacterCard(character, index) {
  const fragment = characterCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".character-card");
  const image = fragment.querySelector(".character-image");
  const name = fragment.querySelector(".character-name");
  const role = fragment.querySelector(".character-role");
  const meta = fragment.querySelector(".character-meta");
  const buildSet = fragment.querySelector(".build-set");
  const buildStats = fragment.querySelector(".build-stats");

  const bestBuild = getBestGf2Build(character);
  card.style.animationDelay = `${index * 28}ms`;
  applyCharacterCardMeta(card, character);
  card.dataset.game = "gf2";
  decorateCharacterCard(card, () => openCharacterModal("gf2", character));

  image.src = character.image;
  image.alt = `Retrato de ${character.name}`;
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", function handleGf2ImageError() {
    const splashImage = String(character.splashImage || "").trim();
    const currentSrc = image.getAttribute("src") || "";

    if (splashImage && currentSrc !== splashImage) {
      image.src = splashImage;
      return;
    }

    image.removeEventListener("error", handleGf2ImageError);
    image.src = buildFallbackAvatar(character.name);
  });

  name.textContent = character.name;
  role.textContent = character.role;
  const phaseText = character.phase || "Phase no definido";
  meta.textContent = `${phaseText} | ${joinWithSlash(character.attackTypes)}`;
  buildSet.innerHTML = renderBuildSetLine("gf2", bestBuild.set);
  buildStats.innerHTML = renderBuildTextLine("Substats", joinWithSlash(bestBuild.substats));

  return fragment;
}

function isGf2CharacterMatch(character) {
  return (character.builds || []).some((build) => isGf2BuildMatch(build));
}

function isGf2BuildMatch(build) {
  if (gf2State.selectedSet && build.set !== gf2State.selectedSet) {
    return false;
  }

  const selectedSubstats = Array.from(gf2State.selectedSubstats);
  if (!selectedSubstats.length) {
    return true;
  }

  const buildSubstats = build.substats || [];
  return selectedSubstats.every((substat) => buildSubstats.includes(substat));
}

function getBestGf2Build(character) {
  return (
    (character.builds || []).find((build) => isGf2BuildMatch(build)) ||
    (character.builds || [])[0] || {
      set: "Sin set",
      substats: []
    }
  );
}

function renderGf2LoadError(error) {
  if (gf2SelectionSummary) {
    gf2SelectionSummary.textContent = `No se pudieron cargar los datos de GF2: ${error.message}`;
  }
  if (gf2CharacterGrid) {
    gf2CharacterGrid.innerHTML = "";
  }
  if (gf2EmptyState) {
    gf2EmptyState.classList.remove("hidden");
    const title = gf2EmptyState.querySelector("h2, h3");
    const message = gf2EmptyState.querySelector("p");
    if (title) {
      title.textContent = "No se pudo cargar la informacion";
    }
    if (message) {
      message.textContent = error.message;
    }
  }
  if (gf2ResultsCount) {
    gf2ResultsCount.textContent = "0 personaje(s) GF2";
  }
}

async function initGenshin() {
  if (
    !genshinSetsRoot ||
    !genshinStatsRoot ||
    !genshinSelectionSummary ||
    !characterGrid ||
    !resultsCount ||
    !clearFiltersBtn ||
    !emptyState ||
    !characterCardTemplate
  ) {
    return;
  }

  try {
    const data = await fetchCharactersData();
    genshinState.allCharacters = data.characters;
    genshinState.filtersConfig = data.filters;
    genshinState.catalogs = data.catalogs;
    renderGenshinFilters();
    renderCharacters();
    clearFiltersBtn.addEventListener("click", clearFilters);
  } catch (error) {
    renderLoadError(error);
  }
}

async function fetchCharactersData() {
  const baseData = await fetchJson("./data/genshin-characters.json");
  const catalogs = await fetchCatalogs(
    baseData.catalogs,
    baseData.filters
  );
  const localCharacters = getCharactersOverride(STORAGE_KEYS.genshinCharacters);
  return normalizeGenshinDataset(
    {
    ...baseData,
    characters: mergeCharacterOverrides(baseData.characters || [], localCharacters)
    },
    catalogs
  );
}

function normalizeGenshinDataset(data, catalogs) {
  return {
    filters: {
      sets: catalogs.sets.items.map((entry) => ({
        id: entry.id,
        name: entry.name,
        image: entry.image || ""
      })),
      stats: catalogs.stats.items.map((entry) => entry.name)
    },
    catalogs,
    characters: normalizeGenshinCharacters(data?.characters || [], catalogs)
  };
}

function normalizeArtifactSetOption(entry) {
  if (typeof entry === "string") {
    const name = entry.trim();
    if (!name) {
      return null;
    }
    return { id: slugifySetName(name), name, image: "" };
  }

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const name = String(entry.name || "").trim();
  if (!name) {
    return null;
  }

  return {
    id: String(entry.id || slugifySetName(name)).trim(),
    name,
    image: String(entry.image || "").trim()
  };
}

function normalizeGenshinCharacters(characters, catalogs) {
  return characters
    .map((character) => normalizeGenshinCharacter(character, catalogs))
    .filter(Boolean)
    .sort(compareCharactersByRelease);
}

function normalizeGenshinCharacter(character, catalogs) {
  if (!character || typeof character !== "object") {
    return null;
  }

  const name = String(character.name || "").trim();
  const image = String(character.image || character.images?.card || "").trim();
  const splashImage = String(character.splashImage || character.images?.splash || image).trim();
  const normalizedId = String(character.id || slugifySetName(name)).trim();
  if (!name || !image || normalizedId === "manekin") {
    return null;
  }

  return {
    id: normalizedId,
    name,
    element: String(character.element || character.details?.element || "Variable").trim(),
    role: String(character.role || "").trim(),
    rarity: Number(character.rarity || 0) || undefined,
    releaseOrder: Number(character.releaseOrder || 0) || undefined,
    image,
    splashImage,
    source: String(character.source || "").trim(),
    builds: normalizeGenshinBuilds(character.builds, catalogs)
  };
}

function normalizeGenshinBuilds(rawBuilds, catalogs) {
  if (!Array.isArray(rawBuilds)) {
    return [];
  }

  return rawBuilds
    .map((build) => normalizeGenshinBuild(build, catalogs))
    .filter(Boolean);
}

function normalizeGenshinBuild(build, catalogs) {
  if (!build || typeof build !== "object") {
    return null;
  }

  const setEntry = resolveCatalogEntry(
    catalogs?.sets,
    build.setId || build.artifactSetId,
    typeof build.artifactSet === "object"
      ? build.artifactSet?.name || ""
      : build.artifactSet || build.set || ""
  );
  if (catalogs?.sets?.items?.length && !setEntry) {
    return null;
  }
  const set = setEntry?.name || String(build.set || build.artifactSet || "").trim();
  const setId = setEntry?.id ?? parseNumericId(build.setId || build.artifactSetId);
  if (!set) {
    return null;
  }

  const stats = Array.isArray(build.stats)
    ? uniqueStrings(build.stats)
    : normalizeLegacyBuildStats(build.mainStats);
  const hasStructuredStats =
    Boolean(build.set || build.artifactSet || build.setId || build.artifactSetId) ||
    Boolean(build.mainStatId) ||
    Array.isArray(build.substatIds);
  const [rawMainStat, ...rawSubstats] = hasStructuredStats
    ? [String(build.mainStat || "").trim(), ...uniqueStrings(build.substats || [])].filter(Boolean)
    : stats;
  const mainStatEntry = resolveCatalogEntry(
    catalogs?.stats,
    build.mainStatId,
    rawMainStat
  );
  const substatEntries = normalizeCatalogEntriesFromValues(
    catalogs?.stats,
    build.substatIds,
    rawSubstats
  );

  return {
    setId,
    set,
    mainStatId:
      mainStatEntry?.id ??
      parseNumericId(build.mainStatId),
    mainStat: mainStatEntry?.name || rawMainStat || "",
    substatIds: substatEntries.map((entry) => entry.id),
    substats: substatEntries.map((entry) => entry.name)
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url} (${response.status})`);
  }
  return response.json();
}

async function fetchCatalogs(catalogRefs, legacyFilters) {
  const [setsPayload, statsPayload] = await Promise.all([
    catalogRefs?.sets ? fetchJson(catalogRefs.sets) : Promise.resolve({ items: legacyFilters?.sets || [] }),
    catalogRefs?.stats ? fetchJson(catalogRefs.stats) : Promise.resolve({ items: legacyFilters?.stats || [] })
  ]);

  return {
    sets: createCatalogIndex(normalizeSetCatalogEntries(setsPayload?.items || legacyFilters?.sets || [])),
    stats: createCatalogIndex(normalizeStatCatalogEntries(statsPayload?.items || legacyFilters?.stats || []))
  };
}

function normalizeSetCatalogEntries(rawEntries) {
  return (rawEntries || [])
    .map((entry) => {
      if (typeof entry === "string") {
        const name = entry.trim();
        return name ? { id: slugifySetName(name), name, image: "" } : null;
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const name = String(entry.name || "").trim();
      if (!name) {
        return null;
      }
      return {
        id:
          Number.isInteger(entry.id)
            ? entry.id
            : String(entry.id || slugifySetName(name)).trim(),
        name,
        image: String(entry.image || entry.icon || "").trim()
      };
    })
    .filter(Boolean);
}

function normalizeStatCatalogEntries(rawEntries) {
  return (rawEntries || [])
    .map((entry) => {
      if (typeof entry === "string") {
        const name = entry.trim();
        return name ? { id: slugifySetName(name), name, short: name.slice(0, 3).toUpperCase(), tone: "neutral" } : null;
      }
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const name = String(entry.name || "").trim();
      if (!name) {
        return null;
      }
      return {
        id:
          Number.isInteger(entry.id)
            ? entry.id
            : String(entry.id || slugifySetName(name)).trim(),
        name,
        short: String(entry.short || name.slice(0, 3).toUpperCase()).trim(),
        tone: String(entry.tone || "neutral").trim()
      };
    })
    .filter(Boolean);
}

function createCatalogIndex(items) {
  const byId = new Map();
  const bySlug = new Map();
  const byName = new Map();

  items.forEach((entry) => {
    byId.set(String(entry.id), entry);
    byName.set(entry.name, entry);
    bySlug.set(slugifySetName(entry.name), entry);
  });

  return { items, byId, byName, bySlug };
}

function resolveCatalogEntry(catalog, rawId, rawName) {
  const normalizedId = String(rawId || "").trim();
  if (normalizedId && catalog?.byId?.has(normalizedId)) {
    return catalog.byId.get(normalizedId);
  }

  const normalizedName = String(rawName || "").trim();
  if (normalizedName && catalog?.byName?.has(normalizedName)) {
    return catalog.byName.get(normalizedName);
  }

  const slug = slugifySetName(normalizedName || normalizedId);
  return slug ? catalog?.bySlug?.get(slug) || null : null;
}

function normalizeCatalogEntriesFromValues(catalog, rawIds, rawNames) {
  if (Array.isArray(rawIds) && rawIds.length) {
    return normalizeStringArray(rawIds)
      .map((value) => resolveCatalogEntry(catalog, value, ""))
      .filter(Boolean);
  }

  const names = normalizeStringArray(rawNames || []);
  if (catalog?.items?.length) {
    return names
      .map((value) => resolveCatalogEntry(catalog, "", value))
      .filter(Boolean);
  }

  return names.map((value) => ({
    id: value,
    name: value,
    short: value.slice(0, 3).toUpperCase(),
    tone: "neutral"
  }));
}

function parseNumericId(value) {
  const nextValue = Number(value);
  return Number.isInteger(nextValue) && nextValue > 0 ? nextValue : null;
}

function normalizeLegacyBuildStats(mainStats) {
  if (!mainStats || typeof mainStats !== "object") {
    return [];
  }

  return uniqueStrings([
    ...(Array.isArray(mainStats.sands) ? mainStats.sands : []),
    ...(Array.isArray(mainStats.goblet) ? mainStats.goblet : []),
    ...(Array.isArray(mainStats.circlet) ? mainStats.circlet : [])
  ]);
}

function renderGenshinFilters() {
  renderGenshinSetFilters();
  renderGenshinStatFilters();
  updateGenshinSelectionSummary();
}

function renderGenshinSetFilters() {
  genshinSetsRoot.innerHTML = "";

  const allButton = createGenshinSetChip({
    value: null,
    label: "Todos los sets",
    image: "",
    isActive: genshinState.selectedFilters.artifactSet === null
  });
  genshinSetsRoot.appendChild(allButton);

  genshinState.filtersConfig.sets.forEach((setOption) => {
    genshinSetsRoot.appendChild(
      createGenshinSetChip({
        value: setOption.name,
        label: setOption.name,
        image: setOption.image,
        isActive: genshinState.selectedFilters.artifactSet === setOption.name
      })
    );
  });
}

function renderGenshinStatFilters() {
  genshinStatsRoot.innerHTML = "";

  genshinState.filtersConfig.stats.forEach((stat) => {
    genshinStatsRoot.appendChild(
      createGenshinStatChip({
        value: stat,
        isActive: genshinState.selectedFilters.stats.includes(stat)
      })
    );
  });
}

function createGenshinSetChip({ value, label, image, isActive }) {
  const button = document.createElement("button");
  button.className = `chip artifact-chip chip-with-icon${isActive ? " active" : ""}`;
  button.type = "button";
  button.dataset.value = value ?? "";
  button.setAttribute("aria-pressed", isActive ? "true" : "false");

  if (image) {
    const icon = document.createElement("img");
    icon.className = "chip-icon";
    icon.src = image;
    icon.alt = "";
    icon.loading = "lazy";
    icon.referrerPolicy = "no-referrer";
    button.appendChild(icon);
  }

  const text = document.createElement("span");
  text.textContent = label;
  button.appendChild(text);

  button.addEventListener("click", () => {
    genshinState.selectedFilters.artifactSet = value;
    updateGenshinChipStates();
    updateGenshinSelectionSummary();
    renderCharacters();
  });
  return button;
}

function createGenshinStatChip({ value, isActive }) {
  const button = document.createElement("button");
  button.className = `chip${isActive ? " active" : ""}`;
  button.type = "button";
  button.setAttribute("aria-pressed", isActive ? "true" : "false");

  const order = genshinState.selectedFilters.stats.indexOf(value);
  if (order >= 0) {
    const badge = document.createElement("span");
    badge.className = "chip-order";
    badge.textContent = String(order + 1);
    button.appendChild(badge);
  }

  const text = document.createElement("span");
  text.textContent = value;
  button.appendChild(text);

  button.dataset.value = value;
  button.addEventListener("click", () => {
    toggleGenshinStat(value);
    updateGenshinChipStates();
    updateGenshinSelectionSummary();
    renderCharacters();
  });
  return button;
}

function toggleGenshinStat(value) {
  const nextStats = [...genshinState.selectedFilters.stats];
  const currentIndex = nextStats.indexOf(value);

  if (currentIndex >= 0) {
    nextStats.splice(currentIndex, 1);
  } else {
    nextStats.push(value);
  }

  genshinState.selectedFilters.stats = nextStats;
}

function updateGenshinChipStates() {
  genshinSetsRoot.querySelectorAll(".chip").forEach((chip) => {
    const value = chip.dataset.value || null;
    const isActive = genshinState.selectedFilters.artifactSet === value;
    chip.classList.toggle("active", isActive);
    chip.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  renderGenshinStatFilters();
}

function clearFilters() {
  genshinState.selectedFilters.artifactSet = null;
  genshinState.selectedFilters.stats = [];
  updateGenshinChipStates();
  updateGenshinSelectionSummary();
  renderCharacters();
}

function renderCharacters() {
  const filteredCharacters = genshinState.allCharacters
    .filter(isCharacterMatch)
    .sort(compareCharactersByRelease);
  characterGrid.innerHTML = "";

  if (filteredCharacters.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  filteredCharacters.forEach((character, index) => {
    const card = buildCharacterCard(character, index);
    characterGrid.appendChild(card);
  });

  const activeCount = countActiveFilters();
  resultsCount.textContent = `${filteredCharacters.length} personaje(s)${
    activeCount ? ` - ${activeCount} filtro(s) activo(s)` : ""
  }`;
}

function buildCharacterCard(character, index) {
  const fragment = characterCardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".character-card");
  const image = fragment.querySelector(".character-image");
  const name = fragment.querySelector(".character-name");
  const role = fragment.querySelector(".character-role");
  const meta = fragment.querySelector(".character-meta");
  const buildSet = fragment.querySelector(".build-set");
  const buildStats = fragment.querySelector(".build-stats");

  const bestBuild = getBestBuild(character);
  card.style.animationDelay = `${index * 35}ms`;
  applyCharacterCardMeta(card, character);
  card.dataset.game = "genshin";
  decorateCharacterCard(card, () => openCharacterModal("genshin", character));

  image.src = character.image;
  image.alt = `Retrato de ${character.name}`;
  image.referrerPolicy = "no-referrer";
  image.addEventListener("error", function handleCharacterImageError() {
    const splashImage = String(character.splashImage || "").trim();
    const currentSrc = image.getAttribute("src") || "";

    if (splashImage && currentSrc !== splashImage) {
      image.src = splashImage;
      return;
    }

    image.removeEventListener("error", handleCharacterImageError);
    image.src = buildFallbackAvatar(character.name);
  });

  name.textContent = character.name;
  role.textContent = character.role || character.element;
  role.classList.add("rarity-badge");
  meta.textContent = `${character.element}`;
  buildSet.innerHTML = renderBuildSetLine("genshin", bestBuild?.set || "Pendiente");
  buildStats.innerHTML = renderGenshinBuildStatsLine(bestBuild);

  return fragment;
}

function decorateCharacterCard(card, onActivate) {
  if (!card) {
    return;
  }

  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.addEventListener("click", onActivate);
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onActivate();
  });
}

function openCharacterModal(game, character) {
  if (!characterModal || !characterModalImage) {
    return;
  }

  const splashImage = String(character?.splashImage || character?.image || "").trim();
  const meta = buildCharacterModalMeta(game, character);

  characterModal.classList.remove("hidden");
  characterModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  characterModalImage.src = splashImage || buildFallbackAvatar(character.name);
  characterModalImage.alt = `Splash art de ${character.name}`;
  characterModalImage.referrerPolicy = "no-referrer";
  characterModalImage.onerror = () => {
    characterModalImage.onerror = null;
    characterModalImage.src = buildFallbackAvatar(character.name);
  };

  characterModalGame.textContent =
    game === "gf2" ? "Girls' Frontline 2" : "Genshin Impact";
  characterModalTitle.textContent = character.name;
  characterModalMeta.textContent = meta.join(" | ");
  renderCharacterModalSummary(game, character);
  renderCharacterModalBuilds(game, character);

  const source = String(character?.source || "").trim();
  if (source) {
    characterModalSource.href = source;
    characterModalSource.classList.remove("hidden");
  } else {
    characterModalSource.removeAttribute("href");
    characterModalSource.classList.add("hidden");
  }
}

function closeCharacterModal() {
  if (!characterModal) {
    return;
  }

  characterModal.classList.add("hidden");
  characterModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function buildCharacterModalMeta(game, character) {
  if (game === "gf2") {
    return [
      character.role || "-",
      character.phase || "-",
      joinWithSlash(character.attackTypes),
      formatRarityLabel(character)
    ].filter(Boolean);
  }

  return [
    character.element || "-",
    character.role || "-",
    formatRarityLabel(character)
  ].filter(Boolean);
}

function renderCharacterModalSummary(game, character) {
  if (!characterModalSummary) {
    return;
  }

  const values =
    game === "gf2"
      ? buildGf2ModalSummaryValues(character)
      : [
          `Elemento: ${character.element || "-"}`,
          `Rol: ${character.role || "-"}`,
          `Rareza: ${formatRarityLabel(character)}`,
          `Salida: ${character.releaseOrder || "-"}`,
          `Builds: ${Array.isArray(character.builds) ? character.builds.length : 0}`
        ];

  characterModalSummary.innerHTML = values
    .filter(Boolean)
    .map((value) => `<span class="character-modal-pill">${escapeHtml(value)}</span>`)
    .join("");
}

function buildGf2ModalSummaryValues(character) {
  const details = character?.details && typeof character.details === "object" ? character.details : {};
  const bestBuild = getBestGf2Build(character);
  const recommendedSet = String(
    details.recommendedSetName || details.recommendedSet || bestBuild?.set || ""
  ).trim();
  const substatPriority = Array.isArray(details.substatPriority) && details.substatPriority.length
    ? details.substatPriority.join(" > ")
    : joinWithSlash(bestBuild?.substats || []);

  return [
    `Rol: ${character.role || "-"}`,
    `Phase: ${character.phase || "-"}`,
    `Ataque: ${joinWithSlash(character.attackTypes)}`,
    `Atributos: ${joinWithSlash(details.attributes)}`,
    `Debilidades: ${joinWithSlash(details.weaknesses)}`,
    `Set recomendado: ${recommendedSet || "-"}`,
    `Prioridad substats: ${substatPriority || "-"}`,
    `Rareza: ${formatRarityLabel(character)}`,
    `Salida: ${character.releaseOrder || "-"}`,
    `Builds: ${Array.isArray(character.builds) ? character.builds.length : 0}`
  ];
}

function renderCharacterModalBuilds(game, character) {
  if (!characterModalBuilds) {
    return;
  }

  const builds = Array.isArray(character?.builds) ? character.builds : [];
  if (!builds.length) {
    characterModalBuilds.innerHTML =
      '<div class="character-modal-empty">Este personaje todavia no tiene builds configuradas en el dataset.</div>';
    return;
  }

  characterModalBuilds.innerHTML = builds
    .map((build, index) =>
      game === "gf2"
        ? `
          <article class="character-modal-build-card">
            <h4>Build ${index + 1}</h4>
            ${renderBuildSetLine("gf2", build.set || "-")}
            ${
              build.mainStat
                ? renderBuildTextLine("Principal", build.mainStat)
                : ""
            }
            ${renderBuildTextLine("Substats", joinWithSlash(build.substats || []))}
          </article>
        `
        : `
          <article class="character-modal-build-card">
            <h4>Build ${index + 1}</h4>
            ${renderBuildSetLine("genshin", build.set || "-")}
            ${renderGenshinBuildStatsLine(build, true)}
          </article>
        `
    )
    .join("");
}

function isCharacterMatch(character) {
  if (!hasActiveGenshinFilters()) {
    return true;
  }

  if (!Array.isArray(character.builds) || character.builds.length === 0) {
    return false;
  }

  return character.builds.some((build) => isBuildMatch(build));
}

function isBuildMatch(build) {
  if (
    genshinState.selectedFilters.artifactSet &&
    build.set !== genshinState.selectedFilters.artifactSet
  ) {
    return false;
  }

  const [selectedMainStat, ...selectedSubstats] = genshinState.selectedFilters.stats;
  const buildMainStat = String(build.mainStat || "").trim();
  const buildSubstats = Array.isArray(build.substats) ? build.substats : [];

  if (selectedMainStat && buildMainStat !== selectedMainStat) {
    return false;
  }

  return selectedSubstats.every((stat) => buildSubstats.includes(stat));
}

function getBestBuild(character) {
  return (
    character.builds.find((build) => isBuildMatch(build)) || character.builds[0] || null
  );
}

function formatBuildStats(build) {
  if (!build || (!build.mainStat && (!Array.isArray(build.substats) || !build.substats.length))) {
    return "Sin stats enlazadas";
  }

  const mainStat = String(build.mainStat || "").trim();
  const substats = Array.isArray(build.substats) ? build.substats : [];
  const mainLabel = `Principal: ${mainStat || "-"}`;
  const substatsLabel = `Substats: ${substats.length ? substats.join(" / ") : "-"}`;
  return `${mainLabel} | ${substatsLabel}`;
}

function joinWithSlash(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return "-";
  }

  return values.join(" / ");
}

function renderBuildSetLine(game, setName) {
  return renderBuildTextLine("Set", setName || "-", getSetIconMarkup(game, setName));
}

function renderBuildTextLine(label, value, iconMarkup = "") {
  return `
    <span class="build-line">
      ${iconMarkup}
      <span class="build-line-text"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(
        value || "-"
      )}</span>
    </span>
  `;
}

function renderGenshinBuildStatsLine(build, includeSubstatIcons = false) {
  if (!build || (!build.mainStat && (!Array.isArray(build.substats) || !build.substats.length))) {
    return renderBuildTextLine("Stats", "Sin stats enlazadas", getStatIconMarkup("", ""));
  }

  const mainStat = String(build.mainStat || "").trim() || "-";
  const substats = Array.isArray(build.substats) ? build.substats : [];
  const substatsText = substats.length ? substats.join(" / ") : "-";
  const substatIcons = includeSubstatIcons
    ? renderSubstatIconsMarkup(substats, build.substatIds)
    : "";

  return `
    <span class="build-line">
      ${getStatIconMarkup(build.mainStatId, mainStat)}
      <span class="build-line-text">
        <strong>Principal:</strong> ${escapeHtml(mainStat)}<br />
        <strong>Substats:</strong> ${escapeHtml(substatsText)}
      </span>
      ${substatIcons}
    </span>
  `;
}

function renderSubstatIconsMarkup(stats, statIds) {
  if (!Array.isArray(stats) || !stats.length) {
    return "";
  }

  return `
    <span class="build-line-subicons" aria-hidden="true">
      ${stats
        .map((stat, index) => {
          const token = getGenshinStatToken(
            Array.isArray(statIds) ? statIds[index] : "",
            stat
          );
          return `<span class="build-line-subicon stat-token stat-token-${escapeHtml(
            token.tone
          )}">${escapeHtml(token.short)}</span>`;
        })
        .join("")}
    </span>
  `;
}

function getSetIconMarkup(game, setName) {
  const iconUrl = getSetIconUrl(game, setName);
  if (!iconUrl) {
    return "";
  }

  return `<img class="build-line-icon build-line-icon-image" src="${escapeHtml(
    iconUrl
  )}" alt="" loading="lazy" referrerpolicy="no-referrer" />`;
}

function getSetIconUrl(game, setName) {
  const normalizedSetName = normalizeSetLookupKey(setName || "");
  if (!normalizedSetName) {
    return "";
  }

  const setOptions =
    game === "gf2" ? gf2State.sets : Array.isArray(genshinState.filtersConfig?.sets)
      ? genshinState.filtersConfig.sets
      : [];
  const matchedSet = setOptions.find(
    (entry) => normalizeSetLookupKey(entry?.name || "") === normalizedSetName
  );

  return String(matchedSet?.icon || matchedSet?.image || "").trim();
}

function normalizeSetLookupKey(value) {
  const key = slugifySetName(value || "");
  if (key === "allay-support") {
    return "ally-support";
  }
  if (key === "physical-boost") {
    return "ballistic-boost";
  }
  return key;
}

function getStatIconMarkup(statId, statName) {
  const token = getGenshinStatToken(statId, statName);
  return `<span class="build-line-icon build-line-icon-stat stat-token stat-token-${escapeHtml(
    token.tone
  )}" aria-hidden="true">${escapeHtml(token.short)}</span>`;
}

function getGenshinStatToken(statId, statName) {
  const entry = resolveCatalogEntry(genshinState.catalogs?.stats, statId, statName);
  if (entry) {
    return {
      short: String(entry.short || entry.name.slice(0, 3).toUpperCase()).trim(),
      tone: String(entry.tone || "neutral").trim()
    };
  }

  const value = String(statName || statId || "").trim();
  const normalized = slugifySetName(value);

  if (!normalized) {
    return { short: "?", tone: "neutral" };
  }
  if (normalized.includes("prob-crit") || normalized.includes("crit-rate")) {
    return { short: "CR", tone: "crit" };
  }
  if (normalized.includes("dano-crit") || normalized.includes("crit-dmg")) {
    return { short: "CD", tone: "crit" };
  }
  if (normalized.includes("recarga-de-energia") || normalized.includes("energy-recharge")) {
    return { short: "ER", tone: "energy" };
  }
  if (
    normalized.includes("maestria-elemental") ||
    normalized.includes("elemental-mastery")
  ) {
    return { short: "EM", tone: "mastery" };
  }
  if (normalized.includes("bono-de-curacion") || normalized.includes("healing")) {
    return { short: "HB", tone: "healing" };
  }
  if (normalized.includes("pyro")) {
    return { short: "PY", tone: "pyro" };
  }
  if (normalized.includes("hydro")) {
    return { short: "HY", tone: "hydro" };
  }
  if (normalized.includes("electro")) {
    return { short: "EL", tone: "electro" };
  }
  if (normalized.includes("cryo")) {
    return { short: "CY", tone: "cryo" };
  }
  if (normalized.includes("geo")) {
    return { short: "GE", tone: "geo" };
  }
  if (normalized.includes("anemo")) {
    return { short: "AN", tone: "anemo" };
  }
  if (normalized.includes("dendro")) {
    return { short: "DE", tone: "dendro" };
  }
  if (normalized.includes("fisico") || normalized.includes("physical")) {
    return { short: "PH", tone: "physical" };
  }
  if (normalized.includes("hp")) {
    return { short: normalized.includes("plano") ? "HP" : "HP%", tone: "hp" };
  }
  if (normalized.includes("atq") || normalized.includes("atk") || normalized.includes("attack")) {
    return { short: normalized.includes("plano") ? "ATK" : "ATK%", tone: "atk" };
  }
  if (normalized.includes("def")) {
    return { short: normalized.includes("plano") ? "DEF" : "DEF%", tone: "def" };
  }

  return { short: value.slice(0, 3).toUpperCase(), tone: "neutral" };
}

function countActiveFilters() {
  return (genshinState.selectedFilters.artifactSet ? 1 : 0) + genshinState.selectedFilters.stats.length;
}

function hasActiveGenshinFilters() {
  return countActiveFilters() > 0;
}

function updateGenshinSelectionSummary() {
  if (!genshinSelectionSummary) {
    return;
  }

  const { artifactSet, stats } = genshinState.selectedFilters;
  if (!artifactSet && stats.length === 0) {
    genshinSelectionSummary.textContent = "Sin filtros activos.";
    return;
  }

  const [mainStat, ...substats] = stats;
  const parts = [];

  if (artifactSet) {
    parts.push(`Set: ${artifactSet}`);
  }
  if (mainStat) {
    parts.push(`Principal: ${mainStat}`);
  }
  if (substats.length) {
    parts.push(`Substats: ${substats.join(" / ")}`);
  }

  genshinSelectionSummary.textContent = parts.join(" | ");
}

function slugifySetName(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildFallbackAvatar(name) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&fontWeight=700`;
}

function formatRarityLabel(character) {
  const rarity = Number(character?.rarity || 0);
  const rarityLabel = String(character?.rarityLabel || "").trim();
  if (!rarity) {
    return rarityLabel || "-";
  }
  if (rarityLabel && rarityLabel !== `${rarity}*`) {
    return `${rarity}* · ${rarityLabel}`;
  }
  return `${rarity}*`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyCharacterCardMeta(card, character) {
  const rarity = Number(character?.rarity || 0);
  if (rarity) {
    card.dataset.rarity = String(rarity);
  } else {
    delete card.dataset.rarity;
  }
}

function compareCharactersByRelease(left, right) {
  const leftOrder = Number(left?.releaseOrder || 0);
  const rightOrder = Number(right?.releaseOrder || 0);

  if (leftOrder && rightOrder && leftOrder !== rightOrder) {
    return rightOrder - leftOrder;
  }
  if (leftOrder && !rightOrder) {
    return -1;
  }
  if (!leftOrder && rightOrder) {
    return 1;
  }
  return String(left?.name || "").localeCompare(String(right?.name || ""), "es");
}

function mergeCharacterOverrides(baseCharacters, overrideCharacters) {
  if (!Array.isArray(baseCharacters) || !baseCharacters.length) {
    return Array.isArray(overrideCharacters) ? overrideCharacters : [];
  }

  if (!Array.isArray(overrideCharacters) || !overrideCharacters.length) {
    return baseCharacters;
  }

  const baseByKey = new Map(
    baseCharacters.map((character) => [getCharacterMergeKey(character), character])
  );
  const overrideByKey = new Map(
    overrideCharacters.map((character) => [getCharacterMergeKey(character), character])
  );

  const merged = baseCharacters.map((baseCharacter) => {
    const key = getCharacterMergeKey(baseCharacter);
    const override = overrideByKey.get(key);
    if (!override) {
      return baseCharacter;
    }

    const nextImage = resolveMergedCharacterImage(baseCharacter, override);
    const nextSplashImage = resolveMergedCharacterSplashImage(
      baseCharacter,
      override,
      nextImage
    );

    return {
      ...baseCharacter,
      ...override,
      image: nextImage,
      splashImage: nextSplashImage,
      rarity: resolveMergedPositiveNumber(override.rarity, baseCharacter.rarity),
      rarityLabel: String(override.rarityLabel || "").trim() || baseCharacter.rarityLabel,
      releaseOrder: resolveMergedReleaseOrder(baseCharacter, override),
      builds:
        Array.isArray(override.builds) && override.builds.length
          ? override.builds
          : baseCharacter.builds
    };
  });

  overrideCharacters.forEach((overrideCharacter) => {
    const key = getCharacterMergeKey(overrideCharacter);
    if (!baseByKey.has(key)) {
      merged.push(overrideCharacter);
    }
  });

  return merged;
}

function getCharacterMergeKey(character) {
  return slugifySetName(character?.id || character?.name || "");
}

function resolveMergedCharacterImage(baseCharacter, overrideCharacter) {
  const overrideImage = getRawCharacterCardImage(overrideCharacter);
  const baseImage = getRawCharacterCardImage(baseCharacter);
  const baseLooksLikeGf2 = isRawGf2Character(baseCharacter);

  if (
    baseLooksLikeGf2 &&
    baseImage.startsWith("./img/avatar/gl2/") &&
    /^https?:/i.test(overrideImage) &&
    !getRawCharacterSplashImage(overrideCharacter)
  ) {
    return baseImage;
  }

  return overrideImage || baseImage;
}

function resolveMergedCharacterSplashImage(baseCharacter, overrideCharacter, mergedImage) {
  const overrideSplash = getRawCharacterSplashImage(overrideCharacter);
  const baseSplash = getRawCharacterSplashImage(baseCharacter);
  const overrideImage = getRawCharacterCardImage(overrideCharacter);

  if (overrideSplash) {
    return overrideSplash;
  }
  if (baseSplash) {
    return baseSplash;
  }
  if (/^https?:/i.test(overrideImage)) {
    return overrideImage;
  }

  return String(mergedImage || "").trim();
}

function getRawCharacterCardImage(character) {
  return String(character?.images?.card || character?.image || "").trim();
}

function getRawCharacterSplashImage(character) {
  return String(
    character?.images?.splash || character?.splashImage || character?.remoteImage || ""
  ).trim();
}

function isRawGf2Character(character) {
  return (
    Array.isArray(character?.attackTypes) ||
    Array.isArray(character?.details?.attackTypes)
  );
}

function resolveMergedPositiveNumber(overrideValue, baseValue) {
  const nextValue = Number(overrideValue);
  if (Number.isFinite(nextValue) && nextValue > 0) {
    return nextValue;
  }

  const fallbackValue = Number(baseValue);
  return Number.isFinite(fallbackValue) && fallbackValue > 0 ? fallbackValue : undefined;
}

function resolveMergedReleaseOrder(baseCharacter, overrideCharacter) {
  const baseValue = resolveMergedPositiveNumber(undefined, baseCharacter?.releaseOrder);
  const overrideValue = resolveMergedPositiveNumber(overrideCharacter?.releaseOrder, undefined);

  if (!overrideValue) {
    return baseValue;
  }
  if (shouldIgnoreLegacyGf2ReleaseOrder(baseCharacter, overrideValue, baseValue)) {
    return baseValue;
  }

  return overrideValue;
}

function shouldIgnoreLegacyGf2ReleaseOrder(baseCharacter, overrideValue, baseValue) {
  if (!isRawGf2Character(baseCharacter)) {
    return false;
  }

  const legacyValue = GF2_LEGACY_RELEASE_ORDER[getCharacterMergeKey(baseCharacter)];
  return Boolean(legacyValue && overrideValue === legacyValue && overrideValue !== baseValue);
}

function renderLoadError(error) {
  characterGrid.innerHTML = "";
  emptyState.classList.remove("hidden");
  const title = emptyState.querySelector("h2, h3");
  const message = emptyState.querySelector("p");
  if (title) {
    title.textContent = "No se pudo cargar la informacion";
  }
  if (message) {
    message.textContent = error.message;
  }
  resultsCount.textContent = "0 personaje(s)";
  if (genshinSelectionSummary) {
    genshinSelectionSummary.textContent = `No se pudieron cargar los datos: ${error.message}`;
  }
}

function getCharactersOverride(storageKey) {
  const raw = getStorageValue(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray(parsed.characters)) {
      return parsed.characters;
    }
    return null;
  } catch {
    return null;
  }
}

function getStorageValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors (private mode / blocked storage)
  }
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );
}
