/**
 * OVIT 3D Virtual Office Room & Expressive Robot Agents
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 * Featuring: Full 3D Tech Office Room, Workstations, Holographic Screens,
 * and Cyber Agent Bots with Expressive Animated Eyes!
 */

class AgentThreeStage {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.agents = [];
    this.agentMeshes = new Map(); // id -> { group, head, leftEye, rightEye, desk, screens, state }
    this.clock = new THREE.Clock();
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.isDestroyed = false;

    this.init();
  }

  init() {
    if (!this.container || !window.THREE) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 450;

    // 1. Scene & Background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0d14);
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.025);

    // 2. Camera: Isometric-like perspective overlooking the office
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 7.5, 12);

    // 3. Renderer with antialiasing and shadow maps
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2.05; // Don't clip under the floor
      this.controls.minDistance = 4;
      this.controls.maxDistance = 22;
      this.controls.target.set(0, 1.2, 0);
    }

    // 5. Build Environment & Lighting
    this.setupLighting();
    this.buildOfficeArchitecture();

    // 6. Raycaster for clicking agents
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.container.addEventListener('click', (e) => this.onCanvasClick(e));
    window.addEventListener('resize', () => this.onResize());

    // 7. Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient soft fill
    const ambient = new THREE.AmbientLight(0x1a2436, 1.2);
    this.scene.add(ambient);

    // Main Overhead Soft Directional Light
    const mainLight = new THREE.DirectionalLight(0xdcf8ff, 1.5);
    mainLight.position.set(5, 12, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 25;
    mainLight.shadow.camera.left = -10;
    mainLight.shadow.camera.right = 10;
    mainLight.shadow.camera.top = 10;
    mainLight.shadow.camera.bottom = -10;
    this.scene.add(mainLight);

    // Cyan Cyber Rim Accent Light
    const cyanRim = new THREE.PointLight(0x00e5ff, 2.5, 16);
    cyanRim.position.set(-6, 3, -3);
    this.scene.add(cyanRim);

    // Emerald Floor Accent Light
    const emeraldRim = new THREE.PointLight(0x10b981, 2.0, 14);
    emeraldRim.position.set(6, 2, 2);
    this.scene.add(emeraldRim);
  }

  buildOfficeArchitecture() {
    const roomGroup = new THREE.Group();

    // --- 1. Floor: Tech Tiled Floor with Grid Accents ---
    const floorGeo = new THREE.PlaneGeometry(22, 16);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f1520,
      roughness: 0.35,
      metalness: 0.6
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // Grid Overlay Lines
    const gridHelper = new THREE.GridHelper(22, 22, 0x00e5ff, 0x1f293d);
    gridHelper.position.y = 0.01;
    roomGroup.add(gridHelper);

    // --- 2. Back Wall with Glass & Cyber Neon Trim ---
    const backWallGeo = new THREE.BoxGeometry(22, 7, 0.4);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x0c111a,
      roughness: 0.6,
      metalness: 0.3
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 3.5, -7);
    backWall.receiveShadow = true;
    roomGroup.add(backWall);

    // Neon Wall Trim Strip (Glowing cyan line)
    const stripGeo = new THREE.BoxGeometry(21.5, 0.08, 0.45);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const wallStrip = new THREE.Mesh(stripGeo, stripMat);
    wallStrip.position.set(0, 1.2, -6.95);
    roomGroup.add(wallStrip);

    const wallStripTop = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    wallStripTop.position.set(0, 6.0, -6.95);
    roomGroup.add(wallStripTop);

    // Center Large Office Display Screen (OVIT Agency Status Board)
    const boardFrameGeo = new THREE.BoxGeometry(7, 3, 0.2);
    const boardFrameMat = new THREE.MeshStandardMaterial({ color: 0x080c14, metalness: 0.8 });
    const boardFrame = new THREE.Mesh(boardFrameGeo, boardFrameMat);
    boardFrame.position.set(0, 3.8, -6.8);

    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const ctx = screenCanvas.getContext('2d');
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 236);

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 32px monospace';
    ctx.fillText('⚡ OVIT MULTI-AGENT HQ', 40, 60);

    ctx.fillStyle = '#10b981';
    ctx.font = '20px monospace';
    ctx.fillText('STATUS: ALL AGENTS DOCKED & ACTIVE', 40, 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText('> Hermes (Lead)   : READY', 40, 145);
    ctx.fillText('> Codex (Backend) : READY', 40, 175);
    ctx.fillText('> Agy (Frontend)  : READY', 40, 205);

    const boardTex = new THREE.CanvasTexture(screenCanvas);
    const boardScreenGeo = new THREE.PlaneGeometry(6.6, 2.6);
    const boardScreenMat = new THREE.MeshBasicMaterial({ map: boardTex });
    const boardScreen = new THREE.Mesh(boardScreenGeo, boardScreenMat);
    boardScreen.position.set(0, 0, 0.12);
    boardFrame.add(boardScreen);
    roomGroup.add(boardFrame);

    // --- 3. Left Wall & Futuristic Server Tower Racks ---
    const leftWallGeo = new THREE.BoxGeometry(0.4, 7, 16);
    const leftWall = new THREE.Mesh(leftWallGeo, backWallMat);
    leftWall.position.set(-11, 3.5, 0);
    roomGroup.add(leftWall);

    for (let r = 0; r < 3; r++) {
      const rack = this.createServerRack();
      rack.position.set(-9.8, 0, -4 + r * 2.8);
      roomGroup.add(rack);
    }

    // --- 4. Right Wall with Potted Sci-Fi Plant & Lounge Divider ---
    const rightWallGeo = new THREE.BoxGeometry(0.4, 7, 16);
    const rightWall = new THREE.Mesh(rightWallGeo, backWallMat);
    rightWall.position.set(11, 3.5, 0);
    roomGroup.add(rightWall);

    this.scene.add(roomGroup);
  }

  createServerRack() {
    const rack = new THREE.Group();
    // Frame
    const frameGeo = new THREE.BoxGeometry(1.2, 4.5, 1.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x080d17, metalness: 0.8, roughness: 0.3 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.y = 2.25;
    frame.castShadow = true;
    rack.add(frame);

    // Server Slots with Glowing LED lights
    for (let i = 0; i < 7; i++) {
      const slotGeo = new THREE.BoxGeometry(0.05, 0.35, 1.2);
      const slotMat = new THREE.MeshStandardMaterial({ color: 0x111827 });
      const slot = new THREE.Mesh(slotGeo, slotMat);
      slot.position.set(0.6, 0.8 + i * 0.45, 0);
      rack.add(slot);

      // LED dot
      const ledGeo = new THREE.BoxGeometry(0.02, 0.08, 0.08);
      const ledColor = (i % 2 === 0) ? 0x00e5ff : 0x10b981;
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(0.63, 0.8 + i * 0.45, 0.4);
      rack.add(led);
    }
    return rack;
  }

  updateAgents(agentsList) {
    this.agents = agentsList;

    // Remove existing agent meshes
    this.agentMeshes.forEach(item => {
      this.scene.remove(item.group);
    });
    this.agentMeshes.clear();

    // Fixed office workstation desk positions
    // Hermes on Left (-3.8), Codex in Center (0), Antigravity on Right (+3.8)
    const deskSpacing = 3.8;
    const startX = -((agentsList.length - 1) * deskSpacing) / 2;

    agentsList.forEach((agent, index) => {
      const posX = startX + index * deskSpacing;
      const posZ = 0.5;

      const agentGroup = this.createAgentAndWorkstation(agent, posX, posZ);
      this.scene.add(agentGroup);
    });
  }

  createAgentAndWorkstation(agent, posX, posZ) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const themeColor = parseInt(agent.color.replace('#', '0x'), 16) || 0x10b981;

    // --- 1. WORKSTATION DESK ---
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x131a26, roughness: 0.4, metalness: 0.5 });
    // Table Top
    const tableTopGeo = new THREE.BoxGeometry(2.4, 0.1, 1.4);
    const tableTop = new THREE.Mesh(tableTopGeo, deskMat);
    tableTop.position.set(0, 1.1, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // Glowing Desk Edge Trim
    const edgeGeo = new THREE.BoxGeometry(2.42, 0.04, 0.04);
    const edgeMat = new THREE.MeshBasicMaterial({ color: themeColor });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, 1.12, 0.7);
    group.add(edge);

    // Desk Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0a0e14, metalness: 0.8 });
    const legPositions = [
      [-1.1, 0.55, -0.6],
      [1.1, 0.55, -0.6],
      [-1.1, 0.55, 0.6],
      [1.1, 0.55, 0.6]
    ];
    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(...p);
      leg.castShadow = true;
      group.add(leg);
    });

    // --- 2. COMPUTER MONITORS WITH ANIMATED CODE TEXTURE ---
    // Dual Curved/Tilted Holographic Monitors
    const screens = [];
    const monitorGeo = new THREE.BoxGeometry(0.9, 0.55, 0.04);
    const standGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 12);

    [-0.5, 0.5].forEach((mX, idx) => {
      const stand = new THREE.Mesh(standGeo, legMat);
      stand.position.set(mX, 1.25, -0.3);
      group.add(stand);

      // Monitor Screen
      const mCanvas = document.createElement('canvas');
      mCanvas.width = 256;
      mCanvas.height = 160;
      const mCtx = mCanvas.getContext('2d');
      mCtx.fillStyle = '#060a12';
      mCtx.fillRect(0, 0, 256, 160);
      mCtx.fillStyle = agent.color || '#10b981';
      mCtx.font = 'bold 16px monospace';
      mCtx.fillText(`[${agent.name.toUpperCase()}]`, 15, 30);
      mCtx.fillStyle = '#64748b';
      mCtx.font = '12px monospace';
      mCtx.fillText('function orchestrate() {', 15, 60);
      mCtx.fillText('  const task = parse();', 25, 85);
      mCtx.fillText('  return execute(task);', 25, 110);
      mCtx.fillText('}', 15, 135);

      const mTex = new THREE.CanvasTexture(mCanvas);
      const screenMat = new THREE.MeshBasicMaterial({ map: mTex });
      const monitor = new THREE.Mesh(monitorGeo, screenMat);
      monitor.position.set(mX, 1.45, -0.3);
      monitor.rotation.y = idx === 0 ? 0.15 : -0.15;
      group.add(monitor);
      screens.push(monitor);
    });

    // Desk Glowing Light on Table
    const deskGlow = new THREE.PointLight(themeColor, 1.2, 3);
    deskGlow.position.set(0, 1.6, -0.1);
    group.add(deskGlow);

    // --- 3. ROBOT AGENT AVATAR WITH EXPRESSIVE EYES ---
    // Bot Body hovering/seated behind the desk
    const botGroup = new THREE.Group();
    botGroup.position.set(0, 1.4, 0.35);

    // Torso / Chassis
    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.45, 24);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x1f293d,
      roughness: 0.3,
      metalness: 0.7
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.castShadow = true;
    botGroup.add(torso);

    // Cyber Chest Core Reactor
    const coreGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: themeColor });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.05, 0.24);
    botGroup.add(core);

    // Head Unit (Rotates & tilts)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, 0);

    let headGeo;
    if (agent.shape === 'cube') {
      headGeo = new THREE.BoxGeometry(0.48, 0.42, 0.42);
    } else if (agent.shape === 'polyhedron') {
      headGeo = new THREE.IcosahedronGeometry(0.32, 0);
    } else {
      headGeo = new THREE.SphereGeometry(0.3, 32, 32);
    }

    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.8
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Visor Screen on Face
    const visorGeo = new THREE.BoxGeometry(0.36, 0.16, 0.05);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0, -0.28);
    headGroup.add(visor);

    // --- EXPRESSIVE ANIMATED ROBOT EYES ("beri mata untuk tampilan agen nya") ---
    // Left Eye
    const eyeGeo = new THREE.PlaneGeometry(0.09, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({
      color: themeColor,
      transparent: true,
      opacity: 0.95
    });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    leftEye.position.set(0.08, 0.01, -0.31);
    leftEye.rotation.y = Math.PI; // Face forward towards desk
    headGroup.add(leftEye);

    // Right Eye
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.position.set(-0.08, 0.01, -0.31);
    rightEye.rotation.y = Math.PI; // Face forward towards desk
    headGroup.add(rightEye);

    // Cyber Antenna / Ear Sensors
    const earGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.16, 12);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    [-0.32, 0.32].forEach(eX => {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(eX, 0.12, 0);
      ear.rotation.z = eX > 0 ? -0.4 : 0.4;
      headGroup.add(ear);
    });

    botGroup.add(headGroup);

    // Floating Robotic Hands (Hovering near keyboard area)
    const handGeo = new THREE.BoxGeometry(0.1, 0.04, 0.14);
    const handMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6 });
    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(0.24, -0.15, -0.25);
    botGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, handMat);
    rightHand.position.set(-0.24, -0.15, -0.25);
    botGroup.add(rightHand);

    // Floating Pod Shadow Disc under Bot
    const shadowGeo = new THREE.CircleGeometry(0.3, 24);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
    const botShadow = new THREE.Mesh(shadowGeo, shadowMat);
    botShadow.rotation.x = -Math.PI / 2;
    botShadow.position.set(0, 1.15, 0.35);
    group.add(botShadow);

    // Overhead Agent Holographic Nameplate
    const nameCanvas = document.createElement('canvas');
    nameCanvas.width = 256;
    nameCanvas.height = 64;
    const nCtx = nameCanvas.getContext('2d');
    nCtx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    nCtx.roundRect ? nCtx.roundRect(4, 4, 248, 56, 12) : nCtx.fillRect(4, 4, 248, 56);
    nCtx.fill();
    nCtx.strokeStyle = agent.color || '#10b981';
    nCtx.lineWidth = 3;
    nCtx.stroke();
    nCtx.fillStyle = '#ffffff';
    nCtx.font = 'bold 22px sans-serif';
    nCtx.textAlign = 'center';
    nCtx.fillText(agent.name, 128, 38);

    const nameTex = new THREE.CanvasTexture(nameCanvas);
    const nameGeo = new THREE.PlaneGeometry(1.2, 0.3);
    const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true });
    const nameplate = new THREE.Mesh(nameGeo, nameMat);
    nameplate.position.set(0, 2.3, 0.35);
    group.add(nameplate);

    group.add(botGroup);

    // Store agent mesh data
    this.agentMeshes.set(agent.id, {
      agent,
      group,
      botGroup,
      headGroup,
      leftEye,
      rightEye,
      leftHand,
      rightHand,
      deskGlow,
      screens,
      nameplate,
      state: 'idle',
      initialBotY: botGroup.position.y,
      workProgress: 0
    });

    return group;
  }

  setAgentStatus(agentId, status) {
    const meshObj = this.agentMeshes.get(agentId);
    if (!meshObj) return;

    meshObj.state = status; // 'idle' | 'working' | 'complete'

    if (status === 'working') {
      meshObj.deskGlow.intensity = 3.5;
      meshObj.leftEye.material.color.setHex(0xffff00);
      meshObj.rightEye.material.color.setHex(0xffff00);
    } else if (status === 'complete') {
      meshObj.deskGlow.intensity = 2.0;
      meshObj.leftEye.material.color.setHex(0x10b981);
      meshObj.rightEye.material.color.setHex(0x10b981);
      setTimeout(() => {
        if (meshObj.state === 'complete') {
          const originalColor = parseInt(meshObj.agent.color.replace('#', '0x'), 16) || 0x10b981;
          meshObj.leftEye.material.color.setHex(originalColor);
          meshObj.rightEye.material.color.setHex(originalColor);
          meshObj.state = 'idle';
        }
      }, 3500);
    } else {
      const originalColor = parseInt(meshObj.agent.color.replace('#', '0x'), 16) || 0x10b981;
      meshObj.leftEye.material.color.setHex(originalColor);
      meshObj.rightEye.material.color.setHex(originalColor);
      meshObj.deskGlow.intensity = 1.2;
    }
  }

  animate() {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    const elapsedTime = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    // Blink timer for eyes
    this.blinkTimer += 0.016;
    if (this.blinkTimer > 3.8) {
      this.isBlinking = true;
      if (this.blinkTimer > 4.0) {
        this.blinkTimer = 0;
        this.isBlinking = false;
      }
    }

    // Animate each agent bot
    this.agentMeshes.forEach((obj, id) => {
      const { botGroup, headGroup, leftEye, rightEye, leftHand, rightHand, initialBotY, state, nameplate } = obj;

      // Face nameplate always towards camera
      nameplate.lookAt(this.camera.position);

      // 1. Natural Sinusoidal Floating
      const hover = Math.sin(elapsedTime * 2.5 + id.charCodeAt(0)) * 0.04;
      botGroup.position.y = initialBotY + hover;

      // 2. Eye Blinking
      if (this.isBlinking) {
        leftEye.scale.set(1, 0.1, 1);
        rightEye.scale.set(1, 0.1, 1);
      } else {
        leftEye.scale.set(1, 1, 1);
        rightEye.scale.set(1, 1, 1);
      }

      // 3. State Behavior
      if (state === 'working') {
        // Active rapid typing motion on hands
        leftHand.position.y = -0.15 + Math.sin(elapsedTime * 20) * 0.03;
        rightHand.position.y = -0.15 + Math.cos(elapsedTime * 20) * 0.03;

        // Head glancing back and forth between monitors
        headGroup.rotation.y = Math.sin(elapsedTime * 6) * 0.18;
        headGroup.rotation.x = 0.08 + Math.cos(elapsedTime * 4) * 0.04;
      } else {
        // Idle calm posture: subtle head look around
        headGroup.rotation.y = Math.sin(elapsedTime * 0.8 + id.charCodeAt(0)) * 0.1;
        headGroup.rotation.x = Math.sin(elapsedTime * 1.2) * 0.03;
        leftHand.position.y = -0.15;
        rightHand.position.y = -0.15;
      }
    });

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onCanvasClick(e) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      let current = intersects[0].object;
      while (current && current.parent && current.parent !== this.scene) {
        current = current.parent;
      }
      this.agentMeshes.forEach((obj, agentId) => {
        if (obj.group === current) {
          // Select this agent in target dropdown
          const sel = document.getElementById('target-agent-select');
          if (sel) {
            sel.value = agentId;
          }
          // Flash eyes acknowledging click
          obj.leftEye.material.color.setHex(0x00e5ff);
          obj.rightEye.material.color.setHex(0x00e5ff);
          setTimeout(() => {
            const originalColor = parseInt(obj.agent.color.replace('#', '0x'), 16) || 0x10b981;
            obj.leftEye.material.color.setHex(originalColor);
            obj.rightEye.material.color.setHex(originalColor);
          }, 600);
        }
      });
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    this.isDestroyed = true;
  }
}

window.AgentThreeStage = AgentThreeStage;
