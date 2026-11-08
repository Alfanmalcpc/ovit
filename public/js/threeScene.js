/**
 * OVIT 3D Virtual Office Room & Expressive Robot Agents
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 * Featuring: Permanent 3D Tech Workstations, Cyberpunk Office HQ,
 * and Expressive Digital-Eye Robot Agents.
 */

class AgentThreeStage {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.animId = null;

    // Workstation Desks (Always in the room)
    this.deskPositions = [
      { x: -3.8, z: 0.5, rot: 0.25, label: 'Meja 1 (Slot 1)' },
      { x: 0.0, z: -0.2, rot: 0.0, label: 'Meja 2 (Slot 2)' },
      { x: 3.8, z: 0.5, rot: -0.25, label: 'Meja 3 (Slot 3)' }
    ];
    this.workstationMeshes = [];

    // Agent Avatars currently seated at workstations
    this.agentMeshes = new Map();
    this.ambientLight = null;
    this.dirLight = null;

    // Room objects for subtle animation
    this.animatedScreens = [];
    this.floatingDecor = [];

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 260;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080c14);
    this.scene.fog = new THREE.FogExp2(0x080c14, 0.035);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 5.2, 9.8);
    this.camera.lookAt(0, 1.2, 0);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.05;
      this.controls.minDistance = 4;
      this.controls.maxDistance = 16;
      this.controls.target.set(0, 1.2, 0);
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Build Office Room Architecture
    this.createOfficeArchitecture();

    // 7. Build the 3 Permanent Workstation Desks
    this.buildPermanentWorkstations();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onResize());

    // 9. Start Loop
    this.animate();
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0x182438, 1.8);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xdff0ff, 1.2);
    this.dirLight.position.set(5, 10, 7);
    this.scene.add(this.dirLight);

    const blueRim = new THREE.DirectionalLight(0x00e5ff, 0.8);
    blueRim.position.set(-8, 6, -5);
    this.scene.add(blueRim);

    const purpRim = new THREE.DirectionalLight(0x8b5cf6, 0.6);
    purpRim.position.set(8, 4, -4);
    this.scene.add(purpRim);
  }

  createOfficeArchitecture() {
    const roomGroup = new THREE.Group();

    // Floor with grid tiles
    const floorGeo = new THREE.PlaneGeometry(24, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      roughness: 0.25,
      metalness: 0.85
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    roomGroup.add(floor);

    // Glowing Neon Floor Grid
    const grid = new THREE.GridHelper(24, 24, 0x00e5ff, 0x142845);
    grid.position.y = 0.01;
    roomGroup.add(grid);

    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(24, 8);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x0d1424,
      roughness: 0.6,
      metalness: 0.4
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 4, -5);
    roomGroup.add(backWall);

    // Glowing Baseboard Neon Trim
    const baseboardGeo = new THREE.BoxGeometry(24, 0.12, 0.12);
    const baseboardMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const baseboard = new THREE.Mesh(baseboardGeo, baseboardMat);
    baseboard.position.set(0, 0.06, -4.95);
    roomGroup.add(baseboard);

    // HQ Digital Signboard
    const signGroup = this.createHQSign();
    signGroup.position.set(0, 6.2, -4.9);
    roomGroup.add(signGroup);

    // Server Racks on Left Wall
    for (let i = 0; i < 3; i++) {
      const rack = this.createServerRack();
      rack.position.set(-8.5 + (i * 1.5), 2.2, -4.2);
      roomGroup.add(rack);
    }

    // Holographic Tech Tower on Right
    const rightTower = this.createCyberPlant();
    rightTower.position.set(8.5, 1.2, -3.5);
    roomGroup.add(rightTower);

    this.scene.add(roomGroup);
  }

  createHQSign() {
    const group = new THREE.Group();
    const bgGeo = new THREE.BoxGeometry(8.5, 1.4, 0.1);
    const bgMat = new THREE.MeshStandardMaterial({ color: 0x080f1e, metalness: 0.9, roughness: 0.2 });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    group.add(bg);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#080f1e';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 74px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ OVIT MULTI-AGENT HQ', 512, 115);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Autonomous Local Orchestration Environment', 512, 190);

    const tex = new THREE.CanvasTexture(canvas);
    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(8.3, 1.25),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true })
    );
    signFace.position.z = 0.06;
    group.add(signFace);

    return group;
  }

  createServerRack() {
    const group = new THREE.Group();
    const rackGeo = new THREE.BoxGeometry(1.2, 4.4, 1.2);
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x111927, metalness: 0.8, roughness: 0.3 });
    const rack = new THREE.Mesh(rackGeo, rackMat);
    group.add(rack);

    for (let r = 0; r < 8; r++) {
      const ledColor = Math.random() > 0.4 ? 0x00e5ff : (Math.random() > 0.5 ? 0x10b981 : 0x8b5cf6);
      const ledGeo = new THREE.BoxGeometry(0.9, 0.06, 0.05);
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0, -1.8 + (r * 0.5), 0.61);
      group.add(led);
      this.floatingDecor.push({ mesh: led, type: 'blink', baseColor: ledColor });
    }
    return group;
  }

  createCyberPlant() {
    const group = new THREE.Group();
    const potGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.4, 8);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x141e2e, metalness: 0.8 });
    const pot = new THREE.Mesh(potGeo, potMat);
    group.add(pot);

    const orbGeo = new THREE.DodecahedronGeometry(0.9, 1);
    const orbMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x064e3b,
      wireframe: true
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 1.4;
    group.add(orb);
    this.floatingDecor.push({ mesh: orb, type: 'rotate' });
    return group;
  }

  buildPermanentWorkstations() {
    this.deskPositions.forEach((pos, idx) => {
      const deskGroup = new THREE.Group();
      deskGroup.position.set(pos.x, 0, pos.z);
      deskGroup.rotation.y = pos.rot;

      // 1. Sleek Tech Desk Surface
      const topGeo = new THREE.BoxGeometry(2.4, 0.1, 1.3);
      const topMat = new THREE.MeshStandardMaterial({
        color: 0x131d2e,
        roughness: 0.3,
        metalness: 0.8
      });
      const deskTop = new THREE.Mesh(topGeo, topMat);
      deskTop.position.set(0, 1.0, 0);
      deskGroup.add(deskTop);

      // Neon Desk Edge Trim
      const trimGeo = new THREE.BoxGeometry(2.42, 0.02, 1.32);
      const trimMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
      const trim = new THREE.Mesh(trimGeo, trimMat);
      trim.position.set(0, 1.01, 0);
      deskGroup.add(trim);

      // Desk Legs
      const legGeo = new THREE.BoxGeometry(0.08, 1.0, 1.1);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x0b111c, metalness: 0.9, roughness: 0.4 });
      const legL = new THREE.Mesh(legGeo, legMat);
      legL.position.set(-1.1, 0.5, 0);
      deskGroup.add(legL);

      const legR = new THREE.Mesh(legGeo, legMat);
      legR.position.set(1.1, 0.5, 0);
      deskGroup.add(legR);

      // 2. Futuristic Ergonomic Chair
      const chairGroup = new THREE.Group();
      chairGroup.position.set(0, 0, 1.1);

      const seatGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
      const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.5 });
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.y = 0.65;
      chairGroup.add(seat);

      const backGeo = new THREE.BoxGeometry(0.7, 0.9, 0.1);
      const backMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.6 });
      const chairBack = new THREE.Mesh(backGeo, backMat);
      chairBack.position.set(0, 1.15, 0.35);
      chairGroup.add(chairBack);

      const chairBaseGeo = new THREE.CylinderGeometry(0.05, 0.4, 0.65, 6);
      const chairBase = new THREE.Mesh(chairBaseGeo, legMat);
      chairBase.position.y = 0.32;
      chairGroup.add(chairBase);

      deskGroup.add(chairGroup);

      // 3. Dual Curved Holographic Monitors
      const monitorsGroup = new THREE.Group();
      monitorsGroup.position.set(0, 1.45, -0.25);

      // Left Monitor
      const monL = this.createMonitorMesh(`Slot ${idx + 1}`, false);
      monL.position.set(-0.6, 0, 0);
      monL.rotation.y = 0.25;
      monitorsGroup.add(monL);

      // Right Monitor
      const monR = this.createMonitorMesh(`Terminal ${idx + 1}`, true);
      monR.position.set(0.6, 0, 0);
      monR.rotation.y = -0.25;
      monitorsGroup.add(monR);

      deskGroup.add(monitorsGroup);

      // 4. Standby Holographic Beacon & Slot Sign (Visible when no agent is present)
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(0, 1.8, 1.0);

      // Pulsing Ring
      const ringGeo = new THREE.RingGeometry(0.35, 0.42, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      beaconGroup.add(ring);

      // Floating Standby Text Badge
      const badgeMesh = this.createStandbyBadge(`SLOT ${idx + 1}: KOSONG`);
      badgeMesh.position.set(0, 0.5, 0);
      beaconGroup.add(badgeMesh);

      deskGroup.add(beaconGroup);

      this.scene.add(deskGroup);

      this.workstationMeshes.push({
        group: deskGroup,
        beaconGroup,
        ring,
        monL,
        monR,
        index: idx
      });
    });
  }

  createMonitorMesh(title, isRight) {
    const group = new THREE.Group();

    // Stand
    const standGeo = new THREE.CylinderGeometry(0.03, 0.08, 0.4, 8);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x0b111c, metalness: 0.9 });
    const stand = new THREE.Mesh(standGeo, standMat);
    stand.position.y = -0.2;
    group.add(stand);

    // Screen Bezel
    const bezelGeo = new THREE.BoxGeometry(0.95, 0.55, 0.04);
    const bezelMat = new THREE.MeshStandardMaterial({ color: 0x0b111c, metalness: 0.8, roughness: 0.4 });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    group.add(bezel);

    // Dynamic Canvas Display
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');

    this.renderScreenStandby(ctx, canvas.width, canvas.height, title);

    const tex = new THREE.CanvasTexture(canvas);
    const screenGeo = new THREE.PlaneGeometry(0.9, 0.5);
    const screenMat = new THREE.MeshBasicMaterial({ map: tex });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.025;
    group.add(screenMesh);

    this.animatedScreens.push({
      canvas,
      ctx,
      tex,
      title,
      isRight,
      activeAgent: null,
      tick: Math.random() * 100
    });

    return group;
  }

  renderScreenStandby(ctx, w, h, title) {
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    // Neon Frame
    ctx.strokeStyle = '#00e5ff33';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Header
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`⚡ ${title}`, w / 2, 32);

    // Status text
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('[STANDBY / KOSONG]', w / 2, 70);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Isi perintah di terminal', w / 2, 105);
    ctx.fillText('untuk mengaktifkan', w / 2, 122);
  }

  createStandbyBadge(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172aee';
    ctx.roundRect(10, 10, 364, 76, 16);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff88';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 30px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, 192, 58);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), mat);
  }

  updateAgents(agentsList) {
    const currentIds = new Set(agentsList.map(a => a.id));

    // 1. Remove meshes of deactivated agents
    for (const [id, agentObj] of this.agentMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(agentObj.mesh);
        // Show standby beacon on that workstation
        if (this.workstationMeshes[agentObj.slotIndex]) {
          this.workstationMeshes[agentObj.slotIndex].beaconGroup.visible = true;
        }
        this.agentMeshes.delete(id);
      }
    }

    // 2. Add or update active agents
    agentsList.forEach((agent, index) => {
      const slotIndex = index % this.deskPositions.length;
      const desk = this.workstationMeshes[slotIndex];

      // Hide standby beacon because an agent is occupying this desk
      if (desk) {
        desk.beaconGroup.visible = false;
      }

      if (this.agentMeshes.has(agent.id)) {
        this.updateAgentAppearance(this.agentMeshes.get(agent.id), agent);
      } else {
        const agentMeshObj = this.spawnExpressiveRobotAgent(agent, slotIndex);
        this.scene.add(agentMeshObj.mesh);
        this.agentMeshes.set(agent.id, agentMeshObj);
      }
    });

    // 3. Update monitor screen bindings
    this.animatedScreens.forEach((scr, idx) => {
      const slotIdx = Math.floor(idx / 2);
      scr.activeAgent = agentsList[slotIdx] || null;
    });
  }

  /**
   * Spawns an expressive 3D robot character seated at its desk
   * with digital glowing eyes that can blink and look around!
   */
  spawnExpressiveRobotAgent(agent, slotIndex) {
    const group = new THREE.Group();
    const deskPos = this.deskPositions[slotIndex];

    // Seated behind the desk facing forward
    group.position.set(deskPos.x, 0.9, deskPos.z + 0.9);
    group.rotation.y = deskPos.rot;

    const mainColor = new THREE.Color(agent.color || '#10B981');

    // 1. Robot Body / Torso
    const torsoGeo = new THREE.BoxGeometry(0.75, 0.75, 0.55);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 0.45;
    group.add(torso);

    // Chest Core Reactor (Glows with agent signature color)
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({ color: mainColor });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.5, 0.28);
    group.add(core);

    // 2. Robot Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.15, 0);

    const headGeo = new THREE.BoxGeometry(0.8, 0.65, 0.65);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    headGroup.add(head);

    // 3. Digital Eye Visor Screen
    const visorGeo = new THREE.BoxGeometry(0.72, 0.35, 0.08);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      metalness: 0.9,
      roughness: 0.1
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.05, 0.32);
    headGroup.add(visor);

    // 4. EXPRESSIVE DIGITAL EYES ("beri mata untuk tampilan agen nya")
    const eyesGroup = new THREE.Group();
    eyesGroup.position.set(0, 0.05, 0.37);

    // Left Eye
    const eyeGeo = new THREE.PlaneGeometry(0.18, 0.18);
    const eyeMatL = new THREE.MeshBasicMaterial({
      color: mainColor,
      side: THREE.DoubleSide
    });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMatL);
    eyeL.position.set(-0.18, 0, 0);
    eyesGroup.add(eyeL);

    // Right Eye
    const eyeMatR = new THREE.MeshBasicMaterial({
      color: mainColor,
      side: THREE.DoubleSide
    });
    const eyeR = new THREE.Mesh(eyeGeo, eyeMatR);
    eyeR.position.set(0.18, 0, 0);
    eyesGroup.add(eyeR);

    headGroup.add(eyesGroup);

    // Cyber Antennas / Ears
    const antGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
    const antMat = new THREE.MeshBasicMaterial({ color: mainColor });
    const antL = new THREE.Mesh(antGeo, antMat);
    antL.position.set(-0.43, 0.32, 0);
    antL.rotation.z = 0.3;
    headGroup.add(antL);

    const antR = new THREE.Mesh(antGeo, antMat);
    antR.position.set(0.43, 0.32, 0);
    antR.rotation.z = -0.3;
    headGroup.add(antR);

    group.add(headGroup);

    // 5. Floating Name Tag above head
    const tagMesh = this.createAgentNameTag(agent.name, mainColor);
    tagMesh.position.set(0, 1.85, 0);
    group.add(tagMesh);

    // 6. Typing Cyber Hands
    const handGeo = new THREE.BoxGeometry(0.16, 0.08, 0.22);
    const handMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });

    const handL = new THREE.Mesh(handGeo, handMat);
    handL.position.set(-0.35, 0.25, -0.45);
    group.add(handL);

    const handR = new THREE.Mesh(handGeo, handMat);
    handR.position.set(0.35, 0.25, -0.45);
    group.add(handR);

    return {
      mesh: group,
      headGroup,
      eyeL,
      eyeR,
      handL,
      handR,
      tagMesh,
      agentId: agent.id,
      slotIndex,
      mainColor,
      blinkTimer: 0,
      isBlinking: false,
      status: 'idle'
    };
  }

  updateAgentAppearance(agentObj, agentData) {
    const mainColor = new THREE.Color(agentData.color || '#10B981');
    agentObj.mainColor = mainColor;
    if (agentObj.eyeL && agentObj.eyeL.material) agentObj.eyeL.material.color = mainColor;
    if (agentObj.eyeR && agentObj.eyeR.material) agentObj.eyeR.material.color = mainColor;
  }

  createAgentNameTag(name, color) {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#060a14ee';
    ctx.roundRect(10, 10, 364, 76, 16);
    ctx.fill();
    ctx.strokeStyle = `#${color.getHexString()}`;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = `#${color.getHexString()}`;
    ctx.font = 'bold 36px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), 192, 60);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
    return new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), mat);
  }

  setAgentStatus(agentId, status) {
    if (this.agentMeshes.has(agentId)) {
      this.agentMeshes.get(agentId).status = status;
    }
  }

  animate() {
    this.animId = requestAnimationFrame(() => this.animate());
    const time = performance.now() * 0.001;

    // Controls update
    if (this.controls) this.controls.update();

    // 1. Animate Workstation Standby Rings
    this.workstationMeshes.forEach(w => {
      if (w.ring) {
        w.ring.rotation.z = time * 0.8;
      }
      if (w.beaconGroup && w.beaconGroup.visible) {
        w.beaconGroup.position.y = 1.8 + Math.sin(time * 2 + w.index) * 0.08;
      }
    });

    // 2. Animate Cyber Decor & Lights
    this.floatingDecor.forEach(d => {
      if (d.type === 'rotate') {
        d.mesh.rotation.y = time * 0.6;
        d.mesh.rotation.x = time * 0.4;
      } else if (d.type === 'blink') {
        d.mesh.material.color.setHex(Math.sin(time * 6 + d.mesh.position.y * 3) > 0.2 ? d.baseColor : 0x07101c);
      }
    });

    // 3. Animate Seated Robot Agents (Expressive blinking eyes, breathing, typing)
    this.agentMeshes.forEach(agent => {
      // Subtle hovering / breathing head movement
      agent.headGroup.position.y = 1.15 + Math.sin(time * 2) * 0.02;
      agent.headGroup.rotation.y = Math.sin(time * 0.8) * 0.08;

      // Blinking eye animation ("mata digital yang berkedip")
      agent.blinkTimer += 0.016;
      if (!agent.isBlinking && agent.blinkTimer > 3.0 + Math.random() * 2) {
        agent.isBlinking = true;
        agent.blinkTimer = 0;
      }

      if (agent.isBlinking) {
        // Eye scales down to simulate blink
        const blinkProgress = agent.blinkTimer / 0.15;
        if (blinkProgress < 1.0) {
          const scaleY = Math.abs(Math.sin(blinkProgress * Math.PI - (Math.PI / 2)));
          agent.eyeL.scale.set(1, Math.max(0.1, scaleY), 1);
          agent.eyeR.scale.set(1, Math.max(0.1, scaleY), 1);
        } else {
          agent.eyeL.scale.set(1, 1, 1);
          agent.eyeR.scale.set(1, 1, 1);
          agent.isBlinking = false;
        }
      }

      // Typing animation on hands when processing
      if (agent.status === 'working') {
        agent.handL.position.y = 0.25 + Math.sin(time * 18) * 0.04;
        agent.handR.position.y = 0.25 + Math.cos(time * 18) * 0.04;
        agent.eyeL.material.color.setHex(0xffffff);
        agent.eyeR.material.color.setHex(0xffffff);
      } else {
        agent.handL.position.y = 0.25;
        agent.handR.position.y = 0.25;
        agent.eyeL.material.color = agent.mainColor;
        agent.eyeR.material.color = agent.mainColor;
      }
    });

    // 4. Update holographic screens
    this.animatedScreens.forEach(scr => {
      scr.tick += 0.05;
      if (Math.floor(scr.tick) % 5 === 0) {
        if (scr.activeAgent) {
          this.renderScreenActive(scr.ctx, 256, 144, scr.activeAgent);
        } else {
          this.renderScreenStandby(scr.ctx, 256, 144, scr.title);
        }
        scr.tex.needsUpdate = true;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  renderScreenActive(ctx, w, h, agent) {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = agent.color || '#10b981';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    ctx.fillStyle = agent.color || '#10b981';
    ctx.font = 'bold 16px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`⚡ ${agent.name.toUpperCase()}`, 14, 28);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(`$ ${agent.command}`, 14, 50);

    // Animated code bar graph
    for (let c = 0; c < 12; c++) {
      const bh = Math.abs(Math.sin(performance.now() * 0.005 + c)) * 40;
      ctx.fillStyle = `${agent.color}88`;
      ctx.fillRect(14 + (c * 19), 125 - bh, 14, bh);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
