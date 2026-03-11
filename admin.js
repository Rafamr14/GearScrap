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

const GAME_CONFIG = {
  gf2: {
    label: "Girls' Frontline 2",
    dataUrl: "./data/gf2-characters.json",
    storageKey: STORAGE_KEYS.gf2Characters
  },
  genshin: {
    label: "Genshin",
    dataUrl: "./data/genshin-characters.json",
    storageKey: STORAGE_KEYS.genshinCharacters
  }
};

const GF2_DEFAULT_OPTIONS = {
  roles: ["Vanguard", "Sentinel", "Support", "Bulwark"],
  phases: ["Corrosion", "Electric", "Hydro", "Physical", "Burn", "Freeze"],
  attackTypes: ["Light Ammo", "Medium Ammo", "Heavy Ammo", "Shotgun Ammo", "Melee"]
};

const GENSHIN_DEFAULT_ELEMENTS = [
  "Pyro",
  "Hydro",
  "Electro",
  "Cryo",
  "Geo",
  "Anemo",
  "Dendro"
];

const state = {
  activeGame: "gf2",
  editingOriginalId: null,
  datasets: {
    gf2: { base: [], current: [] },
    genshin: { base: [], current: [] }
  },
  catalogs: {
    gf2: { sets: null, stats: null },
    genshin: { sets: null, stats: null }
  },
  options: {
    gf2: {
      sets: [],
      setEntries: [],
      substats: [],
      statEntries: [],
      roles: [],
      phases: [],
      attackTypes: []
    },
    genshin: {
      elements: [],
      setEntries: [],
      statEntries: []
    }
  }
};

const adminGameSelector = document.getElementById("adminGameSelector");
const adminGameTabs = document.querySelectorAll("[data-admin-game-tab]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const adminTitle = document.getElementById("adminTitle");
const addCharacterBtn = document.getElementById("addCharacterBtn");
const resetGameBtn = document.getElementById("resetGameBtn");
const adminStatus = document.getElementById("adminStatus");
const charactersTableBody = document.getElementById("charactersTableBody");
const formTitle = document.getElementById("formTitle");
const characterForm = document.getElementById("characterForm");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const idInput = document.getElementById("idInput");
const nameInput = document.getElementById("nameInput");
const imageInput = document.getElementById("imageInput");
const splashImageInput = document.getElementById("splashImageInput");
const sourceInput = document.getElementById("sourceInput");
const rarityInput = document.getElementById("rarityInput");
const releaseOrderInput = document.getElementById("releaseOrderInput");

const gf2RoleField = document.getElementById("gf2RoleField");
const genshinRoleField = document.getElementById("genshinRoleField");
const gf2RoleInput = document.getElementById("gf2RoleInput");
const roleInput = document.getElementById("roleInput");

const gf2Fields = document.getElementById("gf2Fields");
const genshinFields = document.getElementById("genshinFields");
const phaseInput = document.getElementById("phaseInput");
const attackTypesInput = document.getElementById("attackTypesInput");
const elementInput = document.getElementById("elementInput");

const gf2BuildEditor = document.getElementById("gf2BuildEditor");
const genshinBuildEditor = document.getElementById("genshinBuildEditor");
const gf2BuildCount = document.getElementById("gf2BuildCount");
const gf2Build1Card = document.getElementById("gf2Build1Card");
const gf2Build2Card = document.getElementById("gf2Build2Card");
const gf2Build1Set = document.getElementById("gf2Build1Set");
const gf2Build2Set = document.getElementById("gf2Build2Set");
const gf2Build1Substats = document.getElementById("gf2Build1Substats");
const gf2Build2Substats = document.getElementById("gf2Build2Substats");
const buildsInput = document.getElementById("buildsInput");
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

document.addEventListener("DOMContentLoaded", init);

async function init() {
  try {
    await loadAllDatasets();
    renderOptionInputs();
    bindEvents();
    initCharacterModal();

    const savedGame = getStorageValue(STORAGE_KEYS.selectedGame);
    const initialGame = savedGame === "genshin" ? "genshin" : "gf2";
    setActiveGame(initialGame);
  } catch (error) {
    showStatus(`No se pudieron cargar los datos: ${error.message}`, "error");
  }
}

function bindEvents() {
  if (adminGameSelector) {
    adminGameSelector.addEventListener("change", () => {
      const game = adminGameSelector.value === "genshin" ? "genshin" : "gf2";
      setActiveGame(game);
    });
  }

  adminGameTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const game = tab.dataset.adminGameTab === "genshin" ? "genshin" : "gf2";
      setActiveGame(game);
    });

    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      const tabs = Array.from(adminGameTabs);
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

  addCharacterBtn.addEventListener("click", () => {
    resetForm();
    showStatus("Modo alta: completa los campos y guarda.", "info");
  });

  resetGameBtn.addEventListener("click", () => {
    const gameLabel = GAME_CONFIG[state.activeGame].label;
    const confirmed = window.confirm(
      `Se restauraran los personajes de ${gameLabel}. ¿Continuar?`
    );
    if (!confirmed) {
      return;
    }

    removeStorageValue(GAME_CONFIG[state.activeGame].storageKey);
    state.datasets[state.activeGame].current = deepCopy(
      state.datasets[state.activeGame].base
    );
    resetForm();
    renderCharactersTable();
    showStatus(`Datos de ${gameLabel} restaurados.`, "success");
  });

  charactersTableBody.addEventListener("click", (event) => {
    const actionButton = event.target.closest("button[data-action]");
    if (actionButton) {
      const action = actionButton.dataset.action;
      const id = actionButton.dataset.id;
      if (!id) {
        return;
      }

      if (action === "edit") {
        startEditCharacter(id);
        return;
      }

      if (action === "delete") {
        deleteCharacter(id);
      }
      return;
    }

    const previewRow = event.target.closest("tr[data-preview-id]");
    if (previewRow?.dataset.previewId) {
      openCharacterPreview(previewRow.dataset.previewId);
    }
  });

  charactersTableBody.addEventListener("keydown", (event) => {
    if (event.target.closest("button[data-action]")) {
      return;
    }

    const previewRow = event.target.closest("tr[data-preview-id]");
    if (!previewRow || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    openCharacterPreview(previewRow.dataset.previewId);
  });

  characterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveCharacterFromForm();
  });

  cancelEditBtn.addEventListener("click", () => {
    resetForm();
    showStatus("Edicion cancelada.", "info");
  });

  gf2BuildCount.addEventListener("change", updateGf2BuildVisibility);
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

