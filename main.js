// ==========================================
// WNX TOURNAMENT V2 - MAIN JAVASCRIPT
// ==========================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyABFIShwH3zpJTsDeP9cNQZsLyZqUh2u5M",
    authDomain: "wnx-league.firebaseapp.com",
    databaseURL: "https://wnx-league-default-rtdb.firebaseio.com",
    projectId: "wnx-league",
    storageBucket: "wnx-league.firebasestorage.app",
    messagingSenderId: "109721983514",
    appId: "1:109721983514:web:e96369e2fa36fb8a1510ab",
    measurementId: "G-5FK4YY0MP0"
};

// Initialize Firebase
let app;
let database;
let isFirebaseConnected = false;

try {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    isFirebaseConnected = true;
    console.log('Firebase initialized successfully');
    updateConnectionStatus(true);
} catch (error) {
    console.error('Firebase initialization error:', error);
    updateConnectionStatus(false);
}

// Update connection status
function updateConnectionStatus(connected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (statusDot && statusText) {
        if (connected) {
            statusDot.classList.remove('disconnected');
            statusText.textContent = 'Connected';
        } else {
            statusDot.classList.add('disconnected');
            statusText.textContent = 'Disconnected';
        }
    }
}

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let currentPlayer = null;
let isAdmin = false;
let allPlayers = [];
let allFixtures = [];
let groups = { A: [], B: [], C: [], D: [] };

const universities = [
    "Makerere University Kampala",
    "Uganda Christian University",
    "Kyambogo University",
    "Kampala International University",
    "Makerere Business University",
    "International University of East Africa",
    "Kabale University",
    "Muni University",
    "Bugema University",
    "Nakawa Technical School",
    "IUIU",
    "Gulu University",
    "Busitema University",
    "Nkumba University",
    "ISBAT University",
    "AGAKAN Foundation",
];

// ==========================================
// FIREBASE DATABASE FUNCTIONS
// ==========================================

async function savePlayer(player) {
    if (!isFirebaseConnected) {
        alert('Firebase not connected. Please refresh the page.');
        return false;
    }
    
    try {
        await database.ref('players/' + player.id).set(player);
        console.log('Player saved:', player.displayName);
        return true;
    } catch (error) {
        console.error('Error saving player:', error);
        return false;
    }
}

async function getPlayer(playerId) {
    if (!isFirebaseConnected) return null;
    
    try {
        const snapshot = await database.ref('players/' + playerId).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error getting player:', error);
        return null;
    }
}

async function getAllPlayers() {
    if (!isFirebaseConnected) return [];
    
    try {
        const snapshot = await database.ref('players').once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data);
    } catch (error) {
        console.error('Error getting all players:', error);
        return [];
    }
}

async function saveGroups(groupsData) {
    if (!isFirebaseConnected) return false;
    
    try {
        await database.ref('tournament/groups').set(groupsData);
        console.log('Groups saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving groups:', error);
        return false;
    }
}

async function getGroups() {
    if (!isFirebaseConnected) return { A: [], B: [], C: [], D: [] };
    
    try {
        const snapshot = await database.ref('tournament/groups').once('value');
        return snapshot.val() || { A: [], B: [], C: [], D: [] };
    } catch (error) {
        console.error('Error getting groups:', error);
        return { A: [], B: [], C: [], D: [] };
    }
}

async function saveFixtures(fixtures) {
    if (!isFirebaseConnected) return false;
    
    try {
        await database.ref('tournament/fixtures').set(fixtures);
        console.log('Fixtures saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving fixtures:', error);
        return false;
    }
}

