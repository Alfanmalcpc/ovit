# ⚡ OVIT — Open-Source Multi-Agent Orchestrator
### One Command to Rule All AI Coding Agents on Localhost

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0a0e12,0d1f14,133621,1c5432,238636,2ea043&height=220&section=header&text=OVIT%20ENGINE&fontSize=52&fontColor=ffffff&fontAlignY=42&desc=Local-First%20Multi-Agent%20Collaboration%20Platform&descAlignY=62&descSize=18" alt="OVIT Banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/Alfanmalcpc"><img src="https://img.shields.io/badge/Author-Alfanmalcpc-2ea043?style=for-the-badge&logo=github&logoColor=white" alt="Author" /></a>
  <img src="https://img.shields.io/badge/Runtime-Node.js%20(Zero--Dependency)-238636?style=for-the-badge&logo=node.js&logoColor=white" alt="Zero Dep" />
  <img src="https://img.shields.io/badge/3D%20Engine-Three.js%20WebGL-00E5FF?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
</p>

---

## 🌟 Apa itu OVIT?

**OVIT** adalah platform orchestrator multi-agen open-source lokal yang memungkinkan berbagai coding agent (seperti **Hermes**, **Codex**, **Antigravity / Agy**, Claude Code, Grok, dll.) bekerja sama dalam **satu instruksi perintah tunggal**.

Hanya dengan mengetik `ovit` di terminal, dashboard visualizer 3D langsung terbuka di browser Anda secara offline tanpa instalasi paket dependency berat.

---

## ✨ Fitur Unggulan

1. **🚀 1 Command Local Execution (`ovit`)**:
   - Cukup jalankan perintah `ovit` atau `npm start`, server lokal otomatis menyala dan membuka browser di `http://localhost:3800` (auto-fallback ke 3801/3802 jika port bentrok).
   - **Zero External npm Dependency**: Menggunakan built-in Node.js runtime untuk mencegah error `node_modules` atau kendala filesystem virtual.

2. **🤖 Multi-Agent Smart Delegation**:
   - Menerima 1 perintah user, lalu otomatis memecah tugas secara kolaboratif ke agen spesialis:
     - **Hermes**: Perencanaan arsitektur, testing, dan koordinasi sistem.
     - **Codex**: Logika backend, API, algoritma inti, dan database.
     - **Antigravity (Agy)**: Antarmuka frontend UI/UX, styling, dan integrasi review.
   - Tersedia mode **Paralel (Serentak)** dan **Pipeline (Bertahap)**.

3. **🎮 Panggung Animasi 3D Interaktif (Three.js WebGL)**:
   - Visualisasi avatar pod 3D untuk setiap agen dengan dynamic mesh (Sphere, Cyber Cube, Polyhedron Crystal, Torus).
   - Efek rotasi, levitasi sinusoidal, cincin orbit, dan pancaran partikel energi saat agen sedang bekerja.
   - Mendukung kontrol interaktif mouse (OrbitControls: drag rotasi, zoom, pan).

4. **📐 Tata Letak Presisi Sesuai Sketsa**:
   - **Panggung Animasi 3D**: Terletak di area panggung utama atas.
   - **Tempat Perintah (Command Box)**: Diposisikan tepat **di bawah animasinya** dengan selector target agen dan shortcut keyboard.
   - **Panel Hasil Percakapan & Raw Terminal**: Terletak di **sisi sebelah kanan** dengan tab feed percakapan real-time dan console emulator streaming.

5. **🎨 Halaman Panel Agen ("Tambah Tampilan Agen")**:
   - Kostumisasi warna avatar (palet neon cyber atau custom HEX).
   - Pilihan bentuk geometri 3D dengan preview rendering instan.
   - Konfigurasi perintah eksekutor CLI dan alokasi poin Davit/Donasi.

6. **📚 Halaman Pustaka**:
   - Template prompt bawaan untuk Fullstack App Scaffold, Security Audit, Unit Testing, dan Bug Hunter.
   - 1-klik untuk memasukkan template langsung ke kotak perintah.

---

## ⚡ Cara Instalasi & Menjalankan

### Cara 1: Global CLI (Rekomendasi)
```bash
git clone https://github.com/Alfanmalcpc/ovit.git
cd ovit
npm link
ovit
```

### Cara 2: Direct Node
```bash
git clone https://github.com/Alfanmalcpc/ovit.git
cd ovit
node bin/ovit.js
```
*(Atau `npm start`)*

---

## 📁 Struktur Repositori

```text
ovit/
├── bin/
│   └── ovit.js             # Global CLI entrypoint
├── src/
│   ├── server.js           # Zero-dep HTTP & SSE server with auto port-fallback
│   ├── orchestrator.js     # Multi-agent prompt router & delegation engine
│   ├── agentRegistry.js    # Agent management & JSON persistence
│   └── libraryStore.js     # Prompt templates & workflow storage
├── public/
│   ├── index.html          # Cinematic dashboard UI
│   ├── css/style.css       # Dark cyber aesthetic & glassmorphism
│   ├── js/
│   │   ├── app.js          # Core frontend SPA & SSE listener
│   │   ├── threeScene.js   # Three.js 3D multi-agent stage
│   │   └── agentCustomizer.js # Live 3D preview customizer
│   └── vendor/
│       ├── three.min.js    # Three.js r128 (Offline bundled)
│       ├── OrbitControls.js# Three.js OrbitControls (Offline bundled)
│       └── tailwind.js     # Tailwind CSS runtime (Offline bundled)
├── data/
│   ├── agents.json         # Active agents state
│   └── library.json        # Saved prompt templates
├── test/
│   └── verify.js           # Automated integration test suite
├── plan.md                 # Technical blueprint & architecture specification
└── package.json            # Package metadata & CLI config
```

---

## 👤 Author & Lisensi

Dibuat dengan dedikasi oleh **Mochamad Alfan Candrapratama** ([@Alfanmalcpc](https://github.com/Alfanmalcpc)).  
Lisensi: **MIT** — Terbuka untuk seluruh komunitas developer di dunia! 🚀
