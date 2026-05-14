const player = {
  energy: 100,
  cash: 0,
  attention: 0,
  belief: 0,
  capital: 0,
  influence: 0,
  risk: 0,
  level: 0,
  day: 1,
  reality: 10,
  myth: 5,
  lowEnergyDays: 0,
};

const levels = [
  { name: "Niveau 0 - Rien", objective: "Atteindre 100 cash", check: (p) => p.cash >= 100 },
  { name: "Niveau 1 - Débrouillard", objective: "500 cash et 50 attention", check: (p) => p.cash >= 500 && p.attention >= 50 },
  { name: "Niveau 2 - Créateur d'attention", objective: "200 attention et 100 croyance", check: (p) => p.attention >= 200 && p.belief >= 100 },
  { name: "Niveau 3 - Micro-fondateur", objective: "1000 cash, 300 croyance, 1000 capital", check: (p) => p.cash >= 1000 && p.belief >= 300 && p.capital >= 1000 },
  { name: "Niveau 4 - Leveur de fonds", objective: "10000 capital et 500 influence", check: (p) => p.capital >= 10000 && p.influence >= 500 },
  { name: "Niveau 5 - Influence locale", objective: "Prototype final", check: () => false },
];

const locations = [
  { id: "street", name: "Rue", icon: "⬛" },
  { id: "shelter", name: "Abri", icon: "🛏" },
  { id: "job", name: "Petit boulot", icon: "💼" },
  { id: "cyber", name: "Cybercafé", icon: "💻" },
  { id: "social", name: "Réseaux sociaux", icon: "📡" },
  { id: "investor", name: "Investisseur local", icon: "💰" },
  { id: "cowork", name: "Bureau partagé", icon: "🏢" },
  { id: "media", name: "Média local", icon: "📺" },
  { id: "conference", name: "Conférence", icon: "🎤" },
];

const actions = [
  { id: "small_job", location: "job", label: "Faire un petit boulot", cost: { energy: 20 }, gain: { cash: 50 }, risk: 0, minLevel: 0 },
  { id: "sleep", location: "shelter", label: "Dormir à l'abri", cost: {}, gain: { energy: 50 }, dayAdvance: 1, minLevel: 0 },
  { id: "ask_help", location: "street", label: "Demander de l'aide", cost: { energy: 10 }, gain: { cash: 20 }, risk: 2, minLevel: 0 },
  { id: "content", location: "cyber", label: "Créer du contenu", cost: { energy: 10, cash: 20 }, gain: { attention: 40, myth: 5 }, risk: 5, minLevel: 1 },
  { id: "resale", location: "job", label: "Faire de la revente", cost: { energy: 15, cash: 30 }, gain: { cash: 80 }, risk: 4, minLevel: 1 },
  { id: "sell_promise", location: "social", label: "Vendre une promesse", cost: { attention: 20 }, gain: { belief: 50, myth: 10 }, risk: 10, minLevel: 2 },
  { id: "video", location: "media", label: "Publier une vidéo", cost: { energy: 15, cash: 50 }, gain: { attention: 90, myth: 10 }, risk: 8, minLevel: 2 },
  { id: "product", location: "cowork", label: "Améliorer le produit", cost: { cash: 100, energy: 10 }, gain: { reality: 20, belief: 20, risk: -5 }, risk: 0, minLevel: 2 },
  { id: "startup", location: "cowork", label: "Lancer une mini-startup", cost: { cash: 200, energy: 20 }, gain: { belief: 80, attention: 60, reality: 15 }, risk: 10, minLevel: 3 },
  { id: "pitch", location: "investor", label: "Pitcher un investisseur", cost: { belief: 50 }, gain: { capital: 500 }, risk: 15, minLevel: 3, condition: (p) => p.belief >= 100 && p.attention >= 50 },
  { id: "exaggerate", location: "media", label: "Exagérer la vision", cost: {}, gain: { attention: 100, belief: 100, myth: 30 }, risk: 30, minLevel: 4 },
  { id: "solidify", location: "cowork", label: "Renforcer la base réelle", cost: { capital: 300 }, gain: { reality: 50, risk: -20 }, risk: 0, minLevel: 4 },
  { id: "event", location: "conference", label: "Organiser un événement", cost: { capital: 500 }, gain: { attention: 200, belief: 150, influence: 20 }, risk: 15, minLevel: 4 },
  { id: "narrative", location: "social", label: "Créer une narrative", cost: { energy: 20, cash: 100 }, gain: { belief: 70, myth: 20 }, risk: 12, minLevel: 4 },
];

