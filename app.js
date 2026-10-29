const PERCENTATGES = { facil: 0.15, mitja: 0.35, dificil: 0.6, extrem: 1 };
const DIFICULTATS = { facil: "Fàcil", mitja: "Mitjà", dificil: "Difícil", extrem: "Extrem" };

// No es mostren les files dels lantànids (fila 9) ni dels actínids (fila 10).
const VISIBLES = ELEMENTS.filter((e) => e.fila <= 7);
// Els elements del 104 al 118 sempre es mostren i no es pregunten mai.
const PREGUNTABLES = VISIBLES.filter((e) => e.z < 104);

const taula = document.getElementById("taula");
const selectDificultat = document.getElementById("dificultat");
const elEncerts = document.getElementById("encerts");
const elTotal = document.getElementById("total");
const elErrors = document.getElementById("errors");
const elPercent = document.getElementById("percent");
const elMissatge = document.getElementById("missatge");
const elTemps = document.getElementById("temps");
const formDesar = document.getElementById("desar-partida");
const inputNom = document.getElementById("nom-jugador");
const elResumPartida = document.getElementById("resum-partida");
const elPestanyes = document.getElementById("pestanyes");
const cosRanquing = document.querySelector("#ranquing tbody");
const cosHistoric = document.querySelector("#historic tbody");
const elAvisResultats = document.getElementById("avis-resultats");
const botoEsborrar = document.getElementById("esborrar");

let estat = nouEstat(new Set(), selectDificultat.value);
// Partida acabada pendent que l'alumne hi posi el nom.
let partidaPendent = null;
let dificultatRanquing = selectDificultat.value;
let cronometre = null;

function nouEstat(buits, dificultat) {
  return { buits, dificultat, encerts: 0, errors: 0, respostes: 0, finalitzada: false, inici: null };
}

function barreja(llista) {
  const copia = [...llista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// "na", "NA" o " Na " → "Na"
function normalitza(text) {
  const net = text.trim();
  if (!net) return "";
  return net[0].toUpperCase() + net.slice(1).toLowerCase();
}

function crearCasellaPlena(el) {
  const casella = document.createElement("div");
  casella.className = `casella ${el.categoria}`;
  casella.title = `${el.nom} (${el.z})`;
  casella.innerHTML = `
    <span class="z">${el.z}</span>
    <span class="simbol">${el.simbol}</span>
    <span class="nom">${el.nom}</span>`;
  return casella;
}

// "Beril·li", "berilli", "Beril.li" o "BERILLI" → "berilli" (sense punt volat; els accents es mantenen)
function normalitzaNom(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/[·.\-\s]/g, "");
}

const CAMPS = {
  simbol: {
    etiqueta: "Símbol",
    maxLength: 3,
    esCorrecte: (valor, el) => normalitza(valor) === el.simbol,
    solucio: (el) => el.simbol,
  },
  nom: {
    etiqueta: "Nom",
    maxLength: 20,
    esCorrecte: (valor, el) => normalitzaNom(valor) === normalitzaNom(el.nom),
    solucio: (el) => el.nom,
  },
};

function crearCasellaBuida(el) {
  const casella = document.createElement("div");
  casella.className = `casella buida ${el.categoria}`;
  casella.innerHTML = `<span class="z">${el.z}</span>`;

  for (const [clau, camp] of Object.entries(CAMPS)) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = `camp-${clau}`;
    input.maxLength = camp.maxLength;
    input.placeholder = camp.etiqueta;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.dataset.z = el.z;
    input.dataset.camp = clau;
    input.setAttribute("aria-label", `${camp.etiqueta} de l'element ${el.z}`);

    input.addEventListener("focus", iniciaCronometre);
    input.addEventListener("blur", () => comprova(input, el, casella));
    input.addEventListener("input", () => input.classList.remove("incorrecte"));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        comprova(input, el, casella);
        seguentCamp(input);
      }
    });

    casella.appendChild(input);
  }
  return casella;
}

function comprova(input, el, casella) {
  if (input.disabled) return;
  const camp = CAMPS[input.dataset.camp];
  if (!input.value.trim()) {
    input.classList.remove("incorrecte");
    return;
  }
  iniciaCronometre();
  estat.respostes++;
  if (camp.esCorrecte(input.value, el)) {
    input.value = camp.solucio(el);
    input.disabled = true;
    input.classList.remove("incorrecte");
    input.classList.add("correcte");
    if ([...casella.querySelectorAll("input")].every((i) => i.disabled)) {
      casella.classList.add("correcte");
      casella.title = `${el.nom} (${el.z})`;
      estat.encerts++;
    }
  } else if (!input.classList.contains("incorrecte")) {
    input.classList.add("incorrecte");
    estat.errors++;
  }
  actualitzaMarcador();
}