async function loadAllDatasets() {
  const [gf2Raw, genshinRaw] = await Promise.all([
    fetchJson(GAME_CONFIG.gf2.dataUrl),
    fetchJson(GAME_CONFIG.genshin.dataUrl)
  ]);

  const [gf2Catalogs, genshinCatalogs] = await Promise.all([
    fetchCatalogs(gf2Raw.catalogs, gf2Raw.filters),
    fetchCatalogs(genshinRaw.catalogs, genshinRaw.filters)
  ]);

  state.catalogs.gf2 = gf2Catalogs;
  state.catalogs.genshin = genshinCatalogs;

  const gf2Base = sanitizeGf2Characters(gf2Raw.characters || [], gf2Catalogs);
  const genshinBase = sanitizeGenshinCharacters(genshinRaw.characters || [], genshinCatalogs);
  const gf2Override = getCharactersOverride(
    GAME_CONFIG.gf2.storageKey,
    (characters) => sanitizeGf2Characters(characters, gf2Catalogs)
  );
  const genshinOverride = getCharactersOverride(
    GAME_CONFIG.genshin.storageKey,
    (characters) => sanitizeGenshinCharacters(characters, genshinCatalogs)
  );

  state.datasets.gf2.base = deepCopy(gf2Base);
  state.datasets.genshin.base = deepCopy(genshinBase);
  state.datasets.gf2.current = mergeCharacterOverrides(
    deepCopy(gf2Base),
    gf2Override
  );
  state.datasets.genshin.current = mergeCharacterOverrides(
    deepCopy(genshinBase),
    genshinOverride
  );

  state.options.gf2 = buildGf2Options(gf2Catalogs, state.datasets.gf2.current);
  state.options.genshin = buildGenshinOptions(genshinCatalogs, state.datasets.genshin.current);
}

function buildGf2Options(catalogs, characters) {
  const setEntries = catalogs?.sets?.items || [];
  const statEntries = catalogs?.stats?.items || [];
  const sets = setEntries.map((entry) => entry.name);
  const substats = statEntries.map((entry) => entry.name);
  const buildsFromData = characters.flatMap((character) =>
    normalizeGf2Builds(character.builds || [], catalogs)
  );
  const setsFromData = uniqueStrings(buildsFromData.map((build) => build.set));
  const substatsFromData = uniqueStrings(
    buildsFromData.flatMap((build) => build.substats)
  );
  const rolesFromData = uniqueStrings(characters.map((character) => character.role));
  const phasesFromData = uniqueStrings(characters.map((character) => character.phase));
  const attackTypesFromData = uniqueStrings(
    characters.flatMap((character) => character.attackTypes || [])
  );

  return {
    sets: mergeUnique(sets, setsFromData),
    setEntries: mergeSetEntries(setEntries, setsFromData),
    substats: mergeUnique(substats, substatsFromData),
    statEntries: mergeStatEntries(statEntries, substatsFromData),
    roles: mergeUnique(GF2_DEFAULT_OPTIONS.roles, rolesFromData),
    phases: mergeUnique(GF2_DEFAULT_OPTIONS.phases, phasesFromData),
    attackTypes: mergeUnique(GF2_DEFAULT_OPTIONS.attackTypes, attackTypesFromData)
  };
}