let selectedLocation = locations[0].id;
let gameOver = false;

function addLog(message) {
  const log = document.getElementById("log");
  const entry = document.createElement("div");
  entry.className = "log-entry";
  entry.textContent = `Jour ${player.day}: ${message}`;
  log.prepend(entry);
}

function canAfford(cost = {}) {
  return Object.entries(cost).every(([k, v]) => player[k] >= v);
}

function applyDelta(delta = {}) {
  Object.entries(delta).forEach(([k, v]) => {
    player[k] = Math.max(0, (player[k] || 0) + v);
  });
}

function performAction(actionId) {
  if (gameOver) return;
  const action = actions.find((a) => a.id === actionId);
  if (!action || !canAfford(action.cost) || player.level < action.minLevel) return;
  if (action.condition && !action.condition(player)) {
    addLog("Condition non remplie pour cette action.");
    return;
  }

  applyDelta(Object.fromEntries(Object.entries(action.cost || {}).map(([k, v]) => [k, -v])));
  applyDelta(action.gain);
  player.risk = Math.max(0, player.risk + (action.risk || 0));

  addLog(`${action.label} effectué.`);
  triggerRandomEvent();
  if (action.dayAdvance) nextDay(false);
  checkLevelProgression();
  checkLoseCondition();
  checkWinCondition();
  renderGame();
}

function triggerRandomEvent() {
  const roll = Math.random();
  const events = [];
  if (player.attention > 100) events.push({ chance: 0.16, text: "Vidéo virale. +200 attention, +50 croyance.", delta: { attention: 200, belief: 50 } });
  events.push({ chance: 0.12, text: "Critique publique. -50 croyance, +10 risque.", delta: { belief: -50, risk: 10 } });
  if (player.belief > 200) events.push({ chance: 0.1, text: "Investisseur intéressé. +800 capital.", delta: { capital: 800 } });
  if (player.risk > 70 || player.myth > player.reality + 50) events.push({ chance: 0.1, text: "Scandale. -200 croyance, -500 capital, -100 attention.", delta: { belief: -200, capital: -500, attention: -100, risk: -20 } });
  if (player.reality > player.myth) events.push({ chance: 0.08, text: "Produit solide remarqué. +100 croyance, +50 influence.", delta: { belief: 100, influence: 50 } });
  if (player.myth > player.reality + 50) events.push({ chance: 0.1, text: "Bulle médiatique. +500 capital, +300 attention, +30 risque.", delta: { capital: 500, attention: 300, risk: 30 } });

  for (const e of events) {
    if (roll < e.chance) {
      applyDelta(e.delta);
      addLog(e.text);
      break;
    }
  }
}

function nextDay(withEvent = true) {
  if (gameOver) return;
  player.day += 1;
  player.energy = Math.max(0, player.energy - 10);
  if (player.energy === 0) player.lowEnergyDays += 1;
  else player.lowEnergyDays = 0;
  if (withEvent) triggerRandomEvent();
  checkLevelProgression();
  checkLoseCondition();
  checkWinCondition();
  renderGame();
}

function checkLevelProgression() {
  if (player.level < 5 && levels[player.level].check(player)) {
    player.level += 1;
    addLog(`Progression débloquée: ${levels[player.level].name}`);
  }
}

