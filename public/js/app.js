/**
 * OVIT Core Application Controller
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 */

const I18N = {
  ID: {
    library: 'Halaman Pustaka',
    agents: 'Agen',
    terminal: 'Terminal Agen',
    operation: 'Operasi',
    emergencyStop: 'Hentikan Operasi',
    commandPlaceholder: 'Ketik satu perintah untuk semua agen... (Contoh: Bangun sistem REST API Go + UI React)',
    runCommand: 'Jalankan Perintah',
    running: 'Memproses...',
    allAgents: 'Semua Agen',
    parallelMode: 'Mode Paralel',
    sequentialMode: 'Mode Bertahap',
    tabChat: 'Percakapan',
    tabTerminal: 'Terminal Mentah',
    tabFiles: 'Arsip Berkas',
    clearLogs: 'Bersihkan Log',
    addAgentTitle: 'Tambah & Kustomisasi Tampilan Agen',
    agentNameLabel: 'Nama Agen',
    agentColorLabel: 'Warna Avatar',
    agentShapeLabel: 'Bentuk 3D',
    agentCommandLabel: 'Perintah CLI / Eksekutor',
    agentRoleLabel: 'Peran / Spesialisasi',
    davitLabel: 'Alokasi Davit / Donasi',
    saveAgent: 'Simpan Tampilan Agen',
    addNewAgentBtn: '+ Tambah Agen Baru',
    sphereShape: 'Bulat (Sphere Core)',
    cubeShape: 'Kubus (Cyber Cube)',
    crystalShape: 'Kristal (Polyhedron)',
    torusShape: 'Cincin (Torus)',
    emptyChat: 'Belum ada percakapan. Ketik perintah di bawah animasi untuk memulai kolaborasi antar-agen!',
    emptyTerminal: 'Menunggu output konsol dari CLI agen...',
    promptTemplates: 'Template Prompt Siap Pakai',
    useTemplate: 'Gunakan Template',
    statusOnline: 'ONLINE',
    statusProcessing: 'RUNNING',
    davitCounter: 'Davit'
  },
  EN: {
    library: 'Library Page',
    agents: 'Agents',
    terminal: 'Agent Terminal',
    operation: 'Operation',
    emergencyStop: 'Emergency Stop',
    commandPlaceholder: 'Type a unified prompt for all agents... (e.g. Build Go REST API + React UI)',
    runCommand: 'Execute Command',
    running: 'Processing...',
    allAgents: 'All Agents',
    parallelMode: 'Parallel Mode',
    sequentialMode: 'Sequential Mode',
    tabChat: 'Conversation',
    tabTerminal: 'Raw Terminal',
    tabFiles: 'File Archives',
    clearLogs: 'Clear Logs',
    addAgentTitle: 'Add & Customize Agent Appearance',
    agentNameLabel: 'Agent Name',
    agentColorLabel: 'Avatar Color',
    agentShapeLabel: '3D Mesh Shape',
    agentCommandLabel: 'CLI Command / Runner',
    agentRoleLabel: 'Role / Specialization',
    davitLabel: 'Davit / Donation Allocation',
    saveAgent: 'Save Agent Appearance',
    addNewAgentBtn: '+ Add New Agent',
    sphereShape: 'Sphere Core',
    cubeShape: 'Cyber Cube',
    crystalShape: 'Crystal Polyhedron',
    torusShape: 'Torus Ring',
    emptyChat: 'No conversation yet. Type a command underneath the 3D stage to start collaboration!',
    emptyTerminal: 'Awaiting raw stdout/stderr streams from agent CLI...',
    promptTemplates: 'Ready-to-Use Prompt Templates',
    useTemplate: 'Use Template',
    statusOnline: 'ONLINE',
    statusProcessing: 'RUNNING',
    davitCounter: 'Davit'
  }
};

class OvitApp {
  constructor() {
    this.currentLang = localStorage.getItem('ovit_lang') || 'ID';
    this.currentTheme = localStorage.getItem('ovit_theme') || 'dark';
    this.activeView = 'terminal';
    this.activeRightTab = 'chat';
    this.agents = [];
    this.isProcessing = false;
    this.stage = null;
    this.customizer = null;
    this.davitBalance = 10;
    this.selectedAgentForEdit = null;

    this.init();
  }

