import * as THREE from "./vendor/three.module.min.js";
import { clamp } from "./workshop-state.js";

// Procedural geometry keeps the scene independent of model/image downloads.
export function createWorkshop(host, { signal, onFailure }) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  if (!context)
    throw new Error("WebGL is unavailable; use the illustrated workshop.");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio || 1, innerWidth < 600 ? 1.25 : 1.75),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.setClearColor(0x282a36, 0);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 3.6, -3.6, 0.1, 80);
  camera.position.set(8, 7, 12);
  camera.lookAt(0, 0.8, 0);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xe6deff, 0x313344, 2.5));
  const key = new THREE.DirectionalLight(0xffffff, 3.5);
  key.position.set(-3, 7, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8be9fd, 2);
  rim.position.set(5, 3, -4);
  scene.add(rim);
  const geometries = new Set();
  const materials = new Set();
  const ownGeometry = (geometry) => {
    geometries.add(geometry);
    return geometry;
  };
  const material = (color, glow = false) => {
    const value = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.15,
      ...(glow ? { emissive: color, emissiveIntensity: 0.7 } : {}),
    });
    materials.add(value);
    return value;
  };
  const palette = {
    purple: material(0xbd93f9),
    cyan: material(0x8be9fd),
    green: material(0x80efa2),
    dark: material(0x202534),
    surface: material(0x393c50),
    light: material(0xe7e4fa),
    purpleGlow: material(0xbd93f9, true),
    cyanGlow: material(0x8be9fd, true),
    greenGlow: material(0x50fa7b, true),
    floor: material(0x343647),
    muted: material(0x656b89),
  };
  function roundedGeometry(w, h, d, radius = 0.08) {
    const r = Math.min(radius, w / 3, h / 3, d / 3);
    const shape = new THREE.Shape();
    const x = -w / 2,
      y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.01, d - r),
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: r / 2,
      bevelThickness: r / 2,
      curveSegments: 4,
    });
    geometry.center();
    return ownGeometry(geometry);
  }
  function box(parent, size, position, mat, radius) {
    const mesh = new THREE.Mesh(roundedGeometry(...size, radius), mat);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  const sphereGeometry = ownGeometry(new THREE.SphereGeometry(1, 12, 8));
  function sphere(parent, size, position, mat) {
    const mesh = new THREE.Mesh(sphereGeometry, mat);
    mesh.scale.setScalar(size);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  const cylinderGeometry = ownGeometry(new THREE.CylinderGeometry(1, 1, 1, 16));
  function cylinder(parent, radius, height, position, mat) {
    const mesh = new THREE.Mesh(cylinderGeometry, mat);
    mesh.scale.set(radius, height, radius);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  // Stage and grid: geometry, rather than costly real-time shadow maps.
  box(world, [7.8, 0.22, 4.9], [0, -0.2, 0], palette.floor, 0.16);
  box(world, [7.3, 0.035, 4.4], [0, -0.06, 0], palette.surface, 0.03);
  const grid = new THREE.GridHelper(7, 14, 0x57536b, 0x45475b);
  grid.scale.z = 0.59;
  grid.position.y = -0.035;
  world.add(grid);
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x171a25,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  materials.add(shadowMaterial);
  const shadowGeometry = ownGeometry(new THREE.CircleGeometry(0.65, 24));
  function shadow(x, z, scale = 1) {
    const mesh = new THREE.Mesh(shadowGeometry, shadowMaterial);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, -0.025, z);
    mesh.scale.set(scale, scale * 0.65, scale);
    world.add(mesh);
  }

  function robot(color, glow, position, angle) {
    const root = new THREE.Group();
    root.position.set(...position);
    root.rotation.y = angle;
    world.add(root);
    shadow(position[0], position[2]);
    box(root, [0.65, 0.58, 0.45], [0, 0.75, 0], color, 0.12);
    const head = new THREE.Group();
    head.position.y = 1.31;
    root.add(head);
    box(head, [0.91, 0.57, 0.57], [0, 0, 0], color, 0.12);
    box(head, [0.73, 0.3, 0.04], [0, -0.015, 0.31], palette.dark, 0.035);
    const eyes = [-0.18, 0.18].map((x) =>
      box(head, [0.065, 0.13, 0.03], [x, 0.01, 0.35], glow, 0.012),
    );
    cylinder(head, 0.022, 0.2, [0, 0.39, 0], palette.muted);
    sphere(head, 0.06, [0, 0.51, 0], glow);
    const arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.46, 0.97, 0);
      root.add(pivot);
      box(pivot, [0.17, 0.4, 0.21], [0, -0.18, 0], color, 0.06);
      sphere(pivot, 0.12, [0, -0.43, 0.015], color);
      return pivot;
    });
    const feet = [-0.2, 0.2].map((x) =>
      box(root, [0.27, 0.18, 0.42], [x, 0.13, 0.08], color, 0.05),
    );
    // Match the soles to the platform, including the rounded geometry bevel.
    const soles = feet.map((foot) => {
      foot.geometry.computeBoundingBox();
      return foot.position.y + foot.geometry.boundingBox.min.y;
    });
    root.position.y = -0.025 - Math.min(...soles);
    box(root, [0.19, 0.11, 0.03], [0, 0.77, 0.25], glow, 0.025);
    return { root, head, arms, eyes, feet, base: root.position.clone() };
  }
  const builder = robot(
    palette.purple,
    palette.purpleGlow,
    [-2.5, 0, 0.7],
    0.55,
  );
  const integrator = robot(
    palette.cyan,
    palette.cyanGlow,
    [2.7, 0, -0.6],
    -0.6,
  );
  const reviewer = robot(
    palette.green,
    palette.greenGlow,
    [1.75, 0, 1.6],
    -0.45,
  );

  // The application stands upright in the middle of the shared workbench.
  const app = new THREE.Group();
  app.position.set(-0.25, 1.7, -0.5);
  world.add(app);
  const screen = box(app, [3, 2.15, 0.18], [0, 0, 0], palette.dark, 0.09);
  screen.geometry.computeBoundingBox();
  const screenBottom = screen.geometry.boundingBox.min.y;
  box(app, [3, 0.23, 0.2], [0, 0.98, 0.01], palette.surface, 0.04);
  [-1.28, -1.11, -0.94].forEach((x, i) =>
    sphere(
      app,
      0.035,
      [x, 0.99, 0.13],
      [palette.purpleGlow, palette.cyanGlow, palette.greenGlow][i],
    ),
  );
  box(world, [0.18, 0.6, 0.18], [-0.25, 0.31, -0.5], palette.muted, 0.03);
  box(world, [1.15, 0.08, 0.5], [-0.25, 0.02, -0.5], palette.surface, 0.03);
  const parts = [];
  function part() {
    const group = new THREE.Group();
    app.add(group);
    parts.push(group);
    return group;
  }
  const sidebar = part();
  box(sidebar, [0.48, 1.5, 0.06], [-1.12, -0.03, 0.14], palette.surface, 0.025);
  box(sidebar, [0.26, 0.21, 0.025], [-1.12, 0.49, 0.19], palette.purple, 0.025);
  [0.11, -0.15, -0.41].forEach((y) =>
    box(sidebar, [0.27, 0.045, 0.025], [-1.12, y, 0.19], palette.muted, 0.01),
  );
  const heading = part();
  box(heading, [1.45, 0.12, 0.04], [0.15, 0.56, 0.15], palette.light, 0.02);
  box(heading, [1.05, 0.045, 0.04], [-0.05, 0.33, 0.15], palette.muted, 0.01);
  const cards = part();
  [-0.45, 0.25, 0.95].forEach((x, i) => {
    box(
      cards,
      [0.56, 0.44, 0.08],
      [x, -0.05, 0.17],
      [palette.purple, palette.cyan, palette.green][i],
      0.035,
    );
    box(cards, [0.28, 0.035, 0.025], [x, -0.05, 0.23], palette.dark, 0.01);
  });
  const chart = part();
  [0.18, 0.32, 0.25, 0.49, 0.4, 0.58].forEach((height, i) => {
    box(
      chart,
      [0.16, height, 0.06],
      [-0.5 + i * 0.29, -0.84 + height / 2, 0.15],
      i < 3 ? palette.cyan : palette.purple,
      0.015,
    );
  });
  const parcel = box(
    world,
    [0.48, 0.34, 0.18],
    [-2, 1, 0.7],
    palette.purple,
    0.05,
  );
  const server = new THREE.Group();
  server.position.set(2.1, 0, -1.45);
  world.add(server);
  box(server, [0.65, 1, 0.62], [0, 0.55, 0], palette.surface, 0.07);
  for (let i = 0; i < 3; i++) {
    box(
      server,
      [0.47, 0.16, 0.04],
      [0, 0.3 + i * 0.25, 0.34],
      palette.dark,
      0.015,
    );
    sphere(server, 0.025, [0.15, 0.3 + i * 0.25, 0.38], palette.cyanGlow);
  }
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.25, 0.72, -0.5),
    new THREE.Vector3(1.7, 0.25, -0.2),
    new THREE.Vector3(2.4, 0.18, -0.6),
    new THREE.Vector3(2.1, 0.55, -1.13),
  ]);
  const cable = new THREE.Mesh(
    ownGeometry(new THREE.TubeGeometry(curve, 36, 0.025, 6, false)),
    palette.cyanGlow,
  );
  world.add(cable);
  const pulses = [0, 1, 2].map(() =>
    sphere(world, 0.06, [0, 0, 0], palette.cyanGlow),
  );
  const scanner = box(
    app,
    [2.7, 0.035, 0.08],
    [0, 0.7, 0.25],
    palette.greenGlow,
    0.01,
  );
  const testLights = [0, 1, 2].map((i) =>
    sphere(app, 0.055, [0.82 + i * 0.2, 0.99, 0.15], palette.greenGlow),
  );
  const badge = new THREE.Group();
  badge.position.set(1.45, -0.85, 0.35);
  app.add(badge);
  box(badge, [0.5, 0.5, 0.1], [0, 0, 0], palette.green, 0.07);
  const short = box(
    badge,
    [0.075, 0.18, 0.035],
    [-0.08, -0.025, 0.08],
    palette.dark,
    0.01,
  );
  short.rotation.z = Math.PI / 4;
  const long = box(
    badge,
    [0.075, 0.3, 0.035],
    [0.055, 0.025, 0.08],
    palette.dark,
    0.01,
  );
  long.rotation.z = -Math.PI / 4;
  const confetti = Array.from({ length: 12 }, (_, i) => {
    const mesh = box(
      world,
      [0.07, 0.14, 0.025],
      [0, 0, 0],
      [palette.purple, palette.cyan, palette.green][i % 3],
      0.006,
    );
    return mesh;
  });
  let pointer = 0;
  let lastState;
  let disposed = false;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const onPointer = (event) => {
    if (finePointer.matches)
      pointer = (event.clientX / innerWidth - 0.5) * 0.12;
  };
  host.parentElement.addEventListener("pointermove", onPointer, {
    signal,
    passive: true,
  });
  const resize = () => {
    if (disposed) return;
    const width = Math.max(host.clientWidth, 1),
      height = Math.max(host.clientHeight, 1);
    const aspect = width / height;
    // Keep all three agents visible on phones as well as wider screens.
    const halfWidth = Math.max(4.75, 3.15 * aspect);
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfWidth / aspect;
    camera.bottom = -halfWidth / aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (lastState) draw(lastState);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  renderer.domElement.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      if (!disposed) onFailure();
    },
    { signal },
  );

  function draw(state) {
    if (disposed) return;
    lastState = state;
    const { t } = state;
    world.rotation.y += (pointer - world.rotation.y) * 0.06;
    app.scale.setScalar(Math.max(0.001, state.frame));
    app.position.y = 0.62 - screenBottom * app.scale.y;
    parts.forEach((item, i) => {
      const p = state.parts[i];
      item.visible = p > 0.001;
      item.position.set((1 - p) * -1.9, (1 - p) * -0.7, (1 - p) * 1.3);
      item.scale.setScalar(Math.max(0.001, p));
    });
    [builder, integrator, reviewer].forEach((bot, i) => {
      const work = [state.working, state.connecting, state.testing][i];
      bot.root.position.copy(bot.base);
      bot.head.rotation.z = work * 0.045;
      bot.arms[0].rotation.x = -0.15 - Math.abs(work) * 0.7;
      bot.arms[1].rotation.x = -0.15 - Math.abs(work) * 1.1;
      bot.arms[0].rotation.z = 0.15 + state.celebrate * 1.8;
      bot.arms[1].rotation.z = -0.15 - state.celebrate * 1.8;
      bot.feet.forEach((foot) => {
        foot.rotation.x = 0;
      });
      const blink = Math.sin(t * 2.5 + i * 1.6) > 0.995 ? 0.15 : 1;
      bot.eyes.forEach((eye) => {
        eye.scale.y = blink;
      });
    });
    // Four deliveries from the builder's hands into the application.
    const delivery = clamp((t - 0.7) / 4.2) * 4;
    const trip = delivery % 1;
    parcel.visible = t > 0.7 && t < 4.9;
    parcel.position.set(
      -2.1 + trip * 1.8,
      0.98 + Math.sin(trip * Math.PI) * 1.25,
      1 - trip * 1.1,
    );
    parcel.rotation.set(trip * 0.5, t, -0.15);
    builder.arms[1].rotation.x -= t < 5 ? 0.5 : 0;
    server.visible = state.server > 0.001;
    server.scale.setScalar(Math.max(0.001, state.server));
    server.position.y = -0.04 + (1 - state.server) * 0.4;
    cable.visible = state.connection > 0.001;
    // Reveal the tube along its actual topology, then run signals through it.
    const indices = cable.geometry.index.count;
    cable.geometry.setDrawRange(
      0,
      Math.floor((indices * state.connection) / 6) * 6,
    );
    pulses.forEach((pulse, i) => {
      pulse.visible = state.connection > 0.95 && t < 14;
      pulse.position.copy(curve.getPointAt((t * 0.4 + i / 3) % 1));
    });
    scanner.visible = t >= 9 && t < 11.8;
    scanner.position.y = 0.8 - state.scan * 1.65;
    testLights.forEach((light, i) => {
      light.visible = state.checks[i] > 0.5;
    });
    badge.visible = state.success > 0.01;
    badge.scale.setScalar(Math.max(0.001, state.success));
    confetti.forEach((mesh, i) => {
      const p = clamp((t - 12) / 2);
      mesh.visible = t > 12 && t < 14;
      const angle = (i / confetti.length) * Math.PI * 2;
      mesh.position.set(
        Math.cos(angle) * p * 2.7,
        2.3 + Math.sin(p * Math.PI) * 1.3 - p * 0.7,
        Math.sin(angle) * p * 1.5,
      );
      mesh.rotation.set(t + i, t * 2, i + p * 5);
    });
    renderer.render(scene, camera);
  }
  resize();
  return {
    render: draw,
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      host.parentElement.removeEventListener("pointermove", onPointer);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
