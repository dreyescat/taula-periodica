// Dades dels 118 elements: [símbol, nom en català]. L'índex + 1 és el número atòmic.
const DADES_ELEMENTS = [
  ["H", "Hidrogen"], ["He", "Heli"], ["Li", "Liti"], ["Be", "Beril·li"], ["B", "Bor"],
  ["C", "Carboni"], ["N", "Nitrogen"], ["O", "Oxigen"], ["F", "Fluor"], ["Ne", "Neó"],
  ["Na", "Sodi"], ["Mg", "Magnesi"], ["Al", "Alumini"], ["Si", "Silici"], ["P", "Fòsfor"],
  ["S", "Sofre"], ["Cl", "Clor"], ["Ar", "Argó"], ["K", "Potassi"], ["Ca", "Calci"],
  ["Sc", "Escandi"], ["Ti", "Titani"], ["V", "Vanadi"], ["Cr", "Crom"], ["Mn", "Manganès"],
  ["Fe", "Ferro"], ["Co", "Cobalt"], ["Ni", "Níquel"], ["Cu", "Coure"], ["Zn", "Zinc"],
  ["Ga", "Gal·li"], ["Ge", "Germani"], ["As", "Arsènic"], ["Se", "Seleni"], ["Br", "Brom"],
  ["Kr", "Criptó"], ["Rb", "Rubidi"], ["Sr", "Estronci"], ["Y", "Itri"], ["Zr", "Zirconi"],
  ["Nb", "Niobi"], ["Mo", "Molibdè"], ["Tc", "Tecneci"], ["Ru", "Ruteni"], ["Rh", "Rodi"],
  ["Pd", "Pal·ladi"], ["Ag", "Plata"], ["Cd", "Cadmi"], ["In", "Indi"], ["Sn", "Estany"],
  ["Sb", "Antimoni"], ["Te", "Tel·luri"], ["I", "Iode"], ["Xe", "Xenó"], ["Cs", "Cesi"],
  ["Ba", "Bari"], ["La", "Lantani"], ["Ce", "Ceri"], ["Pr", "Praseodimi"], ["Nd", "Neodimi"],
  ["Pm", "Prometi"], ["Sm", "Samari"], ["Eu", "Europi"], ["Gd", "Gadolini"], ["Tb", "Terbi"],
  ["Dy", "Disprosi"], ["Ho", "Holmi"], ["Er", "Erbi"], ["Tm", "Tuli"], ["Yb", "Iterbi"],
  ["Lu", "Luteci"], ["Hf", "Hafni"], ["Ta", "Tàntal"], ["W", "Tungstè"], ["Re", "Reni"],
  ["Os", "Osmi"], ["Ir", "Iridi"], ["Pt", "Platí"], ["Au", "Or"], ["Hg", "Mercuri"],
  ["Tl", "Tal·li"], ["Pb", "Plom"], ["Bi", "Bismut"], ["Po", "Poloni"], ["At", "Àstat"],
  ["Rn", "Radó"], ["Fr", "Franci"], ["Ra", "Radi"], ["Ac", "Actini"], ["Th", "Tori"],
  ["Pa", "Protoactini"], ["U", "Urani"], ["Np", "Neptuni"], ["Pu", "Plutoni"], ["Am", "Americi"],
  ["Cm", "Curi"], ["Bk", "Berkeli"], ["Cf", "Californi"], ["Es", "Einsteini"], ["Fm", "Fermi"],
  ["Md", "Mendelevi"], ["No", "Nobeli"], ["Lr", "Lawrenci"], ["Rf", "Rutherfordi"], ["Db", "Dubni"],
  ["Sg", "Seaborgi"], ["Bh", "Bohri"], ["Hs", "Hassi"], ["Mt", "Meitneri"], ["Ds", "Darmstadti"],
  ["Rg", "Roentgeni"], ["Cn", "Copernici"], ["Nh", "Nihoni"], ["Fl", "Flerovi"], ["Mc", "Moscovi"],
  ["Lv", "Livermori"], ["Ts", "Tennes"], ["Og", "Oganessó"],
];

const CATEGORIES = {
  "alcali": "Metalls alcalins",
  "alcalinoterri": "Metalls alcalinoterris",
  "transicio": "Metalls de transició",
  "lantanid": "Lantànids",
  "actinid": "Actínids",
  "altre-metall": "Altres metalls",
  "metal-loide": "Metal·loides",
  "no-metall": "No metalls",
  "halogen": "Halògens",
  "gas-noble": "Gasos nobles",
};

const GRUPS_CATEGORIA = {
  "alcali": [3, 11, 19, 37, 55, 87],
  "alcalinoterri": [4, 12, 20, 38, 56, 88],
  "gas-noble": [2, 10, 18, 36, 54, 86, 118],
  "halogen": [9, 17, 35, 53, 85, 117],
  "no-metall": [1, 6, 7, 8, 15, 16, 34],
  "metal-loide": [5, 14, 32, 33, 51, 52],
  "altre-metall": [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116],
};

function categoriaDe(z) {
  if (z >= 57 && z <= 71) return "lantanid";
  if (z >= 89 && z <= 103) return "actinid";
  for (const [cat, llista] of Object.entries(GRUPS_CATEGORIA)) {
    if (llista.includes(z)) return cat;
  }
  return "transicio";
}

// Posició a la graella (fila 1-7: períodes; fila 9: lantànids; fila 10: actínids).
function posicioDe(z) {
  if (z === 1) return { fila: 1, columna: 1 };
  if (z === 2) return { fila: 1, columna: 18 };
  if (z <= 18) {
    const fila = z <= 10 ? 2 : 3;
    const i = z - (fila === 2 ? 3 : 11);
    return { fila, columna: i < 2 ? i + 1 : i + 11 };
  }
  if (z <= 54) {
    const fila = z <= 36 ? 4 : 5;
    return { fila, columna: z - (fila === 4 ? 18 : 36) };
  }
  const fila = z <= 86 ? 6 : 7;
  const base = fila === 6 ? 54 : 86;
  const i = z - base; // 1..32
  if (i <= 2) return { fila, columna: i };
  if (i <= 17) return { fila: fila + 3, columna: i }; // lantànids/actínids: columnes 3-17
  return { fila, columna: i - 14 };
}

const ELEMENTS = DADES_ELEMENTS.map(([simbol, nom], i) => {
  const z = i + 1;
  return { z, simbol, nom, categoria: categoriaDe(z), ...posicioDe(z) };
});
