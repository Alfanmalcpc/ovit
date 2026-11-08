/**
 * OVIT Agent Customizer & 3D Robot Preview Engine
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 */

class AgentCustomizer {
  constructor(previewContainerId) {
    this.container = document.getElementById(previewContainerId);
    this.botGroup = null;
    this.headGroup = null;
    this.leftEye = null;
    this.rightEye = null;
    this.currentColor = '#10B981';
    this.currentShape = 'cube';
    this.clock = new THREE.Clock();
    this.initPreview();
  }

  initPreview() {
    if (!this.container || !window.THREE) return;

    const width = this.container.clientWidth || 320;
    const height = this.container.clientHeight || 240;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.8, 2.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(3, 5, 4);
    this.scene.add(dirLight);

    // Mini Cyber Pedestal
    const baseGeo = new THREE.CylinderGeometry(0.85, 0.7, 0.2, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.7;
    this.scene.add(base);

    // Glowing Pedestal Ring
    const ringGeo = new THREE.TorusGeometry(0.75, 0.02, 16, 32);
    this.ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ring = new THREE.Mesh(ringGeo, this.ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.59;
    this.scene.add(ring);

    this.updateMesh(this.currentShape, this.currentColor);
    this.animate();

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });
  }

  updateMesh(shape, colorHex) {
    this.currentShape = shape;
    this.currentColor = colorHex;

    if (this.botGroup) {
      this.scene.remove(this.botGroup);
    }

    const cInt = parseInt(colorHex.replace('#', '0x'), 16) || 0x10b981;
    if (this.ringMat) this.ringMat.color.setHex(cInt);

    this.botGroup = new THREE.Group();
    this.botGroup.position.set(0, -0.1, 0);

    // Torso Chassis
    const torsoGeo = new THREE.CylinderGeometry(0.26, 0.2, 0.42, 24);
    const torsoMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, metalness: 0.7, roughness: 0.3 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.botGroup.add(torso);

    // Chest Reactor Core
    const coreGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: cInt });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(0, 0.05, 0.22);
    this.botGroup.add(core);

    // Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.4, 0);

    let headGeo;
    if (shape === 'cube') {
      headGeo = new THREE.BoxGeometry(0.46, 0.4, 0.4);
    } else if (shape === 'polyhedron') {
      headGeo = new THREE.IcosahedronGeometry(0.32, 0);
    } else if (shape === 'torus') {
      headGeo = new THREE.TorusGeometry(0.3, 0.12, 16, 32);
    } else {
      headGeo = new THREE.SphereGeometry(0.28, 32, 32);
    }

    const headMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    this.headGroup.add(headMesh);

    // Visor
    const visorGeo = new THREE.BoxGeometry(0.34, 0.15, 0.04);
    const visorMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0, 0.26);
    this.headGroup.add(visor);

    // Expressive Eyes
    const eyeGeo = new THREE.PlaneGeometry(0.08, 0.07);
    const eyeMat = new THREE.MeshBasicMaterial({ color: cInt, transparent: true, opacity: 0.95 });

    this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    this.leftEye.position.set(-0.07, 0.01, 0.29);
    this.headGroup.add(this.leftEye);

    this.rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    this.rightEye.position.set(0.07, 0.01, 0.29);
    this.headGroup.add(this.rightEye);

    // Ears
    const earGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12);
    const earMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    [-0.3, 0.3].forEach(eX => {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(eX, 0.1, 0);
      ear.rotation.z = eX > 0 ? -0.4 : 0.4;
      this.headGroup.add(ear);
    });

    this.botGroup.add(this.headGroup);
    this.scene.add(this.botGroup);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    if (this.botGroup) {
      this.botGroup.position.y = -0.1 + Math.sin(t * 2) * 0.03;
      this.botGroup.rotation.y = Math.sin(t * 0.8) * 0.25;
    }
    if (this.headGroup) {
      this.headGroup.rotation.x = Math.sin(t * 1.5) * 0.05;
    }
    this.renderer.render(this.scene, this.camera);
  }
}

window.AgentCustomizer = AgentCustomizer;
