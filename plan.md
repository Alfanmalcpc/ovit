# PLAN & BLUEPRINT TEKNIS ARSITEKTUR LENGKAP: OVIT
### Open-Source Multi-Agent Orchestrator (Local-First & Anti-Bug Engine)

> **Arsitek & Author**: Mochamad Alfan Candrapratama (@Alfanmalcpc)  
> **Status Dokumen**: Final Approved Blueprint (`plan.md`)  
> **Direktori Root Projek**: `G:/My Drive/ovit/`  
> **Target Eksekusi CLI**: Mengetik `ovit` di terminal langsung menjalankan sistem 100% offline di localhost.

---

## 1. Tata Letak Antarmuka Presisi (Berdasarkan Sketsa & Revisi Terakhir)

Antarmuka web lokal disusun dengan grid 3-kolom modern yang responsif dan ergonomis:

### A. Kolom Kiri: Sidebar Navigasi Permanen (Width: 260px)
* **Logo & Status Engine**: Logo `ovit` dengan lampu indikator status runtime server lokal (Hijau = Online, Kuning = Memproses Tugas, Merah = Offline).
* **Menu Halaman Pustaka**: Penyimpanan template prompt, log riwayat sesi, dan katalog skill/aturan agen.
* **Menu Agen**: Pengaturan profil agen, manajemen slot runtime, dan kustomisasi 3D avatar (Warna, Bentuk, Preview, Nama, Nilai Donasi/Davit).
* **Menu Terminal Agen**: Workspace aktif kolaborasi agen.

### B. Header Atas (Top Control Bar)
* **Status Bar & Breadcrumb**: Penunjuk modul aktif saat ini.
* **Tombol Operasi (`[Operasi]`)**: Trigger cepat untuk memulai workflow delegasi otomatis atau menghentikan darurat (*Emergency Stop*).
* **Theme Switcher**: Dark mode (Cinematic slate/charcoal) & Light mode.
* **Language Switcher**: Toggle instan Bahasa Indonesia (`ID`) dan Bahasa Inggris (`EN`).
* **Counter Donasi / Davit**: Nilai 10 kredit token/apresiasi komunitas.

### C. Kolom Tengah: Panggung Visualisasi 3D & Input Perintah (Primary Stage)
* **Area Atas (Wadah 3D Model Animasi)**: 
  * Kanvas Three.js interaktif berlatar panggung bulat (*pod/bowl display*) untuk tiap agen yang aktif (misal: Pod Agen 1 Hermes, Pod Agen 2 Codex, Pod Agen 3 Antigravity).
  * Karakter 3D memiliki status animasi dinamis: *Idle Float* (saat siaga), *Pulsing Orbit* (saat berpikir/generate kode), *High-speed Sparkle* (saat menyelesaikan tugas), dan *Error Alert* (jika perintah gagal).
* **Area Bawah (Tempat Perintah Utama / Command Box)**:
  * Terletak tepat di bawah wadah animasi 3D.
  * Dilengkapi tombol submit cepat, selector agen target (Bisa "Semua Agen" atau "Spesifik Agen"), dan toggle mode kolaborasi (*Parallel Execution* vs *Sequential Pipeline*).

### D. Kolom Kanan: Panel Hasil Percakapan & Log Interaktif (Right Feed Panel)
* **Live Chat & Result Stream**: Menampilkan dialog percakapan antar-agen, sintesis jawaban akhir untuk pengguna, ringkasan kode hasil kolaborasi, dan file diff secara real-time.
* **Tab Switcher di Kolom Kanan**:
  1. *Tab Percakapan (Dialog)*: Tampilan obrolan natural AI ala chat messenger terstruktur.
  2. *Tab Raw Terminal*: Tampilan output konsol terminal asli (*stdout/stderr*) dari masing-masing CLI agen via virtual terminal xterm.js.
  3. *Tab Ringkasan Berkas*: Daftar file yang berhasil dibuat atau diubah oleh agen selama tugas berjalan.

---

## 2. Arsitektur Anti-Bug & Eksekusi 100% Offline di Localhost

Untuk memastikan sistem berjalan mulus tanpa error saat user pertama kali mendownload dan mengetik `ovit`:

### A. Mekanisme Zero-Crash Local Server & Port Auto-Fallback
* **Deteksi Port Bebas**: Server backend lokal secara cerdas mencoba port default `3800`. Jika port sedang terpakai aplikasi lain, backend otomatis berpindah ke `3801`, `3802`, dst., lalu mengarahkan browser otomatis tanpa crash.
* **Localhost-Only Binding**: Terikat secara eksklusif pada `127.0.0.1` demi privasi dan keamanan total (data pengguna dan kode tidak keluar ke jaringan publik).
* **Pembersihan Zombie Process**: Saat aplikasi ditutup (Ctrl+C atau SIGINT/SIGTERM), sistem membersihkan seluruh spawned child process agen secara tuntas agar tidak membebani memori CPU/RAM.