async function getFixtures() {
    if (!isFirebaseConnected) return [];
    
    try {
        const snapshot = await database.ref('tournament/fixtures').once('value');
        const data = snapshot.val();
        if (!data) return [];
        return Object.values(data);
    } catch (error) {
        console.error('Error getting fixtures:', error);
        return [];
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function generatePaymentCode() {
    return 'WNX-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    const navbarHeight = document.querySelector('.navbar').offsetHeight;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navbarHeight;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

async function initApp() {
    console.log('Initializing app...');
    await loadAllData();
    checkPlayerAuth();
    updateUI();
}

async function loadAllData() {
    allPlayers = await getAllPlayers();
    groups = await getGroups();
    allFixtures = await getFixtures();
    
    console.log('Loaded:', allPlayers.length, 'players');
    
    updateCounts();
    loadGroups();
    loadFixtures();
    loadStandings();
}

function updateCounts() {
    const registeredCount = document.getElementById('registeredCount');
    const verifiedCount = document.getElementById('verifiedCount');
    
    if (registeredCount) {
        registeredCount.textContent = allPlayers.length;
    }
    
    if (verifiedCount) {
        const verified = allPlayers.filter(p => p.paymentStatus === 'verified').length;
        verifiedCount.textContent = verified;
    }
}

// ==========================================
// LOAD GROUPS
// ==========================================

function loadGroups() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;
    
    let html = '';
    ['A', 'B', 'C', 'D'].forEach(groupKey => {
        const groupPlayers = groups[groupKey] || [];
        html += `
            <div class="col-md-6 col-lg-3">
                <div class="group-card">
                    <div class="group-header">GROUP ${groupKey}</div>
        `;
        
        if (groupPlayers.length > 0) {
            groupPlayers.forEach(playerId => {
                const player = allPlayers.find(p => p.id === playerId);
                if (player) {
                    html += `
                        <div class="player-item">
                            <strong>${player.displayName}</strong><br>
                            <small class="text-info">${player.fifaClub}</small>
                        </div>
                    `;
                }
            });
        } else {
            for (let i = 1; i <= 5; i++) {
                html += `
                    <div class="player-item">
                        <span class="text-info">Player ${i} - TBA</span>
                    </div>
                `;
            }
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// LOAD FIXTURES
// ==========================================

function loadFixtures() {
    const container = document.getElementById('fixturesContainer');
    if (!container) return;
    
    if (allFixtures.length === 0) {
        container.innerHTML = '<p class="text-center text-info">No fixtures scheduled yet</p>';
        return;
    }
    
    let html = '';
    allFixtures.forEach(fixture => {
        const p1 = allPlayers.find(p => p.id === fixture.player1);
        const p2 = allPlayers.find(p => p.id === fixture.player2);
        
        const statusClass = fixture.status === 'completed' ? 'badge-verified' : 
                           fixture.status === 'live' ? 'badge-rejected' : 'badge-pending';
        
        html += `
            <div class="fixture-card">
                <div class="d-flex justify-between align-items-center mb-2">
                    <span class="badge badge-custom">Group ${fixture.group}</span>
                    <span class="badge ${statusClass}">${fixture.status}</span>
                </div>
                <div class="row align-items-center">
                    <div class="col-5 text-end">
                        <strong>${p1?.displayName || 'TBA'}</strong><br>
                        <small class="text-info">${p1?.fifaClub || ''}</small>
                    </div>
                    <div class="col-2 text-center">
                        ${fixture.status === 'completed' ? 
                            `<div class="fixture-score">${fixture.score1} - ${fixture.score2}</div>` : 
                            `<div class="fixture-vs">VS</div>`
                        }
                    </div>
                    <div class="col-5">
                        <strong>${p2?.displayName || 'TBA'}</strong><br>
                        <small class="text-info">${p2?.fifaClub || ''}</small>
                    </div>
                </div>
                ${fixture.date ? `
                    <div class="text-center mt-2">
                        <small class="text-info">
                            <i class="fas fa-calendar"></i> ${fixture.date} 
                            <i class="fas fa-clock"></i> ${fixture.time} 
                            <i class="fas fa-map-marker-alt"></i> ${fixture.venue}
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================================
// LOAD STANDINGS
// ==========================================

function loadStandings() {
    const container = document.getElementById('standingsContainer');
    if (!container) return;
    
    let html = '';
    ['A', 'B', 'C', 'D'].forEach(groupKey => {
        const groupPlayers = allPlayers
            .filter(p => p.group === groupKey && p.paymentStatus === 'verified')
            .sort((a, b) => {
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                const gda = a.stats.goalsFor - a.stats.goalsAgainst;
                const gdb = b.stats.goalsFor - b.stats.goalsAgainst;
                if (gdb !== gda) return gdb - gda;
                return b.stats.goalsFor - a.stats.goalsFor;
            });
        
        if (groupPlayers.length > 0) {
            html += `
                <div class="table-custom mb-4">
                    <table class="table table-dark mb-0">
                        <thead>
                            <tr>
                                <th colspan="10" class="text-center">GROUP ${groupKey}</th>
                            </tr>
                            <tr>
                                <th>Pos</th>
                                <th>Player</th>
                                <th class="text-center">P</th>
                                <th class="text-center">W</th>
                                <th class="text-center">D</th>
                                <th class="text-center">L</th>
                                <th class="text-center">GF</th>
                                <th class="text-center">GA</th>
                                <th class="text-center">GD</th>
                                <th class="text-center">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                    </table>
                </div>
            `;
            
            groupPlayers.forEach((player, idx) => {
                const gd = player.stats.goalsFor - player.stats.goalsAgainst;
                html += `
                    <tr>
                        <td>${idx + 1}</td>
                        <td>
                            <strong>${player.displayName}</strong><br>
                            <small class="text-info">${player.fifaClub}</small>
                        </td>
                        <td class="text-center">${player.stats.played}</td>
                        <td class="text-center">${player.stats.won}</td>
                        <td class="text-center">${player.stats.drawn}</td>
                        <td class="text-center">${player.stats.lost}</td>
                        <td class="text-center">${player.stats.goalsFor}</td>
                        <td class="text-center">${player.stats.goalsAgainst}</td>
                        <td class="text-center">${gd > 0 ? '+' : ''}${gd}</td>
                        <td class="text-center"><strong>${player.stats.points}</strong></td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
    });
    
    if (html === '') {
        html = '<p class="text-center text-info">No standings available yet</p>';
    }
    
    container.innerHTML = html;
}

// ==========================================
// MODAL FUNCTIONS
// ==========================================

function showRegisterModal() {
    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
}

function showAdminLoginModal() {
    const modal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    modal.show();
}

function showAdminModal() {
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    modal.show();
    loadAdminData();
}

// ==========================================
// PLAYER REGISTRATION
// ==========================================

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!isFirebaseConnected) {
            alert('Firebase is not connected. Please refresh the page.');
            return;
        }

        const formData = {
            id: 'player_' + Date.now(),
            name: document.getElementById('regName').value,
            displayName: document.getElementById('regDisplayName').value,
            email: document.getElementById('regEmail').value,
            phone: document.getElementById('regPhone').value,
            university: document.getElementById('regUniversity').value,
            fifaClub: document.getElementById('regFifaClub').value,
            paymentCode: generatePaymentCode(),
            paymentStatus: 'pending',
            group: null,
            stats: { 
                played: 0, 
                won: 0, 
                drawn: 0, 
                lost: 0, 
                goalsFor: 0, 
                goalsAgainst: 0, 
                points: 0 
            },
            registeredAt: new Date().toISOString()
        };

        const saved = await savePlayer(formData);
        
        if (saved) {
            alert(`Registration Successful!\n\nYour Payment Code: ${formData.paymentCode}\n\nPlease send 5,000 UGX to:\nMTN: 0762685612\n\nUse code: ${formData.paymentCode} as reference\n\nOnce verified, you'll have access to view groups, fixtures and standings!`);
            
            this.reset();
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            await loadAllData();
        } else {
            alert('Registration failed. Please try again.');
        }
    });
}

// ==========================================
// ADMIN LOGIN
// ==========================================

const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        
        if (email === 'admin@wnx.com' && password === 'admin123') {
            isAdmin = true;
            localStorage.setItem('wnx_admin', 'true');
            bootstrap.Modal.getInstance(document.getElementById('adminLoginModal')).hide();
            updateAuthUI();
            showAdminModal();
        } else {
            alert('Invalid admin credentials!');
        }
    });
}

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

async function loadAdminData() {
    const pending = allPlayers.filter(p => p.paymentStatus === 'pending');
    const verified = allPlayers.filter(p => p.paymentStatus === 'verified');
    
    document.getElementById('adminPendingCount').textContent = pending.length;
    document.getElementById('adminVerifiedCount').textContent = verified.length;
    
    // Pending payments
    const pendingContainer = document.getElementById('adminPendingContainer');
    if (pending.length === 0) {
        pendingContainer.innerHTML = '<p class="text-info">No pending payments</p>';
    } else {
        let html = '';
        pending.forEach(player => {
            html += `
                <div class="admin-card">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h6>${player.displayName}</h6>
                            <p class="mb-1 small">${player.name}</p>
                            <p class="mb-1 small text-info">${player.university}</p>
                            <p class="mb-0 small"><span class="badge badge-pending">${player.paymentCode}</span></p>
                        </div>
                        <div class="col-md-6 text-end mt-3 mt-md-0">
                            <button class="btn btn-success btn-sm me-2" onclick="verifyPayment('${player.id}')">
                                <i class="fas fa-check"></i> Verify
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="rejectPayment('${player.id}')">
                                <i class="fas fa-times"></i> Reject
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        pendingContainer.innerHTML = html;
    }
    
    // Verified players
    const verifiedContainer = document.getElementById('adminVerifiedContainer');
    if (verified.length === 0) {
        verifiedContainer.innerHTML = '<p class="text-info">No verified players</p>';
    } else {
        let html = '';
        verified.forEach(player => {
            html += `
                <div class="admin-card">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6>${player.displayName}</h6>
                            <p class="mb-0 small text-info">${player.university} | ${player.fifaClub}</p>
                        </div>
                        <div class="col-md-4 text-end">
                            <span class="badge badge-verified">Verified</span>
                            <p class="mb-0 small text-info mt-1">Group ${player.group || 'Unassigned'}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        verifiedContainer.innerHTML = html;
    }
    
    loadAdminGroups();
    loadAdminFixtures();
    loadAdminScores();
}

async function verifyPayment(playerId) {
    const player = await getPlayer(playerId);
    if (player) {
        player.paymentStatus = 'verified';
        await savePlayer(player);
        await loadAllData();
        loadAdminData();
        alert(`Payment verified for ${player.displayName}`);
    }
}

async function rejectPayment(playerId) {
    const player = await getPlayer(playerId);
    if (player) {
        player.paymentStatus = 'rejected';
        await savePlayer(player);
        await loadAllData();
        loadAdminData();
        alert(`Payment rejected for ${player.displayName}`);
    }
}

async function adminGenerateGroups() {
    const verified = allPlayers.filter(p => p.paymentStatus === 'verified');
    
    if (verified.length < 16) {
        alert(`Need at least 16 verified players!\nCurrently: ${verified.length} verified`);
        return;
    }
    
    const shuffled = verified.sort(() => Math.random() - 0.5).slice(0, 20);
    const newGroups = { A: [], B: [], C: [], D: [] };
    const groupKeys = ['A', 'B', 'C', 'D'];
    
    shuffled.forEach((player, index) => {
        const groupKey = groupKeys[Math.floor(index / 5)];
        newGroups[groupKey].push(player.id);
        player.group = groupKey;
        savePlayer(player);
    });
    
    await saveGroups(newGroups);
    await loadAllData();
    loadAdminData();
    alert('Groups generated successfully!');
}

function loadAdminGroups() {
    const container = document.getElementById('adminGroupsContainer');
    if (!container) return;
    
    let html = '<div class="row g-3">';
    ['A', 'B', 'C', 'D'].forEach(groupKey => {
        const groupPlayers = groups[groupKey] || [];
        html += `
            <div class="col-md-6">
                <div class="group-card">
                    <div class="group-header">GROUP ${groupKey} (${groupPlayers.length}/5)</div>
        `;
        
        if (groupPlayers.length > 0) {
            groupPlayers.forEach(playerId => {
                const player = allPlayers.find(p => p.id === playerId);
                if (player) {
                    html += `
                        <div class="player-item">
                            <strong>${player.displayName}</strong><br>
                            <small class="text-info">${player.fifaClub}</small>
                        </div>
                    `;
                }
            });
        } else {
            html += '<p class="text-info text-center">No players assigned</p>';
        }
        
        html += `</div></div>`;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

async function adminGenerateFixtures() {
    const newFixtures = [];
    
    ['A', 'B', 'C', 'D'].forEach(groupKey => {
        const groupPlayers = groups[groupKey] || [];
        for (let i = 0; i < groupPlayers.length; i++) {
            for (let j = i + 1; j < groupPlayers.length; j++) {
                newFixtures.push({
                    id: 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    player1: groupPlayers[i],
                    player2: groupPlayers[j],
                    group: groupKey,
                    date: '',
                    time: '',
                    venue: '',
                    score1: null,
                    score2: null,
                    status: 'scheduled'
                });
            }
        }
    });
    
    await saveFixtures(newFixtures);
    await loadAllData();
    loadAdminData();
    alert(`${newFixtures.length} fixtures generated!`);
}

function loadAdminFixtures() {
    const container = document.getElementById('adminFixturesContainer');
    if (!container) return;
    
    if (allFixtures.length === 0) {
        container.innerHTML = '<p class="text-info">No fixtures yet. Generate them first.</p>';
        return;
    }
    
    let html = '';
    allFixtures.forEach((fixture, index) => {
        const p1 = allPlayers.find(p => p.id === fixture.player1);
        const p2 = allPlayers.find(p => p.id === fixture.player2);
        
        html += `
            <div class="admin-card">
                <div class="mb-2">
                    <span class="badge badge-custom">Group ${fixture.group}</span>
                    <span class="badge badge-pending">${fixture.status}</span>
                </div>
                <p class="mb-2"><strong>${p1?.displayName || 'TBA'} vs ${p2?.displayName || 'TBA'}</strong></p>
                <div class="row g-2">
                    <div class="col-md-3">
                        <input type="date" class="form-control form-control-sm" id="date_${index}" value="${fixture.date || ''}">
                    </div>
                    <div class="col-md-3">
                        <input type="time" class="form-control form-control-sm" id="time_${index}" value="${fixture.time || ''}">
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control form-control-sm" id="venue_${index}" placeholder="Venue" value="${fixture.venue || ''}">
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-primary-custom btn-sm w-100" onclick="updateFixture(${index})">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function updateFixture(index) {
    const fixture = allFixtures[index];
    fixture.date = document.getElementById(`date_${index}`).value;
    fixture.time = document.getElementById(`time_${index}`).value;
    fixture.venue = document.getElementById(`venue_${index}`).value;
    
    await saveFixtures(allFixtures);
    await loadAllData();
    alert('Fixture updated!');
}

function loadAdminScores() {
    const container = document.getElementById('adminScoresContainer');
    if (!container) return;
    
    const scheduledFixtures = allFixtures.filter(f => f.status === 'scheduled');
    
    if (scheduledFixtures.length === 0) {
        container.innerHTML = '<p class="text-info">All matches completed!</p>';
        return;
    }
    
    let html = '';
    scheduledFixtures.forEach((fixture, index) => {
        const p1 = allPlayers.find(p => p.id === fixture.player1);
        const p2 = allPlayers.find(p => p.id === fixture.player2);
        const fixtureIndex = allFixtures.indexOf(fixture);
        
        html += `
            <div class="admin-card">
                <div class="mb-2">
                    <span class="badge badge-custom">Group ${fixture.group}</span>
                </div>
                <div class="row align-items-center mb-3">
                    <div class="col-5 text-end">
                        <strong>${p1?.displayName || 'TBA'}</strong><br>
                        <small class="text-info">${p1?.fifaClub || ''}</small>
                    </div>
                    <div class="col-2 text-center">VS</div>
                    <div class="col-5">
                        <strong>${p2?.displayName || 'TBA'}</strong><br>
                        <small class="text-info">${p2?.fifaClub || ''}</small>
                    </div>
                </div>
                <div class="row g-2">
                    <div class="col-4">
                        <input type="number" class="form-control" id="score1_${fixtureIndex}" placeholder="0" min="0">
                    </div>
                    <div class="col-4">
                        <input type="number" class="form-control" id="score2_${fixtureIndex}" placeholder="0" min="0">
                    </div>
                    <div class="col-4">
                        <button class="btn btn-success w-100" onclick="submitScore(${fixtureIndex})">
                            <i class="fas fa-check"></i> Submit
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

async function submitScore(index) {
    const fixture = allFixtures[index];
    const score1 = parseInt(document.getElementById(`score1_${index}`).value) || 0;
    const score2 = parseInt(document.getElementById(`score2_${index}`).value) || 0;
    
    fixture.score1 = score1;
    fixture.score2 = score2;
    fixture.status = 'completed';
    
    // Update player stats
    const p1 = await getPlayer(fixture.player1);
    const p2 = await getPlayer(fixture.player2);
    
    if (p1 && p2) {
        p1.stats.played++;
        p2.stats.played++;
        p1.stats.goalsFor += score1;
        p1.stats.goalsAgainst += score2;
        p2.stats.goalsFor += score2;
        p2.stats.goalsAgainst += score1;
        
        if (score1 > score2) {
            p1.stats.won++;
            p1.stats.points += 3;
            p2.stats.lost++;
        } else if (score2 > score1) {
            p2.stats.won++;
            p2.stats.points += 3;
            p1.stats.lost++;
        } else {
            p1.stats.drawn++;
            p2.stats.drawn++;
            p1.stats.points += 1;
            p2.stats.points += 1;
        }
        
        await savePlayer(p1);
        await savePlayer(p2);
    }
    
    await saveFixtures(allFixtures);
    await loadAllData();
    loadAdminData();
    alert('Score updated!');
}

// ==========================================
// AUTH UI
// ==========================================

function checkPlayerAuth() {
    const adminStatus = localStorage.getItem('wnx_admin');
    if (adminStatus === 'true') {
        isAdmin = true;
        updateAuthUI();
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;
    
    if (isAdmin) {
        authButtons.innerHTML = `
            <button class="btn btn-outline-custom btn-sm me-2" onclick="showAdminModal()">
                <i class="fas fa-user-shield"></i> Admin Panel
            </button>
            <button class="btn btn-outline-custom btn-sm" onclick="adminLogout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    } else {
        authButtons.innerHTML = `
            <button class="btn btn-outline-custom btn-sm me-2" onclick="showRegisterModal()">
                <i class="fas fa-user-plus"></i> Register
            </button>
            <button class="btn btn-outline-custom btn-sm" onclick="showAdminLoginModal()">
                <i class="fas fa-user-shield"></i> Admin
            </button>
        `;
    }
}

function adminLogout() {
    isAdmin = false;
    localStorage.removeItem('wnx_admin');
    updateAuthUI();
    alert('Logged out successfully');
}

function updateUI() {
    // Additional UI updates
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar-custom');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 30, 59, 0.98)';
        } else {
            navbar.style.background = 'rgba(10, 30, 59, 0.95)';
        }
    }
    
    // Update active nav link
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (window.pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    // Wait for Firebase to initialize
    setTimeout(() => {
        initApp();
    }, 500);
    
    // Add entrance animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    

    const animatedElements = document.querySelectorAll('.stat-card, .group-card, .fixture-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});
// ==========================================
// KNOCKOUT STAGES FUNCTIONS
// ==========================================

// Global knockout data
let knockoutData = {
    quarterFinals: [],
    semiFinals: [],
    thirdPlace: null,
    final: null,
    champion: null
};

// Generate Knockout Bracket
async function generateKnockout() {
    try {
        console.log('🏆 Generating knockout bracket...');
        
        // Check if all group matches are completed
        const allGroupMatchesComplete = allFixtures.every(f => f.status === 'completed');
        
        if (!allGroupMatchesComplete) {
            alert('⚠️ All group stage matches must be completed first!');
            return;
        }
        
        // Check if we have exactly 20 verified players (4 groups of 5)
        const verifiedPlayers = allPlayers.filter(p => p.paymentStatus === 'verified');
        if (verifiedPlayers.length < 16) {
            alert('⚠️ Need at least 16 verified players to generate knockout!');
            return;
        }
        
        // Get top 2 from each group
        const qualifiedPlayers = [];
        
        ['A', 'B', 'C', 'D'].forEach(groupKey => {
            const groupPlayers = groups[groupKey] || [];
            const standings = groupPlayers.map(playerId => {
                const player = allPlayers.find(p => p.id === playerId);
                return player;
            }).filter(p => p && p.stats).sort((a, b) => {
                // Sort by points, then goal difference, then goals for
                if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points;
                const gdA = a.stats.goalsFor - a.stats.goalsAgainst;
                const gdB = b.stats.goalsFor - b.stats.goalsAgainst;
                if (gdB !== gdA) return gdB - gdA;
                return b.stats.goalsFor - a.stats.goalsFor;
            });
            
            // Top 2 qualify
            if (standings[0]) qualifiedPlayers.push({ ...standings[0], group: groupKey, position: 1 });
            if (standings[1]) qualifiedPlayers.push({ ...standings[1], group: groupKey, position: 2 });
        });
        
        if (qualifiedPlayers.length < 8) {
            alert('⚠️ Not enough qualified players. Need 8 players (top 2 from each group).');
            return;
        }
        
        console.log('✅ Qualified players:', qualifiedPlayers);
        
        // Create Quarter-Final matchups (1A vs 2B, 1B vs 2A, 1C vs 2D, 1D vs 2C)
        const qf1 = {
            id: 'qf1',
            stage: 'Quarter-Final',
            matchNumber: 1,
            player1: qualifiedPlayers.find(p => p.group === 'A' && p.position === 1),
            player2: qualifiedPlayers.find(p => p.group === 'B' && p.position === 2),
            status: 'pending',
            date: '',
            time: '',
            venue: '',
            score1: null,
            score2: null,
            winner: null
        };
        
        const qf2 = {
            id: 'qf2',
            stage: 'Quarter-Final',
            matchNumber: 2,
            player1: qualifiedPlayers.find(p => p.group === 'B' && p.position === 1),
            player2: qualifiedPlayers.find(p => p.group === 'A' && p.position === 2),
            status: 'pending',
            date: '',
            time: '',
            venue: '',
            score1: null,
            score2: null,
            winner: null
        };
        
        const qf3 = {
            id: 'qf3',
            stage: 'Quarter-Final',
            matchNumber: 3,
            player1: qualifiedPlayers.find(p => p.group === 'C' && p.position === 1),
            player2: qualifiedPlayers.find(p => p.group === 'D' && p.position === 2),
            status: 'pending',
            date: '',
            time: '',
            venue: '',
            score1: null,
            score2: null,
            winner: null
        };
        
        const qf4 = {
            id: 'qf4',
            stage: 'Quarter-Final',
            matchNumber: 4,
            player1: qualifiedPlayers.find(p => p.group === 'D' && p.position === 1),
            player2: qualifiedPlayers.find(p => p.group === 'C' && p.position === 2),
            status: 'pending',
            date: '',
            time: '',
            venue: '',
            score1: null,
            score2: null,
            winner: null
        };
        
        knockoutData.quarterFinals = [qf1, qf2, qf3, qf4];
        
        // Create empty Semi-Finals
        knockoutData.semiFinals = [
            {
                id: 'sf1',
                stage: 'Semi-Final',
                matchNumber: 1,
                player1: null,
                player2: null,
                status: 'pending',
                date: '',
                time: '',
                venue: '',
                score1: null,
                score2: null,
                winner: null
            },
            {
                id: 'sf2',
                stage: 'Semi-Final',
                matchNumber: 2,
                player1: null,
                player2: null,
                status: 'pending',
                date: '',
                time: '',
                venue: '',
                score1: null,
                score2: null,
                winner: null
            }
        ];
        
        // Create empty Third Place match
        knockoutData.thirdPlace = {
            id: 'third',
            stage: 'Third Place',
            matchNumber: 1,
            player1: null,
            player2: null,
            status: 'pending',
            date: '',
            time: '',
            venue: '',
            score1: null,
            score2: null,
            winner: null
        };
        
        // Create empty Final
        knockoutData.final = {
            id: 'final',
            stage: 'Final',
            matchNumber: 1,
            player1: null,
            player2: null,
            status: 'pending',
            date: '',
            time: '',
            venue: '',
            score1: null,
            score2: null,
            winner: null
        };
        
        // Save to Firebase
        await database.ref('tournament/knockout').set(knockoutData);
        
        console.log('✅ Knockout bracket generated!');
        alert('🏆 Knockout bracket generated successfully!');
        
        // Reload admin knockout view
        loadAdminKnockout();
        loadPublicKnockout();
        
    } catch (error) {
        console.error('❌ Error generating knockout:', error);
        alert('Error generating knockout bracket. Please try again.');
    }
}

// Load Admin Knockout View
function loadAdminKnockout() {
    const container = document.getElementById('knockoutAdminContainer');
    if (!container) return;
    
    if (!knockoutData.quarterFinals || knockoutData.quarterFinals.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Click "Generate Knockout Bracket" to create quarter-finals, semi-finals, and final matches.</p>';
        return;
    }
    
    let html = '';
    
    // Quarter-Finals
    html += '<div class="knockout-stage-header">QUARTER-FINALS</div>';
    knockoutData.quarterFinals.forEach(match => {
        html += renderAdminKnockoutMatch(match);
    });
    
    // Semi-Finals
    html += '<div class="knockout-stage-header">SEMI-FINALS</div>';
    knockoutData.semiFinals.forEach(match => {
        html += renderAdminKnockoutMatch(match);
    });
    
    // Third Place
    html += '<div class="knockout-stage-header">THIRD PLACE</div>';
    html += renderAdminKnockoutMatch(knockoutData.thirdPlace);
    
    // Final
    html += '<div class="knockout-stage-header">FINAL</div>';
    html += renderAdminKnockoutMatch(knockoutData.final);
    
    // Champion Display
    if (knockoutData.champion) {
        html += `
            <div class="champion-card">
                <div class="champion-trophy">🏆</div>
                <div class="champion-title">WNX CHAMPION</div>
                <div class="champion-name">${knockoutData.champion.displayName}</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Render Admin Knockout Match Card
function renderAdminKnockoutMatch(match) {
    if (!match) return '';
    
    const player1 = match.player1;
    const player2 = match.player2;
    
    const statusClass = match.status === 'completed' ? 'completed' : 
                       match.status === 'scheduled' ? 'scheduled' : 'pending';
    
    return `
        <div class="knockout-match-card">
            <div class="knockout-match-title">
                <i class="fas fa-trophy"></i>
                ${match.stage} - Match ${match.matchNumber}
                <span class="knockout-status ${statusClass}">${match.status}</span>
            </div>
            
            <div class="knockout-players">
                <div class="knockout-player ${match.winner === player1?.id ? 'knockout-winner' : ''}">
                    <div class="knockout-player-name">
                        ${player1 ? player1.displayName : 'TBA'}
                    </div>
                    <div class="knockout-player-club">
                        ${player1 ? player1.fifaClub : 'Waiting for previous match'}
                    </div>
                </div>
                
                <div class="knockout-vs">VS</div>
                
                <div class="knockout-player ${match.winner === player2?.id ? 'knockout-winner' : ''}">
                    <div class="knockout-player-name">
                        ${player2 ? player2.displayName : 'TBA'}
                    </div>
                    <div class="knockout-player-club">
                        ${player2 ? player2.fifaClub : 'Waiting for previous match'}
                    </div>
                </div>
            </div>
            
            ${player1 && player2 ? `
                <!-- Match Details Form -->
                <div class="knockout-match-details">
                    <div class="knockout-input-group">
                        <label><i class="fas fa-calendar"></i> Date</label>
                        <input type="date" id="date_${match.id}" value="${match.date || ''}" 
                               ${match.status === 'completed' ? 'disabled' : ''}>
                    </div>
                    <div class="knockout-input-group">
                        <label><i class="fas fa-clock"></i> Time</label>
                        <input type="time" id="time_${match.id}" value="${match.time || ''}"
                               ${match.status === 'completed' ? 'disabled' : ''}>
                    </div>
                    <div class="knockout-input-group">
                        <label><i class="fas fa-map-marker-alt"></i> Venue</label>
                        <input type="text" id="venue_${match.id}" value="${match.venue || ''}" 
                               placeholder="Enter venue"
                               ${match.status === 'completed' ? 'disabled' : ''}>
                    </div>
                </div>
                
                ${match.status !== 'completed' ? `
                    <div class="knockout-actions">
                        <button class="btn btn-knockout-schedule" onclick="scheduleKnockoutMatch('${match.id}')">
                            <i class="fas fa-calendar-check"></i> Schedule Match
                        </button>
                    </div>
                ` : ''}
                
                ${match.status === 'scheduled' ? `
                    <!-- Score Input -->
                    <div class="knockout-score-section">
                        <div>
                            <div class="text-center mb-2 text-muted small">${player1.displayName}</div>
                            <input type="number" class="knockout-score-input" id="score1_${match.id}" 
                                   min="0" max="20" placeholder="0">
                        </div>
                        <div class="knockout-score-separator">-</div>
                        <div>
                            <div class="text-center mb-2 text-muted small">${player2.displayName}</div>
                            <input type="number" class="knockout-score-input" id="score2_${match.id}" 
                                   min="0" max="20" placeholder="0">
                        </div>
                    </div>
                    <div class="knockout-actions">
                        <button class="btn btn-knockout-score" onclick="submitKnockoutScore('${match.id}')">
                            <i class="fas fa-check-circle"></i> Submit Score
                        </button>
                    </div>
                ` : ''}
                
                ${match.status === 'completed' ? `
                    <div class="knockout-score-section">
                        <div>
                            <div class="text-center mb-2 text-muted small">${player1.displayName}</div>
                            <div class="knockout-score-input" style="background: rgba(0,255,204,0.1);">${match.score1}</div>
                        </div>
                        <div class="knockout-score-separator">-</div>
                        <div>
                            <div class="text-center mb-2 text-muted small">${player2.displayName}</div>
                            <div class="knockout-score-input" style="background: rgba(0,255,204,0.1);">${match.score2}</div>
                        </div>
                    </div>
                ` : ''}
            ` : ''}
        </div>
    `;
}

// Schedule Knockout Match
async function scheduleKnockoutMatch(matchId) {
    try {
        const date = document.getElementById(`date_${matchId}`).value;
        const time = document.getElementById(`time_${matchId}`).value;
        const venue = document.getElementById(`venue_${matchId}`).value;
        
        if (!date || !time || !venue) {
            alert('Please fill in all fields (date, time, venue)');
            return;
        }
        
        // Find and update the match
        let matchPath = '';
        let matchIndex = -1;
        
        if (matchId.startsWith('qf')) {
            matchIndex = knockoutData.quarterFinals.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                knockoutData.quarterFinals[matchIndex].date = date;
                knockoutData.quarterFinals[matchIndex].time = time;
                knockoutData.quarterFinals[matchIndex].venue = venue;
                knockoutData.quarterFinals[matchIndex].status = 'scheduled';
            }
        } else if (matchId.startsWith('sf')) {
            matchIndex = knockoutData.semiFinals.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                knockoutData.semiFinals[matchIndex].date = date;
                knockoutData.semiFinals[matchIndex].time = time;
                knockoutData.semiFinals[matchIndex].venue = venue;
                knockoutData.semiFinals[matchIndex].status = 'scheduled';
            }
        } else if (matchId === 'third') {
            knockoutData.thirdPlace.date = date;
            knockoutData.thirdPlace.time = time;
            knockoutData.thirdPlace.venue = venue;
            knockoutData.thirdPlace.status = 'scheduled';
        } else if (matchId === 'final') {
            knockoutData.final.date = date;
            knockoutData.final.time = time;
            knockoutData.final.venue = venue;
            knockoutData.final.status = 'scheduled';
        }
        
        // Save to Firebase
        await database.ref('tournament/knockout').set(knockoutData);
        
        console.log('✅ Match scheduled:', matchId);
        alert('✅ Match scheduled successfully!');
        
        loadAdminKnockout();
        loadPublicKnockout(); // Update public view
        
    } catch (error) {
        console.error('❌ Error scheduling match:', error);
        alert('Error scheduling match. Please try again.');
    }
}

// Submit Knockout Score
async function submitKnockoutScore(matchId) {
    try {
        const score1 = parseInt(document.getElementById(`score1_${matchId}`).value);
        const score2 = parseInt(document.getElementById(`score2_${matchId}`).value);
        
        if (isNaN(score1) || isNaN(score2)) {
            alert('Please enter valid scores for both players');
            return;
        }
        
        if (score1 === score2) {
            alert('⚠️ Knockout matches cannot end in a draw! Please enter different scores.');
            return;
        }
        
        if (!confirm(`Confirm score: ${score1} - ${score2}?`)) {
            return;
        }
        
        let match = null;
        let matchIndex = -1;
        
        // Find the match
        if (matchId.startsWith('qf')) {
            matchIndex = knockoutData.quarterFinals.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                match = knockoutData.quarterFinals[matchIndex];
            }
        } else if (matchId.startsWith('sf')) {
            matchIndex = knockoutData.semiFinals.findIndex(m => m.id === matchId);
            if (matchIndex !== -1) {
                match = knockoutData.semiFinals[matchIndex];
            }
        } else if (matchId === 'third') {
            match = knockoutData.thirdPlace;
        } else if (matchId === 'final') {
            match = knockoutData.final;
        }
        
        if (!match) {
            alert('Match not found!');
            return;
        }
        
        // Update match
        match.score1 = score1;
        match.score2 = score2;
        match.status = 'completed';
        match.winner = score1 > score2 ? match.player1.id : match.player2.id;
        
        const winnerPlayer = score1 > score2 ? match.player1 : match.player2;
        const loserPlayer = score1 < score2 ? match.player1 : match.player2;
        
        // Advance winner to next round
        if (matchId === 'qf1') {
            knockoutData.semiFinals[0].player1 = winnerPlayer;
        } else if (matchId === 'qf2') {
            knockoutData.semiFinals[0].player2 = winnerPlayer;
        } else if (matchId === 'qf3') {
            knockoutData.semiFinals[1].player1 = winnerPlayer;
        } else if (matchId === 'qf4') {
            knockoutData.semiFinals[1].player2 = winnerPlayer;
        } else if (matchId === 'sf1') {
            knockoutData.final.player1 = winnerPlayer;
            knockoutData.thirdPlace.player1 = loserPlayer;
        } else if (matchId === 'sf2') {
            knockoutData.final.player2 = winnerPlayer;
            knockoutData.thirdPlace.player2 = loserPlayer;
        } else if (matchId === 'final') {
            knockoutData.champion = winnerPlayer;
        }
        
        // Save to Firebase
        await database.ref('tournament/knockout').set(knockoutData);
        
        console.log('✅ Score submitted:', matchId);
        alert(`✅ Score submitted! Winner: ${winnerPlayer.displayName}`);
        
        loadAdminKnockout();
        loadPublicKnockout(); // Update public view
        
    } catch (error) {
        console.error('❌ Error submitting score:', error);
        alert('Error submitting score. Please try again.');
    }
}

// Load knockout data from Firebase
async function loadKnockoutData() {
    try {
        const snapshot = await database.ref('tournament/knockout').once('value');
        const data = snapshot.val();
        
        if (data) {
            knockoutData = data;
            console.log('✅ Knockout data loaded:', knockoutData);
        }
    } catch (error) {
        console.error('❌ Error loading knockout data:', error);
    }
}
// Load Public Knockout View (Homepage)
function loadPublicKnockout() {
    const container = document.getElementById('knockoutBracketContainer');
    if (!container) return;
    
    if (!knockoutData.quarterFinals || knockoutData.quarterFinals.length === 0) {
        container.innerHTML = `
            <p class="text-center text-muted">
                <i class="fas fa-info-circle"></i> Knockout bracket will appear here after group stage completion
            </p>
        `;
        return;
    }
    
    let html = '';
    
    // Quarter-Finals
    html += '<div class="bracket-stage">';
    html += '<div class="bracket-stage-title"><i class="fas fa-fire"></i> QUARTER-FINALS</div>';
    html += '<div class="bracket-matches">';
    knockoutData.quarterFinals.forEach(match => {
        html += renderPublicKnockoutMatch(match);
    });
    html += '</div></div>';
    
    // Semi-Finals
    html += '<div class="bracket-stage">';
    html += '<div class="bracket-stage-title"><i class="fas fa-star"></i> SEMI-FINALS</div>';
    html += '<div class="bracket-matches">';
    knockoutData.semiFinals.forEach(match => {
        html += renderPublicKnockoutMatch(match);
    });
    html += '</div></div>';
    
    // Third Place
    html += '<div class="bracket-stage">';
    html += '<div class="bracket-stage-title"><i class="fas fa-medal"></i> THIRD PLACE</div>';
    html += '<div class="bracket-matches" style="max-width: 500px; margin: 0 auto;">';
    html += renderPublicKnockoutMatch(knockoutData.thirdPlace);
    html += '</div></div>';
    
    // Final
    html += '<div class="bracket-stage">';
    html += '<div class="bracket-stage-title"><i class="fas fa-crown"></i> FINAL</div>';
    html += '<div class="bracket-matches" style="max-width: 500px; margin: 0 auto;">';
    html += renderPublicKnockoutMatch(knockoutData.final);
    html += '</div></div>';
    
    // Champion
    if (knockoutData.champion) {
        html += `
            <div class="champion-card">
                <div class="champion-trophy">🏆</div>
                <div class="champion-title">WNX TOURNAMENT CHAMPION</div>
                <div class="champion-name">${knockoutData.champion.displayName}</div>
                <p style="color: var(--fc-dark); font-size: 1.2rem; margin-top: 15px;">
                    ${knockoutData.champion.fifaClub}
                </p>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Render Public Knockout Match Card
function renderPublicKnockoutMatch(match) {
    if (!match) return '';
    
    const player1 = match.player1;
    const player2 = match.player2;
    
    const statusBadge = match.status === 'completed' ? 
        '<span class="knockout-status completed">Completed</span>' :
        match.status === 'scheduled' ? 
        '<span class="knockout-status scheduled">Scheduled</span>' :
        '<span class="knockout-status pending">Pending</span>';
    
    return `
        <div class="bracket-match-card ${match.status}">
            <div class="bracket-match-header">
                <span class="bracket-match-number">${match.stage} ${match.matchNumber}</span>
                ${statusBadge}
            </div>
            
            <div class="bracket-player-row ${match.winner === player1?.id ? 'winner' : ''}">
                <div class="bracket-player-info">
                    <div class="bracket-player-name">
                        ${player1 ? player1.displayName : 'TBA'}
                        ${match.winner === player1?.id ? ' 🏆' : ''}
                    </div>
                    <div class="bracket-player-club">
                        ${player1 ? player1.fifaClub : 'Waiting for previous match'}
                    </div>
                </div>
                <div class="bracket-score">
                    ${match.score1 !== null ? match.score1 : '-'}
                </div>
            </div>
            
            <div class="bracket-player-row ${match.winner === player2?.id ? 'winner' : ''}">
                <div class="bracket-player-info">
                    <div class="bracket-player-name">
                        ${player2 ? player2.displayName : 'TBA'}
                        ${match.winner === player2?.id ? ' 🏆' : ''}
                    </div>
                    <div class="bracket-player-club">
                        ${player2 ? player2.fifaClub : 'Waiting for previous match'}
                    </div>
                </div>
                <div class="bracket-score">
                    ${match.score2 !== null ? match.score2 : '-'}
                </div>
            </div>
            
            ${match.date || match.time || match.venue ? `
                <div class="bracket-match-footer">
                    <div class="bracket-match-datetime">
                        ${match.date ? `<i class="fas fa-calendar"></i> ${match.date}` : ''}
                        ${match.time ? `<i class="fas fa-clock"></i> ${match.time}` : ''}
                    </div>
                    <div class="bracket-match-venue">
                        ${match.venue ? `<i class="fas fa-map-marker-alt"></i> ${match.venue}` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Initialize knockout data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadKnockoutData();
});
// Open chat modal
function openChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        lastSeenTimestamp = Date.now();
        unreadCount = 0;
        updateChatBadge();
        
        setTimeout(() => {
            const input = document.getElementById('chatInputModal');
            if (input) input.focus();
        }, 300);
    } else {
        console.error('Chat modal not found!');
    }
}

// Close chat modal
function closeChatModal() {
    const modal = document.getElementById('chatModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        clearTypingIndicator();
    }
}
// Open Registration Form
function openRegistrationForm() {
    // Close the journey modal
    const journeyModal = bootstrap.Modal.getInstance(document.getElementById('tournamentJourneyModal'));
    if (journeyModal) {
        journeyModal.hide();
    }
    
    // Wait a moment for modal to close, then open registration
    setTimeout(() => {
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Click the register button
        setTimeout(() => {
            document.getElementById('registerBtn').click();
        }, 500);
    }, 300);
}
