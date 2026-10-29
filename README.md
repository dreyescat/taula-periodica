# Taula periòdica – Practica símbols i noms

Aplicació web per estudiar la taula periòdica. Mostra la taula amb alguns elements buits
(només amb el número atòmic com a pista) i l'alumne n'ha d'escriure el símbol i el nom.

No es mostren les files dels lantànids ni dels actínids, i els elements del 104 al 118
sempre apareixen omplerts (no es pregunten mai).

## Com executar-la

Sense instal·lar res: obre `index.html` amb el navegador (doble clic).

O bé amb un servidor local:

```sh
python3 -m http.server 8000
```

i obre <http://localhost:8000>.

## Com es juga

- Tria la dificultat (Fàcil 15%, Mitjà 35%, Difícil 60%, Extrem 100% d'elements buits) i prem **Nova partida**.
- Escriu el símbol i el nom a cada casella buida. Cada camp es corregeix en sortir-ne o prémer
  **Enter** (que també salta al camp següent). No cal preocupar-se per majúscules/minúscules;
  al nom cal posar els accents correctes (`fòsfor`, no `fosfor`), però el punt volat es pot
  escriure de qualsevol manera (`berilli`, `beril.li` o `beril·li`).
- Un element compta com a encert quan el símbol i el nom són correctes.
- Verd = correcte, vermell = incorrecte (pots tornar-ho a provar).
- **Mostrar solucions** omple les caselles que falten (en taronja).

## Millors resultats i històric

- El temps comença a comptar quan es fa clic a la primera casella buida.
- En acabar una partida (o prémer **Mostrar solucions**) es demana el nom per desar el resultat;
  es recorda l'últim nom usat. Si es comença una partida nova sense desar, es desa amb l'últim nom
  (o "Anònim"). Una partida deixada a mitges es desa com a *abandonada*.
- Hi ha un rànquing (top 10) per a cada dificultat, ordenat per més encerts, després menys errors i
  després menys temps. A sota hi ha l'històric complet de partides.
- Les dades es guarden al navegador (`localStorage`): són per a cada ordinador i navegador.
  Amb **Exportar** es descarrega un fitxer JSON i amb **Importar** es pot recuperar o fusionar amb
  l'històric d'un altre ordinador (sense duplicar partides).

## Fitxers

- `index.html` – estructura de la pàgina
- `styles.css` – estils i colors per categoria
- `elements.js` – dades dels 118 elements i càlcul de la posició a la taula
- `historic.js` – desat de l'històric al navegador, rànquing, exportar/importar
- `app.js` – lògica del joc, cronòmetre i pantalla de resultats
