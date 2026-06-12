// State management
const STATE = {
  positions: [],
  matches: [],
  predictions: [],
  players: [],
  settings: {
    realWinner: '',
    realSecond: '',
    realThird: ''
  }
};

// Global variables for caching teams
let TEAMS_LIST = [];

// DOM Cache
const DOM = {
  // Navigation Tabs
  tabDb: document.getElementById('tab-db'),
  tabMatches: document.getElementById('tab-matches'),
  tabWildcards: document.getElementById('tab-wildcards'),
  tabScorers: document.getElementById('tab-scorers'),
  tabStandings: document.getElementById('tab-standings'),

  // Views
  viewDb: document.getElementById('view-db'),
  viewMatches: document.getElementById('view-matches'),
  viewWildcards: document.getElementById('view-wildcards'),
  viewScorers: document.getElementById('view-scorers'),
  viewStandings: document.getElementById('view-standings'),

  // Database Stats
  statParticipants: document.getElementById('stat-participants'),
  statMatches: document.getElementById('stat-matches'),
  statPredictions: document.getElementById('stat-predictions'),
  statPlayers: document.getElementById('stat-players'),
  txtStatusText: document.getElementById('txt-status-text'),

  // Action Elements
  btnExportExcel: document.getElementById('btn-export-excel'),
  inputImportDb: document.getElementById('input-import-db'),
  inputImportUser: document.getElementById('input-import-user'),
  btnResetDb: document.getElementById('btn-reset-db'),
  btnClearDb: document.getElementById('btn-clear-db'),

  // Match Tab Elements
  matchSearchInput: document.getElementById('match-search-input'),
  matchStageFilter: document.getElementById('match-stage-filter'),
  matchesPlayedCount: document.getElementById('matches-played-count'),
  btnClearAllMatches: document.getElementById('btn-clear-all-matches'),
  adminMatchesList: document.getElementById('admin-matches-list'),

  // Wildcard Elements
  selectRealWinner: document.getElementById('select-real-winner'),
  selectRealSecond: document.getElementById('select-real-second'),
  selectRealThird: document.getElementById('select-real-third'),
  btnSaveWildcards: document.getElementById('btn-save-wildcards'),

  // Scorer Elements
  btnAddScorerModal: document.getElementById('btn-add-scorer-modal'),
  scorerSearchInput: document.getElementById('scorer-search-input'),
  adminScorersTbody: document.getElementById('admin-scorers-tbody'),
  modalAddScorer: document.getElementById('modal-add-scorer'),
  btnCloseScorerModal: document.getElementById('btn-close-scorer-modal'),
  inputScorerName: document.getElementById('input-scorer-name'),
  selectScorerTeam: document.getElementById('select-scorer-team'),
  inputScorerGoals: document.getElementById('input-scorer-goals'),
  inputScorerSynonyms: document.getElementById('input-scorer-synonyms'),
  btnSaveNewScorer: document.getElementById('btn-save-new-scorer'),

  // Standings elements
  goldName: document.getElementById('txt-gold-name'),
  goldPoints: document.getElementById('txt-gold-points'),
  silverName: document.getElementById('txt-silver-name'),
  silverPoints: document.getElementById('txt-silver-points'),
  bronzeName: document.getElementById('txt-bronze-name'),
  bronzePoints: document.getElementById('txt-bronze-points'),
  leaderboardSearchInput: document.getElementById('leaderboard-search-input'),
  adminLeaderboardList: document.getElementById('admin-leaderboard-list'),

  // Participant Detail Modal
  modalParticipantDetail: document.getElementById('modal-participant-detail'),
  participantModalClose: document.getElementById('participant-modal-close'),
  detailParticipantName: document.getElementById('detail-participant-name'),
  detailTotalPoints: document.getElementById('detail-total-points'),
  detailMatchPoints: document.getElementById('detail-match-points'),
  detailWildcardPoints: document.getElementById('detail-wildcard-points'),
  detailWcWinner: document.getElementById('detail-wc-winner'),
  detailWcWinnerPts: document.getElementById('detail-wc-winner-pts'),
  detailWcSecond: document.getElementById('detail-wc-second'),
  detailWcSecondPts: document.getElementById('detail-wc-second-pts'),
  detailWcThird: document.getElementById('detail-wc-third'),
  detailWcThirdPts: document.getElementById('detail-wc-third-pts'),
  detailWcScorer: document.getElementById('detail-wc-scorer'),
  detailWcScorerPts: document.getElementById('detail-wc-scorer-pts'),
  detailPredictionsList: document.getElementById('detail-predictions-list')
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  checkAuthentication();
  loadInitialData();
  extractTeamsList();
  populateDropdowns();
  setupEventListeners();
  recalculateAllPoints();
  renderUI();
  updateStats();
});

// --- State Loading & Saving ---
function loadInitialData() {
  const cached = localStorage.getItem('kikes_admin_db');
  if (cached) {
    try {
      const data = JSON.parse(cached);
      STATE.positions = data.positions || [];
      STATE.matches = data.matches || [];
      STATE.predictions = data.predictions || [];
      STATE.players = data.players || [];
      STATE.settings = data.settings || { realWinner: '', realSecond: '', realThird: '' };
      DOM.txtStatusText.innerText = "Cargada Local";
      return;
    } catch (e) {
      console.error('Error parsing cached database', e);
    }
  }

  // Fallback to SEED_DATA
  if (typeof SEED_DATA !== 'undefined') {
    STATE.positions = JSON.parse(JSON.stringify(SEED_DATA.positions)) || [];
    STATE.matches = JSON.parse(JSON.stringify(SEED_DATA.matches)) || [];
    STATE.predictions = JSON.parse(JSON.stringify(SEED_DATA.predictions)) || [];
    STATE.players = JSON.parse(JSON.stringify(SEED_DATA.players)) || [];
    STATE.settings = JSON.parse(JSON.stringify(SEED_DATA.settings)) || { realWinner: '', realSecond: '', realThird: '' };
    DOM.txtStatusText.innerText = "Semilla Inicial";
  } else {
    showToast('No se encontró información semilla en seed_data.js', 'warning');
  }
  saveState();
}

