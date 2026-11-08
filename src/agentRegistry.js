const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const AGENTS_FILE = path.join(DATA_DIR, 'agents.json');

const DEFAULT_AGENTS = [
  {
    id: 'hermes',
    name: 'Hermes',
    shape: 'sphere',
    color: '#FF7A00',
    command: 'hermes',
    role: 'System Architect & Testing Lead',
    davit: 10,
    status: 'ready',
    stats: { tasksCompleted: 14, efficiency: '99.2%' }
  },
  {
    id: 'codex',
    name: 'Codex',
    shape: 'cube',
    color: '#10B981',
    command: 'codex',
    role: 'Backend Engineering & Algorithms',
    davit: 10,
    status: 'ready',
    stats: { tasksCompleted: 19, efficiency: '98.5%' }
  },
  {
    id: 'antigravity',
    name: 'Antigravity (Agy)',
    shape: 'polyhedron',
    color: '#8B5CF6',
    command: 'agy',
    role: 'Frontend UI/UX & Code Reviewer',
    davit: 10,
    status: 'ready',
    stats: { tasksCompleted: 11, efficiency: '97.8%' }
  }
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(AGENTS_FILE)) {
    fs.writeFileSync(AGENTS_FILE, JSON.stringify(DEFAULT_AGENTS, null, 2), 'utf-8');
  }
}

function getAllAgents() {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(AGENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return DEFAULT_AGENTS;
  }
}

function saveAgents(agents) {
  ensureDataDir();
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2), 'utf-8');
}

function getAgent(id) {
  const agents = getAllAgents();
  return agents.find(a => a.id === id);
}

function upsertAgent(agentData) {
  const agents = getAllAgents();
  const idx = agents.findIndex(a => a.id === agentData.id);
  if (idx !== -1) {
    agents[idx] = { ...agents[idx], ...agentData };
  } else {
    agents.push({
      id: agentData.id || `agent_${Date.now()}`,
      name: agentData.name || 'Agen Baru',
      shape: agentData.shape || 'sphere',
      color: agentData.color || '#00E5FF',
      command: agentData.command || 'echo "Agent running"',
      role: agentData.role || 'Generalist AI Agent',
      davit: parseInt(agentData.davit, 10) || 10,
      status: 'ready',
      stats: { tasksCompleted: 0, efficiency: '100%' }
    });
  }
  saveAgents(agents);
  return agents;
}

function deleteAgent(id) {
  let agents = getAllAgents();
  agents = agents.filter(a => a.id !== id);
  saveAgents(agents);
  return agents;
}

module.exports = {
  getAllAgents,
  getAgent,
  upsertAgent,
  deleteAgent,
  DEFAULT_AGENTS
};
