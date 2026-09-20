const API_URL = '/api';

let currentTab = 'home';
let metaData = [];
let playersData = [];
let eventsData = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadData();
});

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${tab}-content`).classList.add('active');
    event.target.classList.add('active');
}

// Load data from backend
async function loadData() {
    try {
        const [meta, players, events] = await Promise.all([
            fetch(`${API_URL}/meta`).then(r => r.json()),
            fetch(`${API_URL}/players`).then(r => r.json()),
            fetch(`${API_URL}/events`).then(r => r.json())
        ]);

        metaData = meta;
        playersData = players;
        eventsData = events;

        renderHome();
        renderMeta();
        renderPlayers();
        renderEvents();
    } catch (err) {
        console.error('Error loading data:', err);
        showError('Failed to load data. Check backend connection.');
    }
}

// HOME TAB
function renderHome() {
    const container = document.getElementById('home-content');
    container.innerHTML = `
        <h2>Meta Shifts</h2>
        <div class="grid">
            ${metaData.slice(0, 6).map(shift => `
                <div class="card">
                    <h3>${shift.formation}</h3>
                    <p><strong>Play Rate:</strong> ${shift.playRate}%</p>
                    <p><strong>Win Rate:</strong> ${shift.winRate}%</p>
                    <p><strong>Top Players:</strong> ${shift.topPlayers?.join(', ') || 'N/A'}</p>
                    <span class="badge success">Active</span>
                </div>
            `).join('')}
        </div>
    `;
}

// META TAB
function renderMeta() {
    const container = document.getElementById('meta-content');
    if (!metaData.length) {
        container.innerHTML = '<p class="loading">Loading meta data...</p>';
        return;
    }
    
    container.innerHTML = `
        <h2>Formation Meta</h2>
        <div class="grid">
            ${metaData.map(meta => `
                <div class="card">
                    <h3>${meta.formation}</h3>
                    <p><strong>Play Rate:</strong> <span class="badge">${meta.playRate}%</span></p>
                    <p><strong>Win Rate:</strong> <span class="badge ${meta.winRate > 50 ? 'success' : 'danger'}">${meta.winRate}%</span></p>
                    <p><strong>Avg Rating:</strong> ${meta.avgRating || '8.2'}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// PLAYERS TAB
function renderPlayers() {
    const container = document.getElementById('players-content');
    if (!playersData.length) {
        container.innerHTML = '<p class="loading">Loading players...</p>';
        return;
    }

    container.innerHTML = `
        <h2>Trending Players</h2>
        <div class="input-group">
            <input type="text" id="playerSearch" placeholder="Search player...">
            <select id="positionFilter">
                <option value="">All Positions</option>
                <option value="CB">CB</option>
                <option value="LB">LB</option>
                <option value="RB">RB</option>
                <option value="CM">CM</option>
                <option value="CAM">CAM</option>
                <option value="ST">ST</option>
            </select>
        </div>
        <div class="grid" id="playersGrid">
            ${playersData.map(player => `
                <div class="card">
                    <h3>${player.name}</h3>
                    <p><strong>Position:</strong> ${player.position}</p>
                    <p><strong>Rating:</strong> <span class="badge success">${player.rating}</span></p>
                    <p><strong>Price:</strong> ${player.price}k coins</p>
                    <p><strong>Trend:</strong> ${player.trend === 'up' ? '📈' : '📉'} ${player.trend}</p>
                </div>
            `).join('')}
        </div>
    `;

    // Search filter
    document.getElementById('playerSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = playersData.filter(p => p.name.toLowerCase().includes(query));
        updateGrid('playersGrid', filtered);
    });

    // Position filter
    document.getElementById('positionFilter').addEventListener('change', (e) => {
        const pos = e.target.value;
        const filtered = pos ? playersData.filter(p => p.position === pos) : playersData;
        updateGrid('playersGrid', filtered);
    });
}

// EVENTS TAB
function renderEvents() {
    const container = document.getElementById('events-content');
    if (!eventsData.length) {
        container.innerHTML = '<p class="loading">Loading events...</p>';
        return;
    }

    container.innerHTML = `
        <h2>Active Events</h2>
        <div class="grid">
            ${eventsData.map(event => `
                <div class="card">
                    <h3>${event.name}</h3>
                    <p><strong>Type:</strong> ${event.type}</p>
                    <p><strong>Status:</strong> <span class="badge ${event.status === 'active' ? 'success' : 'warning'}">${event.status}</span></p>
                    <p><strong>Ends In:</strong> ${event.endsIn || 'N/A'}</p>
                    <p><strong>Rewards:</strong> ${event.rewards || 'TBA'}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// SQUAD BUILDER TAB
function renderSquadBuilder() {
    const container = document.getElementById('squad-content');
    container.innerHTML = `
        <h2>Squad Builder</h2>
        <div class="squad-builder">
            <div class="input-group">
                <input type="number" id="budget" placeholder="Enter budget (coins)" min="0">
                <select id="formationSelect">
                    <option value="4-2-3-1">4-2-3-1</option>
                    <option value="4-3-3">4-3-3</option>
                    <option value="5-2-3">5-2-3</option>
                    <option value="3-5-2">3-5-2</option>
                </select>
                <button onclick="buildSquad()">Build Squad</button>
            </div>
            <div id="squad-output"></div>
        </div>
    `;
}

function buildSquad() {
    const budget = document.getElementById('budget').value;
    const formation = document.getElementById('formationSelect').value;
    
    if (!budget) {
        showError('Please enter a budget');
        return;
    }

    fetch(`${API_URL}/squad-builder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: parseInt(budget), formation })
    })
    .then(r => r.json())
    .then(data => {
        const output = document.getElementById('squad-output');
        output.innerHTML = `
            <h3>Recommended Squad (${formation})</h3>
            <div class="grid">
                ${data.squad.map(player => `
                    <div class="card">
                        <h3>${player.name}</h3>
                        <p><strong>${player.position}</strong> | Rating ${player.rating}</p>
                        <p>💰 ${player.price}k</p>
                        <span class="badge">${player.chemistry}</span>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 20px; color: #9ca3af;"><strong>Total Spent:</strong> ${data.totalSpent}k / ${budget}</p>
        `;
    })
    .catch(err => showError('Squad builder error: ' + err.message));
}

// Utility functions
function updateGrid(gridId, data) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    grid.innerHTML = data.map(item => `
        <div class="card">
            <h3>${item.name}</h3>
            <p><strong>Position:</strong> ${item.position}</p>
            <p><strong>Rating:</strong> <span class="badge success">${item.rating}</span></p>
            <p><strong>Price:</strong> ${item.price}k coins</p>
        </div>
    `).join('');
}

function showError(msg) {
    const root = document.getElementById('root');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = msg;
    root.insertBefore(errorDiv, root.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
}