// Passa al següent camp pendent (símbol → nom → element buit següent), tornant a l'inici al final.
function seguentCamp(actual) {
  const inputs = [...taula.querySelectorAll("input")]
    .sort((a, b) => a.dataset.z - b.dataset.z);
  const i = inputs.indexOf(actual);
  const ordre = [...inputs.slice(i + 1), ...inputs.slice(0, i + 1)];
  const seguent = ordre.find((inp) => !inp.disabled);
  if (seguent) seguent.focus();
}

function actualitzaMarcador() {
  const total = estat.buits.size;
  elEncerts.textContent = estat.encerts;
  elTotal.textContent = total;
  elErrors.textContent = estat.errors;
  elPercent.textContent = total ? `${Math.round((estat.encerts / total) * 100)}%` : "0%";

  if (!estat.finalitzada && total && estat.encerts === total) {
    estat.finalitzada = true;
    elMissatge.textContent = estat.errors === 0
      ? "🎉 Perfecte! Tots els símbols correctes sense cap error!"
      : `🎉 Molt bé! Has completat la taula amb ${estat.errors} error${estat.errors === 1 ? "" : "s"}.`;
    elMissatge.hidden = false;
    acabaPartida(true);
  }
}

// ---- Cronòmetre ----

function segonsJugats() {
  return estat.inici ? Math.round((Date.now() - estat.inici) / 1000) : 0;
}

function formataTemps(segons) {
  const m = Math.floor(segons / 60);
  const s = segons % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function iniciaCronometre() {
  if (estat.inici || estat.finalitzada) return;
  estat.inici = Date.now();
  cronometre = setInterval(() => { elTemps.textContent = formataTemps(segonsJugats()); }, 1000);
}

function aturaCronometre() {
  clearInterval(cronometre);
  cronometre = null;
}

// ---- Fi de partida i desat ----

function hiHaJugades() {
  return estat.respostes > 0;
}

function registreDePartida(completada) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nom: "",
    data: new Date().toISOString(),
    dificultat: estat.dificultat,
    total: estat.buits.size,
    encerts: estat.encerts,
    errors: estat.errors,
    segons: segonsJugats(),
    completada,
  };
}

// Atura la partida i demana el nom per desar-la (si s'hi ha jugat).
function acabaPartida(completada) {
  const segons = segonsJugats();
  estat.finalitzada = true;
  aturaCronometre();
  elTemps.textContent = formataTemps(segons);
  if (!hiHaJugades()) return;

  partidaPendent = registreDePartida(completada);
  elResumPartida.textContent = `${completada ? "Partida completada" : "Partida abandonada"}: `
    + `${partidaPendent.encerts}/${partidaPendent.total} encerts, ${partidaPendent.errors} errors, `
    + `${formataTemps(partidaPendent.segons)}.`;
  inputNom.value = nomRecordat();
  formDesar.hidden = false;
  inputNom.focus();
  inputNom.select();
}

function desaPartida(partida, nom) {
  partida.nom = nom.trim() || "Anònim";
  if (nom.trim()) recordaNom(partida.nom);
  const desada = afegeixPartida(partida);
  elAvisResultats.textContent = desada ? "" : "No s'ha pogut desar la partida (el navegador no permet guardar dades).";
  dificultatRanquing = partida.dificultat;
  mostraResultats(partida.id);
}

// Desa la partida pendent amb l'últim nom usat (quan l'alumne no ha premut "Desar").
function desaPendentSenseFormulari() {
  if (!partidaPendent) return;
  desaPartida(partidaPendent, nomRecordat());
  partidaPendent = null;
  formDesar.hidden = true;
}

formDesar.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!partidaPendent) return;
  desaPartida(partidaPendent, inputNom.value);
  partidaPendent = null;
  formDesar.hidden = true;
});

// ---- Rànquing i històric ----

function filaResultat(celles, partida, destacat) {
  const tr = document.createElement("tr");
  if (partida.id === destacat) tr.className = "destacat";
  for (const contingut of celles) {
    const td = document.createElement("td");
    if (contingut instanceof Node) td.appendChild(contingut);
    else td.textContent = contingut;
    tr.appendChild(td);
  }
  return tr;
}

function celaNom(partida) {
  const span = document.createElement("span");
  span.textContent = partida.nom;
  if (!partida.completada) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-abandonada";
    etiqueta.textContent = "abandonada";
    span.append(" ", etiqueta);
  }
  return span;
}

function formataData(iso) {
  return new Date(iso).toLocaleString("ca-ES", { dateStyle: "short", timeStyle: "short" });
}