  async init() {
    this.applyTheme();
    this.applyLanguage();
    this.bindEvents();

    // Init 3D Visualizer Stage
    this.stage = new AgentThreeStage('three-canvas-container');

    // Init 3D Customizer in Agent Panel
    this.customizer = new AgentCustomizer('customizer-preview-container');

    // Load initial data
    await this.fetchAgents();
    await this.fetchLibrary();
    this.connectEventStream();
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Right Feed Tabs
    document.querySelectorAll('.feed-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchRightTab(tab);
      });
    });

    // Theme Toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', () => {
      this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ovit_theme', this.currentTheme);
      this.applyTheme();
    });

    // Language Toggle
    document.getElementById('lang-toggle-btn').addEventListener('click', () => {
      this.currentLang = this.currentLang === 'ID' ? 'EN' : 'ID';
      localStorage.setItem('ovit_lang', this.currentLang);
      this.applyLanguage();
    });

    // [Operasi] Header Button
    document.getElementById('operation-btn').addEventListener('click', () => {
      if (this.isProcessing) {
        this.triggerEmergencyStop();
      } else {
        // Quick trigger focus on command box
        this.switchView('terminal');
        const box = document.getElementById('command-input');
        if (box) {
          box.focus();
          box.classList.add('ring-2', 'ring-emerald-400');
          setTimeout(() => box.classList.remove('ring-2', 'ring-emerald-400'), 1000);
        }
      }
    });

    // Command Box Run Button
    document.getElementById('run-command-btn').addEventListener('click', () => {
      this.submitCommand();
    });

    // Command Box Enter Key (Ctrl+Enter or Enter without Shift)
    document.getElementById('command-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submitCommand();
      }
    });

    // Clear Terminal Button
    document.getElementById('clear-terminal-btn').addEventListener('click', () => {
      const container = document.getElementById('terminal-stream-content');
      if (container) container.innerHTML = '';
    });

    // Clear Chat Button
    document.getElementById('clear-chat-btn').addEventListener('click', () => {
      const container = document.getElementById('chat-stream-content');
      if (container) container.innerHTML = '';
    });

    // Customizer Shape change
    document.getElementById('customizer-shape').addEventListener('change', (e) => {
      if (this.customizer) {
        this.customizer.updateMesh(e.target.value, document.getElementById('customizer-color').value);
      }
    });

    // Customizer Color change (input and swatches)
    document.getElementById('customizer-color').addEventListener('input', (e) => {
      if (this.customizer) {
        this.customizer.updateMesh(document.getElementById('customizer-shape').value, e.target.value);
      }
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color;
        document.getElementById('customizer-color').value = color;
        if (this.customizer) {
          this.customizer.updateMesh(document.getElementById('customizer-shape').value, color);
        }
      });
    });

    // Save Agent Form
    document.getElementById('agent-customizer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCustomizedAgent();
    });

    // Add New Agent Button
    document.getElementById('add-new-agent-btn').addEventListener('click', () => {
      this.resetCustomizerForm();
    });
  }

  applyTheme() {
    if (this.currentTheme === 'light') {
      document.body.classList.add('light-mode');
      document.getElementById('theme-icon').textContent = '🌙';
    } else {
      document.body.classList.remove('light-mode');
      document.getElementById('theme-icon').textContent = '☀️';
    }
  }

  applyLanguage() {
    const t = I18N[this.currentLang];
    document.getElementById('lang-label').textContent = this.currentLang;

    // Translate marked elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    // Placeholders
    const cmdInput = document.getElementById('command-input');
    if (cmdInput) cmdInput.placeholder = t.commandPlaceholder;

    // Operation button state
    this.updateOperationButton();
  }

  updateOperationButton() {
    const t = I18N[this.currentLang];
    const btn = document.getElementById('operation-btn');
    if (!btn) return;
    if (this.isProcessing) {
      btn.innerHTML = `<span class="inline-block w-2.5 h-2.5 rounded-full bg-red-400 animate-ping mr-2"></span>[${t.emergencyStop}]`;
      btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-600/30 text-red-300 border border-red-500/50 hover:bg-red-600/50 transition-all cursor-pointer';
    } else {
      btn.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>[${t.operation}]`;
      btn.className = 'px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer';
    }
  }

  switchView(viewName) {
    this.activeView = viewName;
    document.querySelectorAll('.view-page').forEach(page => {
      page.classList.add('hidden');
    });

    document.querySelectorAll('.nav-item').forEach(btn => {
      if (btn.dataset.view === viewName) {
        btn.classList.add('active', 'border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('active', 'border-emerald-500/50', 'bg-emerald-500/10', 'text-emerald-400');
        btn.classList.add('text-slate-400');
      }
    });

    const targetPage = document.getElementById(`view-${viewName}`);
    if (targetPage) targetPage.classList.remove('hidden');

    if (viewName === 'terminal' && this.stage) {
      setTimeout(() => this.stage.onResize(), 100);
    }
  }

  switchRightTab(tabName) {
    this.activeRightTab = tabName;
    document.querySelectorAll('.feed-tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('border-b-2', 'border-emerald-400', 'text-emerald-400');
        btn.classList.remove('text-slate-400');
      } else {
        btn.classList.remove('border-b-2', 'border-emerald-400', 'text-emerald-400');
        btn.classList.add('text-slate-400');
      }
    });

    document.querySelectorAll('.feed-tab-content').forEach(c => c.classList.add('hidden'));
    const activeContent = document.getElementById(`feed-content-${tabName}`);
    if (activeContent) activeContent.classList.remove('hidden');
  }

  async fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const agents = await res.json();
      this.agents = agents;

      // Update 3D Stage
      if (this.stage) {
        this.stage.updateAgents(agents);
      }

      // Update Command Box Target Dropdown
      this.renderAgentTargetOptions();

      // Update Agent List in Panel
      this.renderAgentsList();
    } catch (e) {
      console.error('Failed to fetch agents:', e);
    }
  }

  renderAgentTargetOptions() {
    const select = document.getElementById('target-agent-select');
    if (!select) return;
    const t = I18N[this.currentLang];
    select.innerHTML = `<option value="all">${t.allAgents} (${this.agents.length})</option>`;
    this.agents.forEach(a => {
      select.innerHTML += `<option value="${a.id}">${a.name} (${a.command})</option>`;
    });
  }

  renderAgentsList() {
    const container = document.getElementById('agents-list-container');
    if (!container) return;
    container.innerHTML = '';

    this.agents.forEach(agent => {
      const card = document.createElement('div');
      card.className = 'glass-panel p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-500/40 transition-all';
      card.innerHTML = `
        <div class="flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner" style="background: ${agent.color}22; border: 1px solid ${agent.color}66; color: ${agent.color};">
            ${agent.name.charAt(0)}
          </div>
          <div>
            <h4 class="font-bold text-sm text-slate-100 flex items-center gap-2">
              ${agent.name}
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">${agent.command}</span>
            </h4>
            <p class="text-xs text-slate-400 mt-0.5">${agent.role}</p>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono font-bold text-emerald-400">${agent.davit || 10} Davit</span>
          <div class="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">${agent.shape}</div>
        </div>
      `;
      card.addEventListener('click', () => this.loadAgentToForm(agent));
      container.appendChild(card);
    });
  }

  loadAgentToForm(agent) {
    this.selectedAgentForEdit = agent;
    document.getElementById('customizer-agent-id').value = agent.id;
    document.getElementById('customizer-name').value = agent.name;
    document.getElementById('customizer-command').value = agent.command;
    document.getElementById('customizer-role').value = agent.role || '';
    document.getElementById('customizer-shape').value = agent.shape || 'sphere';
    document.getElementById('customizer-color').value = agent.color || '#10B981';
    document.getElementById('customizer-davit').value = agent.davit || 10;

    if (this.customizer) {
      this.customizer.updateMesh(agent.shape, agent.color);
    }
  }

  resetCustomizerForm() {
    this.selectedAgentForEdit = null;
    document.getElementById('customizer-agent-id').value = '';
    document.getElementById('customizer-name').value = 'Agen Baru';
    document.getElementById('customizer-command').value = 'echo "Agent running"';
    document.getElementById('customizer-role').value = 'Generalist AI Agent';
    document.getElementById('customizer-shape').value = 'sphere';
    document.getElementById('customizer-color').value = '#00E5FF';
    document.getElementById('customizer-davit').value = 10;

    if (this.customizer) {
      this.customizer.updateMesh('sphere', '#00E5FF');
    }
  }

  async saveCustomizedAgent() {
    const id = document.getElementById('customizer-agent-id').value || `agent_${Date.now()}`;
    const name = document.getElementById('customizer-name').value.trim();
    const command = document.getElementById('customizer-command').value.trim();
    const role = document.getElementById('customizer-role').value.trim();
    const shape = document.getElementById('customizer-shape').value;
    const color = document.getElementById('customizer-color').value;
    const davit = parseInt(document.getElementById('customizer-davit').value, 10) || 10;

    if (!name) return alert('Nama agen tidak boleh kosong!');

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, command, role, shape, color, davit })
      });
      const data = await res.json();
      if (data.success) {
        await this.fetchAgents();
        alert(`Tampilan agen ${name} berhasil disimpan!`);
      }
    } catch (e) {
      alert('Gagal menyimpan agen: ' + e.message);
    }
  }

  async fetchLibrary() {
    try {
      const res = await fetch('/api/library');
      const data = await res.json();
      this.renderLibraryTemplates(data.templates || []);
    } catch (e) {
      console.error('Failed to fetch library:', e);
    }
  }

  renderLibraryTemplates(templates) {
    const container = document.getElementById('library-templates-container');
    if (!container) return;
    container.innerHTML = '';
    const t = I18N[this.currentLang];

    templates.forEach(tmpl => {
      const card = document.createElement('div');
      card.className = 'glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-emerald-500/40 transition-all';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">${tmpl.category}</span>
          </div>
          <h3 class="font-bold text-base text-slate-100 mb-2">${tmpl.title}</h3>
          <p class="text-xs text-slate-400 leading-relaxed mb-4">${tmpl.description}</p>
        </div>
        <button class="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-all cursor-pointer">
          ${t.useTemplate} →
        </button>
      `;
      card.querySelector('button').addEventListener('click', () => {
        this.switchView('terminal');
        const input = document.getElementById('command-input');
        if (input) {
          input.value = tmpl.command;
          input.focus();
        }
      });
      container.appendChild(card);
    });
  }

  connectEventStream() {
    const evtSource = new EventSource('/api/stream');

    evtSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.handleStreamEvent(data);
      } catch (err) {
        // Ping or heartbeats
      }
    };

    evtSource.onerror = () => {
      console.warn('[OVIT Stream] Disconnected. Reconnecting in 3s...');
    };
  }

  handleStreamEvent(event) {
    if (event.type === 'operation_start') {
      this.isProcessing = true;
      this.updateOperationButton();
      this.updateEngineStatus(I18N[this.currentLang].statusProcessing, 'text-yellow-400');
    } else if (event.type === 'agent_status') {
      if (this.stage) {
        this.stage.setAgentStatus(event.agentId, event.status);
      }
    } else if (event.type === 'conversation') {
      this.appendConversationMessage(event);
    } else if (event.type === 'terminal_output') {
      this.appendTerminalLine(event);
    } else if (event.type === 'operation_complete') {
      this.isProcessing = false;
      this.updateOperationButton();
      this.updateEngineStatus(I18N[this.currentLang].statusOnline, 'text-emerald-400');
    }
  }

  updateEngineStatus(label, colorClass) {
    const el = document.getElementById('engine-status-pill');
    if (el) {
      el.textContent = label;
      el.className = `text-xs font-mono font-bold ${colorClass}`;
    }
  }

  appendConversationMessage(msg) {
    const container = document.getElementById('chat-stream-content');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'mb-4 flex flex-col space-y-1.5 animate-fadeIn';

    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';

    let headerHtml = '';
    if (isUser) {
      headerHtml = `<div class="flex items-center space-x-2 text-xs font-bold text-slate-300">
        <span>👤</span><span>You (User)</span>
      </div>`;
    } else if (isSystem) {
      headerHtml = `<div class="flex items-center space-x-2 text-xs font-bold text-cyan-400">
        <span>⚡</span><span>OVIT Core Orchestrator</span>
      </div>`;
    } else {
      headerHtml = `<div class="flex items-center space-x-2 text-xs font-bold" style="color: ${msg.color || '#10B981'}">
        <span>${msg.avatar || '🤖'}</span><span>${msg.sender}</span>
      </div>`;
    }

    let codeBlockHtml = '';
    if (msg.codeSnippet) {
      codeBlockHtml = `<pre class="text-[11px] leading-relaxed mt-2 text-slate-300 bg-black/60 p-3 rounded-lg border border-slate-800 font-mono"><code>${escapeHtml(msg.codeSnippet)}</code></pre>`;
    }

    el.innerHTML = `
      ${headerHtml}
      <div class="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        ${formatMarkdown(msg.text)}
        ${codeBlockHtml}
      </div>
    `;

    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  appendTerminalLine(item) {
    const container = document.getElementById('terminal-stream-content');
    if (!container) return;

    const line = document.createElement('div');
    line.className = 'text-[11px] font-mono leading-relaxed py-0.5 text-slate-300 flex items-start space-x-2';

    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    line.innerHTML = `
      <span class="text-slate-600 select-none">[${time}]</span>
      <span class="text-emerald-400 select-none">></span>
      <span class="flex-1">${escapeHtml(item.text)}</span>
    `;

    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  async submitCommand() {
    const input = document.getElementById('command-input');
    const prompt = input.value.trim();
    if (!prompt) return;

    const targetAgent = document.getElementById('target-agent-select').value;
    const mode = document.getElementById('exec-mode-select').value;

    input.value = '';
    this.isProcessing = true;
    this.updateOperationButton();

    try {
      await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, targetAgent, mode })
      });
    } catch (e) {
      alert('Error saat eksekusi: ' + e.message);
      this.isProcessing = false;
      this.updateOperationButton();
    }
  }

  async triggerEmergencyStop() {
    try {
      await fetch('/api/emergency-stop', { method: 'POST' });
    } catch (e) {
      console.error('Stop error:', e);
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
  if (!text) return '';
  let out = escapeHtml(text);
  // Bold **text**
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
  // Bullets • or -
  out = out.replace(/\n• (.*?)/g, '<br/>• $1');
  out = out.replace(/\n- (.*?)/g, '<br/>• $1');
  out = out.replace(/\n/g, '<br/>');
  return out;
}

window.addEventListener('DOMContentLoaded', () => {
  window.ovitApp = new OvitApp();
});
