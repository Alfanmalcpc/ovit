const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');

const DEFAULT_TEMPLATES = [
  {
    id: 'tmpl_fullstack',
    title: 'Arsitektur Fullstack Web Modern',
    category: 'Development',
    description: 'Bagi tugas otomatis: Codex kerjakan backend REST API, Antigravity kerjakan frontend UI, Hermes mengorkestrasi autentikasi dan database.',
    command: 'Bangun sistem aplikasi web lengkap dengan REST API backend, interface dashboard responsif, dan skema database PostgreSQL.',
    tags: ['Fullstack', 'Multi-Agent', 'Auto-Delegasi']
  },
  {
    id: 'tmpl_security_audit',
    title: 'Audit Keamanan & OWASP Top 10',
    category: 'Security',
    description: 'Hermes memeriksa celah injeksi & izin autentikasi, Codex memverifikasi sanitasi input backend, Antigravity mengecek keamanan client-side.',
    command: 'Lakukan audit keamanan menyeluruh terhadap codebase ini, cari potensi celah XSS, SQLi, IDOR, dan kebocoran credential.',
    tags: ['Security', 'Audit', 'Hardening']
  },
  {
    id: 'tmpl_code_review',
    title: 'Review Kode & Optimalisasi Performa',
    category: 'Review',
    description: 'Semua agen membedah commit terbaru, menghapus memory leak, meningkatkan typing strictness, dan memangkas waktu build.',
    command: 'Review seluruh file perubahan terbaru, berikan rekomendasi refactoring, eliminasi duplikasi kode, dan tingkatkan performa eksekusi.',
    tags: ['Refactoring', 'Performance', 'Clean Code']
  },
  {
    id: 'tmpl_auto_tests',
    title: 'Pembuatan Unit Test & E2E Test Suite',
    category: 'Testing',
    description: 'Codex menyusun unit test logic, Hermes menyusun integration test dan edge-case coverage 100%.',
    command: 'Buatkan automated unit test dan integration test suite lengkap dengan mock data dan assertion ketat untuk semua modul utama.',
    tags: ['Testing', 'Jest', 'Coverage']
  }
];

function ensureLibraryFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LIBRARY_FILE)) {
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify({ templates: DEFAULT_TEMPLATES, history: [] }, null, 2), 'utf-8');
  }
}

function getLibrary() {
  ensureLibraryFile();
  try {
    const raw = fs.readFileSync(LIBRARY_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { templates: DEFAULT_TEMPLATES, history: [] };
  }
}

function saveLibrary(data) {
  ensureLibraryFile();
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function addHistoryEntry(entry) {
  const lib = getLibrary();
  lib.history.unshift({
    id: `hist_${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...entry
  });
  if (lib.history.length > 50) lib.history = lib.history.slice(0, 50);
  saveLibrary(lib);
}

module.exports = {
  getLibrary,
  saveLibrary,
  addHistoryEntry
};
