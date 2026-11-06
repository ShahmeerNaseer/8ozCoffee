(function () {
  'use strict';

  const heroCanvas = document.getElementById('heroCoffeeCanvas');
  const experienceCanvas = document.getElementById('experienceCoffeeCanvas');
  const heroVisual = document.querySelector('.hero-visual');

  if (!heroCanvas || !experienceCanvas || !window.THREE || !THREE.GLTFLoader) {
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mountCoffee(canvas, source, options) {
    options = options || {};

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
      });
    } catch (error) {
      console.warn('WebGL is not available for the 3D coffee model.', error);
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 1.85, 4.15);
    camera.lookAt(0, -0.08, 0);

    scene.add(new THREE.HemisphereLight(0xfff2df, 0x2b1a12, 0.95));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xd8a35a, 0.45);
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);

    const tilt = new THREE.Group();
    const spin = new THREE.Group();
    const shift = new THREE.Group();

    tilt.add(spin);
    spin.add(shift);
    spin.rotation.x = 0.24;
    shift.add(source);
    scene.add(tilt);

    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(tilt);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    shift.position.copy(center).negate();
    spin.scale.setScalar((options.fitSize || 2.5) / maxDim);

    const clock = new THREE.Clock();
    const pointerTarget = options.pointerTarget || canvas.parentElement;
    let targetX = 0;
    let targetY = 0;
    let rafId = null;
    let visible = true;

    function onPointerMove(event) {
      const rect = pointerTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetY = -x * 0.85;
      targetX = y * 0.5;
    }

    function onPointerLeave() {
      targetX = 0;
      targetY = 0;
    }

    if (options.mode === 'cursor' && pointerTarget) {
      pointerTarget.addEventListener('pointermove', onPointerMove, { passive: true });
      pointerTarget.addEventListener('pointerleave', onPointerLeave);
    }

    function resize() {
      const width = canvas.clientWidth || canvas.parentElement.clientWidth || 1;
      const height = canvas.clientHeight || canvas.parentElement.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (reduceMotion) renderer.render(scene, camera);
    }

    function frame() {
      if (!visible) {
        rafId = null;
        return;
      }

      const elapsed = clock.getElapsedTime();

      if (options.mode === 'cursor') {
        tilt.rotation.y += (targetY - tilt.rotation.y) * 0.075;
        tilt.rotation.x += (targetX - tilt.rotation.x) * 0.075;
        spin.rotation.y += reduceMotion ? 0 : 0.0022;
      } else {
        tilt.rotation.y = Math.sin(elapsed * 0.45) * 0.12;
        tilt.rotation.x = Math.sin(elapsed * 0.7) * 0.07;
        spin.rotation.y += reduceMotion ? 0 : 0.0034;
        spin.position.y = Math.sin(elapsed * 1.1) * 0.05;
      }

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(frame);
    }

    function play() {
      if (reduceMotion || rafId !== null || !visible) return;
      rafId = window.requestAnimationFrame(frame);
    }

    function stop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    if ('ResizeObserver' in window && canvas.parentElement) {
      new ResizeObserver(resize).observe(canvas.parentElement);
    }

    if ('IntersectionObserver' in window && canvas.parentElement) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) play();
        else stop();
      }, { threshold: 0.05 }).observe(canvas.parentElement);
    }

    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      play();
    }

    return { renderer: renderer, scene: scene, camera: camera };
  }

  const loader = new THREE.GLTFLoader();
  let embeddedRequested = false;

  function parseEmbeddedModel(onLoad, onError) {
    if (window.COFFEE_MODEL_BASE64) {
      parseBase64Model(onLoad, onError);
      return;
    }

    if (embeddedRequested) {
      onError(new Error('Embedded coffee model is already loading.'));
      return;
    }

    embeddedRequested = true;
    const script = document.createElement('script');
    script.src = 'js/coffee-model.js';
    script.onload = function () {
      parseBase64Model(onLoad, onError);
    };
    script.onerror = function () {
      onError(new Error('Unable to load embedded coffee model.'));
    };
    document.body.appendChild(script);
  }

  function parseBase64Model(onLoad, onError) {
    try {
      const binary = window.atob(window.COFFEE_MODEL_BASE64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      loader.parse(bytes.buffer, '', onLoad, onError);
    } catch (error) {
      onError(error);
    }
  }

  function onModelLoaded(gltf) {
    const model = gltf.scene;

    mountCoffee(heroCanvas, model.clone(true), {
      mode: 'cursor',
      pointerTarget: heroVisual,
      fitSize: 2.45
    });

    mountCoffee(experienceCanvas, model.clone(true), {
      mode: 'idle',
      fitSize: 2.35
    });
  }

  function onModelError(error) {
    console.error('Unable to load coffee model.', error);
  }

  if (window.location.protocol === 'file:') {
    parseEmbeddedModel(onModelLoaded, onModelError);
  } else {
    loader.load('coffee.glb', onModelLoaded, undefined, function (error) {
      console.warn('coffee.glb failed to load; trying embedded fallback.', error);
      parseEmbeddedModel(onModelLoaded, onModelError);
    });
  }
})();