### B. Cross-Platform PTY & CLI Adapter Engine
* **Universal Agent Adapter**:
  * Menjalankan agen lokal (Hermes, Codex, Antigravity/agy, Claude Code, Grok, Ollama) melalui runtime runner berbasis `child_process.spawn` dengan opsi fallback tanpa dependensi C++ native compiler yang rumit.
  * Di Windows, sistem secara otomatis mendeteksi ketersediaan executable via `where <agent>` atau fallback ke shell `.cmd` / `.ps1` / Git Bash. Di macOS/Linux mendeteksi via `which <agent>`.
* **Deteksi Agen Otomatis**: Jika user mengetikkan nama agen yang belum terpasang di komputernya, sistem tidak crash, melainkan menampilkan instruksi ramah di layar web untuk instalasi atau opsi memakai agen alternatif yang tersedia.

### C. WebGL 3D Fail-Safe Renderer
* **Fallback Canvas**: Three.js dirancang dengan modul *lightweight procedural meshes* (tanpa ketergantungan file 3D `.gltf` raksasa dari internet). Jika browser pengguna tidak mengaktifkan akselerasi GPU, mesin visual secara halus beralih ke rendering SVG/Canvas 2D tanpa menurunkan fungsi kontrol sama sekali.

---

## 3. Alur Kerja Logika Orkestrasi (The Core Engine)

1. **User Input**: Pengguna mengetik perintah di kotak perintah bawah animasi: *"Buat sistem login JWT lengkap dengan endpoint Go dan komponen UI Svelte"*.
2. **Task Planner & Delegator (Local Orchestrator)**:
   * Mengurai perintah menjadi 2 sub-tugas terpisah:
     * Sub-tugas A (Backend): Diberikan ke Codex / Antigravity.
     * Sub-tugas B (Frontend): Diberikan ke Hermes.
3. **Animasi 3D Bereaksi**: Pod Agen 1 dan Pod Agen 2 serentak berputar dan memancarkan efek cahaya partikel di layar tengah.
4. **Streaming Real-time**: Output pengerjaan mengalir ke panel kanan. Pengguna dapat membaca ringkasan percakapan yang rapi atau beralih melihat baris kode terminal mentah.
5. **Final Aggregation**: Agen saling memvalidasi output sebelum dinyatakan selesai. Hasil akhir disajikan lengkap di panel kanan siap salin atau langsung tersimpan di direktori kerja user.

---

## 4. Struktur Repositori & File Projek (`ovit`)

```text
ovit/
├── bin/
│   └── ovit.js                     # CLI bin script (dieksekusi saat user ketik 'ovit')
├── packages/
│   ├── server/                     # Backend local orchestrator & WebSocket bridge
│   │   ├── src/
│   │   │   ├── index.ts            # Entrypoint Express + HTTP + WebSocket
│   │   │   ├── portFinder.ts       # Fallback port scanner otomatis
│   │   │   ├── agentRunner.ts      # Multi-process executor & output streamer
│   │   │   ├── taskRouter.ts       # Logika pembagi dan delegator tugas
│   │   │   └── processCleaner.ts   # Graceful exit & memory garbage cleanup
│   │   └── package.json
│   ├── client/                     # Frontend visual dashboard (Vite + React)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── 3d/
│   │   │   │   │   ├── AgentStage.tsx      # Panggung 3D utama Three.js
│   │   │   │   │   ├── AgentPod.tsx        # Karakter & wadah pod bulat 3D
│   │   │   │   │   └── FallbackAvatar.tsx  # Mode 2D fallback jika no GPU
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx         # Logo, Pustaka, Agen, Terminal
│   │   │   │   │   └── Header.tsx          # [Operasi], Tema, Bahasa, Davit/Donasi
│   │   │   │   ├── command/
│   │   │   │   │   └── CommandBox.tsx      # Tempat perintah di bawah animasi
│   │   │   │   └── feed/
│   │   │   │       ├── ConversationFeed.tsx# Hasil percakapan di sebelah kanan
│   │   │   │       └── TerminalStream.tsx  # Tab raw terminal
│   │   │   ├── pages/
│   │   │   │   ├── TerminalPage.tsx
│   │   │   │   ├── AgentPanelPage.tsx
│   │   │   │   └── LibraryPage.tsx
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   └── package.json
│   └── shared/                     # Tipe data TypeScript bersama
├── plan.md                         # Blueprint ini (panduan teknis mutlak)
├── README.md                       # Panduan instalasi dan penggunaan untuk publik
└── package.json                    # Workspace root
```

---

## 5. Kesimpulan Kesiapan
Semua aspek teknis—mulai dari posisi kotak perintah tepat di bawah kanvas animasi 3D, panel hasil percakapan di sebelah kanan, arsitektur pencegahan bug pada port & sistem operasi Windows/Linux/macOS, hingga kesiapan jalan 100% offline di localhost—telah diformulasikan secara matang dan presisi. Dokumen ini menjadi acuan tunggal sebelum kita menginjak tahap penulisan kode antarmuka web.
