const PERCENTATGES = { facil: 0.15, mitja: 0.35, dificil: 0.6, extrem: 1 };

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

let estat = { buits: new Set(), encerts: 0, errors: 0, finalitzada: false };

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
  }
}

function novaPartida() {
  const percentatge = PERCENTATGES[selectDificultat.value];
  const quantitat = Math.round(PREGUNTABLES.length * percentatge);
  const buits = new Set(barreja(PREGUNTABLES.map((e) => e.z)).slice(0, quantitat));
  estat = { buits, encerts: 0, errors: 0, finalitzada: false };
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
  estat.finalitzada = true;
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
selectDificultat.addEventListener("change", novaPartida);

crearLlegenda();
novaPartida();