function saveState() {
  localStorage.setItem('kikes_admin_db', JSON.stringify(STATE));
}

function extractTeamsList() {
  const teams = new Set();
  STATE.matches.forEach(m => {
    if (m.team1) teams.add(m.team1);
    if (m.team2) teams.add(m.team2);
  });
  TEAMS_LIST = Array.from(teams).sort((a, b) => a.localeCompare(b, 'es'));
}

function populateDropdowns() {
  // Clear options except first
  const clearDropdown = (el) => {
    el.innerHTML = '<option value="">-- Seleccionar Equipo --</option>';
  };

  clearDropdown(DOM.selectRealWinner);
  clearDropdown(DOM.selectRealSecond);
  clearDropdown(DOM.selectRealThird);
  clearDropdown(DOM.selectScorerTeam);

  TEAMS_LIST.forEach(team => {
    const optWinner = new Option(team, team);
    const optSecond = new Option(team, team);
    const optThird = new Option(team, team);
    const optScorer = new Option(team, team);

    DOM.selectRealWinner.add(optWinner);
    DOM.selectRealSecond.add(optSecond);
    DOM.selectRealThird.add(optThird);
    DOM.selectScorerTeam.add(optScorer);
  });

  // Set selected values if available in settings
  if (STATE.settings) {
    DOM.selectRealWinner.value = STATE.settings.realWinner || '';
    DOM.selectRealSecond.value = STATE.settings.realSecond || '';
    DOM.selectRealThird.value = STATE.settings.realThird || '';
  }
}

// --- Scoring Calculations ---
function recalculateAllPoints() {
  // 1. Get top scorers (players with max goals > 0)
  let maxGoals = 0;
  STATE.players.forEach(p => {
    if (p.goals > maxGoals) maxGoals = p.goals;
  });

  const topScorers = [];
  if (maxGoals > 0) {
    STATE.players.forEach(p => {
      if (p.goals === maxGoals) {
        topScorers.push({
          name: p.name.trim().toLowerCase(),
          synonyms: (p.synonyms || '').split(/[;,]/).map(s => s.trim().toLowerCase()).filter(s => s !== '')
        });
      }
    });
  }

  const realWinner = (STATE.settings.realWinner || '').trim().toLowerCase();
  const realSecond = (STATE.settings.realSecond || '').trim().toLowerCase();
  const realThird = (STATE.settings.realThird || '').trim().toLowerCase();

  // Create match lookup
  const matchMap = new Map();
  STATE.matches.forEach(m => {
    matchMap.set(m.id, m);
  });

  // Calculate predictions first and group by participant name
  const participantPreds = new Map();
  STATE.predictions.forEach(pred => {
    let pts = 0;
    const match = matchMap.get(pred.matchId);
    
    if (match && match.realGoals1 !== null && match.realGoals1 !== undefined &&
        match.realGoals2 !== null && match.realGoals2 !== undefined &&
        pred.predGoals1 !== null && pred.predGoals1 !== undefined &&
        pred.predGoals2 !== null && pred.predGoals2 !== undefined) {
      
      const r1 = match.realGoals1;
      const r2 = match.realGoals2;
      const p1 = pred.predGoals1;
      const p2 = pred.predGoals2;

      const realOutcome = r1 > r2 ? 1 : (r1 < r2 ? 2 : 0);
      const predOutcome = p1 > p2 ? 1 : (p1 < p2 ? 2 : 0);

      const correctExact = (r1 === p1 && r2 === p2);
      const correctDifference = ((r1 - r2) === (p1 - p2));
      const correctOutcome = (realOutcome === predOutcome);

      if (correctExact) {
        pts = 5;
      } else if (correctDifference) {
        pts = 3;
      } else if (correctOutcome) {
        pts = 2;
      }
    }

    pred.points = pts;

    if (!participantPreds.has(pred.participantName)) {
      participantPreds.set(pred.participantName, []);
    }
    participantPreds.get(pred.participantName).push(pred);
  });

  // Update positions points
  STATE.positions.forEach(p => {
    const preds = participantPreds.get(p.name) || [];
    let matchPoints = 0;
    preds.forEach(pred => {
      matchPoints += pred.points;
    });

    // Champion (30 pts)
    const predWinner = (p.predictedWinner || '').trim().toLowerCase();
    const winnerPoints = (realWinner && predWinner === realWinner) ? 30 : 0;

    // Second (20 pts)
    const predSecond = (p.predictedSecond || '').trim().toLowerCase();
    const secondPoints = (realSecond && predSecond === realSecond) ? 20 : 0;

    // Third (10 pts)
    const predThird = (p.predictedThird || '').trim().toLowerCase();
    const thirdPoints = (realThird && predThird === realThird) ? 10 : 0;

    // Scorer (20 pts)
    let scorerPoints = 0;
    const predScorer = (p.predictedScorer || '').trim().toLowerCase();
    if (predScorer && topScorers.length > 0) {
      for (const ts of topScorers) {
        let match = (ts.name === predScorer);
        if (!match && ts.synonyms.length > 0) {
          match = ts.synonyms.includes(predScorer);
        }
        if (match) {
          scorerPoints = 20;
          break;
        }
      }
    }

    p.matchPoints = matchPoints;
    p.winnerPoints = winnerPoints;
    p.secondPoints = secondPoints;
    p.thirdPoints = thirdPoints;
    p.scorerPoints = scorerPoints;
    p.wildcardPoints = winnerPoints + secondPoints + thirdPoints + scorerPoints;
    p.totalPoints = matchPoints + p.wildcardPoints;
  });
}