function mostraResultats(destacat = null) {
  for (const boto of elPestanyes.querySelectorAll("button")) {
    boto.classList.toggle("activa", boto.dataset.dificultat === dificultatRanquing);
  }

  const top = millors(dificultatRanquing);
  cosRanquing.replaceChildren(...top.map((p, i) => filaResultat([
    i + 1, celaNom(p), `${p.encerts}/${p.total}`, p.errors, formataTemps(p.segons), formataData(p.data),
  ], p, destacat)));
  if (!top.length) {
    cosRanquing.innerHTML = `<tr><td colspan="6" class="buit">Encara no hi ha partides en aquest nivell.</td></tr>`;
  }

  const totes = llegeixHistoric().sort((a, b) => b.data.localeCompare(a.data));
  cosHistoric.replaceChildren(...totes.map((p) => filaResultat([
    formataData(p.data), celaNom(p), DIFICULTATS[p.dificultat] || p.dificultat,
    `${p.encerts}/${p.total}`, p.errors, formataTemps(p.segons),
  ], p, destacat)));
  if (!totes.length) {
    cosHistoric.innerHTML = `<tr><td colspan="6" class="buit">Encara no hi ha cap partida.</td></tr>`;
  }
}

function crearPestanyes() {
  for (const [clau, nom] of Object.entries(DIFICULTATS)) {
    const boto = document.createElement("button");
    boto.type = "button";
    boto.textContent = nom;
    boto.dataset.dificultat = clau;
    boto.addEventListener("click", () => {
      dificultatRanquing = clau;
      mostraResultats();
    });
    elPestanyes.appendChild(boto);
  }
}

function novaPartida() {
  // Una partida a mitges amb alguna jugada es desa com a abandonada.
  if (!estat.finalitzada && hiHaJugades()) acabaPartida(false);
  desaPendentSenseFormulari();
  aturaCronometre();
  elTemps.textContent = formataTemps(0);

  const percentatge = PERCENTATGES[selectDificultat.value];
  const quantitat = Math.round(PREGUNTABLES.length * percentatge);
  const buits = new Set(barreja(PREGUNTABLES.map((e) => e.z)).slice(0, quantitat));
  estat = nouEstat(buits, selectDificultat.value);
  elMissatge.hidden = true;

  taula.innerHTML = "";
  for (const el of VISIBLES) {
    const casella = buits.has(el.z) ? crearCasellaBuida(el) : crearCasellaPlena(el);
    casella.style.gridRow = el.fila;
    casella.style.gridColumn = el.columna;
    taula.appendChild(casella);
  }

  actualitzaMarcador();
}

function mostrarSolucions() {
  for (const input of taula.querySelectorAll("input:not(:disabled)")) {
    const el = ELEMENTS[input.dataset.z - 1];
    const casella = input.parentElement;
    input.value = CAMPS[input.dataset.camp].solucio(el);
    input.disabled = true;
    input.classList.remove("incorrecte");
    input.classList.add("revelat");
    casella.title = `${el.nom} (${el.z})`;
  }
  if (!estat.finalitzada) acabaPartida(false);
}

function crearLlegenda() {
  const llegenda = document.getElementById("llegenda");
  const presents = new Set(VISIBLES.map((e) => e.categoria));
  for (const [clau, nom] of Object.entries(CATEGORIES)) {
    if (!presents.has(clau)) continue;
    const item = document.createElement("span");
    item.innerHTML = `<i class="${clau}"></i>${nom}`;
    llegenda.appendChild(item);
  }
}

document.getElementById("nova-partida").addEventListener("click", novaPartida);
document.getElementById("solucions").addEventListener("click", mostrarSolucions);
selectDificultat.addEventListener("change", () => {
  dificultatRanquing = selectDificultat.value;
  novaPartida();
  mostraResultats();
});

document.getElementById("exportar").addEventListener("click", exportaHistoric);
const inputImportar = document.getElementById("fitxer-importar");
document.getElementById("importar").addEventListener("click", () => inputImportar.click());
inputImportar.addEventListener("change", async () => {
  const fitxer = inputImportar.files[0];
  inputImportar.value = "";
  if (!fitxer) return;
  try {
    const noves = await importaHistoric(fitxer);
    elAvisResultats.textContent = `S'han importat ${noves} partide${noves === 1 ? "" : "s"} noves.`;
  } catch {
    elAvisResultats.textContent = "No s'ha pogut importar el fitxer: no és un històric vàlid.";
  }
  mostraResultats();
});

// Esborrar demana confirmació amb un segon clic en menys de 4 segons.
let confirmacioEsborrar = null;
botoEsborrar.addEventListener("click", () => {
  if (!confirmacioEsborrar) {
    botoEsborrar.textContent = "Segur? Torna a clicar";
    confirmacioEsborrar = setTimeout(() => {
      botoEsborrar.textContent = "Esborrar històric";
      confirmacioEsborrar = null;
    }, 4000);
    return;
  }
  clearTimeout(confirmacioEsborrar);
  confirmacioEsborrar = null;
  botoEsborrar.textContent = "Esborrar històric";
  esborraHistoric();
  elAvisResultats.textContent = "Històric esborrat.";
  mostraResultats();
});

// Si es tanca la pàgina amb una partida pendent de desar, es desa amb l'últim nom.
window.addEventListener("pagehide", desaPendentSenseFormulari);

crearLlegenda();
crearPestanyes();
novaPartida();
mostraResultats();
