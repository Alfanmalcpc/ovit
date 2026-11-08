/**
 * OVIT Agent Customizer & 3D Preview Engine
 * Author: Mochamad Alfan Candrapratama (@Alfanmalcpc)
 */

class AgentCustomizer {
  constructor(previewContainerId) {
    this.container = document.getElementById(previewContainerId);
    this.currentMesh = null;
    this.currentColor = '#10B981';
    this.currentShape = 'cube';
    this.initPreview();
  }

  initPreview() {
    if (!this.container || !window.THREE) return;

    const width = this.container.clientWidth || 320;
    const height = this.container.clientHeight || 240;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 4.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(3, 6, 5);
    this.scene.add(dirLight);

    // Small Pod Base
    const podGeo = new THREE.CylinderGeometry(1.2, 0.8, 0.35, 32);
    const podMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 });
    const pod = new THREE.Mesh(podGeo, podMat);
    pod.position.y = -1.0;
    this.scene.add(pod);

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

    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
    }

    const cInt = parseInt(colorHex.replace('#', '0x'), 16) || 0x10b981;

    let geo;
    if (shape === 'cube') {
      geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    } else if (shape === 'polyhedron' || shape === 'crystal') {
      geo = new THREE.IcosahedronGeometry(0.85, 0);
    } else if (shape === 'torus') {
      geo = new THREE.TorusGeometry(0.7, 0.28, 16, 32);
    } else {
      geo = new THREE.SphereGeometry(0.8, 32, 32);
    }

    const mat = new THREE.MeshStandardMaterial({
      color: cInt,
      emissive: cInt,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.7
    });

    this.currentMesh = new THREE.Mesh(geo, mat);
    this.currentMesh.position.y = 0.1;
    this.scene.add(this.currentMesh);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (this.currentMesh) {
      this.currentMesh.rotation.y += 0.015;
      this.currentMesh.rotation.x += 0.008;
    }
    this.renderer.render(this.scene, this.camera);
  }
}

window.AgentCustomizer = AgentCustomizer;
