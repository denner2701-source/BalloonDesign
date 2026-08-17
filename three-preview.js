(() => {
  if (!window.THREE) return;
  const host = document.querySelector('#preview-stage');
  host.replaceChildren();
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.className = 'three-preview-canvas';
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, .3, 7.3);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x76608c, 2.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3, 5, 6);
  scene.add(key);
  const group = new THREE.Group();
  scene.add(group);
  const geometry = new THREE.SphereGeometry(.17, 14, 12);
  const neck = new THREE.ConeGeometry(.045, .11, 8);
  const materials = new Map();
  const materialFor = (color) => {
    if (!materials.has(color)) materials.set(color, new THREE.MeshPhongMaterial({ color, shininess: 65, specular: 0xffffff }));
    return materials.get(color);
  };
  const isVisible = (col, row) => {
    if (['panel_duplet', 'panel_alternating', 'duplet_alternating'].includes(state.shape)) return true;
    if (state.shape === 'column') return col > Math.floor(state.cols * .25) && col < Math.ceil(state.cols * .75);
    if (state.shape === 'disc') {
      const x = (col + .5) / state.cols * 2 - 1;
      const y = (row + .5) / state.rows * 2 - 1;
      return x * x + y * y <= .94;
    }
    if (state.shape === 'organic') {
      const progress = state.cols <= 1 ? 0 : col / (state.cols - 1);
      const center = state.rows * (.72 - progress * .40 + Math.sin(progress * Math.PI * 2) * .08);
      return Math.abs(row - center) <= Math.max(1.4, state.rows * .16);
    }
    const x = (col + .5) / state.cols * 2 - 1;
    const y = (row + .4) / state.rows;
    return x * x + Math.pow(y - 1.03, 2) < 1.06 && y > .07;
  };
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  function renderThree() {
    group.clear();
    const spacing = Math.min(3.5 / state.cols, 2.8 / state.rows);
    const scale = Math.max(.58, Math.min(1.25, spacing / .22));
    const sampleStep = Math.max(1, Math.ceil((state.cols * state.rows) / 650));
    for (let row = 0; row < state.rows; row += 1) for (let col = 0; col < state.cols; col += 1) {
      if (!isVisible(col, row)) continue;
      const index = row * state.cols + col;
      if (index % sampleStep) continue;
      const color = state.cells[index] || '#ded9e8';
      const selectedSize = Number(state.balloonSizes?.[index] || state.selectedSize || 9);
      const patternScale = state.shape === 'organic' ? [.72, 1, 1.3, .86][(row * 3 + col) % 4] : (state.shape === 'panel_alternating' || state.shape === 'duplet_alternating') && (row + col) % 3 === 0 ? 1.18 : 1;
      const sizeScale = Math.max(.62, Math.min(1.4, selectedSize / 9)) * patternScale;
      let x = (col - (state.cols - 1) / 2) * spacing;
      const y = ((state.rows - 1) / 2 - row) * spacing;
      let z = Math.sin(col * .8 + row * .5) * .08;
      if (state.shape === 'duplet_alternating') {
        const angle = col / state.cols * Math.PI * 2;
        x = Math.cos(angle) * 1.15;
        z = Math.sin(angle) * 1.15;
      }
      const balloon = new THREE.Mesh(geometry, materialFor(color));
      balloon.position.set(x, y, z);
      balloon.scale.setScalar(scale * sizeScale);
      const knot = new THREE.Mesh(neck, materialFor(color));
      knot.position.set(x, y - .2 * scale * sizeScale, z);
      knot.rotation.x = Math.PI;
      knot.scale.setScalar(scale * sizeScale);
      group.add(balloon, knot);
    }
    group.rotation.y = Number(state.rotation || 0) * Math.PI / 180;
    resize();
    renderer.render(scene, camera);
  }
  const previousRender = renderAll;
  renderAll = () => { previousRender(); renderThree(); };
  document.querySelector('#rotation').addEventListener('input', renderThree);
  new ResizeObserver(renderThree).observe(host);
  renderThree();
})();
