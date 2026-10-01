// Family tree: data + layout. Coordinates are in a fixed design space (W × H)
// and the whole tree is scaled to fit its container.
(() => {
  const W = 2020;
  const H = 860;
  const ROW = [40, 260, 480, 700]; // top of each generation
  const IMG_H = 92;                // computer picture height
  const IMG_W = Math.round(IMG_H * (448 / 557));
  const BUS = 34;                  // gap between the bus line and the child row

  // id: [role, name, x-centre, generation]
  const P = {
    ggm: ["great-grandma", "", 800, 0],
    ggp: ["great-grandpa", "", 940, 0],

    gmMaria: ["grandma", "Maria", 490, 1],
    gpKolya: ["grandpa", "Kolya", 630, 1],
    gpTolya: ["grandpa", "Tolya", 1110, 1],
    gmValya: ["grandma", "Valya", 1250, 1],
    gpVanya: ["grandpa", "Vanya", 1480, 1],
    gmVera: ["grandma", "Vera", 1620, 1],

    tanya: ["aunt", "Tanya", 170, 2],
    aunt: ["aunt", "", 470, 2],
    yulya: ["aunt", "Yulya", 650, 2],
    lesha: ["uncle", "Lesha", 790, 2],
    lena: ["aunt", "Lena", 950, 2],
    pasha: ["uncle", "Pasha", 1110, 2],
    dad: ["dad", "Kolya", 1250, 2],
    mum: ["mum", "Olya", 1390, 2],
    ruslan: ["uncle", "Ruslan", 1710, 2],
    galya: ["aunt", "Galya", 1850, 2],

    denis: ["", "Denis", 100, 3],
    maria: ["", "Maria", 240, 3],
    stas: ["", "Stas", 400, 3],
    maks: ["", "Maks", 540, 3],
    lada: ["", "Lada", 720, 3],
    dasha: ["", "Dasha", 950, 3],
    nikita: ["brother", "Nikita", 1180, 3],
    timofey: ["brother", "Timofey", 1320, 3],
    me: ["me", "Vanya", 1460, 3],
    marusya: ["cousin", "Marusya", 1640, 3],
    polina: ["cousin", "Polina", 1780, 3],
    andrey: ["cousin", "Andrey", 1920, 3],
  };

  const COUPLES = [
    ["ggm", "ggp"], ["gmMaria", "gpKolya"], ["gpTolya", "gmValya"], ["gpVanya", "gmVera"],
    ["yulya", "lesha"], ["dad", "mum"], ["ruslan", "galya"],
  ];

  // [parents (one id or a couple), children]
  const FAMILIES = [
    [["ggm", "ggp"], ["gpKolya", "gpTolya"]],
    [["gmMaria", "gpKolya"], ["tanya", "aunt", "yulya", "lena"]],
    [["gpTolya", "gmValya"], ["pasha", "dad"]],
    [["gpVanya", "gmVera"], ["mum", "ruslan"]],
    [["tanya"], ["denis", "maria"]],
    [["aunt"], ["stas", "maks"]],
    [["yulya", "lesha"], ["lada"]],
    [["lena"], ["dasha"]],
    [["dad", "mum"], ["nikita", "timofey", "me"]],
    [["ruslan", "galya"], ["marusya", "polina", "andrey"]],
  ];

  const root = document.getElementById("familyTree");
  if (!root) return;

  const stage = document.createElement("div");
  stage.className = "ft-stage";
  stage.style.width = `${W}px`;
  stage.style.height = `${H}px`;
  root.appendChild(stage);

  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("class", "ft-lines");
  svg.setAttribute("aria-hidden", "true");
  stage.appendChild(svg);

  const top = (id) => ROW[P[id][3]];
  const mid = (id) => top(id) + IMG_H / 2;
  const line = (pts, cls) => {
    const el = document.createElementNS(NS, "polyline");
    el.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
    el.setAttribute("class", cls);
    svg.appendChild(el);
  };

  // Me and my direct ancestors get the accent line
  const LINEAGE = new Set(["me", "dad", "mum", "gpTolya", "gmValya", "gpVanya", "gmVera", "ggm", "ggp"]);

  for (const [a, b] of COUPLES) {
    const xa = P[a][2], xb = P[b][2];
    const [l, r] = xa < xb ? [xa, xb] : [xb, xa];
    line([[l + IMG_W / 2 + 6, mid(a)], [r - IMG_W / 2 - 6, mid(a)]], "ft-couple");
  }

  for (const [parents, kids] of FAMILIES) {
    const xs = parents.map((id) => P[id][2]);
    const px = xs.reduce((s, x) => s + x, 0) / xs.length;
    // couples drop from the middle of their marriage line, single parents from under their name
    const py = parents.length === 2 ? mid(parents[0]) : top(parents[0]) + IMG_H + 44;
    const busY = top(kids[0]) - BUS;
    const kxs = kids.map((id) => P[id][2]);
    const minX = Math.min(px, ...kxs);
    const maxX = Math.max(px, ...kxs);
    const ours = kids.some((k) => LINEAGE.has(k)) && parents.every((p) => LINEAGE.has(p));
    line([[minX, busY], [maxX, busY]], "ft-link");
    for (const id of kids) {
      if (!(ours && LINEAGE.has(id))) line([[P[id][2], busY], [P[id][2], top(id) - 4]], "ft-link");
    }
    if (ours) {
      // highlight only the path that leads down to me
      const kid = kids.find((k) => LINEAGE.has(k));
      line([[px, py], [px, busY], [P[kid][2], busY], [P[kid][2], top(kid) - 4]], "ft-link ours");
    } else {
      line([[px, py], [px, busY]], "ft-link");
    }
  }

  let order = 0;
  for (const [id, [role, name, x, gen]] of Object.entries(P)) {
    const node = document.createElement("div");
    node.className = `ft-node${id === "me" ? " me" : ""}${LINEAGE.has(id) ? " lineage" : ""}`;
    node.style.left = `${x}px`;
    node.style.top = `${ROW[gen]}px`;
    node.style.setProperty("--d", `${gen * 0.12 + (order++ % 12) * 0.015}s`);
    const img = document.createElement("img");
    img.src = "img/computer.png";
    img.alt = "";
    img.style.height = `${IMG_H}px`;
    const label = document.createElement("div");
    label.className = "ft-label";
    if (role) {
      const r = document.createElement("span");
      r.className = "ft-role";
      r.textContent = role;
      label.appendChild(r);
    }
    if (name) {
      const n = document.createElement("span");
      n.className = "ft-name";
      n.textContent = name;
      label.appendChild(n);
    }
    node.append(img, label);
    stage.appendChild(node);
  }

  const fit = () => {
    const s = Math.min(root.clientWidth / W, root.clientHeight / H);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  };
  new ResizeObserver(fit).observe(root);
  fit();
})();