// --- Dynamic Rendering ---
function renderUI() {
  renderMatchesList();
  renderScorersList();
  renderStandings();
}

function updateStats() {
  DOM.statParticipants.innerText = STATE.positions.length;
  DOM.statMatches.innerText = STATE.matches.length;
  DOM.statPredictions.innerText = STATE.predictions.length;
  DOM.statPlayers.innerText = STATE.players.length;
}

// 1. Matches tab
function renderMatchesList() {
  DOM.adminMatchesList.innerHTML = '';
  
  const searchVal = DOM.matchSearchInput.value.toLowerCase().trim();
  const stageFilter = DOM.matchStageFilter.value;

  const filtered = STATE.matches.filter(m => {
    // Stage Filter
    if (stageFilter !== 'ALL' && m.groupStage !== stageFilter) return false;
    
    // Search Filter
    if (searchVal) {
      return m.team1.toLowerCase().includes(searchVal) || m.team2.toLowerCase().includes(searchVal) || m.groupStage.toLowerCase().includes(searchVal);
    }
    return true;
  });

  const playedCount = STATE.matches.filter(m => m.realGoals1 !== null && m.realGoals2 !== null).length;
  DOM.matchesPlayedCount.innerText = `${playedCount}/${STATE.matches.length}`;

  if (filtered.length === 0) {
    DOM.adminMatchesList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>Sin Partidos</h3>
        <p>No hay partidos que coincidan con la búsqueda.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.id = `match-card-${m.id}`;

    const g1Val = m.realGoals1 !== null ? m.realGoals1 : '';
    const g2Val = m.realGoals2 !== null ? m.realGoals2 : '';
    const g1Filled = m.realGoals1 !== null ? 'filled' : '';
    const g2Filled = m.realGoals2 !== null ? 'filled' : '';

    card.innerHTML = `
      <div class="match-card-header">${m.groupStage} &bull; Partido #${m.id}</div>
      <div class="match-card-teams">
        <div class="team-info team-local-info">
          <span class="match-team">${m.team1}</span>
          <img src="${getFlagUrl(m.team1)}" class="match-flag" onerror="this.src='Assets/Flags/placeholder.png'" alt="">
        </div>
        
        <div class="match-score-inputs">
          <div class="score-input-wrapper">
            <input type="number" class="score-input ${g1Filled}" data-match-id="${m.id}" data-type="goals1" value="${g1Val}" placeholder="-" min="0">
          </div>
          <span class="score-separator">&ndash;</span>
          <div class="score-input-wrapper">
            <input type="number" class="score-input ${g2Filled}" data-match-id="${m.id}" data-type="goals2" value="${g2Val}" placeholder="-" min="0">
          </div>
        </div>

        <div class="team-info team-visit-info">
          <img src="${getFlagUrl(m.team2)}" class="match-flag" onerror="this.src='Assets/Flags/placeholder.png'" alt="">
          <span class="match-team">${m.team2}</span>
        </div>
      </div>
    `;
    DOM.adminMatchesList.appendChild(card);
  });

  // Bind input listeners
  const scoreInputs = DOM.adminMatchesList.querySelectorAll('.score-input');
  scoreInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      const matchId = parseInt(e.target.dataset.matchId);
      const type = e.target.dataset.type;
      const match = STATE.matches.find(m => m.id === matchId);
      
      if (!match) return;

      const val = e.target.value.trim();
      if (val === '') {
        if (type === 'goals1') match.realGoals1 = null;
        else match.realGoals2 = null;
        e.target.classList.remove('filled');
      } else {
        const intVal = parseInt(val);
        if (intVal >= 0) {
          if (type === 'goals1') match.realGoals1 = intVal;
          else match.realGoals2 = intVal;
          e.target.classList.add('filled');
        } else {
          e.target.value = '';
          if (type === 'goals1') match.realGoals1 = null;
          else match.realGoals2 = null;
          e.target.classList.remove('filled');
        }
      }

      recalculateAllPoints();
      saveState();
      updateStandingsLiveOnly(); // Faster UI update
      updateStats();
    });
  });
}

