// Històric de partides guardat al localStorage del navegador.
const CLAU_HISTORIC = "taula-periodica:historic";
const CLAU_NOM = "taula-periodica:nom";

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
  return desaHistoric([]);
}

function nomRecordat() {
  try {
    return localStorage.getItem(CLAU_NOM) || "";
  } catch {
    return "";
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
    && ["total", "encerts", "errors", "segons"].every((c) => Number.isFinite(p[c]))
    && typeof p.completada === "boolean";
}

// Millors partides d'una dificultat: més encerts, després menys errors, després menys temps.
function millors(dificultat, n = 10) {
  return llegeixHistoric()
    .filter((p) => p.dificultat === dificultat)
    .sort((a, b) => b.encerts - a.encerts || a.errors - b.errors || a.segons - b.segons)
    .slice(0, n);
}

function exportaHistoric() {
  const blob = new Blob([JSON.stringify(llegeixHistoric(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enllac = document.createElement("a");
  enllac.href = url;
  enllac.download = "historic-taula-periodica.json";
  document.body.appendChild(enllac);
  enllac.click();
  enllac.remove();
  URL.revokeObjectURL(url);
}

// Fusiona les partides d'un fitxer JSON amb l'històric actual (sense duplicar per id).
// Retorna el nombre de partides noves afegides.
async function importaHistoric(fitxer) {
  const dades = JSON.parse(await fitxer.text());
  if (!Array.isArray(dades)) throw new Error("El fitxer no conté una llista de partides.");
  const actuals = llegeixHistoric();
  const ids = new Set(actuals.map((p) => p.id));
  const noves = dades.filter((p) => esPartidaValida(p) && !ids.has(p.id));
  desaHistoric([...actuals, ...noves]);
  return noves.length;
}
