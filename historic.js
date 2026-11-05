// Històric de partides guardat al localStorage del navegador.
const CLAU_HISTORIC = "taula-periodica:historic";
const CLAU_NOM = "taula-periodica:nom";
const CLAU_MODE = "taula-periodica:mode";
// Les falles de símbols mantenen la clau original per no perdre les dades anteriors.
const CLAUS_FALLES = {
  simbols: "taula-periodica:falles",
  valencies: "taula-periodica:falles-valencies",
};

function llegeixHistoric() {
  try {
    const dades = JSON.parse(localStorage.getItem(CLAU_HISTORIC) || "[]");
    return Array.isArray(dades) ? dades.filter(esPartidaValida) : [];
  } catch {
    return [];
  }
}

function desaHistoric(partides) {
  try {
    localStorage.setItem(CLAU_HISTORIC, JSON.stringify(partides));
    return true;
  } catch {
    return false;
  }
}

function afegeixPartida(partida) {
  return desaHistoric([...llegeixHistoric(), partida]);
}

function esborraHistoric() {
  try {
    for (const clau of Object.values(CLAUS_FALLES)) localStorage.removeItem(clau);
  } catch {
    // Sense localStorage no hi ha falles guardades.
  }
  return desaHistoric([]);
}

// ---- Falles per element i mode (per a "Repassa els errors") ----

function llegeixFalles(mode = "simbols") {
  try {
    const dades = JSON.parse(localStorage.getItem(CLAUS_FALLES[mode]) || "{}");
    return dades && typeof dades === "object" && !Array.isArray(dades) ? dades : {};
  } catch {
    return {};
  }
}

function desaFalles(falles, mode = "simbols") {
  try {
    localStorage.setItem(CLAUS_FALLES[mode], JSON.stringify(falles));
  } catch {
    // Sense localStorage el repàs simplement no està disponible.
  }
}

function sumaFalla(z, mode) {
  const falles = llegeixFalles(mode);
  falles[z] = (falles[z] || 0) + 1;
  desaFalles(falles, mode);
}

function restaFalla(z, mode) {
  const falles = llegeixFalles(mode);
  if (!falles[z]) return;
  falles[z] -= 1;
  if (falles[z] <= 0) delete falles[z];
  desaFalles(falles, mode);
}

// Números atòmics amb falles pendents en un mode, de més a menys falles.
function elementsAFallar(mode) {
  return Object.entries(llegeixFalles(mode))
    .filter(([, n]) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([z]) => Number(z));
}

function nomRecordat() {
  try {
    return localStorage.getItem(CLAU_NOM) || "";
  } catch {
    return "";
  }
}

function modeRecordat() {
  try {
    return localStorage.getItem(CLAU_MODE) || "";
  } catch {
    return "";
  }
}

function recordaMode(mode) {
  try {
    localStorage.setItem(CLAU_MODE, mode);
  } catch {
    // Sense localStorage simplement no es recorda el mode.
  }
}

function recordaNom(nom) {
  try {
    localStorage.setItem(CLAU_NOM, nom);
  } catch {
    // Sense localStorage simplement no es recorda el nom.
  }
}

function esPartidaValida(p) {
  return p && typeof p === "object"
    && typeof p.id === "string"
    && typeof p.nom === "string"
    && typeof p.data === "string"
    && typeof p.dificultat === "string"
    && (p.mode === undefined || typeof p.mode === "string")
    && ["total", "encerts", "errors", "segons"].every((c) => Number.isFinite(p[c]))
    && typeof p.completada === "boolean";
}

// Les partides anteriors al mode valències no guarden el mode: eren de símbols.
function modeDe(partida) {
  return partida.mode || "simbols";
}

// Millors partides d'un mode i dificultat: més encerts, després menys errors, després menys temps.
function millors(mode, dificultat, n = 10) {
  return llegeixHistoric()
    .filter((p) => modeDe(p) === mode && p.dificultat === dificultat)
    .sort((a, b) => b.encerts - a.encerts || a.errors - b.errors || a.segons - b.segons)
    .slice(0, n);
}

// Format del fitxer: { versio: 3, partides: [...], falles: { z: n }, fallesValencies: { z: n } }.
// La versió 2 no tenia fallesValencies i la 1 (antiga) era només la llista de partides.
function exportaHistoric() {
  const dades = {
    versio: 3,
    partides: llegeixHistoric(),
    falles: llegeixFalles("simbols"),
    fallesValencies: llegeixFalles("valencies"),
  };
  const blob = new Blob([JSON.stringify(dades, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enllac = document.createElement("a");
  enllac.href = url;
  enllac.download = "historic-taula-periodica.json";
  document.body.appendChild(enllac);
  enllac.click();
  enllac.remove();
  URL.revokeObjectURL(url);
}

// Fusiona un fitxer exportat amb les dades actuals: les partides sense duplicar per id i, per a
// cada element, es queda el nombre de falles més alt (així reimportar el mateix fitxer no suma).
// Retorna quantes partides i quants elements fallats s'han afegit o actualitzat.
async function importaHistoric(fitxer) {
  const dades = JSON.parse(await fitxer.text());
  const partides = Array.isArray(dades) ? dades : dades?.partides;
  if (!Array.isArray(partides)) throw new Error("El fitxer no conté una llista de partides.");

  const actuals = llegeixHistoric();
  const ids = new Set(actuals.map((p) => p.id));
  const noves = partides.filter((p) => esPartidaValida(p) && !ids.has(p.id));
  desaHistoric([...actuals, ...noves]);

  const fallesCanviades = Array.isArray(dades) ? 0
    : fusionaFalles(dades.falles, "simbols") + fusionaFalles(dades.fallesValencies, "valencies");
  return { partides: noves.length, falles: fallesCanviades };
}

// Retorna quants elements han canviat.
function fusionaFalles(fallesFitxer, mode) {
  if (!fallesFitxer || typeof fallesFitxer !== "object") return 0;
  let canviades = 0;
  const falles = llegeixFalles(mode);
  for (const [z, n] of Object.entries(fallesFitxer)) {
    const valid = Number.isInteger(n) && n > 0 && Number.isInteger(Number(z)) && z >= 1 && z <= 118;
    if (valid && n > (falles[z] || 0)) {
      falles[z] = n;
      canviades++;
    }
  }
  desaFalles(falles, mode);
  return canviades;
}