function buildGenshinOptions(catalogs, characters) {
  const elementsFromData = uniqueStrings(
    characters.map((character) => character.element)
  );
  return {
    elements: mergeUnique(GENSHIN_DEFAULT_ELEMENTS, elementsFromData),
    setEntries: catalogs?.sets?.items || [],
    statEntries: catalogs?.stats?.items || []
  };
}

function renderOptionInputs() {
  populateSelectOptions(gf2RoleInput, state.options.gf2.roles);
  populateSelectOptions(phaseInput, state.options.gf2.phases);
  populateMultiSelectOptions(attackTypesInput, state.options.gf2.attackTypes);
  populateSelectOptions(elementInput, state.options.genshin.elements);

  populateSelectOptions(gf2Build1Set, state.options.gf2.sets);
  populateSelectOptions(gf2Build2Set, state.options.gf2.sets);
  populateMultiSelectOptions(gf2Build1Substats, state.options.gf2.substats);
  populateMultiSelectOptions(gf2Build2Substats, state.options.gf2.substats);
}

function setActiveGame(game) {
  state.activeGame = game;
  if (adminGameSelector) {
    adminGameSelector.value = game;
  }
  applyGameTheme(game);
  setStorageValue(STORAGE_KEYS.selectedGame, game);
  adminTitle.textContent = `Editor de personajes - ${GAME_CONFIG[game].label}`;
  syncAdminNavigation(game);

  const isGf2 = game === "gf2";
  gf2Fields.classList.toggle("hidden", !isGf2);
  genshinFields.classList.toggle("hidden", isGf2);
  gf2BuildEditor.classList.toggle("hidden", !isGf2);
  genshinBuildEditor.classList.toggle("hidden", isGf2);
  gf2RoleField.classList.toggle("hidden", !isGf2);
  genshinRoleField.classList.toggle("hidden", isGf2);

  gf2RoleInput.required = isGf2;
  phaseInput.required = isGf2;
  roleInput.required = !isGf2;
  elementInput.required = !isGf2;
  buildsInput.required = false;

  resetForm();
  renderCharactersTable();
}

