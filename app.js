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
  inputScriptUrl: document.getElementById('input-script-url'),
  btnSyncSheets: document.getElementById('btn-sync-sheets'),
  btnPullSheets: document.getElementById('btn-pull-sheets'),
  btnSuperSync: document.getElementById('btn-super-sync'),
  btnClearAllScorers: document.getElementById('btn-clear-all-scorers'),

  // Match Tab Elements
  matchSearchInput: document.getElementById('match-search-input'),
  matchStageFilter: document.getElementById('match-stage-filter'),
  matchStatusFilter: document.getElementById('match-status-filter'),
  countPlayed: document.getElementById('count-played'),
  countLive: document.getElementById('count-live'),
  countPrevia: document.getElementById('count-previa'),
  countPending: document.getElementById('count-pending'),
  btnSyncEspn: document.getElementById('btn-sync-espn'),
  btnClearAllMatches: document.getElementById('btn-clear-all-matches'),
  adminMatchesList: document.getElementById('admin-matches-list'),

  // Wildcard Elements
  selectRealWinner: document.getElementById('select-real-winner'),
  selectRealSecond: document.getElementById('select-real-second'),
  selectRealThird: document.getElementById('select-real-third'),
  btnSaveWildcards: document.getElementById('btn-save-wildcards'),

  // Scorer Elements
  btnAddScorerModal: document.getElementById('btn-add-scorer-modal'),
  btnSyncScorersEspn: document.getElementById('btn-sync-scorers-espn'),
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
  
  // Load script URL from localStorage
  const scriptUrl = localStorage.getItem('kikes_admin_script_url') || 'https://script.google.com/macros/s/AKfycbw2C5cDfWGtGR-WJeI_qwD99Vzpl5_V8j-6zJnheMPZkSJ2Ld07q1sTEaiY7M8-UyI/exec';
  if (DOM.inputScriptUrl) {
    DOM.inputScriptUrl.value = scriptUrl;
  }
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

      const isKnockout = match.groupStage && !match.groupStage.startsWith('Grupo');

      if (isKnockout) {
        // ── Fase eliminatoria: solo 2 pts si aciertas el equipo que avanza ──
        // Determinar quién ganó realmente (por resultado normal o penaltis)
        let realAdvancing = null;
        const r1 = match.realGoals1;
        const r2 = match.realGoals2;
        if (r1 > r2) {
          realAdvancing = match.team1;
        } else if (r2 > r1) {
          realAdvancing = match.team2;
        } else {
          // Empate → gana por penaltis
          realAdvancing = (match.penaltiesWinner || '').trim() || null;
        }

        // Determinar quién pronosticó el participante que avanza
        const p1 = pred.predGoals1;
        const p2 = pred.predGoals2;
        let predAdvancing = null;
        if (p1 > p2) {
          predAdvancing = match.team1;
        } else if (p2 > p1) {
          predAdvancing = match.team2;
        } else {
          // Empate pronosticado → usar penaltiesWinner del pronóstico
          predAdvancing = (pred.penaltiesWinner || '').trim() || null;
        }

        if (realAdvancing && predAdvancing &&
            realAdvancing.trim().toLowerCase() === predAdvancing.trim().toLowerCase()) {
          pts = 2;
        }
      } else {
        // ── Fase de grupos: sistema normal 5 / 3 / 2 / 0 ──
        const r1 = match.realGoals1;
        const r2 = match.realGoals2;
        const p1 = pred.predGoals1;
        const p2 = pred.predGoals2;

        const realOutcome = r1 > r2 ? 1 : (r1 < r2 ? 2 : 0);
        const predOutcome = p1 > p2 ? 1 : (p1 < p2 ? 2 : 0);

        const correctExact      = (r1 === p1 && r2 === p2);
        const correctDifference = ((r1 - r2) === (p1 - p2));
        const correctOutcome    = (realOutcome === predOutcome);

        if (correctExact) {
          pts = 5;
        } else if (correctDifference) {
          pts = 3;
        } else if (correctOutcome) {
          pts = 2;
        }
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
// --- Sort matches: EN VIVO → PREVIA → PENDIENTE → TERMINADO ---
function sortMatchesByStatus(matches) {
  const STATUS_ORDER = { 'EN VIVO': 0, 'PREVIA': 1, 'PENDIENTE': 2, 'TERMINADO': 3 };
  return [...matches].sort((a, b) => {
    const statusA = (a.status || 'PREVIA').toUpperCase();
    const statusB = (b.status || 'PREVIA').toUpperCase();
    const orderA = STATUS_ORDER[statusA] !== undefined ? STATUS_ORDER[statusA] : 2;
    const orderB = STATUS_ORDER[statusB] !== undefined ? STATUS_ORDER[statusB] : 2;
    if (orderA !== orderB) return orderA - orderB;
    // Within TERMINADO: most recent first (higher id)
    if (statusA === 'TERMINADO') return b.id - a.id;
    // Within others: chronological order (lower id first)
    return a.id - b.id;
  });
}

function renderMatchesList() {
  DOM.adminMatchesList.innerHTML = '';
  
  const searchVal = DOM.matchSearchInput.value.toLowerCase().trim();
  const stageFilter = DOM.matchStageFilter.value;
  const statusFilter = DOM.matchStatusFilter.value;

  const filtered = STATE.matches.filter(m => {
    // Stage Filter
    if (stageFilter !== 'ALL') {
      if (stageFilter === 'Fase de Grupos') {
        if (!m.groupStage.startsWith('Grupo')) return false;
      } else if (stageFilter === '16avos de Final') {
        if (m.groupStage !== '16avos de Final' && m.groupStage !== 'Dieciseisavos de Final') return false;
      } else {
        if (m.groupStage !== stageFilter) return false;
      }
    }
    
    // Status Filter
    const mStatus = m.status || ( (m.realGoals1 !== null && m.realGoals2 !== null) ? "TERMINADO" : "PREVIA" );
    if (statusFilter !== 'ALL' && mStatus !== statusFilter) return false;
    
    // Search Filter
    if (searchVal) {
      return m.team1.toLowerCase().includes(searchVal) || m.team2.toLowerCase().includes(searchVal) || m.groupStage.toLowerCase().includes(searchVal);
    }
    return true;
  });

  // Apply priority sort: EN VIVO → PREVIA → PENDIENTE → TERMINADO
  const sortedFiltered = sortMatchesByStatus(filtered);

  const playedCount = STATE.matches.filter(m => (m.status || 'PREVIA') === 'TERMINADO').length;
  const liveCount = STATE.matches.filter(m => (m.status || 'PREVIA') === 'EN VIVO').length;
  const previaCount = STATE.matches.filter(m => (m.status || 'PREVIA') === 'PREVIA').length;
  const pendingCount = STATE.matches.filter(m => (m.status || 'PREVIA') === 'PENDIENTE').length;

  if (DOM.countPlayed) DOM.countPlayed.innerText = playedCount;
  if (DOM.countLive) DOM.countLive.innerText = liveCount;
  if (DOM.countPrevia) DOM.countPrevia.innerText = previaCount;
  if (DOM.countPending) DOM.countPending.innerText = pendingCount;

  if (sortedFiltered.length === 0) {
    DOM.adminMatchesList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-magnifying-glass"></i>
        <h3>Sin Partidos</h3>
        <p>No hay partidos que coincidan con la búsqueda.</p>
      </div>
    `;
    return;
  }

  sortedFiltered.forEach(m => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.id = `match-card-${m.id}`;

    const g1Val = m.realGoals1 !== null ? m.realGoals1 : '';
    const g2Val = m.realGoals2 !== null ? m.realGoals2 : '';
    const g1Filled = m.realGoals1 !== null ? 'filled' : '';
    const g2Filled = m.realGoals2 !== null ? 'filled' : '';
    const currentStatus = m.status || ( (m.realGoals1 !== null && m.realGoals2 !== null) ? "TERMINADO" : "PREVIA" );

    // Format date like in client PWA
    let dateStr = '';
    if (m.matchDate) {
      const d = new Date(String(m.matchDate).replace(' ', 'T'));
      if (!isNaN(d.getTime())) {
        const options = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };
        dateStr = d.toLocaleString('es-ES', options);
      } else {
        dateStr = m.matchDate;
      }
    }

    card.innerHTML = `
      <div class="match-card-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span>${m.groupStage}${dateStr ? ` &bull; ${dateStr}` : ''} &bull; Partido #${m.id}</span>
        <select class="status-select" data-match-id="${m.id}" style="background: #0F172A; color: #fff; border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 5px; font-size: 11px; font-weight: bold;">
          <option value="PREVIA" ${currentStatus === 'PREVIA' ? 'selected' : ''}>PREVIA</option>
          <option value="EN VIVO" ${currentStatus === 'EN VIVO' ? 'selected' : ''}>EN VIVO</option>
          <option value="TERMINADO" ${currentStatus === 'TERMINADO' ? 'selected' : ''}>TERMINADO</option>
          <option value="PENDIENTE" ${currentStatus === 'PENDIENTE' ? 'selected' : ''}>PENDIENTE</option>
        </select>
      </div>
      <div class="match-card-teams">
        <div class="team-info team-local-info">
          <span class="match-team" contenteditable="true" data-match-id="${m.id}" data-type="team1" style="border-bottom: 1px dashed rgba(255,255,255,0.3); min-width: 50px; display: inline-block; cursor: text; text-align: right; padding: 1px 3px;">${m.team1}</span>
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
          <span class="match-team" contenteditable="true" data-match-id="${m.id}" data-type="team2" style="border-bottom: 1px dashed rgba(255,255,255,0.3); min-width: 50px; display: inline-block; cursor: text; text-align: left; padding: 1px 3px;">${m.team2}</span>
        </div>
      </div>
      <button class="match-toggle-btn" data-match-id="${m.id}" style="margin-top: 10px; width: 100%;">
        <i class="fa-solid fa-chevron-down"></i> Ver Pronósticos
      </button>
      <div class="top10-predictions-panel" id="panel-predictions-${m.id}">
        <table class="predictions-table">
          <thead>
            <tr>
              <th>Pos</th>
              <th>Nombre</th>
              <th>Pronóstico</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody id="predictions-body-${m.id}">
            <tr>
              <td colspan="4" style="text-align: center; padding: 15px; color: var(--text-secondary);">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Cargando pronósticos...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
    DOM.adminMatchesList.appendChild(card);
  });

  // Bind input listeners
  const scoreInputs = DOM.adminMatchesList.querySelectorAll('.score-input');
  scoreInputs.forEach(input => {
    input.addEventListener('input', (e) => {
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
          
          // Auto set status to TERMINADO or EN VIVO if currently PREVIA
          const currentStatus = match.status || "PREVIA";
          if (currentStatus === 'PREVIA') {
            match.status = 'TERMINADO';
            const selectEl = DOM.adminMatchesList.querySelector(`#match-card-${matchId} .status-select`);
            if (selectEl) selectEl.value = 'TERMINADO';
          }
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

      // Update predictions panel if expanded
      const panel = document.getElementById(`panel-predictions-${matchId}`);
      if (panel && panel.classList.contains('show')) {
        loadMatchPredictions(matchId);
      }
    });
  });

  // Bind status select listeners
  const statusSelects = DOM.adminMatchesList.querySelectorAll('.status-select');
  statusSelects.forEach(select => {
    select.addEventListener('change', (e) => {
      const matchId = parseInt(e.target.dataset.matchId);
      const match = STATE.matches.find(m => m.id === matchId);
      if (!match) return;

      match.status = e.target.value;
      if (match.status === 'PREVIA' || match.status === 'PENDIENTE') {
        match.realGoals1 = null;
        match.realGoals2 = null;
        // Re-render to clear input text boxes
        renderMatchesList();
      }

      recalculateAllPoints();
      saveState();
      updateStandingsLiveOnly();
      updateStats();

      // Update predictions panel if expanded
      const panel = document.getElementById(`panel-predictions-${matchId}`);
      if (panel && panel.classList.contains('show')) {
        loadMatchPredictions(matchId);
      }
    });
  });

  // Bind expand/collapse handlers for predictions
  const toggles = DOM.adminMatchesList.querySelectorAll('.match-toggle-btn');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = parseInt(btn.getAttribute('data-match-id'));
      const panel = document.getElementById(`panel-predictions-${matchId}`);
      const isExpanded = panel.classList.contains('show');
      
      if (isExpanded) {
        panel.classList.remove('show');
        btn.classList.remove('expanded');
        btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Ver Pronósticos`;
      } else {
        panel.classList.add('show');
        btn.classList.add('expanded');
        btn.innerHTML = `<i class="fa-solid fa-chevron-up"></i> Ocultar Pronósticos`;
        
        loadMatchPredictions(matchId);
      }
    });
  });

  // Bind editable team name listeners
  const editableTeams = DOM.adminMatchesList.querySelectorAll('.match-team[contenteditable="true"]');
  editableTeams.forEach(span => {
    span.addEventListener('blur', (e) => {
      const matchId = parseInt(e.target.dataset.matchId);
      const type = e.target.dataset.type;
      const match = STATE.matches.find(m => m.id === matchId);
      if (!match) return;

      const newName = e.target.innerText.trim();
      if (newName === '') {
        e.target.innerText = type === 'team1' ? match.team1 : match.team2;
        return;
      }

      if (type === 'team1') {
        if (match.team1 !== newName) {
          match.team1 = newName;
          const flagImg = e.target.nextElementSibling;
          if (flagImg && flagImg.classList.contains('match-flag')) {
            flagImg.src = getFlagUrl(newName);
          }
          saveAndRefreshTeams();
        }
      } else {
        if (match.team2 !== newName) {
          match.team2 = newName;
          const flagImg = e.target.previousElementSibling;
          if (flagImg && flagImg.classList.contains('match-flag')) {
            flagImg.src = getFlagUrl(newName);
          }
          saveAndRefreshTeams();
        }
      }
    });

    span.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });
  });

  function saveAndRefreshTeams() {
    extractTeamsList();
    populateDropdowns();
    recalculateAllPoints();
    saveState();
  }
}

function loadMatchPredictions(matchId) {
  const tbody = document.getElementById(`predictions-body-${matchId}`);
  if (!tbody) return;

  // Filter predictions for this match
  const filteredPreds = STATE.predictions.filter(pr => pr.matchId === matchId);
  
  // Sort descending by points, then name ascending
  filteredPreds.sort((a, b) => b.points - a.points || a.participantName.localeCompare(b.participantName));

  if (filteredPreds.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 12px; color: var(--text-secondary);">
          No hay pronósticos registrados para este partido.
        </td>
      </tr>
    `;
    return;
  }

  let currentRank = 1;
  const rowsHtml = filteredPreds.map((p, idx) => {
    if (idx > 0 && p.points < filteredPreds[idx - 1].points) {
      currentRank = idx + 1;
    }
    
    let badgeClass = 'zero';
    if (p.points === 5) badgeClass = 'exact';
    else if (p.points === 3) badgeClass = 'diff';
    else if (p.points === 2) badgeClass = 'outcome';
    
    const predText = (p.predGoals1 !== null && p.predGoals2 !== null) ? `${p.predGoals1} - ${p.predGoals2}` : "-";
    
    return `
      <tr>
        <td class="pred-cell-rank">${currentRank}°</td>
        <td class="pred-cell-name">${p.participantName}</td>
        <td class="pred-cell-val">${predText}</td>
        <td class="pred-cell-pts">
          <span class="pred-pts-badge ${badgeClass}">${p.points} pts</span>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = rowsHtml;
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
          <div style="display: flex; align-items: center; gap: 5px; margin-top: 4px;">
            <span class="scorer-synonyms" style="flex-grow:1;">Sinónimos: ${p.synonyms || ''}</span>
            <button class="btn btn-secondary btn-sm btn-edit-synonyms" data-player-id="${p.name}" style="padding: 2px 6px; font-size: 10px;" title="Editar Sinónimos"><i class="fa-solid fa-pencil"></i></button>
          </div>
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

  // Edit synonyms listener
  DOM.adminScorersTbody.querySelectorAll('.btn-edit-synonyms').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pName = e.currentTarget.dataset.playerId;
      const player = STATE.players.find(p => p.name === pName);
      if (player) {
        const newSynonyms = prompt(`Editar sinónimos para ${pName} (separados por ;):`, player.synonyms || '');
        if (newSynonyms !== null) {
          player.synonyms = newSynonyms.trim();
          recalculateAllPoints();
          saveState();
          renderScorersList();
          renderStandings();
          showToast('Sinónimos actualizados', 'success');
        }
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

  DOM.detailWcScorer.innerHTML = `
    ${p.predictedScorer || '-'}
    <button class="btn btn-sm btn-secondary btn-edit-participant-scorer" data-participant="${p.name}" style="margin-left: 10px; padding: 2px 6px; font-size: 10px; border-radius: 4px;" title="Editar Goleador"><i class="fa-solid fa-pencil"></i></button>
  `;
  DOM.detailWcScorerPts.innerText = `${p.scorerPoints} pts`;

  // Bind Edit Scorer Listener
  setTimeout(() => {
    const btnEditScorer = document.querySelector('.btn-edit-participant-scorer');
    if (btnEditScorer) {
      btnEditScorer.addEventListener('click', (e) => {
        const partName = e.currentTarget.dataset.participant;
        const part = STATE.positions.find(x => x.name === partName);
        if (part) {
          const newScorer = prompt(`Editar goleador predicho para ${partName}:`, part.predictedScorer || '');
          if (newScorer !== null) {
            part.predictedScorer = newScorer.trim();
            recalculateAllPoints();
            saveState();
            openParticipantDetail(partName);
            renderStandings();
            updateStats();
            showToast('Goleador actualizado', 'success');
          }
        }
      });
    }
  }, 10);

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
    "Goles Visitante": m.realGoals2 !== null && m.realGoals2 !== undefined ? m.realGoals2 : "",
    "Estado": m.status || ( (m.realGoals1 !== null && m.realGoals2 !== null) ? "TERMINADO" : "PREVIA" ),
    "Ganador Penaltis": m.penaltiesWinner || "",
    "Fecha": m.matchDate || ""
  }));

  // C. Build Pronosticos sheet
  const predRows = STATE.predictions.map(pr => ({
    "Nombre Participante": pr.participantName,
    "ID Partido": pr.matchId,
    "Pred Local": pr.predGoals1 !== null && pr.predGoals1 !== undefined ? pr.predGoals1 : "",
    "Pred Visitante": pr.predGoals2 !== null && pr.predGoals2 !== undefined ? pr.predGoals2 : "",
    "Puntos": pr.points,
    "Ganador Penaltis": pr.penaltiesWinner || ""
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
    
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const HH = String(now.getHours()).padStart(2, '0');
    const MM = String(now.getMinutes()).padStart(2, '0');
    const SS = String(now.getSeconds()).padStart(2, '0');
    a.download = `KikesMundial_Posiciones_${dd}-${mm}-${yyyy}_${HH}-${MM}-${SS}.xlsm`;

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
        realGoals2: r['Goles Visitante'] === "" || r['Goles Visitante'] === undefined ? null : parseInt(r['Goles Visitante']),
        status: String(r['Estado'] || ( (r['Goles Local'] !== "" && r['Goles Local'] !== undefined && r['Goles Visitante'] !== "" && r['Goles Visitante'] !== undefined) ? 'TERMINADO' : 'PREVIA' )).trim().toUpperCase(),
        penaltiesWinner: String(r['Ganador Penaltis'] || '').trim() || null,
        matchDate: String(r['Fecha'] || '').trim() || null
      })).filter(m => m.id > 0);

      // Parse Pronosticos
      const sheetPred = workbook.Sheets['Pronosticos'];
      const rowsPred = XLSX.utils.sheet_to_json(sheetPred, { defval: "" });
      const predictions = rowsPred.map(r => ({
        participantName: String(r['Nombre Participante'] || '').trim(),
        matchId: parseInt(r['ID Partido'] || 0),
        predGoals1: r['Pred Local'] === "" || r['Pred Local'] === undefined ? null : parseInt(r['Pred Local']),
        predGoals2: r['Pred Visitante'] === "" || r['Pred Visitante'] === undefined ? null : parseInt(r['Pred Visitante']),
        points: parseInt(r['Puntos'] || 0),
        penaltiesWinner: String(r['Ganador Penaltis'] || '').trim() || null
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

          const penaltyCell = ws[`G${row}`];
          const penaltiesWinner = penaltyCell && penaltyCell.v !== undefined && String(penaltyCell.v).trim() !== ''
            ? String(penaltyCell.v).trim() : null;

          predictionsList.push({
            matchId,
            predGoals1,
            predGoals2,
            penaltiesWinner
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

  if (DOM.inputScriptUrl) {
    DOM.inputScriptUrl.addEventListener('input', (e) => {
      localStorage.setItem('kikes_admin_script_url', e.target.value.trim());
    });
  }

  if (DOM.btnSyncSheets) {
    DOM.btnSyncSheets.addEventListener('click', syncToGoogleSheets);
  }
  
  if (DOM.btnPullSheets) {
    DOM.btnPullSheets.addEventListener('click', importFromGoogleSheets);
  }
  
  if (DOM.btnSuperSync) {
    DOM.btnSuperSync.addEventListener('click', superSync);
  }
  DOM.btnClearAllScorers.addEventListener('click', () => {
    if (STATE.players.length === 0) {
      showToast('No hay goleadores registrados para eliminar.', 'info');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas ELIMINAR TODOS los ${STATE.players.length} goleadores registrados?\nEsta acción afectará los puntos de goleador de todos los participantes.`)) {
      STATE.players = [];
      recalculateAllPoints();
      saveState();
      renderUI();
      updateStats();
      showToast('Todos los goleadores han sido eliminados.', 'warning');
    }
  });

  // 3. Match Tab Filter Listeners
  DOM.matchSearchInput.addEventListener('input', renderMatchesList);
  DOM.matchStageFilter.addEventListener('change', renderMatchesList);
  DOM.matchStatusFilter.addEventListener('change', renderMatchesList);
  
  DOM.btnSyncEspn.addEventListener('click', syncFromEspn);

  DOM.btnClearAllMatches.addEventListener('click', () => {
    if (confirm('¿Realmente deseas borrar todos los marcadores reales de los partidos? Los pronósticos volverán a valer 0 puntos.')) {
      STATE.matches.forEach(m => {
        m.realGoals1 = null;
        m.realGoals2 = null;
        m.status = "PREVIA";
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

  DOM.btnSyncScorersEspn.addEventListener('click', syncScorersFromEspn);

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

// --- ESPN API Synchronization for Admin PWA ---
// Using Unicode escapes to avoid file encoding issues with special characters
const TEAM_MAPPINGS = {
  // English -> Spanish mappings
  "Mexico":                  "M\u00e9xico",
  "South Africa":            "Sud\u00e1frica",
  "Korea Republic":          "Corea del Sur",
  "South Korea":             "Corea del Sur",
  "North Korea":             "Corea del Norte",
  "Czech Republic":          "Rep\u00fablica Checa",
  "Czechia":                 "Rep\u00fablica Checa",
  "Canada":                  "Canad\u00e1",
  "Bosnia & Herzegovina":    "Bosnia y Herzegovina",
  "Bosnia and Herzegovina":  "Bosnia y Herzegovina",
  "Bosnia-Herzegovina":      "Bosnia y Herzegovina",
  "Bosnia & Herz":           "Bosnia y Herzegovina",
  "Bosnia-Herz":             "Bosnia y Herzegovina",
  "Qatar":                   "Catar",
  "Switzerland":             "Suiza",
  "Brazil":                  "Brasil",
  "Morocco":                 "Marruecos",
  "Haiti":                   "Hait\u00ed",
  "Scotland":                "Escocia",
  "United States":           "Estados Unidos",
  "USA":                     "Estados Unidos",
  "US":                      "Estados Unidos",
  "Turkey":                  "Turqu\u00eda",
  "T\u00fcrkiye":            "Turqu\u00eda",
  "Turkiye":                 "Turqu\u00eda",
  "Iraq":                    "Irak",
  "Germany":                 "Alemania",
  "Cura\u00e7ao":            "Curazao",
  "Curacao":                 "Curazao",
  "Ivory Coast":             "Costa de Marfil",
  "C\u00f4te d'Ivoire":      "Costa de Marfil",
  "Netherlands":             "Pa\u00edses Bajos",
  "Holland":                 "Pa\u00edses Bajos",
  "Japan":                   "Jap\u00f3n",
  "Sweden":                  "Suecia",
  "Tunisia":                 "T\u00fanez",
  "Belgium":                 "B\u00e9lgica",
  "Egypt":                   "Egipto",
  "Iran":                    "Ir\u00e1n",
  "New Zealand":             "Nueva Zelanda",
  "Spain":                   "Espa\u00f1a",
  "Cape Verde":              "Cabo Verde",
  "Saudi Arabia":            "Arabia Saudita",
  "France":                  "Francia",
  "Norway":                  "Noruega",
  "Algeria":                 "Argelia",
  "Jordan":                  "Jordania",
  "DR Congo":                "RD Congo",
  "Congo DR":                "RD Congo",
  "Democratic Republic of Congo": "RD Congo",
  "Uzbekistan":              "Uzbekist\u00e1n",
  "England":                 "Inglaterra",
  "Croatia":                 "Croacia",
  "Panama":                  "Panam\u00e1",
  "Peru":                    "Per\u00fa",
  "Ecuador":                 "Ecuador",
  "Venezuela":               "Venezuela",
  "Chile":                   "Chile",
  "Bolivia":                 "Bolivia",
  "Paraguay":                "Paraguay",
  "Costa Rica":              "Costa Rica",
  "Honduras":                "Honduras",
  "Jamaica":                 "Jamaica",
  "Trinidad and Tobago":     "Trinidad y Tobago",
  "Guatemala":               "Guatemala",
  "El Salvador":             "El Salvador",
  "Senegal":                 "Senegal",
  "Nigeria":                 "Nigeria",
  "Ghana":                   "Ghana",
  "Cameroon":                "Camer\u00fan",
  "Cameroun":                "Camer\u00fan",
  "Mali":                    "Mali",
  "Benin":                   "Ben\u00edn",
  "Tanzania":                "Tanzania",
  "Kenya":                   "Kenia",
  "Angola":                  "Angola",
  "Comoros":                 "Comoras",
  "Mozambique":              "Mozambique",
  "Uganda":                  "Uganda",
  "South Sudan":             "Sud\u00e1n del Sur",
  "Sudan":                   "Sud\u00e1n",
  "Mauritania":              "Mauritania",
  "Guinea":                  "Guinea",
  "Equatorial Guinea":       "Guinea Ecuatorial",
  "Guinea-Bissau":           "Guinea-Bis\u00e1u",
  "Central African Republic": "Rep\u00fablica Centroafricana",
  "Zambia":                  "Zambia",
  "Zimbabwe":                "Zimbabue",
  "Namibia":                 "Namibia",
  "Botswana":                "Botsuana",
  "Rwanda":                  "Ruanda",
  "Australia":               "Australia",
  "Indonesia":               "Indonesia",
  "Philippines":             "Filipinas",
  "Thailand":                "Tailandia",
  "Vietnam":                 "Vietnam",
  "China":                   "China",
  "China PR":                "China",
  "India":                   "India",
  "Pakistan":                "Pakist\u00e1n",
  "Afghanistan":             "Afganist\u00e1n",
  "Bahrain":                 "Bar\u00e9in",
  "Kuwait":                  "Kuwait",
  "Oman":                    "Om\u00e1n",
  "Lebanon":                 "L\u00edbano",
  "Syria":                   "Siria",
  "Yemen":                   "Yemen",
  "Palestine":               "Palestina",
  "Israel":                  "Israel",
  "Russia":                  "Rusia",
  "Ukraine":                 "Ucrania",
  "Poland":                  "Polonia",
  "Romania":                 "Rumania",
  "Hungary":                 "Hungr\u00eda",
  "Greece":                  "Grecia",
  "Serbia":                  "Serbia",
  "Slovakia":                "Eslovaquia",
  "Slovenia":                "Eslovenia",
  "Denmark":                 "Dinamarca",
  "Finland":                 "Finlandia",
  "Iceland":                 "Islandia",
  "Wales":                   "Gales",
  "Ireland":                 "Irlanda",
  "Northern Ireland":        "Irlanda del Norte",
  "Austria":                 "Austria",
  "Switzerland":             "Suiza",
  "Portugal":                "Portugal",
  "Albania":                 "Albania",
  "Kosovo":                  "Kosovo",
  "Montenegro":              "Montenegro",
  "North Macedonia":         "Macedonia del Norte",
  "Moldova":                 "Moldavia",
  "Belarus":                 "Bielorrusia",
  "Georgia":                 "Georgia",
  "Armenia":                 "Armenia",
  "Azerbaijan":              "Azerbaiy\u00e1n",
  "Kazakhstan":              "Kazajist\u00e1n",
  "Kyrgyzstan":              "Kirguist\u00e1n",
  "Tajikistan":              "Tayikist\u00e1n",
  "Turkmenistan":            "Turkmenist\u00e1n",
  "Mongolia":                "Mongolia",
  "New Caledonia":           "Nueva Caledonia",
  "Fiji":                    "Fiyi"
};

function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Maps an ESPN team name to the Spanish name stored in the DB.
 * Tries multiple name variants from the ESPN API response.
 * @param {string[]} apiNameCandidates - Array of possible names from ESPN (name, displayName, shortDisplayName)
 * @param {string[]} dbTeams - List of team names from STATE.matches
 * @returns {string} The matched Spanish team name, or the first candidate as fallback
 */
function mapTeamName(apiNameCandidates, dbTeams) {
  // Accept both old string call and new array call for backwards compatibility
  const candidates = Array.isArray(apiNameCandidates) ? apiNameCandidates : [apiNameCandidates];

  for (const rawName of candidates) {
    if (!rawName) continue;
    const cleanedApi = rawName.trim();

    // 1. Direct mapping lookup
    if (TEAM_MAPPINGS[cleanedApi]) {
      return TEAM_MAPPINGS[cleanedApi];
    }

    // 2. Case-insensitive direct mapping lookup
    const lowerCleaned = cleanedApi.toLowerCase();
    for (const [key, val] of Object.entries(TEAM_MAPPINGS)) {
      if (key.toLowerCase() === lowerCleaned) return val;
    }

    // 3. Normalized (no accents) match against DB teams
    const apiNorm = removeAccents(cleanedApi).toLowerCase();
    for (const dbTeam of dbTeams) {
      const dbNorm = removeAccents(dbTeam).toLowerCase();
      if (apiNorm === dbNorm) return dbTeam;
    }

    // 4. Normalized match against mapping keys
    for (const [key, val] of Object.entries(TEAM_MAPPINGS)) {
      if (removeAccents(key).toLowerCase() === apiNorm) return val;
    }
  }

  // Fallback: return the first non-empty candidate
  return candidates.find(c => c && c.trim()) || "";
}

async function syncFromEspn() {
  if (STATE.matches.length === 0) {
    showToast('No hay partidos cargados para sincronizar. Importa la base de datos primero.', 'warning');
    return;
  }
  
  const btn = DOM.btnSyncEspn;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
  
  showToast('Sincronizando partidos con ESPN...', 'info');
  
  try {
    const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=500");
    if (!response.ok) throw new Error("Error al consultar la API de ESPN (Scoreboard)");
    
    const data = await response.json();
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error("Formato de respuesta de ESPN inválido");
    }

    let updatedCount = 0;
    extractTeamsList(); // Populate TEAMS_LIST
    
    data.events.forEach(ev => {
      if (ev.competitions && ev.competitions.length > 0) {
        const comp = ev.competitions[0];
        
        let completed = false;
        let apiState = "pre";
        if (comp.status) {
          if (comp.status.type) {
            completed = !!comp.status.type.completed;
            apiState = (comp.status.type.state || "pre").toLowerCase();
          }
        }
        
        let matchStatus = "PREVIA";
        if (completed || apiState === "post") {
          matchStatus = "TERMINADO";
        } else if (apiState === "in") {
          matchStatus = "EN VIVO";
        } else {
          if (ev.date) {
            const matchDate = new Date(ev.date);
            const today = new Date();
            const isToday = matchDate.getFullYear() === today.getFullYear() &&
                            matchDate.getMonth() === today.getMonth() &&
                            matchDate.getDate() === today.getDate();
            if (!isToday) {
              matchStatus = "PENDIENTE";
            }
          }
        }
        
        if (comp.competitors && comp.competitors.length === 2) {
          const comp1 = comp.competitors[0];
          const comp2 = comp.competitors[1];
          
          // Collect all available name fields from ESPN to maximize matching chances
          const team1Candidates = comp1.team ? [
            comp1.team.displayName,
            comp1.team.name,
            comp1.team.shortDisplayName,
            comp1.team.abbreviation
          ].filter(Boolean) : [];
          const team2Candidates = comp2.team ? [
            comp2.team.displayName,
            comp2.team.name,
            comp2.team.shortDisplayName,
            comp2.team.abbreviation
          ].filter(Boolean) : [];
          
          const team1Mapped = mapTeamName(team1Candidates, TEAMS_LIST);
          const team2Mapped = mapTeamName(team2Candidates, TEAMS_LIST);
          
          let score1 = null;
          let score2 = null;
          if (comp1.score !== undefined && comp1.score !== "") {
            const val = parseInt(comp1.score);
            if (!isNaN(val)) score1 = val;
          }
          if (comp2.score !== undefined && comp2.score !== "") {
            const val = parseInt(comp2.score);
            if (!isNaN(val)) score2 = val;
          }
          
          // Find matching match in our STATE.matches
          const matchedMatch = STATE.matches.find(m => {
            return (m.team1.toLowerCase() === team1Mapped.toLowerCase() && m.team2.toLowerCase() === team2Mapped.toLowerCase()) ||
                   (m.team1.toLowerCase() === team2Mapped.toLowerCase() && m.team2.toLowerCase() === team1Mapped.toLowerCase());
          });
          
          if (matchedMatch) {
            const goals1 = matchedMatch.team1.toLowerCase() === team1Mapped.toLowerCase() ? score1 : score2;
            const goals2 = matchedMatch.team1.toLowerCase() === team1Mapped.toLowerCase() ? score2 : score1;
            
            let finalGoals1 = null;
            let finalGoals2 = null;
            if (matchStatus === "EN VIVO" || matchStatus === "TERMINADO") {
              finalGoals1 = goals1;
              finalGoals2 = goals2;
            }

            // Format and update matchDate from ev.date if it exists
            let formattedDate = matchedMatch.matchDate || null;
            if (ev.date) {
              const d = new Date(ev.date);
              const colDate = new Date(d.getTime() - (5 * 60 * 60 * 1000));
              const yyyy = colDate.getUTCFullYear();
              const mm = String(colDate.getUTCMonth() + 1).padStart(2, '0');
              const dd = String(colDate.getUTCDate()).padStart(2, '0');
              const hh = String(colDate.getUTCHours()).padStart(2, '0');
              const min = String(colDate.getUTCMinutes()).padStart(2, '0');
              const ss = String(colDate.getUTCSeconds()).padStart(2, '0');
              formattedDate = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
            }

            // If goals, status or date changed, update it
            if (matchedMatch.realGoals1 !== finalGoals1 || 
                matchedMatch.realGoals2 !== finalGoals2 || 
                matchedMatch.status !== matchStatus || 
                matchedMatch.matchDate !== formattedDate) {
              matchedMatch.realGoals1 = finalGoals1;
              matchedMatch.realGoals2 = finalGoals2;
              matchedMatch.status = matchStatus;
              matchedMatch.matchDate = formattedDate;
              updatedCount++;
            }
          }
        }
      }
    });
    
    if (updatedCount > 0) {
      recalculateAllPoints();
      saveState();
      renderUI();
      updateStats();
      showToast(`¡Sincronización completada! Se actualizaron ${updatedCount} partidos.`, 'success');
    } else {
      showToast('Sincronización finalizada. No se encontraron cambios.', 'info');
    }
  } catch (err) {
    console.error(err);
    showToast(`Error de sincronización: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function syncScorersFromEspn() {
  const btn = DOM.btnSyncScorersEspn;
  if (!btn) return;
  
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';
  
  showToast('Sincronizando goleadores con ESPN...', 'info');
  
  try {
    const response = await fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics");
    if (!response.ok) throw new Error("Error al consultar la API de estadísticas de ESPN");
    
    const data = await response.json();
    if (!data.stats || !Array.isArray(data.stats)) {
      throw new Error("Formato de respuesta de estadísticas inválido");
    }

    let updatedCount = 0;
    let addedCount = 0;
    extractTeamsList(); // Populate TEAMS_LIST
    
    const goalsLeaders = data.stats.find(s => s.name === "goalsLeaders");
    if (goalsLeaders && goalsLeaders.leaders && Array.isArray(goalsLeaders.leaders)) {
      goalsLeaders.leaders.forEach(leader => {
        const goals = parseInt(leader.value || 0);
        if (leader.athlete) {
          const playerName = (leader.athlete.displayName || "").trim();
          let teamNameApi = "";
          if (leader.athlete.team) {
            teamNameApi = (leader.athlete.team.displayName || "").trim();
          }
          
          const teamMapped = mapTeamName(teamNameApi, TEAMS_LIST);
          
          if (playerName && teamMapped && TEAMS_LIST.includes(teamMapped)) {
            // Find existing player
            const existingPlayer = STATE.players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
            if (existingPlayer) {
              if (existingPlayer.goals !== goals || existingPlayer.team !== teamMapped) {
                existingPlayer.goals = goals;
                existingPlayer.team = teamMapped;
                updatedCount++;
              }
            } else {
              STATE.players.push({
                name: playerName,
                team: teamMapped,
                goals: goals,
                synonyms: ""
              });
              addedCount++;
            }
          }
        }
      });
    }
    
    if (updatedCount > 0 || addedCount > 0) {
      recalculateAllPoints();
      saveState();
      renderUI();
      updateStats();
      showToast(`¡Goleadores sincronizados! Agregados: ${addedCount}, Actualizados: ${updatedCount}.`, 'success');
    } else {
      showToast('Sincronización de goleadores finalizada. No se encontraron cambios.', 'info');
    }
  } catch (err) {
    console.error(err);
    showToast(`Error al sincronizar goleadores: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function syncToGoogleSheets() {
  const url = localStorage.getItem('kikes_admin_script_url') || 'https://script.google.com/macros/s/AKfycbw2C5cDfWGtGR-WJeI_qwD99Vzpl5_V8j-6zJnheMPZkSJ2Ld07q1sTEaiY7M8-UyI/exec';
  if (!url) {
    showToast('Por favor, ingresa primero la URL del Web App de Google Apps Script.', 'warning');
    return;
  }

  const btn = DOM.btnSyncSheets;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...';

  showToast('Iniciando sincronización con Google Sheets...', 'info');

  try {
    const payload = {
      positions: STATE.positions.map(p => ({
        name: p.name,
        matchPoints: p.matchPoints,
        wildcardPoints: p.wildcardPoints,
        totalPoints: p.totalPoints,
        predictedWinner: p.predictedWinner || "",
        winnerPoints: p.winnerPoints,
        predictedSecond: p.predictedSecond || "",
        secondPoints: p.secondPoints,
        predictedThird: p.predictedThird || "",
        thirdPoints: p.thirdPoints,
        predictedScorer: p.predictedScorer || "",
        scorerPoints: p.scorerPoints
      })),
      // Solo sincronizar hasta partido 73 (16avos en adelante se sincronizan después)
      matches: STATE.matches
        .filter(m => m.id <= 73)
        .map(m => ({
          id: m.id,
          groupStage: m.groupStage,
          team1: m.team1,
          realGoals1: m.realGoals1,
          team2: m.team2,
          realGoals2: m.realGoals2,
          status: m.status || ( (m.realGoals1 !== null && m.realGoals2 !== null) ? "TERMINADO" : "PREVIA" ),
          penaltiesWinner: m.penaltiesWinner || "",
          matchDate: m.matchDate || ""
        })),
      predictions: STATE.predictions
        .filter(pr => pr.matchId <= 73)
        .map(pr => ({
          participantName: pr.participantName,
          matchId: pr.matchId,
          predGoals1: pr.predGoals1,
          predGoals2: pr.predGoals2,
          points: pr.points,
          penaltiesWinner: pr.penaltiesWinner || ""
        }))
    };

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error("Respuesta de servidor inválida: " + response.status);

    const result = await response.json();
    if (result.status === 'success') {
      showToast('¡Base de datos sincronizada con éxito en Google Sheets!', 'success');
    } else {
      throw new Error(result.message || 'Error desconocido');
    }
  } catch (err) {
    console.error(err);
    showToast(`Error al sincronizar con Google Sheets: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function superSync() {
  const btn = DOM.btnSuperSync;
  if (!btn) return;
  
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Súper Sincronizando...';
  
  try {
    // 1. Sync Matches from ESPN
    showToast('Paso 1/2: Sincronizando partidos...', 'info');
    await syncFromEspn();
    
    // 2. Sync to Google Sheets
    showToast('Paso 2/2: Publicando en Google Sheets...', 'info');
    await syncToGoogleSheets();
    
    showToast('¡SÚPER SINCRONIZACIÓN COMPLETADA!', 'success');
  } catch (err) {
    console.error('Super Sync Error:', err);
    showToast(`Error en la súper sincronización: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

async function importFromGoogleSheets() {
  const url = localStorage.getItem('kikes_admin_script_url') || 'https://script.google.com/macros/s/AKfycbw2C5cDfWGtGR-WJeI_qwD99Vzpl5_V8j-6zJnheMPZkSJ2Ld07q1sTEaiY7M8-UyI/exec';
  if (!url) {
    showToast('Por favor, ingresa primero la URL del Web App de Google Apps Script.', 'warning');
    return;
  }

  if (!confirm('¿Estás seguro de querer IMPORTAR los datos desde Google Sheets? Esto sobrescribirá todos los datos locales actuales (participantes, partidos y pronósticos).')) {
    return;
  }

  const btn = DOM.btnPullSheets;
  if (!btn) return;
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';

  showToast('Descargando base de datos desde Google Sheets...', 'info');

  try {
    const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors'
    });

    if (!response.ok) throw new Error("Respuesta de servidor inválida: " + response.status);

    const result = await response.json();
    if (result.status === 'success' || result.positions) {
      STATE.positions = result.positions || [];
      STATE.matches = result.matches || [];
      STATE.predictions = result.predictions || [];
      
      extractTeamsList();
      populateDropdowns();
      recalculateAllPoints();
      saveState();

      renderUI();
      updateStats();
      showToast('¡Base de datos importada con éxito desde Google Sheets!', 'success');
    } else {
      throw new Error(result.message || 'El script de Google no retornó el formato de base de datos esperado.');
    }
  } catch (err) {
    console.error(err);
    showToast(`Error al importar desde Google Sheets: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}