function checkLoseCondition() {
  if (player.lowEnergyDays >= 2 || player.cash < 0 || player.risk > 150 || (player.level >= 2 && player.belief === 0) || (player.level >= 4 && player.capital === 0)) {
    gameOver = true;
    addLog("DEFAITE: Ton système s'est effondré. Tu as vendu plus de mythe que tu ne pouvais livrer.");
  }
}

function checkWinCondition() {
  if (player.level >= 5 && player.influence >= 1000 && player.capital >= 50000 && player.risk < 100) {
    gameOver = true;
    addLog("VICTOIRE: Tu n'es plus un survivant. Tu es devenu une machine à déplacer le capital.");
  }
}

function renderStats() {
  const stats = document.getElementById("stats");
  const objective = levels[player.level].objective;
  stats.innerHTML = `
    ${renderStat("Énergie", player.energy)}
    ${renderStat("Cash", player.cash)}
    ${renderStat("Attention", player.attention)}
    ${renderStat("Croyance", player.belief)}
    ${renderStat("Capital", player.capital)}
    ${renderStat("Influence", player.influence)}
    ${renderStat("Risque", player.risk)}
    ${renderStat("Niveau", player.level)}
    ${renderStat("Jour", player.day)}
    <div class="stat"><strong>Objectif</strong>${objective}</div>
    <div class="stat"><strong>Reality</strong>${player.reality}</div>
    <div class="stat"><strong>Myth</strong>${player.myth}</div>
    <div class="stat" style="grid-column: span 2;">
      <div class="bar-wrap"><div class="bar-label">Reality</div><div class="bar"><div class="fill reality" style="width:${Math.min(player.reality, 100)}%"></div></div></div>
      <div class="bar-wrap"><div class="bar-label">Myth</div><div class="bar"><div class="fill myth" style="width:${Math.min(player.myth, 100)}%"></div></div></div>
      <div class="bar-wrap"><div class="bar-label">Risque</div><div class="bar"><div class="fill risk" style="width:${Math.min(player.risk, 150) / 1.5}%"></div></div></div>
    </div>
  `;
}

const renderStat = (k, v) => `<div class="stat"><strong>${k}</strong>${v}</div>`;

function renderMap() {
  const map = document.getElementById("map");
  map.innerHTML = "";
  locations.forEach((loc) => {
    const tile = document.createElement("button");
    tile.className = `tile ${selectedLocation === loc.id ? "active" : ""}`;
    tile.innerHTML = `<span class="icon">${loc.icon}</span>${loc.name}`;
    tile.onclick = () => {
      selectedLocation = loc.id;
      renderActions(loc.id);
      renderMap();
    };
    map.appendChild(tile);
  });
}

function renderActions(locationId) {
  const zone = document.getElementById("actions");
  const title = document.getElementById("selected-location-title");
  const location = locations.find((l) => l.id === locationId);
  title.textContent = `Actions - ${location.name}`;
  zone.innerHTML = "";

  actions.filter((a) => a.location === locationId).forEach((a) => {
    const btn = document.createElement("button");
    const blocked = player.level < a.minLevel || !canAfford(a.cost) || (a.condition && !a.condition(player));
    btn.className = "action-btn";
    btn.disabled = blocked || gameOver;
    btn.innerHTML = `<strong>${a.label}</strong><br/>Niveau min: ${a.minLevel} | Coût: ${JSON.stringify(a.cost)} | Gain: ${JSON.stringify(a.gain)} | Risque: ${a.risk || 0}`;
    btn.onclick = () => performAction(a.id);
    zone.appendChild(btn);
  });
}

function renderGame() {
  renderStats();
  renderMap();
  renderActions(selectedLocation);
  document.getElementById("next-day-btn").disabled = gameOver;
}

document.getElementById("next-day-btn").addEventListener("click", () => nextDay(true));
addLog("Tu pars de zéro. Ici, tout est levier.");
renderGame();
