/**
 * Three.js 3D Multi-Agent Stage & Pod Visualizer
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 */

class AgentThreeStage {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.agents = [];
    this.agentMeshes = new Map(); // id -> { group, coreMesh, ringMesh, light, podMesh }
    this.isInitialized = false;
    this.particleSystem = null;
    this.beamMesh = null;
    this.clock = new THREE.Clock();

    if (this.container && window.THREE) {
      this.init();
    }
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 450;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0d12, 0.035);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 4.5, 11);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    // 3. Orbit Controls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below floor
      this.controls.minDistance = 4;
      this.controls.maxDistance = 20;
    }

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 8);
    this.scene.add(dirLight);

    // 5. Grid Floor (Cyberpunk holographic stage)
    const gridHelper = new THREE.GridHelper(24, 24, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = -1.5;
    this.scene.add(gridHelper);

    // 6. Particle Field
    this.createBackgroundParticles();

    // 7. Window Resize Listener
    window.addEventListener('resize', () => this.onResize());

    this.isInitialized = true;
    this.animate();
  }

  createBackgroundParticles() {
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 8 - 1;
      positions[i + 2] = (Math.random() - 0.5) * 20;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.08,
      transparent: true,
      opacity: 0.6
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  updateAgents(agents) {
    this.agents = agents;
    // Clear old agent meshes
    for (const [id, item] of this.agentMeshes.entries()) {
      this.scene.remove(item.group);
    }
    this.agentMeshes.clear();

    const count = agents.length;
    const spacing = 3.6;
    const startX = -((count - 1) * spacing) / 2;

    agents.forEach((agent, idx) => {
      const posX = startX + idx * spacing;
      const group = new THREE.Group();
      group.position.set(posX, 0, 0);

      const colorHex = parseInt(agent.color.replace('#', '0x'), 16) || 0x00e5ff;

      // A. Pod Bowl Base (Wadah display bulat per sketsa)
      const podGeo = new THREE.CylinderGeometry(1.4, 0.9, 0.5, 32);
      const podMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        metalness: 0.85,
        roughness: 0.25,
      });
      const podMesh = new THREE.Mesh(podGeo, podMat);
      podMesh.position.y = -1.2;
      group.add(podMesh);

      // Glowing Rim on the Pod Bowl
      const rimGeo = new THREE.TorusGeometry(1.4, 0.05, 16, 64);
      const rimMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.rotation.x = Math.PI / 2;
      rimMesh.position.y = -0.95;
      group.add(rimMesh);

      // B. Core 3D Mesh (Bentuk avatar agen)
      let coreGeo;
      if (agent.shape === 'cube') {
        coreGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
      } else if (agent.shape === 'polyhedron' || agent.shape === 'crystal') {
        coreGeo = new THREE.IcosahedronGeometry(0.85, 0);
      } else if (agent.shape === 'torus') {
        coreGeo = new THREE.TorusGeometry(0.7, 0.3, 16, 32);
      } else {
        // Default: Sphere Core
        coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
      }

      const coreMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.8,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.y = 0.2;
      group.add(coreMesh);

      // C. Orbital Cybernetic Ring
      const ringGeo = new THREE.TorusGeometry(1.2, 0.03, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: colorHex,
        emissiveIntensity: 0.8,
        wireframe: true
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      ringMesh.position.y = 0.2;
      group.add(ringMesh);

      // D. Point Light inside the agent core
      const light = new THREE.PointLight(colorHex, 1.5, 6);
      light.position.y = 0.4;
      group.add(light);

      this.scene.add(group);
      this.agentMeshes.set(agent.id, {
        group,
        coreMesh,
        ringMesh,
        light,
        podMesh,
        agentData: agent,
        status: agent.status || 'ready',
        baseY: 0.2
      });
    });

    this.updateCollaborationBeams();
  }

  setAgentStatus(agentId, status) {
    const item = this.agentMeshes.get(agentId);
    if (!item) return;
    item.status = status;

    if (status === 'working') {
      item.light.intensity = 3.0;
      item.coreMesh.material.emissiveIntensity = 0.9;
    } else if (status === 'complete') {
      item.light.color.setHex(0x10b981);
      item.light.intensity = 4.0;
      item.coreMesh.material.emissiveIntensity = 1.0;
    } else {
      // ready
      const origColor = parseInt(item.agentData.color.replace('#', '0x'), 16) || 0x00e5ff;
      item.light.color.setHex(origColor);
      item.light.intensity = 1.5;
      item.coreMesh.material.emissiveIntensity = 0.35;
    }

    this.updateCollaborationBeams();
  }

  updateCollaborationBeams() {
    // Check if any agent is working
    let anyWorking = false;
    for (const [id, item] of this.agentMeshes.entries()) {
      if (item.status === 'working') {
        anyWorking = true;
        break;
      }
    }

    if (anyWorking && !this.beamMesh && this.agentMeshes.size > 1) {
      // Create connecting energy line between agents
      const points = [];
      for (const [id, item] of this.agentMeshes.entries()) {
        points.push(item.group.position.clone().add(new THREE.Vector3(0, 0.4, 0)));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.04, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.75,
        wireframe: true
      });
      this.beamMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.scene.add(this.beamMesh);
    } else if (!anyWorking && this.beamMesh) {
      this.scene.remove(this.beamMesh);
      this.beamMesh = null;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Animate Agents
    for (const [id, item] of this.agentMeshes.entries()) {
      const isWorking = item.status === 'working';
      const speed = isWorking ? 4.5 : 1.2;

      // Floating breathing motion
      item.coreMesh.position.y = item.baseY + Math.sin(time * speed + item.group.position.x) * 0.12;
      item.coreMesh.rotation.y += delta * (isWorking ? 3.0 : 0.8);
      item.coreMesh.rotation.x += delta * (isWorking ? 1.5 : 0.4);

      // Orbital Ring rotation
      item.ringMesh.position.y = item.coreMesh.position.y;
      item.ringMesh.rotation.z += delta * (isWorking ? 4.0 : 1.0);
      item.ringMesh.rotation.y += delta * (isWorking ? 2.0 : 0.5);

      if (isWorking) {
        item.light.intensity = 2.0 + Math.sin(time * 10) * 1.0;
      }
    }

    // Background particle drift
    if (this.particleSystem) {
      this.particleSystem.rotation.y = time * 0.04;
    }

    // Energy beam pulse
    if (this.beamMesh) {
      this.beamMesh.material.opacity = 0.5 + Math.sin(time * 8) * 0.35;
    }

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.AgentThreeStage = AgentThreeStage;