// 2. Goleadores (Scorers) tab
function renderScorersList() {
  DOM.adminScorersTbody.innerHTML = '';
  
  const search = DOM.scorerSearchInput.value.toLowerCase().trim();
  const sortedPlayers = [...STATE.players].sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  
  const filtered = sortedPlayers.filter(p => 
    p.name.toLowerCase().includes(search) || p.team.toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    DOM.adminScorersTbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">
          No hay jugadores registrados.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="scorer-name-cell">
          <span>${p.name}</span>
          ${p.synonyms ? `<span class="scorer-synonyms">Sinónimos: ${p.synonyms}</span>` : ''}
        </div>
      </td>
      <td>
        <div class="table-team-cell">
          <img src="${getFlagUrl(p.team)}" class="match-flag" onerror="this.src='Assets/Flags/placeholder.png'" alt="" style="width: 20px; height: 14px;">
          <span>${p.team}</span>
        </div>
      </td>
      <td>
        <div class="counter-container">
          <button class="btn-counter btn-decrement" data-player-id="${p.name}">&minus;</button>
          <span class="counter-value">${p.goals}</span>
          <button class="btn-counter btn-increment" data-player-id="${p.name}">&plus;</button>
        </div>
      </td>
      <td>
        <button class="btn btn-danger-outline btn-sm btn-delete-scorer" data-player-id="${p.name}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    `;
    DOM.adminScorersTbody.appendChild(tr);
  });

  // Bind counter listeners
  DOM.adminScorersTbody.querySelectorAll('.btn-increment').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pName = e.target.closest('button').dataset.playerId;
      const player = STATE.players.find(p => p.name === pName);
      if (player) {
        player.goals++;
        recalculateAllPoints();
        saveState();
        renderScorersList();
        renderStandings();
        updateStats();
      }
    });
  });

  DOM.adminScorersTbody.querySelectorAll('.btn-decrement').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pName = e.target.closest('button').dataset.playerId;
      const player = STATE.players.find(p => p.name === pName);
      if (player && player.goals > 0) {
        player.goals--;
        recalculateAllPoints();
        saveState();
        renderScorersList();
        renderStandings();
        updateStats();
      }
    });
  });

  // Delete listener
  DOM.adminScorersTbody.querySelectorAll('.btn-delete-scorer').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pName = e.target.closest('button').dataset.playerId;
      if (confirm(`¿Estás seguro de eliminar a ${pName} de la lista de goleadores?`)) {
        STATE.players = STATE.players.filter(p => p.name !== pName);
        recalculateAllPoints();
        saveState();
        renderScorersList();
        renderStandings();
        updateStats();
        showToast('Goleador eliminado', 'info');
      }
    });
  });
}

