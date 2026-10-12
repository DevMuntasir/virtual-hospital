import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Decorative scene; all navigation remains accessible HTML outside the canvas. */
export default function HospitalReception() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // The CSS reception and HTML actions remain available without WebGL.
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0xeaf1ec);
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeaf1ec, 24, 45);
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 60);
    const materials = new Map<string, THREE.MeshStandardMaterial>();
    const material = (color: string) => {
      if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.65 }));
      return materials.get(color)!;
    };
    const box = (w: number, h: number, d: number, x: number, y: number, z: number, color: string) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };
    const sphere = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string) => {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material(color));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.castShadow = true;
      scene.add(mesh);
      return mesh;
    };
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9cae9f, 2.6));
    const sun = new THREE.DirectionalLight(0xfff6e5, 3.2);
    sun.position.set(-7, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 10, bottom: -10 });
    sun.shadow.normalBias = 0.035;
    scene.add(sun);

    // A tiled lobby, recessed wall, and warm oak reception desk.
    box(32, 0.15, 28, 0, -0.1, 0, '#dfe9e3');
    for (let i = -14; i <= 14; i += 2) {
      box(0.015, 0.005, 25, i, -0.018, 0, '#c4d5ce');
      box(30, 0.005, 0.015, 0, -0.018, i, '#c4d5ce');
    }
    box(25, 7, 0.3, 0, 3.5, -4, '#f0f2eb');
    box(6.4, 5.7, 0.22, 0, 2.85, -3.76, '#cadbd1');
    for (let i = -3; i <= 3; i += 0.24) box(0.045, 5.5, 0.1, i, 2.85, -3.6, '#b7cec0');
    box(0.25, 1.1, 0.18, 0, 4.1, -3.4, '#236b58');
    box(1.1, 0.25, 0.18, 0, 4.1, -3.4, '#236b58');
    box(4.4, 1.4, 1.45, 0, 0.7, 0.1, '#c2a681');
    for (let i = -2.1; i < 2.2; i += 0.15) box(0.035, 1.3, 0.06, i, 0.7, 0.85, '#a78b67');
    box(4.65, 0.18, 1.65, 0, 1.47, 0.1, '#f8f6ec');
    box(4.3, 0.08, 0.08, 0, 0.12, 0.89, '#e7f2d4');
    box(1.3, 0.48, 0.08, 0, 0.83, 0.92, '#246754');
    box(0.08, 0.28, 0.02, 0, 0.83, 0.97, '#ffffff');
    box(0.28, 0.08, 0.02, 0, 0.83, 0.97, '#ffffff');
    // Receptionist and computer, built from lightweight primitives.
    sphere(0.35, 1.62, -0.62, 0.38, 0.55, 0.25, '#fafbf5');
    sphere(0.35, 2.28, -0.62, 0.26, 0.31, 0.25, '#55443b');
    sphere(0.35, 2.25, -0.47, 0.21, 0.25, 0.15, '#c38f6a');
    box(0.12, 0.16, 0.03, 0.55, 1.84, -0.35, '#3a8a77');
    box(0.8, 0.51, 0.08, -0.65, 1.84, 0.04, '#324c46');
    box(0.08, 0.22, 0.09, -0.65, 1.56, 0.04, '#324c46');
    box(0.42, 0.03, 0.27, -0.65, 1.58, 0.1, '#324c46');
    box(0.48, 0.04, 0.32, 1.3, 1.59, 0.35, '#e1e8dc');

    for (const side of [-1, 1]) {
      const x = side * 5.4;
      // Door recesses, glass panels and illuminated department lintels.
      box(3.2, 4.2, 0.25, x, 2.1, -3.5, '#557b72');
      for (const half of [-1, 1]) {
        box(1.4, 3.5, 0.1, x + half * 0.75, 1.85, -3.3, '#b6d7d0');
        box(0.045, 3.5, 0.08, x + half * 0.05, 1.85, -3.2, '#f6faf5');
        box(0.045, 0.56, 0.1, x + half * 0.2, 1.65, -3.12, '#44685e');
        box(1.35, 0.1, 0.02, x + half * 0.75, 2.1, -3.22, '#e7f2ec');
      }
      box(3.25, 0.38, 0.32, x, 4.1, -3.3, side < 0 ? '#b65649' : '#2d7763');
      // Waiting seats.
      for (let i = 0; i < 3; i++) {
        const seatX = side * (7.2 + i * 0.9);
        box(0.78, 0.17, 0.8, seatX, 0.52, -0.8, '#6f9d8b');
        box(0.78, 0.75, 0.16, seatX, 0.98, -1.16, '#6f9d8b');
        for (const dx of [-0.28, 0.28]) box(0.045, 0.5, 0.6, seatX + dx, 0.25, -0.8, '#667d74');
      }
      const plantX = side * 3.5;
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.27, 0.65, 24), material('#f7f4e9'));
      pot.position.set(plantX, 0.33, -0.7); pot.castShadow = true; scene.add(pot);
      box(0.045, 1.5, 0.045, plantX, 1.15, -0.7, '#5a7550');
      for (let i = 0; i < 7; i++) {
        const angle = i * 2.4;
        const leaf = sphere(plantX + Math.cos(angle) * 0.26, 1 + i * 0.15, -0.7 + Math.sin(angle) * 0.25, 0.15, 0.42, 0.12, i % 2 ? '#487856' : '#78985d');
        leaf.rotation.z = Math.cos(angle) * 0.8;
      }
    }
    // Ceiling pendants frame the room without obscuring the controls.
    for (const x of [-2.2, 2.2]) {
      box(0.025, 1.7, 0.025, x, 5.6, 0, '#697e71');
      const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.28, 24, 1, true), material('#e9ddc3'));
      lamp.position.set(x, 4.7, 0); scene.add(lamp);
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pointerX = 0;
    let previousWidth = 0;
    let previousHeight = 0;
    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      if (width !== previousWidth || height !== previousHeight) {
        renderer.setSize(width, height, false);
        previousWidth = width;
        previousHeight = height;
      }
      camera.aspect = width / height;
      camera.position.set(reducedMotion.matches ? 0 : pointerX * 0.32, 5.2, width < 700 ? 18 : 14.5);
      camera.lookAt(0, 1.5, -1);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    let frame = 0;
    const requestRender = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(render); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
      const bounds = container.getBoundingClientRect();
      pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      requestRender();
    };
    const stage = container.closest('.reception-stage')!;
    stage.addEventListener('pointermove', move as EventListener);
    const resize = new ResizeObserver(requestRender);
    resize.observe(container);
    reducedMotion.addEventListener('change', requestRender);
    const lost = (event: Event) => { event.preventDefault(); renderer.domElement.style.opacity = '0'; };
    const restored = () => { renderer.domElement.style.opacity = '1'; requestRender(); };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    renderer.domElement.addEventListener('webglcontextrestored', restored);
    requestRender();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      stage.removeEventListener('pointermove', move as EventListener);
      reducedMotion.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      renderer.domElement.removeEventListener('webglcontextrestored', restored);
      scene.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      materials.forEach(value => value.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="reception-canvas" ref={host} />;
}
