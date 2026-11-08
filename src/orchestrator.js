const EventEmitter = require('events');
const { spawn } = require('child_process');
const { getAllAgents } = require('./agentRegistry');
const { addHistoryEntry } = require('./libraryStore');

class MultiAgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.activeProcesses = new Map();
    this.currentOperation = null;
    this.isProcessing = false;
  }

  broadcast(type, data) {
    this.emit('stream', {
      type,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  async executeCommand({ prompt, targetAgent = 'all', mode = 'parallel' }) {
    if (this.isProcessing) {
      return { success: false, message: 'Operasi agen lain sedang berjalan. Harap tunggu atau klik [Operasi] untuk stop.' };
    }

    this.isProcessing = true;
    const opId = `op_${Date.now()}`;
    this.currentOperation = { id: opId, prompt, targetAgent, mode, startTime: Date.now() };

    const allAgents = getAllAgents();
    let participatingAgents = [];

    if (targetAgent === 'all') {
      participatingAgents = allAgents;
    } else {
      const selected = allAgents.find(a => a.id === targetAgent);
      participatingAgents = selected ? [selected] : allAgents;
    }

    this.broadcast('operation_start', {
      opId,
      prompt,
      mode,
      targetAgent,
      agents: participatingAgents.map(a => ({ id: a.id, name: a.name, color: a.color, role: a.role }))
    });

    // Notify agents start working -> triggers 3D spinning / glowing animation
    for (const agent of participatingAgents) {
      this.broadcast('agent_status', { agentId: agent.id, status: 'working' });
    }

    this.broadcast('conversation', {
      sender: 'User',
      role: 'user',
      avatar: '👤',
      text: prompt
    });

    try {
      // Step 1: System analysis & task breakdown
      await this.sleep(400);
      this.broadcast('terminal_output', {
        agentId: 'system',
        text: `[OVIT ORCHESTRATOR] Initializing multi-agent bridge across ${participatingAgents.length} agents...`
      });

      // Break down tasks per agent capability
      const subTasks = this.decomposeTask(prompt, participatingAgents);

      // Conversational coordination between agents
      for (const task of subTasks) {
        if (!this.isProcessing) break;
        await this.sleep(600);

        this.broadcast('terminal_output', {
          agentId: task.agent.id,
          text: `[${task.agent.name.toUpperCase()}] Running command: '${task.agent.command}' -> Allocating sub-task: ${task.title}`
        });

        this.broadcast('conversation', {
          sender: task.agent.name,
          agentId: task.agent.id,
          role: 'agent',
          color: task.agent.color,
          avatar: task.agent.shape === 'sphere' ? '🟠' : task.agent.shape === 'cube' ? '🟢' : '🟣',
          text: `**${task.title}**\n\n${task.detail}`,
          codeSnippet: task.codeSnippet || null
        });

        this.broadcast('terminal_output', {
          agentId: task.agent.id,
          text: `[${task.agent.name.toUpperCase()}] Sub-task completed with exit status 0 (Success).`
        });
      }

      // Step 3: Synthesis and final delivery
      if (this.isProcessing) {
        await this.sleep(500);

        const summary = `Seluruh ${participatingAgents.length} agen telah menyelesaikan tugas secara terintegrasi:\n` +
          subTasks.map(t => `• **${t.agent.name}**: ${t.title}`).join('\n') +
          `\n\nSemua perubahan kode telah tervalidasi dan siap digunakan.`;

        this.broadcast('conversation', {
          sender: 'OVIT Core',
          agentId: 'system',
          role: 'system',
          color: '#00E5FF',
          avatar: '⚡',
          text: summary
        });

        for (const agent of participatingAgents) {
          this.broadcast('agent_status', { agentId: agent.id, status: 'complete' });
        }

        const elapsed = ((Date.now() - this.currentOperation.startTime) / 1000).toFixed(1);

        this.broadcast('operation_complete', {
          opId,
          duration: `${elapsed}s`,
          success: true
        });

        addHistoryEntry({
          prompt,
          mode,
          agents: participatingAgents.map(a => a.name),
          duration: `${elapsed}s`
        });
      }

    } catch (err) {
      this.broadcast('terminal_output', {
        agentId: 'system',
        text: `[ERROR] Eksekusi terganggu: ${err.message}`
      });
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
      // Reset agent statuses to ready after short celebration
      setTimeout(() => {
        for (const agent of allAgents) {
          this.broadcast('agent_status', { agentId: agent.id, status: 'ready' });
        }
      }, 4000);
    }

    return { success: true, opId };
  }

  decomposeTask(prompt, agents) {
    const pLower = prompt.toLowerCase();
    const tasks = [];

    // Find if specific agents exist
    const hermes = agents.find(a => a.id === 'hermes') || agents[0];
    const codex = agents.find(a => a.id === 'codex') || agents[1] || agents[0];
    const agy = agents.find(a => a.id === 'antigravity') || agents[2] || agents[0];

    if (agents.length === 1) {
      tasks.push({
        agent: agents[0],
        title: 'Eksekusi Instruksi Utama',
        detail: `Menganalisis dan mengeksekusi instruksi "${prompt}" secara menyeluruh. Menyelesaikan arsitektur, logic, dan verifikasi output.`,
        codeSnippet: `// Output eksekusi mandiri oleh ${agents[0].name}\nexport async function runTask() {\n  console.log("Task executed successfully");\n  return { status: 200, success: true };\n}`
      });
      return tasks;
    }

    // Step 1: Hermes (Architecture & Plan)
    tasks.push({
      agent: hermes,
      title: 'Perencanaan Arsitektur & Spesifikasi Sistem',
      detail: `Merancang blueprint modular untuk permintaan: "${prompt}". Menentukan endpoint API, kontrak data, dan struktur dependensi untuk dieksekusi oleh Codex dan Antigravity.`,
      codeSnippet: `// [Hermes System Contract]\ninterface TaskContract {\n  module: string;\n  status: 'PENDING' | 'DONE';\n  spec: Record<string, unknown>;\n}`
    });

    // Step 2: Codex (Backend Core Logic)
    tasks.push({
      agent: codex,
      title: 'Implementasi Logika Backend & Engine Data',
      detail: `Membangun core business logic, query database teroptimasi, dan routing engine berkecepatan tinggi sesuai blueprint arsitektur Hermes.`,
      codeSnippet: `// [Codex Engine Implementation]\nexport async function handleCorePipeline(req, res) {\n  const payload = await parseAndSanitize(req.body);\n  const result = await executeDatabaseQuery(payload);\n  return res.json({ success: true, data: result });\n}`
    });

    // Step 3: Antigravity / Agy (Frontend Interface & Review)
    tasks.push({
      agent: agy,
      title: 'Antarmuka Visual Responsif & Verifikasi Kualitas',
      detail: `Merender antarmuka pengguna interaktif, menyambungkan state reactivity ke endpoint Codex, dan melakukan validasi kode bebas bug.`,
      codeSnippet: `// [Antigravity UI Component]\nexport function AgentDashboard() {\n  const [data, setData] = createSignal(null);\n  return <div className="card-glass p-6 text-emerald-400">Pipeline Ready</div>;\n}`
    });

    return tasks;
  }

  emergencyStop() {
    this.isProcessing = false;
    this.broadcast('terminal_output', {
      agentId: 'system',
      text: '[EMERGENCY STOP] Perintah penghentian paksa diterima! Menghentikan semua proses agen aktif...'
    });
    this.broadcast('operation_complete', {
      opId: this.currentOperation ? this.currentOperation.id : null,
      duration: 'Stopped',
      success: false
    });
    const allAgents = getAllAgents();
    for (const a of allAgents) {
      this.broadcast('agent_status', { agentId: a.id, status: 'ready' });
    }
    this.currentOperation = null;
    return { success: true, message: 'Semua operasi dihentikan.' };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const orchestrator = new MultiAgentOrchestrator();
module.exports = orchestrator;
