/**
 * OVIT Core Application Controller
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 */

const I18N = {
  ID: {
    providers: 'Halaman Penyedia',
    agents: 'Agen',
    terminal: 'Terminal Agen',
    operation: 'Operasi',
    emergencyStop: 'Hentikan Operasi',
    commandPlaceholder: 'Ketik satu perintah untuk semua agen yang terhubung... (Contoh: Bangun sistem REST API Go + UI React)',
    runCommand: 'Jalankan Perintah',
    running: 'Memproses...',
    allAgents: 'Semua Agen Aktif',
    parallelMode: 'Mode Paralel',
    sequentialMode: 'Mode Bertahap',
    tabChat: 'Percakapan',
    tabTerminal: 'Terminal Mentah',
    clearLogs: 'Bersihkan Log',
    addAgentTitle: 'Tambah & Kustomisasi Tampilan Agen',
    agentNameLabel: 'Nama Agen',
    agentColorLabel: 'Warna Avatar & Mata',
    agentShapeLabel: 'Bentuk 3D Kepala',
    agentCommandLabel: 'Perintah CLI / Eksekutor',
    agentRoleLabel: 'Peran / Spesialisasi',
    davitLabel: 'Alokasi Davit / Donasi',
    saveAgent: 'Simpan Tampilan Agen',
    addNewAgentBtn: '+ Tambah Agen Baru',
    statusOnline: 'ONLINE',
    statusProcessing: 'RUNNING',
    davitCounter: 'Davit'
  },
  EN: {
    providers: 'Providers Page',
    agents: 'Agents',
    terminal: 'Agent Terminal',
    operation: 'Operation',
    emergencyStop: 'Emergency Stop',
    commandPlaceholder: 'Type a unified prompt for all connected agents... (e.g. Build Go REST API + React UI)',
    runCommand: 'Execute Command',
    running: 'Processing...',
    allAgents: 'All Active Agents',
    parallelMode: 'Parallel Mode',
    sequentialMode: 'Sequential Mode',
    tabChat: 'Conversation',
    tabTerminal: 'Raw Terminal',
    clearLogs: 'Clear Logs',
    addAgentTitle: 'Add & Customize Agent Appearance',
    agentNameLabel: 'Agent Name',
    agentColorLabel: 'Avatar & Eye Color',
    agentShapeLabel: '3D Head Shape',
    agentCommandLabel: 'CLI Command / Runner',
    agentRoleLabel: 'Role / Specialization',
    davitLabel: 'Davit / Donation Allocation',
    saveAgent: 'Save Agent Appearance',
    addNewAgentBtn: '+ Add New Agent',
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
    this.terminalSlots = [
      { id: 'slot_1', command: '', name: 'Agen 1', active: false, color: '#10B981', shape: 'cube' },
      { id: 'slot_2', command: '', name: 'Agen 2', active: false, color: '#8B5CF6', shape: 'sphere' },
      { id: 'slot_3', command: '', name: 'Agen 3', active: false, color: '#FF7A00', shape: 'polyhedron' }
    ];
    this.isProcessing = false;
    this.stage = null;
    this.customizer = null;

    this.init();
  }

  async init() {
    this.applyTheme();
    this.applyLanguage();
    this.bindEvents();

    // 1. Init 3D Visualizer Stage (Office Room with Standby Desks)
    this.stage = new AgentThreeStage('three-canvas-container');

    // 2. Init 3D Customizer in Agent Panel
    this.customizer = new AgentCustomizer('customizer-preview-container');

    // 3. Load initial data
    await this.fetchAgents();
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
        this.switchView('terminal');
        const box = document.getElementById('command-input');
        if (box) {
          box.focus();
          box.classList.add('ring-2', 'ring-emerald-400');
          setTimeout(() => box.classList.remove('ring-2', 'ring-emerald-400'), 1000);
        }
      }
    });

    // Add Terminal Slot Button
    document.getElementById('add-terminal-slot-btn').addEventListener('click', () => {
      const newIndex = this.terminalSlots.length + 1;
      this.terminalSlots.push({
        id: `slot_${newIndex}`,
        command: '',
        name: `Agen ${newIndex}`,
        active: false,
        color: '#00E5FF',
        shape: 'torus'
      });
      this.renderTerminalSlots();
    });

    // Command Box Run Button
    document.getElementById('run-command-btn').addEventListener('click', () => {
      this.submitCommand();
    });

    // Command Box Enter Key
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

    // Customizer Color change
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

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (t[key]) el.textContent = t[key];
    });

    const cmdInput = document.getElementById('command-input');
    if (cmdInput) cmdInput.placeholder = t.commandPlaceholder;

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
    document.querySelectorAll('.view-page').forEach(page => page.classList.add('hidden'));

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
      this.agents = Array.isArray(agents) ? agents : [];

      // Sync terminal slots with saved agents
      if (this.agents.length > 0) {
        this.agents.forEach((ag, idx) => {
          if (this.terminalSlots[idx]) {
            this.terminalSlots[idx] = {
              id: ag.id,
              command: ag.command,
              name: ag.name,
              active: true,
              color: ag.color || '#10B981',
              shape: ag.shape || 'sphere'
            };
          } else {
            this.terminalSlots.push({
              id: ag.id,
              command: ag.command,
              name: ag.name,
              active: true,
              color: ag.color || '#10B981',
              shape: ag.shape || 'sphere'
            });
          }
        });
      }

      // Update 3D Stage
      if (this.stage) {
        this.stage.updateAgents(this.agents);
      }

      // Update badge
      const badge = document.getElementById('active-agents-badge');
      if (badge) {
        if (this.agents.length === 0) {
          badge.textContent = '0 Agen Aktif (Standby)';
          badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
        } else {
          badge.textContent = `${this.agents.length} Agen Aktif Terhubung`;
          badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        }
      }

      this.renderTerminalSlots();
      this.renderAgentTargetOptions();
      this.renderAgentsList();
    } catch (e) {
      console.error('Failed to fetch agents:', e);
    }
  }

  renderTerminalSlots() {
    const container = document.getElementById('terminal-slots-container');
    if (!container) return;
    container.innerHTML = '';

    this.terminalSlots.forEach((slot, index) => {
      const isConnected = slot.active;
      const card = document.createElement('div');
      card.className = `p-2.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
        isConnected ? 'bg-slate-900/80 border-emerald-500/50' : 'bg-black/50 border-white/10'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-1.5">
            <span class="w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}"></span>
            <span class="text-xs font-mono font-bold text-slate-200">Slot ${index + 1}: ${slot.name}</span>
          </div>
          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
          }">
            ${isConnected ? 'AKTIF' : 'KOSONG'}
          </span>
        </div>

        <!-- Terminal Command Input Line -->
        <div class="bg-black/80 rounded-lg px-2 py-1.5 border border-white/10 font-mono flex items-center space-x-2">
          <span class="text-emerald-400 font-bold text-xs select-none">$</span>
          <input type="text" class="slot-cmd-input bg-transparent text-xs text-slate-100 placeholder-slate-600 focus:outline-none flex-1"
            value="${slot.command || ''}"
            placeholder="ketik codex / agy / hermes"
            ${isConnected ? 'disabled' : ''}>
        </div>

        <!-- Action Row -->
        <div class="flex items-center justify-between pt-0.5">
          <div class="text-[10px] text-slate-500 font-mono">
            ${isConnected ? `Model: ${slot.shape}` : 'Tulis perintah di atas'}
          </div>
          ${
            isConnected
              ? `<button class="deactivate-slot-btn px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all cursor-pointer">
                  Matikan
                </button>`
              : `<button class="activate-slot-btn px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer">
                  Aktifkan ⚡
                </button>`
          }
        </div>
      `;

      // Auto-suggest name on typing
      const cmdInput = card.querySelector('.slot-cmd-input');
      if (cmdInput && !isConnected) {
        cmdInput.addEventListener('input', (e) => {
          const val = e.target.value.trim().toLowerCase();
          if (val === 'codex') {
            slot.name = 'Codex';
            slot.color = '#10B981';
            slot.shape = 'cube';
          } else if (val === 'agy' || val === 'antigravity') {
            slot.name = 'Antigravity';
            slot.color = '#8B5CF6';
            slot.shape = 'polyhedron';
          } else if (val === 'hermes') {
            slot.name = 'Hermes';
            slot.color = '#FF7A00';
            slot.shape = 'sphere';
          }
          slot.command = e.target.value.trim();
        });
      }

      // Activate Button
      const actBtn = card.querySelector('.activate-slot-btn');
      if (actBtn) {
        actBtn.addEventListener('click', () => {
          const val = cmdInput ? cmdInput.value.trim() : slot.command;
          if (!val) return alert('Silakan tulis perintah agen terlebih dahulu (misal: codex, agy, atau hermes)!');
          this.activateSlot(index, val, slot);
        });
      }

      // Deactivate Button
      const deactBtn = card.querySelector('.deactivate-slot-btn');
      if (deactBtn) {
        deactBtn.addEventListener('click', () => {
          this.deactivateSlot(index, slot);
        });
      }

      container.appendChild(card);
    });
  }

  async activateSlot(index, command, slot) {
    let name = slot.name || `Agen ${index + 1}`;
    let role = 'General Specialist';
    let color = slot.color || '#10B981';
    let shape = slot.shape || 'sphere';

    const cmdLower = command.toLowerCase();
    if (cmdLower.includes('codex')) {
      name = 'Codex';
      role = 'Backend & Core Logic';
      color = '#10B981';
      shape = 'cube';
    } else if (cmdLower.includes('agy') || cmdLower.includes('antigravity')) {
      name = 'Antigravity (Agy)';
      role = 'Frontend & UI/UX Design';
      color = '#8B5CF6';
      shape = 'polyhedron';
    } else if (cmdLower.includes('hermes')) {
      name = 'Hermes';
      role = 'Architecture & QA Orchestration';
      color = '#FF7A00';
      shape = 'sphere';
    }

    const agentData = {
      id: slot.id || `agent_${Date.now()}`,
      name,
      command,
      role,
      color,
      shape,
      davit: 10,
      active: true
    };

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
      const data = await res.json();
      if (data.success) {
        slot.active = true;
        slot.command = command;
        slot.name = name;
        slot.color = color;
        slot.shape = shape;
        await this.fetchAgents();

        // Send conversation event to chat
        this.appendConversationMessage({
          role: 'system',
          sender: 'OVIT Core',
          text: `**Robot Agen [${name}] Berhasil Diaktifkan!**\nPerintah eksekutor: \`${command}\`. Workstation telah aktif di ruangan kantor 3D.`
        });
      }
    } catch (e) {
      alert('Gagal mengaktifkan agen: ' + e.message);
    }
  }

  async deactivateSlot(index, slot) {
    try {
      await fetch(`/api/agents?id=${slot.id}`, { method: 'DELETE' });
      slot.active = false;
      await this.fetchAgents();

      this.appendConversationMessage({
        role: 'system',
        sender: 'OVIT Core',
        text: `Agen **[${slot.name}]** telah dinonaktifkan dan meninggalkan ruangan kantor.`
      });
    } catch (e) {
      alert('Gagal menonaktifkan agen: ' + e.message);
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

    if (this.agents.length === 0) {
      container.innerHTML = `
        <div class="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-500">
          Belum ada agen yang aktif. Masukkan perintah agen di menu Terminal Agen untuk mendaftarkan.
        </div>
      `;
      return;
    }

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
    document.getElementById('customizer-agent-id').value = '';
    document.getElementById('customizer-name').value = 'Agen Baru';
    document.getElementById('customizer-command').value = 'echo "Agent ready"';
    document.getElementById('customizer-role').value = 'General Specialist Agent';
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
        body: JSON.stringify({ id, name, command, role, shape, color, davit, active: true })
      });
      const data = await res.json();
      if (data.success) {
        await this.fetchAgents();
        alert(`Tampilan robot agen ${name} berhasil disimpan!`);
      }
    } catch (e) {
      alert('Gagal menyimpan agen: ' + e.message);
    }
  }

  connectEventStream() {
    const evtSource = new EventSource('/api/stream');

    evtSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.handleStreamEvent(data);
      } catch (err) {}
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
        <span>🤖</span><span>${msg.sender}</span>
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

    if (this.agents.length === 0) {
      this.appendConversationMessage({
        role: 'system',
        sender: 'OVIT Core',
        text: '⚠️ **Belum ada agen yang aktif!** Silakan isi perintah agen di slot terminal di atas (misal ketik `codex` atau `agy`) lalu klik **[Aktifkan Agen ⚡]**.'
      });
      return;
    }

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
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
  out = out.replace(/\n• (.*?)/g, '<br/>• $1');
  out = out.replace(/\n- (.*?)/g, '<br/>• $1');
  out = out.replace(/\n/g, '<br/>');
  return out;
}

window.addEventListener('DOMContentLoaded', () => {
  window.ovitApp = new OvitApp();
});