// 3. Standings Leaderboard Tab
function renderStandings() {
  if (STATE.positions.length === 0) {
    DOM.adminLeaderboardList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-ranking-star"></i>
        <h3>Sin Participantes</h3>
        <p>Importa archivos de predicción para poblar la lista de clasificación.</p>
      </div>
    `;
    return;
  }

  // Sort descending by totalPoints, then name ascending
  const sorted = [...STATE.positions].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));

  let currentRank = 1;
  const standingsWithRank = sorted.map((s, index) => {
    if (index > 0 && s.totalPoints < sorted[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return {
      rank: currentRank,
      ...s
    };
  });

  renderPodium(standingsWithRank);
  renderLeaderboardList(standingsWithRank);
}

function updateStandingsLiveOnly() {
  const sorted = [...STATE.positions].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));

  let currentRank = 1;
  const standingsWithRank = sorted.map((s, index) => {
    if (index > 0 && s.totalPoints < sorted[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return {
      rank: currentRank,
      ...s
    };
  });

  renderPodium(standingsWithRank);
  
  // Update only list rows in DOM if they exist to avoid rebuilding DOM on every keystroke
  const searchVal = DOM.leaderboardSearchInput.value.toLowerCase().trim();
  const filtered = standingsWithRank.filter(s => s.name.toLowerCase().includes(searchVal));

  const listEl = DOM.adminLeaderboardList;
  listEl.innerHTML = '';
  
  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>Sin Resultados</h3>
        <p>No se encontraron coincidencias.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = `leaderboard-item item-rank-${item.rank}`;
    itemEl.dataset.name = item.name;
    
    itemEl.innerHTML = `
      <div class="col-rank">
        <span class="rank-badge">${item.rank}</span>
      </div>
      <div class="col-name">
        <span class="item-name">${item.name}</span>
      </div>
      <div class="col-details">
        <div class="item-details">
          <span>Partidos / Comodín</span>
          <div class="pts-breakdown">
            <span class="pts-type">⚽ ${item.matchPoints}</span>
            <span class="pts-type">🏆 ${item.wildcardPoints}</span>
          </div>
        </div>
      </div>
      <div class="col-total">
        <span class="total-badge">${item.totalPoints}</span>
      </div>
    `;
    itemEl.addEventListener('click', () => openParticipantDetail(item.name));
    listEl.appendChild(itemEl);
  });
}

function renderPodium(standings) {
  DOM.goldName.innerText = '-';
  DOM.goldPoints.innerText = '0 pts';
  DOM.silverName.innerText = '-';
  DOM.silverPoints.innerText = '0 pts';
  DOM.bronzeName.innerText = '-';
  DOM.bronzePoints.innerText = '0 pts';

  const first = standings[0];
  if (first) {
    DOM.goldName.innerText = first.name;
    DOM.goldPoints.innerText = `${first.totalPoints} pts`;
  }

  const second = standings[1];
  if (second) {
    DOM.silverName.innerText = second.name;
    DOM.silverPoints.innerText = `${second.totalPoints} pts`;
  }

  const third = standings[2];
  if (third) {
    DOM.bronzeName.innerText = third.name;
    DOM.bronzePoints.innerText = `${third.totalPoints} pts`;
  }
}

function renderLeaderboardList(standings) {
  const searchVal = DOM.leaderboardSearchInput.value.toLowerCase().trim();
  const filtered = standings.filter(s => s.name.toLowerCase().includes(searchVal));

  DOM.adminLeaderboardList.innerHTML = '';

  if (filtered.length === 0) {
    DOM.adminLeaderboardList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>Sin Resultados</h3>
        <p>No se encontraron participantes.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = `leaderboard-item item-rank-${item.rank}`;
    itemEl.dataset.name = item.name;

    itemEl.innerHTML = `
      <div class="col-rank">
        <span class="rank-badge">${item.rank}</span>
      </div>
      <div class="col-name">
        <span class="item-name">${item.name}</span>
      </div>
      <div class="col-details">
        <div class="item-details">
          <span>Partidos / Comodín</span>
          <div class="pts-breakdown">
            <span class="pts-type">⚽ ${item.matchPoints}</span>
            <span class="pts-type">🏆 ${item.wildcardPoints}</span>
          </div>
        </div>
      </div>
      <div class="col-total">
        <span class="total-badge">${item.totalPoints}</span>
      </div>
    `;
    itemEl.addEventListener('click', () => openParticipantDetail(item.name));
    DOM.adminLeaderboardList.appendChild(itemEl);
  });
}

function openParticipantDetail(name) {
  const p = STATE.positions.find(pos => pos.name === name);
  if (!p) return;

  DOM.detailParticipantName.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${p.name}`;
  DOM.detailTotalPoints.innerText = `${p.totalPoints} pts`;
  DOM.detailMatchPoints.innerText = `${p.matchPoints} pts`;
  DOM.detailWildcardPoints.innerText = `${p.wildcardPoints} pts`;

  DOM.detailWcWinner.innerText = p.predictedWinner || '-';
  DOM.detailWcWinnerPts.innerText = `${p.winnerPoints} pts`;
  
  DOM.detailWcSecond.innerText = p.predictedSecond || '-';
  DOM.detailWcSecondPts.innerText = `${p.secondPoints} pts`;

  DOM.detailWcThird.innerText = p.predictedThird || '-';
  DOM.detailWcThirdPts.innerText = `${p.thirdPoints} pts`;

  DOM.detailWcScorer.innerText = p.predictedScorer || '-';
  DOM.detailWcScorerPts.innerText = `${p.scorerPoints} pts`;

  // Render detail predictions list
  DOM.detailPredictionsList.innerHTML = '';
  
  const preds = STATE.predictions.filter(pr => pr.participantName === p.name);
  preds.sort((a, b) => a.matchId - b.matchId);

  preds.forEach(pred => {
    const match = STATE.matches.find(m => m.id === pred.matchId);
    if (!match) return;

    const div = document.createElement('div');
    div.className = 'history-pred-card';

    const realText = (match.realGoals1 !== null && match.realGoals2 !== null) ? `${match.realGoals1} - ${match.realGoals2}` : 'Pte';
    const predText = (pred.predGoals1 !== null && pred.predGoals2 !== null) ? `${pred.predGoals1} - ${pred.predGoals2}` : '-';

    let badgeClass = 'zero';
    if (pred.points === 5) badgeClass = 'exact';
    else if (pred.points === 3) badgeClass = 'diff';
    else if (pred.points === 2) badgeClass = 'outcome';

    div.innerHTML = `
      <div class="history-pred-header">
        <span>${match.groupStage} &bull; ID #${match.id}</span>
        <span class="pred-pts-badge ${badgeClass}">${pred.points} pts</span>
      </div>
      <div class="history-pred-body">
        <span class="history-pred-teams">${match.team1} vs ${match.team2}</span>
        <div class="history-pred-result">
          <div class="history-score-display">
            <div class="history-score-box pred">
              <span class="history-score-box-label">Pred</span>
              <span class="history-score-box-val">${predText}</span>
            </div>
            <div class="history-score-box">
              <span class="history-score-box-label">Real</span>
              <span class="history-score-box-val">${realText}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    DOM.detailPredictionsList.appendChild(div);
  });

  DOM.modalParticipantDetail.classList.remove('hidden');
}

// --- Import / Export Logic (SheetJS) ---

// 1. Export Excel function
function exportToExcel() {
  if (STATE.positions.length === 0) {
    showToast('No hay datos de participantes para exportar.', 'warning');
    return;
  }

  // A. Build Posiciones sheet
  const posRows = STATE.positions.map(p => ({
    "Nombre": p.name,
    "Puntos Partidos": p.matchPoints,
    "Puntos Comodín": p.wildcardPoints,
    "Puntos Totales": p.totalPoints,
    "Campeón": p.predictedWinner || "",
    "Pts Campeón": p.winnerPoints,
    "Subcampeón": p.predictedSecond || "",
    "Pts Subcampeón": p.secondPoints,
    "Tercer Puesto": p.predictedThird || "",
    "Pts Tercer Puesto": p.thirdPoints,
    "Goleador": p.predictedScorer || "",
    "Pts Goleador": p.scorerPoints
  }));

  // Sort descending by totalPoints
  posRows.sort((a, b) => b["Puntos Totales"] - a["Puntos Totales"] || a["Nombre"].localeCompare(b["Nombre"]));

  // B. Build Partidos sheet
  const matchRows = STATE.matches.map(m => ({
    "Id": m.id,
    "Fase": m.groupStage,
    "Equipo Local": m.team1,
    "Goles Local": m.realGoals1 !== null && m.realGoals1 !== undefined ? m.realGoals1 : "",
    "Equipo Visitante": m.team2,
    "Goles Visitante": m.realGoals2 !== null && m.realGoals2 !== undefined ? m.realGoals2 : ""
  }));

  // C. Build Pronosticos sheet
  const predRows = STATE.predictions.map(pr => ({
    "Nombre Participante": pr.participantName,
    "ID Partido": pr.matchId,
    "Pred Local": pr.predGoals1 !== null && pr.predGoals1 !== undefined ? pr.predGoals1 : "",
    "Pred Visitante": pr.predGoals2 !== null && pr.predGoals2 !== undefined ? pr.predGoals2 : "",
    "Puntos": pr.points
  }));

  const wb = XLSX.utils.book_new();

  const wsPos = XLSX.utils.json_to_sheet(posRows);
  const wsMatch = XLSX.utils.json_to_sheet(matchRows);
  const wsPred = XLSX.utils.json_to_sheet(predRows);

  XLSX.utils.book_append_sheet(wb, wsPos, "Posiciones");
  XLSX.utils.book_append_sheet(wb, wsMatch, "Partidos");
  XLSX.utils.book_append_sheet(wb, wsPred, "Pronosticos");

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsm', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KikesMundial_Posiciones.xlsm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('¡Excel generado con éxito!', 'success');
  } catch (err) {
    console.error('Error generating Excel', err);
    showToast('Error al generar el archivo Excel.', 'error');
  }
}

// 2. Import Consolidated Database
function importConsolidated(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      if (!workbook.SheetNames.includes('Posiciones') || 
          !workbook.SheetNames.includes('Partidos') || 
          !workbook.SheetNames.includes('Pronosticos')) {
        showToast('Formato inválido. El Excel debe contener las hojas: Posiciones, Partidos y Pronosticos.', 'error');
        return;
      }

      // Parse Posiciones
      const sheetPos = workbook.Sheets['Posiciones'];
      const rowsPos = XLSX.utils.sheet_to_json(sheetPos, { defval: "" });
      const positions = rowsPos.map(r => ({
        name: String(r['Nombre'] || '').trim(),
        matchPoints: parseInt(r['Puntos Partidos'] || 0),
        wildcardPoints: parseInt(r['Puntos Comodín'] || r['Puntos Comod\u00edn'] || 0),
        totalPoints: parseInt(r['Puntos Totales'] || 0),
        predictedWinner: String(r['Campeón'] || r['Campe\u00f3n'] || '').trim(),
        winnerPoints: parseInt(r['Pts Campeón'] || r['Pts Campe\u00f3n'] || 0),
        predictedSecond: String(r['Subcampeón'] || r['Subcampe\u00f3n'] || '').trim(),
        secondPoints: parseInt(r['Pts Subcampeón'] || r['Pts Subcampe\u00f3n'] || 0),
        predictedThird: String(r['Tercer Puesto'] || '').trim(),
        thirdPoints: parseInt(r['Pts Tercer Puesto'] || 0),
        predictedScorer: String(r['Goleador'] || '').trim(),
        scorerPoints: parseInt(r['Pts Goleador'] || 0)
      })).filter(p => p.name !== '');

      // Parse Partidos
      const sheetMatch = workbook.Sheets['Partidos'];
      const rowsMatch = XLSX.utils.sheet_to_json(sheetMatch, { defval: "" });
      const matches = rowsMatch.map(r => ({
        id: parseInt(r['Id'] || 0),
        groupStage: String(r['Fase'] || '').trim(),
        team1: String(r['Equipo Local'] || '').trim(),
        realGoals1: r['Goles Local'] === "" || r['Goles Local'] === undefined ? null : parseInt(r['Goles Local']),
        team2: String(r['Equipo Visitante'] || '').trim(),
        realGoals2: r['Goles Visitante'] === "" || r['Goles Visitante'] === undefined ? null : parseInt(r['Goles Visitante'])
      })).filter(m => m.id > 0);

      // Parse Pronosticos
      const sheetPred = workbook.Sheets['Pronosticos'];
      const rowsPred = XLSX.utils.sheet_to_json(sheetPred, { defval: "" });
      const predictions = rowsPred.map(r => ({
        participantName: String(r['Nombre Participante'] || '').trim(),
        matchId: parseInt(r['ID Partido'] || 0),
        predGoals1: r['Pred Local'] === "" || r['Pred Local'] === undefined ? null : parseInt(r['Pred Local']),
        predGoals2: r['Pred Visitante'] === "" || r['Pred Visitante'] === undefined ? null : parseInt(r['Pred Visitante']),
        points: parseInt(r['Puntos'] || 0)
      })).filter(pr => pr.participantName !== '' && pr.matchId > 0);

      // Overwrite Database State
      STATE.positions = positions;
      STATE.matches = matches;
      STATE.predictions = predictions;
      
      // Update team dropdowns dynamically based on imported matches
      extractTeamsList();
      populateDropdowns();

      recalculateAllPoints();
      saveState();
      
      DOM.txtStatusText.innerText = "Importada Completa";
      renderUI();
      updateStats();
      showToast('Base de datos consolidada importada con éxito.', 'success');
    } catch (ex) {
      console.error(ex);
      showToast('Error al procesar el archivo Excel.', 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

// 3. Import Individual Participant predictions template file
async function importIndividualUserFiles(files) {
  let countSuccess = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const parsedData = await parseIndividualUserFile(file);
      if (parsedData) {
        addOrUpdateIndividual(parsedData);
        countSuccess++;
      }
    } catch (err) {
      console.error('Error importing file ' + file.name, err);
      showToast(`Error al importar ${file.name}: ${err.message}`, 'error');
    }
  }

  if (countSuccess > 0) {
    recalculateAllPoints();
    saveState();
    renderUI();
    updateStats();
    showToast(`¡Se importaron ${countSuccess} participantes con éxito!`, 'success');
  }
}

function parseIndividualUserFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const ws = workbook.Sheets[firstSheetName];

        // Read name (Cell B3)
        const nameCell = ws['B3'];
        const name = nameCell && nameCell.v ? String(nameCell.v).trim() : '';
        if (!name) {
          return reject(new Error('Celda B3 (Nombre) está vacía o es inválida.'));
        }

        // Read wildcards (B6, B7, B8, B9)
        const winner = ws['B6'] && ws['B6'].v ? String(ws['B6'].v).trim() : '';
        const second = ws['B7'] && ws['B7'].v ? String(ws['B7'].v).trim() : '';
        const third = ws['B8'] && ws['B8'].v ? String(ws['B8'].v).trim() : '';
        const scorer = ws['B9'] && ws['B9'].v ? String(ws['B9'].v).trim() : '';

        // Read predictions starting from row 11
        let row = 11;
        const predictionsList = [];
        
        while (true) {
          const idCell = ws[`A${row}`];
          if (!idCell || idCell.v === undefined || idCell.v === null || String(idCell.v).trim() === '') {
            break; // End of predictions rows list
          }

          const matchId = parseInt(idCell.v);
          const localG = ws[`D${row}`];
          const visitG = ws[`F${row}`];

          let predGoals1 = null;
          let predGoals2 = null;

          if (localG && localG.v !== undefined && localG.v !== null && String(localG.v).trim() !== '') {
            predGoals1 = parseInt(localG.v);
          }
          if (visitG && visitG.v !== undefined && visitG.v !== null && String(visitG.v).trim() !== '') {
            predGoals2 = parseInt(visitG.v);
          }

          predictionsList.push({
            matchId,
            predGoals1,
            predGoals2
          });
          row++;
        }

        resolve({
          name,
          winner,
          second,
          third,
          scorer,
          predictions: predictionsList
        });

      } catch (ex) {
        reject(ex);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });
}

function addOrUpdateIndividual(data) {
  // Check if player name matches existing
  const idx = STATE.positions.findIndex(p => p.name.toLowerCase() === data.name.toLowerCase());
  
  const participantObj = {
    name: data.name,
    matchPoints: 0,
    wildcardPoints: 0,
    totalPoints: 0,
    predictedWinner: data.winner,
    winnerPoints: 0,
    predictedSecond: data.second,
    secondPoints: 0,
    predictedThird: data.third,
    thirdPoints: 0,
    predictedScorer: data.scorer,
    scorerPoints: 0
  };

  if (idx >= 0) {
    // Keep exact original spelling/casing but update forecasts
    STATE.positions[idx] = { 
      ...STATE.positions[idx], 
      ...participantObj,
      name: STATE.positions[idx].name // preserve name casing
    };
  } else {
    STATE.positions.push(participantObj);
  }

  // Remove old predictions for this participant name to prevent leaks
  STATE.predictions = STATE.predictions.filter(pr => pr.participantName.toLowerCase() !== data.name.toLowerCase());

  // Insert predictions
  data.predictions.forEach(p => {
    STATE.predictions.push({
      participantName: data.name,
      matchId: p.matchId,
      predGoals1: p.predGoals1,
      predGoals2: p.predGoals2,
      points: 0
    });
  });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // 1. Tab Navigation switching
  const tabs = [
    { button: DOM.tabDb, view: DOM.viewDb },
    { button: DOM.tabMatches, view: DOM.viewMatches },
    { button: DOM.tabWildcards, view: DOM.viewWildcards },
    { button: DOM.tabScorers, view: DOM.viewScorers },
    { button: DOM.tabStandings, view: DOM.viewStandings }
  ];

  tabs.forEach(item => {
    item.button.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(t => {
        t.button.classList.remove('active');
        t.view.classList.add('hidden');
      });
      // Activate this
      item.button.classList.add('active');
      item.view.classList.remove('hidden');
      
      // Specifical tab setups
      if (item.view === DOM.viewStandings) {
        renderStandings();
      } else if (item.view === DOM.viewScorers) {
        renderScorersList();
      } else if (item.view === DOM.viewMatches) {
        renderMatchesList();
      }
    });
  });

  // 2. Database Management Tab Listeners
  DOM.btnExportExcel.addEventListener('click', exportToExcel);

  DOM.inputImportDb.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importConsolidated(file);
      e.target.value = ''; // clear for future imports
    }
  });

  DOM.inputImportUser.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      importIndividualUserFiles(files);
      e.target.value = ''; // clear
    }
  });

  DOM.btnResetDb.addEventListener('click', () => {
    if (confirm('¿Estás seguro de restablecer la base de datos a los datos de semilla originales? Se perderán todos tus cambios de marcadores reales.')) {
      localStorage.removeItem('kikes_admin_db');
      loadInitialData();
      extractTeamsList();
      populateDropdowns();
      recalculateAllPoints();
      saveState();
      renderUI();
      updateStats();
      showToast('Base de datos restablecida a semilla', 'success');
    }
  });

  DOM.btnClearDb.addEventListener('click', () => {
    if (confirm('¿Estás SEGURO de querer BORRAR TODOS los datos? (Participantes, Partidos, Predicciones). Esta acción es irreversible.')) {
      STATE.positions = [];
      STATE.matches = [];
      STATE.predictions = [];
      STATE.players = [];
      STATE.settings = { realWinner: '', realSecond: '', realThird: '' };
      saveState();
      populateDropdowns();
      renderUI();
      updateStats();
      DOM.txtStatusText.innerText = "Base Vacía";
      showToast('Base de datos vaciada por completo', 'warning');
    }
  });

  // 3. Match Tab Filter Listeners
  DOM.matchSearchInput.addEventListener('input', renderMatchesList);
  DOM.matchStageFilter.addEventListener('change', renderMatchesList);
  
  DOM.btnClearAllMatches.addEventListener('click', () => {
    if (confirm('¿Realmente deseas borrar todos los marcadores reales de los partidos? Los pronósticos volverán a valer 0 puntos.')) {
      STATE.matches.forEach(m => {
        m.realGoals1 = null;
        m.realGoals2 = null;
      });
      recalculateAllPoints();
      saveState();
      renderUI();
      updateStats();
      showToast('Marcadores borrados', 'info');
    }
  });

  // 4. Wildcard Save listener
  DOM.btnSaveWildcards.addEventListener('click', () => {
    STATE.settings.realWinner = DOM.selectRealWinner.value;
    STATE.settings.realSecond = DOM.selectRealSecond.value;
    STATE.settings.realThird = DOM.selectRealThird.value;

    recalculateAllPoints();
    saveState();
    renderUI();
    updateStats();
    showToast('Resultados de comodines guardados con éxito', 'success');
  });

  // 5. Scorer Search & Modal listeners
  DOM.scorerSearchInput.addEventListener('input', renderScorersList);
  
  DOM.btnAddScorerModal.addEventListener('click', () => {
    // Clear modal fields
    DOM.inputScorerName.value = '';
    DOM.selectScorerTeam.value = '';
    DOM.inputScorerGoals.value = 0;
    DOM.inputScorerSynonyms.value = '';
    DOM.modalAddScorer.classList.remove('hidden');
  });

  DOM.btnCloseScorerModal.addEventListener('click', () => {
    DOM.modalAddScorer.classList.add('hidden');
  });

  DOM.btnSaveNewScorer.addEventListener('click', () => {
    const name = DOM.inputScorerName.value.trim();
    const team = DOM.selectScorerTeam.value;
    const goals = parseInt(DOM.inputScorerGoals.value) || 0;
    const synonyms = DOM.inputScorerSynonyms.value.trim();

    if (!name) {
      showToast('Por favor introduce el nombre del goleador.', 'error');
      return;
    }
    if (!team) {
      showToast('Por favor selecciona una selección nacional.', 'error');
      return;
    }

    // Check if player already exists
    const exists = STATE.players.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showToast('Ese jugador ya existe en la lista.', 'error');
      return;
    }

    STATE.players.push({
      name,
      team,
      goals,
      synonyms
    });

    recalculateAllPoints();
    saveState();
    renderScorersList();
    renderStandings();
    updateStats();
    
    DOM.modalAddScorer.classList.add('hidden');
    showToast('Jugador agregado correctamente.', 'success');
  });

  // 6. Standings & Leaderboard Search
  DOM.leaderboardSearchInput.addEventListener('input', () => {
    // Render list
    const sorted = [...STATE.positions].sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name));
    let currentRank = 1;
    const standingsWithRank = sorted.map((s, index) => {
      if (index > 0 && s.totalPoints < sorted[index - 1].totalPoints) {
        currentRank = index + 1;
      }
      return {
        rank: currentRank,
        ...s
      };
    });
    renderLeaderboardList(standingsWithRank);
  });

  // Detail Modal Close
  DOM.participantModalClose.addEventListener('click', () => {
    DOM.modalParticipantDetail.classList.add('hidden');
  });

  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === DOM.modalAddScorer) DOM.modalAddScorer.classList.add('hidden');
    if (e.target === DOM.modalParticipantDetail) DOM.modalParticipantDetail.classList.add('hidden');
  });
}

// --- Flag Path Helper ---
function getFlagUrl(teamName) {
  if (!teamName) return 'Assets/Flags/placeholder.png';
  
  let normalized = teamName.toLowerCase().trim();
  normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  normalized = normalized.replace(/\s+/g, '_');
  
  if (normalized === 'usa' || normalized === 'estados_unidos') normalized = 'estados_unidos';
  if (normalized === 'republica_checa') normalized = 'republica_checa';
  
  return `Assets/Flags/${normalized}.png`;
}

// --- Service Worker Registration ---
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Admin Service Worker Registered!', reg.scope))
      .catch(err => console.error('Admin Service Worker failed to register:', err));
  }
}

// --- Toast notification system ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  else if (type === 'error') icon = 'fa-triangle-exclamation';
  else if (type === 'warning') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon} toast-icon"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 4000);
}

// --- Lock Screen Authentication ---
function checkAuthentication() {
  const isAuth = localStorage.getItem('kikes_admin_auth') === 'true';
  const lockScreen = document.getElementById('lock-screen');
  
  if (isAuth) {
    lockScreen.classList.add('hidden');
  } else {
    lockScreen.classList.remove('hidden');
    
    const passwordInput = document.getElementById('input-admin-password');
    const verifyBtn = document.getElementById('btn-login-verify');
    const errorMsg = document.getElementById('txt-login-error');
    
    const handleLogin = () => {
      const password = passwordInput.value.trim();
      if (password === 'guacaguaca') {
        localStorage.setItem('kikes_admin_auth', 'true');
        lockScreen.style.opacity = '0';
        setTimeout(() => {
          lockScreen.classList.add('hidden');
        }, 300);
        showToast('Acceso concedido', 'success');
      } else {
        errorMsg.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
        showToast('Clave incorrecta', 'error');
      }
    };
    
    verifyBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    
    // Focus input
    setTimeout(() => {
      passwordInput.focus();
    }, 150);
  }
}