function syncAdminNavigation(game) {
  adminGameTabs.forEach((tab) => {
    const isActive = tab.dataset.adminGameTab === game;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", isActive ? "true" : "false");
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

function renderCharactersTable() {
  const characters = [...getActiveCharacters()].sort(compareCharactersByRelease);
  const isGf2 = state.activeGame === "gf2";

  if (!characters.length) {
    charactersTableBody.innerHTML =
      "<tr><td colspan='5'>No hay personajes cargados.</td></tr>";
    return;
  }

  charactersTableBody.innerHTML = characters
    .map((character) => {
      const extraValue = isGf2 ? character.phase || "-" : character.element || "-";
      const buildCount = Array.isArray(character.builds) ? character.builds.length : 0;

      return `
        <tr tabindex="0" data-preview-id="${escapeHtml(character.id || "")}">
          <td>${escapeHtml(character.name || "-")}</td>
          <td>${escapeHtml(character.role || "-")}</td>
          <td>${escapeHtml(extraValue)}</td>
          <td>${buildCount}</td>
          <td class="row-actions">
            <button type="button" class="md-button md-button-tonal" data-action="edit" data-id="${escapeHtml(
              character.id || ""
            )}">
              Editar
            </button>
            <button type="button" class="md-button md-button-outlined danger" data-action="delete" data-id="${escapeHtml(
              character.id || ""
            )}">
              Eliminar
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function startEditCharacter(id) {
  const character = getActiveCharacters().find((entry) => entry.id === id);
  if (!character) {
    showStatus("No se encontro el personaje para editar.", "error");
    return;
  }

  state.editingOriginalId = id;
  formTitle.textContent = `Editando: ${character.name}`;

  idInput.value = character.id || "";
  nameInput.value = character.name || "";
  imageInput.value = character.image || "";
  splashImageInput.value = character.splashImage || character.image || "";
  sourceInput.value = character.source || "";
  rarityInput.value = String(character.rarity || "");
  releaseOrderInput.value = String(character.releaseOrder || "");

  if (state.activeGame === "gf2") {
    setSelectValue(gf2RoleInput, character.role || state.options.gf2.roles[0] || "");
    setSelectValue(phaseInput, character.phase || state.options.gf2.phases[0] || "");
    setMultiSelectValues(attackTypesInput, character.attackTypes || []);

    const builds = normalizeGf2Builds(character.builds || [], state.catalogs.gf2);
    const hasSecondBuild = builds.length > 1;
    gf2BuildCount.value = hasSecondBuild ? "2" : "1";
    applyGf2BuildToEditor(1, builds[0] || createDefaultGf2Build(0));
    applyGf2BuildToEditor(2, builds[1] || createDefaultGf2Build(1));
    updateGf2BuildVisibility();

    if (Array.isArray(character.builds) && character.builds.length > 2) {
      showStatus(
        "Este personaje tenia mas de 2 builds: solo se cargaron las 2 primeras.",
        "info"
      );
      return;
    }
  } else {
    roleInput.value = character.role || "";
    setSelectValue(elementInput, character.element || state.options.genshin.elements[0] || "");
    buildsInput.value = JSON.stringify(exportGenshinBuildsForEditor(character.builds || []), null, 2);
  }

  showStatus(`Editando personaje: ${character.name}`, "info");
}

function openCharacterPreview(id) {
  const character = getActiveCharacters().find((entry) => entry.id === id);
  if (!character || !characterModal) {
    return;
  }

  const isGf2 = state.activeGame === "gf2";
  const splashImage = String(character.splashImage || character.image || "").trim();
  const meta = isGf2
    ? [character.role || "-", character.phase || "-", joinWithSlash(character.attackTypes), formatRarityLabel(character)]
    : [character.element || "-", character.role || "-", formatRarityLabel(character)];

  characterModal.classList.remove("hidden");
  characterModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  characterModalGame.textContent = GAME_CONFIG[state.activeGame].label;
  characterModalTitle.textContent = character.name;
  characterModalMeta.textContent = meta.filter(Boolean).join(" | ");
  characterModalImage.src = splashImage || buildFallbackAvatar(character.name);
  characterModalImage.alt = `Splash art de ${character.name}`;
  characterModalImage.referrerPolicy = "no-referrer";
  characterModalImage.onerror = () => {
    characterModalImage.onerror = null;
    characterModalImage.src = buildFallbackAvatar(character.name);
  };

  renderCharacterPreviewSummary(character, isGf2);
  renderCharacterPreviewBuilds(character, isGf2);

  const source = String(character.source || "").trim();
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

function renderCharacterPreviewSummary(character, isGf2) {
  const values = isGf2
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
  const builds = Array.isArray(character?.builds) ? character.builds : [];
  const bestBuild = builds[0] || { set: "-", substats: [] };
  const recommendedSet = String(
    details.recommendedSetName || details.recommendedSet || bestBuild.set || ""
  ).trim();
  const substatPriority = Array.isArray(details.substatPriority) && details.substatPriority.length
    ? details.substatPriority.join(" > ")
    : joinWithSlash(bestBuild.substats || []);

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
    `Builds: ${builds.length}`
  ];
}

function renderCharacterPreviewBuilds(character, isGf2) {
  const builds = Array.isArray(character.builds) ? character.builds : [];
  if (!builds.length) {
    characterModalBuilds.innerHTML =
      '<div class="character-modal-empty">Este personaje todavia no tiene builds configuradas en el dataset.</div>';
    return;
  }

  characterModalBuilds.innerHTML = builds
    .map((build, index) =>
      isGf2
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

function deleteCharacter(id) {
  const character = getActiveCharacters().find((entry) => entry.id === id);
  if (!character) {
    showStatus("No se encontro el personaje para eliminar.", "error");
    return;
  }

  const confirmed = window.confirm(
    `Vas a eliminar a "${character.name}". ¿Continuar?`
  );
  if (!confirmed) {
    return;
  }

  const nextCharacters = getActiveCharacters().filter((entry) => entry.id !== id);
  setActiveCharacters(nextCharacters);
  persistActiveGameCharacters();
  renderCharactersTable();

  if (state.editingOriginalId === id) {
    resetForm();
  }

  showStatus(`Personaje eliminado: ${character.name}`, "success");
}

function saveCharacterFromForm() {
  const nextCharacter = buildCharacterFromForm();
  if (!nextCharacter) {
    return;
  }

  const characters = getActiveCharacters();
  const targetId = state.editingOriginalId;
  const currentId = nextCharacter.id;

  if (!targetId) {
    if (characters.some((entry) => entry.id === currentId)) {
      showStatus(`Ya existe un personaje con id "${currentId}".`, "error");
      return;
    }

    setActiveCharacters([...characters, nextCharacter]);
    persistActiveGameCharacters();
    renderCharactersTable();
    resetForm();
    showStatus(`Personaje añadido: ${nextCharacter.name}`, "success");
    return;
  }

  const targetIndex = characters.findIndex((entry) => entry.id === targetId);
  if (targetIndex < 0) {
    showStatus("No se pudo actualizar: personaje no encontrado.", "error");
    return;
  }

  const duplicate = characters.some(
    (entry) => entry.id === currentId && entry.id !== targetId
  );
  if (duplicate) {
    showStatus(`Ya existe otro personaje con id "${currentId}".`, "error");
    return;
  }

  const updatedCharacters = [...characters];
  updatedCharacters[targetIndex] = nextCharacter;
  setActiveCharacters(updatedCharacters);
  persistActiveGameCharacters();
  renderCharactersTable();
  resetForm();
  showStatus(`Personaje actualizado: ${nextCharacter.name}`, "success");
}

function buildCharacterFromForm() {
  const id = slugify(idInput.value.trim());
  const name = nameInput.value.trim();
  const image = imageInput.value.trim();
  const splashImage = splashImageInput.value.trim();
  const source = sourceInput.value.trim();
  const rarity = Number(rarityInput.value || 0);
  const releaseOrder = Number(releaseOrderInput.value || 0);

  if (!id || !name || !image || !splashImage) {
    showStatus("ID, nombre, imagen y splash image son obligatorios.", "error");
    return null;
  }

  if (!rarity || !releaseOrder) {
    showStatus("Rareza y orden de salida son obligatorios.", "error");
    return null;
  }

  if (state.activeGame === "gf2") {
    const role = gf2RoleInput.value.trim();
    const phase = phaseInput.value.trim();
    const attackTypes = getMultiSelectValues(attackTypesInput);
    const builds = collectGf2BuildsFromEditor();

    if (!role || !phase || !builds) {
      return null;
    }

    const editingCharacter = state.editingOriginalId
      ? getActiveCharacters().find((entry) => entry.id === state.editingOriginalId)
      : null;
    const baseDetails =
      editingCharacter?.details && typeof editingCharacter.details === "object"
        ? editingCharacter.details
        : {};
    const primarySetEntry = resolveCatalogEntry(
      state.catalogs.gf2?.sets,
      "",
      builds[0]?.set || ""
    );
    const primarySetName = String(
      baseDetails.recommendedSetName || baseDetails.recommendedSet || builds[0]?.set || ""
    ).trim();
    const recommendedSetId =
      parseNumericId(baseDetails.recommendedSetId) ||
      parseNumericId(primarySetEntry?.id) ||
      null;
    const substatPriority = uniqueStrings(baseDetails.substatPriority || []).length
      ? uniqueStrings(baseDetails.substatPriority)
      : uniqueStrings(builds[0]?.substats || []);

    return {
      id,
      name,
      role,
      phase,
      attackTypes,
      image,
      splashImage,
      source: source || "",
      rarity,
      rarityLabel: rarity >= 5 ? "Elite" : "Standard",
      releaseOrder,
      details: {
        ...baseDetails,
        phase,
        attackTypes: uniqueStrings(attackTypes),
        attributes: uniqueStrings(baseDetails.attributes || []),
        weaknesses: uniqueStrings(baseDetails.weaknesses || []),
        recommendedSetName: primarySetName,
        recommendedSet: String(baseDetails.recommendedSet || primarySetName).trim(),
        recommendedSetId,
        substatPriority
      },
      builds
    };
  }

  const role = roleInput.value.trim();
  const element = elementInput.value.trim();
  const buildsText = buildsInput.value.trim();

  if (!role || !element) {
    showStatus("Rol y elemento son obligatorios para Genshin.", "error");
    return null;
  }

  let builds = [];
  if (buildsText) {
    try {
      builds = JSON.parse(buildsText);
    } catch {
      showStatus("El campo Builds debe ser JSON valido.", "error");
      return null;
    }

    if (!Array.isArray(builds)) {
      showStatus("Builds debe ser un array JSON.", "error");
      return null;
    }
  }

  return {
    id,
    name,
    role,
    element,
    image,
    splashImage,
    source: source || "",
    rarity,
    releaseOrder,
    builds: normalizeGenshinBuilds(builds, state.catalogs.genshin)
  };
}

function collectGf2BuildsFromEditor() {
  const buildCount = gf2BuildCount.value === "2" ? 2 : 1;
  const builds = [];

  for (let index = 1; index <= buildCount; index += 1) {
    const setInput = index === 1 ? gf2Build1Set : gf2Build2Set;
    const substatsInput = index === 1 ? gf2Build1Substats : gf2Build2Substats;
    const setName = setInput.value.trim();
    const substats = uniqueStrings(getMultiSelectValues(substatsInput));

    if (!setName) {
      showStatus(`La build ${index} debe tener set seleccionado.`, "error");
      return null;
    }

    if (!substats.length) {
      showStatus(`La build ${index} debe tener al menos 1 substat.`, "error");
      return null;
    }

    builds.push({ set: setName, mainStat: "", substats });
  }

  return builds;
}

function resetForm() {
  state.editingOriginalId = null;
  formTitle.textContent = "Nuevo personaje";
  characterForm.reset();
  splashImageInput.value = "";
  rarityInput.value = "";
  releaseOrderInput.value = "";

  if (state.activeGame === "gf2") {
    roleInput.value = "";
    setSelectValue(gf2RoleInput, state.options.gf2.roles[0] || "");
    setSelectValue(phaseInput, state.options.gf2.phases[0] || "");
    setMultiSelectValues(attackTypesInput, []);
    gf2BuildCount.value = "1";
    applyGf2BuildToEditor(1, createDefaultGf2Build(0));
    applyGf2BuildToEditor(2, createDefaultGf2Build(1));
    updateGf2BuildVisibility();
  } else {
    setSelectValue(elementInput, state.options.genshin.elements[0] || "");
    buildsInput.value = JSON.stringify(buildDefaultGenshinBuild(), null, 2);
  }
}

function createDefaultGf2Build(offset) {
  const sets = state.options.gf2.sets;
  const substats = state.options.gf2.substats;
  return {
    set: sets[offset] || sets[0] || "",
    substats: substats.slice(0, 2)
  };
}

function buildDefaultGenshinBuild() {
  const setsCatalog = state.catalogs.genshin.sets;
  const statsCatalog = state.catalogs.genshin.stats;
  const setId = resolveCatalogEntry(setsCatalog, "", "Emblem of Severed Fate")?.id || null;
  const mainStatId = resolveCatalogEntry(statsCatalog, "", "Recarga de Energía")?.id || null;
  const critRateId = resolveCatalogEntry(statsCatalog, "", "Prob. CRIT")?.id || null;
  const critDmgId = resolveCatalogEntry(statsCatalog, "", "Daño CRIT")?.id || null;
  const atkPctId = resolveCatalogEntry(statsCatalog, "", "ATQ%")?.id || null;

  return [
    {
      setId,
      mainStatId,
      substatIds: [critRateId, critDmgId, atkPctId].filter((value) => value !== null)
    }
  ];
}

function exportGenshinBuildsForEditor(builds) {
  return normalizeGenshinBuilds(builds, state.catalogs.genshin).map((build) => ({
    setId: build.setId || "",
    mainStatId: build.mainStatId || "",
    substatIds: Array.isArray(build.substatIds) ? build.substatIds : []
  }));
}

function applyGf2BuildToEditor(index, build) {
  const setInput = index === 1 ? gf2Build1Set : gf2Build2Set;
  const substatsInput = index === 1 ? gf2Build1Substats : gf2Build2Substats;
  setSelectValue(setInput, build?.set || "");
  setMultiSelectValues(substatsInput, build?.substats || []);
}

function updateGf2BuildVisibility() {
  const showSecondBuild = gf2BuildCount.value === "2";
  gf2Build2Card.classList.toggle("hidden", !showSecondBuild);
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

function persistActiveGameCharacters() {
  const storageKey = GAME_CONFIG[state.activeGame].storageKey;
  const activeCharacters = getActiveCharacters();
  const sanitized =
    state.activeGame === "gf2"
      ? sanitizeGf2Characters(activeCharacters)
      : sanitizeGenshinCharacters(activeCharacters);

  setActiveCharacters(sanitized);
  const payload = {
    updatedAt: new Date().toISOString(),
    characters: sanitized
  };
  setStorageValue(storageKey, JSON.stringify(payload));
}

function getActiveCharacters() {
  return state.datasets[state.activeGame].current;
}

function setActiveCharacters(nextCharacters) {
  state.datasets[state.activeGame].current = nextCharacters;
}

function sanitizeGf2Characters(characters, catalogs = state.catalogs.gf2) {
  return characters
    .map((character) => normalizeGf2Character(character, catalogs))
    .filter(Boolean)
    .sort(compareCharactersByRelease);
}

function sanitizeGenshinCharacters(characters, catalogs = state.catalogs.genshin) {
  return characters
    .map((character) => normalizeGenshinCharacter(character, catalogs))
    .filter(Boolean)
    .sort(compareCharactersByRelease);
}

function normalizeGf2Character(character, catalogs) {
  if (!character || typeof character !== "object") {
    return null;
  }

  const id = slugify(String(character.id || character.name || "").trim());
  const name = String(character.name || "").trim();
  const role = String(character.role || "").trim();
  const image = String(character.image || character.images?.card || "").trim();
  const splashImage = String(
    character.splashImage || character.images?.splash || character.remoteImage || image
  ).trim();
  const rarity = Number(character.rarity || 0) || undefined;
  const rarityLabel = String(character.rarityLabel || "").trim();
  const releaseOrder = Number(character.releaseOrder || 0) || undefined;
  if (!id || !name || !image) {
    return null;
  }

  const builds = normalizeGf2Builds(character.builds, catalogs).slice(0, 2);
  const details = normalizeGf2Details(character, builds);
  const phase = details.phase || "";
  const attackTypes =
    details.attackTypes.length
      ? details.attackTypes
      : uniqueStrings(character.attackTypes || character.tags || []);
  if (!builds.length) {
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
    source: String(character.source || "").trim(),
    rarity,
    rarityLabel,
    releaseOrder,
    details,
    builds
  };
}

function normalizeGf2Details(character, builds) {
  const rawDetails =
    character?.details && typeof character.details === "object"
      ? character.details
      : {};
  const firstBuild = Array.isArray(builds) ? builds[0] : null;
  const rawPriority = uniqueStrings(rawDetails.substatPriority || []);
  const rawRecommendedSetName =
    rawDetails.recommendedSetName || rawDetails.recommendedSet || firstBuild?.set || "";
  const rawRecommendedSetId =
    parseNumericId(rawDetails.recommendedSetId) || parseNumericId(firstBuild?.setId);
  const substatPriority = rawPriority.length
    ? rawPriority
    : uniqueStrings(firstBuild?.substats || []);

  return {
    phase: String(character.phase || rawDetails.phase || "").trim(),
    attackTypes: uniqueStrings(
      character.attackTypes || rawDetails.attackTypes || character.tags || []
    ),
    attributes: uniqueStrings(rawDetails.attributes || []),
    weaknesses: uniqueStrings(rawDetails.weaknesses || []),
    recommendedSetName: String(rawRecommendedSetName).trim(),
    recommendedSet: String(rawDetails.recommendedSet || rawRecommendedSetName).trim(),
    recommendedSetId: rawRecommendedSetId || null,
    substatPriority
  };
}

function normalizeGenshinCharacter(character, catalogs) {
  if (!character || typeof character !== "object") {
    return null;
  }

  const id = slugify(String(character.id || character.name || "").trim());
  const name = String(character.name || "").trim();
  const role = String(character.role || "").trim();
  const element = String(character.element || character.details?.element || "").trim();
  const image = String(character.image || character.images?.card || "").trim();
  const splashImage = String(character.splashImage || character.images?.splash || image).trim();
  const rarity = Number(character.rarity || 0) || undefined;
  const releaseOrder = Number(character.releaseOrder || 0) || undefined;
  const builds = normalizeGenshinBuilds(character.builds, catalogs);

  if (!id || !name || !element || !image || id === "manekin") {
    return null;
  }

  return {
    id,
    name,
    role: role || "-",
    element,
    image,
    splashImage,
    source: String(character.source || "").trim(),
    rarity,
    releaseOrder,
    builds
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

function normalizeLegacyGenshinStats(mainStats) {
  if (!mainStats || typeof mainStats !== "object") {
    return [];
  }

  return uniqueStrings([
    ...(Array.isArray(mainStats.sands) ? mainStats.sands : []),
    ...(Array.isArray(mainStats.goblet) ? mainStats.goblet : []),
    ...(Array.isArray(mainStats.circlet) ? mainStats.circlet : [])
  ]);
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
      const setName = setEntry?.name || String(build.set || "").trim();
      const setId = setEntry?.id ?? parseNumericId(build.setId);
      const mainStat = mainStatEntry?.name || String(build.mainStat || "").trim();
      const mainStatId =
        mainStatEntry?.id ?? parseNumericId(build.mainStatId);
      const substats = substatEntries.map((entry) => entry.name);
      const substatIds = substatEntries.map((entry) => entry.id);
      if (!setName || !substats.length) {
        return null;
      }
      return {
        setId,
        set: setName,
        mainStatId,
        mainStat,
        substatIds,
        substats
      };
    })
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
    : normalizeLegacyGenshinStats(build.mainStats);
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

function normalizeSetEntries(rawSets) {
  return normalizeSetCatalogEntries(rawSets).map((entry) => ({
    name: entry.name,
    icon: entry.image || ""
  }));
}

function mergeSetEntries(baseEntries, extraNames) {
  const entries = [...(Array.isArray(baseEntries) ? baseEntries : [])];
  const known = new Set(entries.map((entry) => slugify(entry?.name || "")));
  let nextId = entries.reduce((max, entry) => {
    const numericId = Number(entry?.id);
    return Number.isInteger(numericId) && numericId > max ? numericId : max;
  }, 0) + 1;

  uniqueStrings(extraNames || []).forEach((name) => {
    const key = slugify(name);
    if (!key || known.has(key)) {
      return;
    }
    known.add(key);
    entries.push({
      id: nextId,
      name,
      image: ""
    });
    nextId += 1;
  });

  return entries;
}

function mergeStatEntries(baseEntries, extraNames) {
  const entries = [...(Array.isArray(baseEntries) ? baseEntries : [])];
  const known = new Set(entries.map((entry) => slugify(entry?.name || "")));
  let nextId = entries.reduce((max, entry) => {
    const numericId = Number(entry?.id);
    return Number.isInteger(numericId) && numericId > max ? numericId : max;
  }, 0) + 1;

  uniqueStrings(extraNames || []).forEach((name) => {
    const key = slugify(name);
    if (!key || known.has(key)) {
      return;
    }
    known.add(key);
    entries.push({
      id: nextId,
      name,
      short: name.slice(0, 3).toUpperCase(),
      tone: "neutral"
    });
    nextId += 1;
  });

  return entries;
}

function normalizeSetCatalogEntries(rawEntries) {
  return (rawEntries || [])
    .map((entry) => {
      if (typeof entry === "string") {
        const name = entry.trim();
        return name ? { id: slugify(name), name, image: "" } : null;
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
            : String(entry.id || slugify(name)).trim(),
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
        return name
          ? { id: slugify(name), name, short: name.slice(0, 3).toUpperCase(), tone: "neutral" }
          : null;
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
            : String(entry.id || slugify(name)).trim(),
        name,
        short: String(entry.short || name.slice(0, 3).toUpperCase()).trim(),
        tone: String(entry.tone || "neutral").trim()
      };
    })
    .filter(Boolean);
}

function createCatalogIndex(items) {
  const byId = new Map();
  const byName = new Map();
  const bySlug = new Map();

  items.forEach((entry) => {
    byId.set(String(entry.id), entry);
    byName.set(entry.name, entry);
    bySlug.set(slugify(entry.name), entry);
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

  const slugKey = slugify(normalizedName || normalizedId);
  return slugKey ? catalog?.bySlug?.get(slugKey) || null : null;
}

function normalizeCatalogEntriesFromValues(catalog, rawIds, rawNames) {
  if (Array.isArray(rawIds) && rawIds.length) {
    return uniqueStrings(rawIds)
      .map((value) => resolveCatalogEntry(catalog, value, ""))
      .filter(Boolean);
  }

  const names = uniqueStrings(rawNames || []);
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

  const setEntries =
    game === "gf2"
      ? state.options.gf2.setEntries
      : state.options.genshin.setEntries;
  const matchedSet = Array.isArray(setEntries)
    ? setEntries.find((entry) => normalizeSetLookupKey(entry?.name || "") === normalizedSetName)
    : null;

  return String(matchedSet?.icon || matchedSet?.image || "").trim();
}

function normalizeSetLookupKey(value) {
  const key = slugify(value || "");
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
  const entry = resolveCatalogEntry(state.catalogs.genshin.stats, statId, statName);
  if (entry) {
    return {
      short: String(entry.short || entry.name.slice(0, 3).toUpperCase()).trim(),
      tone: String(entry.tone || "neutral").trim()
    };
  }

  const value = String(statName || statId || "").trim();
  const normalized = slugify(value);

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
  if (normalized.includes("maestria-elemental") || normalized.includes("elemental-mastery")) {
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

function populateSelectOptions(selectElement, values) {
  const currentValue = selectElement.value;
  selectElement.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");

  if (!values.length) {
    return;
  }

  const nextValue = values.includes(currentValue) ? currentValue : values[0];
  selectElement.value = nextValue;
}

function populateMultiSelectOptions(selectElement, values) {
  const selectedValues = getMultiSelectValues(selectElement);
  selectElement.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
  setMultiSelectValues(selectElement, selectedValues);
}

function setSelectValue(selectElement, value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    if (selectElement.options.length) {
      selectElement.value = selectElement.options[0].value;
    }
    return;
  }

  const hasOption = Array.from(selectElement.options).some(
    (option) => option.value === normalized
  );
  if (!hasOption) {
    const option = document.createElement("option");
    option.value = normalized;
    option.textContent = normalized;
    selectElement.appendChild(option);
  }
  selectElement.value = normalized;
}

function getMultiSelectValues(selectElement) {
  return Array.from(selectElement.selectedOptions).map((option) => option.value);
}

function setMultiSelectValues(selectElement, values) {
  const normalizedValues = uniqueStrings(values || []);
  Array.from(selectElement.options).forEach((option) => {
    option.selected = normalizedValues.includes(option.value);
  });
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

function parseNumericId(value) {
  const nextValue = Number(value);
  return Number.isInteger(nextValue) && nextValue > 0 ? nextValue : null;
}

function getCharactersOverride(storageKey, sanitizer) {
  const raw = getStorageValue(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return sanitizer(parsed);
    }
    if (parsed && Array.isArray(parsed.characters)) {
      return sanitizer(parsed.characters);
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
    // ignore
  }
}

function removeStorageValue(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function showStatus(message, type) {
  adminStatus.textContent = message;
  adminStatus.className = `admin-status ${type}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function mergeUnique(primary, secondary) {
  return uniqueStrings([...(primary || []), ...(secondary || [])]);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
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

  return merged.sort(compareCharactersByRelease);
}

function getCharacterMergeKey(character) {
  return slugify(String(character?.id || character?.name || "").trim());
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
