const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

// Default is EMPTY: No pre-populated agents! User adds them via terminal slots!
const DEFAULT_AGENTS = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getAllAgents() {
  ensureDataDir();
  if (!fs.existsSync(AGENTS_FILE)) {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2), 'utf8');
    return DEFAULT_AGENTS;
  }
  try {
    const raw = fs.readFileSync(AGENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveAllAgents(agents) {
  ensureDataDir();
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf8');
}

function getAgentById(id) {
  const agents = getAllAgents();
  return agents.find(a => a.id === id) || null;
}

function upsertAgent(agentData) {
  const agents = getAllAgents();
  const existingIndex = agents.findIndex(a => a.id === agentData.id);

  const cleanAgent = {
    id: agentData.id || `agent_${Date.now()}`,
    name: agentData.name || 'Agent',
    command: agentData.command || 'echo "Agent ready"',
    role: agentData.role || 'Specialist Agent',
    shape: agentData.shape || 'sphere',
    color: agentData.color || '#10B981',
    davit: agentData.davit !== undefined ? Number(agentData.davit) : 10,
    status: agentData.status || 'ready',
    active: agentData.active !== undefined ? agentData.active : true,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    agents[existingIndex] = { ...agents[existingIndex], ...cleanAgent };
  } else {
    agents.push(cleanAgent);
  }

  saveAllAgents(agents);
  return cleanAgent;
}

function deleteAgent(id) {
  const agents = getAllAgents();
  const filtered = agents.filter(a => a.id !== id);
  saveAllAgents(filtered);
  return filtered.length < agents.length;
}

module.exports = {
  getAllAgents,
  getAgentById,
  upsertAgent,
  deleteAgent
};
