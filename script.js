import * as THREE from "https://unpkg.com/three@0.160.1/build/three.module.js";

const circles = document.querySelectorAll(".circle");

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCircle(entry.target);
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

circles.forEach(circle => observer.observe(circle));

function animateCircle(circle) {
  const percent = Number(circle.getAttribute("data-percent") || 100);
  const progress = circle.querySelector(".progress");
  if (!progress) return;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  setTimeout(() => {
    progress.style.strokeDashoffset = offset;
  }, 200);
}

function initCarousel(carouselEl) {
  const track = carouselEl.querySelector(".carousel-track");
  const slides = carouselEl.querySelectorAll(".carousel-item");
  const nextBtn = carouselEl.querySelector(".next");
  const prevBtn = carouselEl.querySelector(".prev");

  if (!track || slides.length === 0) return;

  let index = 0;
  let intervalId = null;

  const updateCarousel = () => {
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
  };

  const goNext = () => {
    index = (index + 1) % slides.length;
    updateCarousel();
  };

  const goPrev = () => {
    index = (index - 1 + slides.length) % slides.length;
    updateCarousel();
  };

  if (nextBtn) nextBtn.addEventListener("click", goNext);
  if (prevBtn) prevBtn.addEventListener("click", goPrev);

  const start = () => {
    if (intervalId) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    intervalId = window.setInterval(goNext, 3000);
  };

  const stop = () => {
    if (!intervalId) return;
    window.clearInterval(intervalId);
    intervalId = null;
  };

  carouselEl.addEventListener("mouseenter", stop);
  carouselEl.addEventListener("mouseleave", start);
  window.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  updateCarousel();
  start();
}

document.querySelectorAll(".carousel").forEach(initCarousel);

function initAnchorFocus() {
  const focusSection = (hash) => {
    if (!hash || hash === "#") return;
    let el = null;
    try {
      el = document.querySelector(hash);
    } catch {
      el = null;
    }
    if (!el || el.tagName !== "SECTION") return;
    el.classList.remove("anchor-focus");
    void el.offsetWidth;
    el.classList.add("anchor-focus");
    window.setTimeout(() => {
      el.classList.remove("anchor-focus");
    }, 950);
  };

  document.querySelectorAll('.navbar a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      history.pushState(null, "", href);
      focusSection(href);
    });
  });

  window.addEventListener("hashchange", () => {
    focusSection(window.location.hash);
  });

  if (window.location.hash) {
    window.setTimeout(() => focusSection(window.location.hash), 0);
  }
}

function initScrollEffects() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sections = Array.from(document.querySelectorAll("section")).filter((s) => s.id !== "splash");
  sections.forEach((s) => s.classList.add("reveal-section"));

  const popStats = (statsSection) => {
    const cards = Array.from(statsSection.querySelectorAll(".stat-card"));
    if (cards.length === 0) return;
    const baseDelay = 650;
    cards.forEach((card, i) => {
      window.setTimeout(() => {
        card.classList.add("stat-pop");
        window.setTimeout(() => {
          card.classList.remove("stat-pop");
        }, 360);
      }, baseDelay + i * 110);
    });
  };

  const obs = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("stats")) popStats(entry.target);
        obs.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  sections.forEach((s) => obs.observe(s));
}

initScrollEffects();
initAnchorFocus();

function initLiquidGlass() {
  const app = document.getElementById("app");
  if (!app) return;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(app.clientWidth || innerWidth, app.clientHeight || innerHeight);
  app.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  const bgTexture = new THREE.CanvasTexture(bgCanvas);
  bgTexture.minFilter = THREE.LinearFilter;
  bgTexture.magFilter = THREE.LinearFilter;
  const splashImage = new Image();
  splashImage.decoding = "async";
  splashImage.src = new URL("./assets/NtandoMsw.png", import.meta.url).toString();
  let bgDirty = true;
  let parallaxTargetY = 0;
  let parallaxY = 0;
  splashImage.addEventListener("load", () => {
    bgDirty = true;
  });
  window.addEventListener(
    "scroll",
    () => {
      bgDirty = true;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const t = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      parallaxTargetY = t * 0.02;
    },
    { passive: true },
  );
  {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const t = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    parallaxTargetY = t * 0.02;
  }

  function drawBackground() {
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    bgCanvas.width = w;
    bgCanvas.height = h;

    const grd = bgCtx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#ffffffff");
    grd.addColorStop(1, "#ffffffff");
    bgCtx.fillStyle = grd;
    bgCtx.fillRect(0, 0, w, h);

    const pr = renderer.getPixelRatio();
    const navH = Math.round((document.querySelector(".navbar")?.offsetHeight || 80) * pr);
    const safeH = Math.max(0, h - navH);
    const scrollPx = Math.round(window.scrollY * pr);
    const safeTop = navH - scrollPx;
    const safeBottom = navH + safeH - scrollPx;

    if (safeH > 0 && splashImage.complete && splashImage.naturalWidth > 0) {
      const leftText = "SOFTWARE";
      const rightText = "DEVELOPER </>";
      const sideText =
        "A software developer passionate about building things that actually work in the real world. I enjoy solving problems and bringing ideas to life through code.";

      const margin = Math.round(Math.min(w, safeH) * 0.06);
      const gap = Math.max(18, Math.round(Math.min(w, safeH) * 0.02));
      const contentW = Math.max(0, w - margin * 2);

      const imgAsp = splashImage.naturalWidth / splashImage.naturalHeight;
      const imageH = safeH;
      let titleSize = Math.round(Math.min(contentW, safeH) * 0.75);

      const measureGroupWidth = () => {
        bgCtx.font = `700 ${titleSize}px "Bebas Neue", sans-serif`;
        const leftW = bgCtx.measureText(leftText).width;
        const rightW = bgCtx.measureText(rightText).width;
        const imgW = imageH * imgAsp;
        return leftW + gap + imgW + gap + rightW;
      };

      for (let i = 0; i < 12; i++) {
        const groupW = measureGroupWidth();
        if (groupW <= contentW) break;
        const s = contentW / groupW;
        titleSize = Math.max(30, Math.floor(titleSize * s));
      }

      bgCtx.font = `700 ${titleSize}px "Bebas Neue", sans-serif`;
      const leftW = bgCtx.measureText(leftText).width;
      const rightW = bgCtx.measureText(rightText).width;
      const imageW = imageH * imgAsp;
      const groupW = leftW + gap + imageW + gap + rightW;
      const startX = margin + Math.max(0, (contentW - groupW) * 0.5);

      const imgY = safeBottom - imageH;
      const yMid = safeTop + safeH * 0.5;

      bgCtx.fillStyle = "#111111";
      bgCtx.textAlign = "left";
      bgCtx.textBaseline = "middle";
      bgCtx.fillText(leftText, startX, yMid);
      bgCtx.drawImage(splashImage, startX + leftW + gap, imgY, imageW, imageH);
      bgCtx.fillText(rightText, startX + leftW + gap + imageW + gap, yMid);

      const developerX = startX + leftW + gap + imageW + gap;
      const paraX = Math.max(margin, developerX - Math.round(titleSize * 0.15));
      const maxW = Math.min(w - margin - paraX, Math.max(320, Math.round(contentW * 0.46)));
      const paraSize = Math.max(10, Math.round(Math.min(maxW, safeH) * 0.032));
      const lineH = Math.round(paraSize * 1.6);
      const words = sideText.split(/\s+/);
      const lines = [];
      let current = "";
      bgCtx.font = `400 ${paraSize}px "VT323", monospace`;
      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (bgCtx.measureText(next).width <= maxW) {
          current = next;
          continue;
        }
        if (current) lines.push(current);
        current = word;
      }
      if (current) lines.push(current);

      const totalH = lines.length * lineH;
      const minY = safeTop + margin;
      const maxY = safeBottom - margin - totalH;
      const desiredY = yMid + Math.round(titleSize * 0.65);
      const yStart = Math.max(minY, Math.min(maxY, desiredY));

      bgCtx.fillStyle = "rgba(17, 17, 17, 0.74)";
      bgCtx.textAlign = "left";
      bgCtx.textBaseline = "top";
      let y = yStart;
      for (const line of lines) {
        bgCtx.fillText(line, paraX, y);
        y += lineH;
      }
    }

    bgTexture.needsUpdate = true;
  }

  if (document.fonts?.ready)
    document.fonts.ready.then(() => {
      bgDirty = true;
    });
  drawBackground();

  const MAX_DROPLETS = 40;
  const FIXED_DT_MS = 8;
  const MAX_FRAME_DT_MS = 100;
  const MAX_CATCHUP = 6;

  const MAX_ENTRIES = MAX_DROPLETS * 2;
  const dropletBuf = new Float32Array(MAX_ENTRIES * 4);
  const dropletTex = new THREE.DataTexture(
    dropletBuf,
    MAX_ENTRIES,
    1,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  dropletTex.minFilter = THREE.NearestFilter;
  dropletTex.magFilter = THREE.NearestFilter;
  dropletTex.needsUpdate = true;

  let drops = [];
  let uid = 0;

  function spawn(x, y, r, vx = 0, vy = 0) {
    if (drops.length >= MAX_DROPLETS) return null;
    const area = Math.PI * r * r;
    const angle = Math.random() * Math.PI * 2;
    const spd = 0.0003 + Math.random() * 0.0008;
    const d = {
      id: uid++,
      x,
      y,
      r,
      area,
      vx: vx || Math.cos(angle) * spd,
      vy: vy || Math.sin(angle) * spd,
      alive: true,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: 0.3 + Math.random() * 0.5,
      softPrevX: x,
      softPrevY: y,
      softOffX: 0,
      softOffY: 0,
      softVelX: 0,
      softVelY: 0,
    };
    drops.push(d);
    return d;
  }

  for (let i = 0; i < 12; i++) {
    spawn((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.5, 0.03 + Math.random() * 0.05);
  }

  const vertSrc = `void main(){ gl_Position = vec4(position, 1.0); }`;
  const fragSrc = `
precision highp float;
#define MAX_N ${MAX_ENTRIES}

uniform vec2      uRes;
uniform sampler2D uData;
uniform sampler2D uBg;
uniform int       uCount;
uniform float     uTime;
uniform vec2      uParallax;

void main(){
  vec2  uv  = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2  p   = (uv - 0.5) * vec2(asp, 1.0);

  float field = 0.0;
  vec2  grad  = vec2(0.0);
  vec2  lens  = vec2(0.0);
  float lensW = 0.0;

  for(int i = 0; i < MAX_N; i++){
    if(i >= uCount) break;
    vec4  d = texture2D(uData, vec2((float(i)+0.5)/float(MAX_N), 0.5));
    vec2  c = d.xy;
    float r = d.z;
    if(r < 0.001) continue;
    vec2  delta = p - c;
    float dSq   = dot(delta, delta) + 1e-5;
    float contrib = r * r / dSq;
    field += contrib;
    grad  += -2.0 * contrib / dSq * delta;

    float w = r * r / (dSq + r * r);
    lens += (c - p) * w;
    lensW += w;
  }

  lens /= (lensW + 0.001);
  float lensLen = length(lens);

  float thr  = 1.0;
  float edge = smoothstep(thr - 0.08, thr + 0.03, field);

  float refractStrength = 0.035;
  float mappedLens = atan(lensLen * 6.0) * refractStrength;
  vec2  refractDir = (lensLen > 1e-5) ? lens / lensLen : vec2(0.0);
  float refractMask = smoothstep(thr - 0.2, thr + 1.5, field);
  vec2  refractedUV = clamp(uv + refractDir * mappedLens * refractMask, 0.001, 0.999);

  vec2  bgUV = clamp(uv + uParallax, 0.001, 0.999);
  vec2  refrBgUV = clamp(refractedUV + uParallax, 0.001, 0.999);
  vec3  bgClean = texture2D(uBg, bgUV).rgb;

  float gradLen = length(grad);
  float nScale = atan(gradLen * 0.5) * 0.3;
  vec2  nGrad  = (gradLen > 1e-4) ? (grad / gradLen) * nScale : vec2(0.0);
  vec3  N = normalize(vec3(-nGrad, 1.0));
  vec3  L = normalize(vec3(0.3, 0.6, 1.0));
  vec3  V = vec3(0.0, 0.0, 1.0);
  vec3  H = normalize(L + V);
  float diff = max(dot(N, L), 0.0);
  float spec = pow(max(dot(N, H), 0.0), 180.0);

  float cosTheta = max(dot(N, V), 0.0);
  float fresnel  = 0.04 + 0.96 * pow(1.0 - cosTheta, 4.0);

  float rim = smoothstep(thr + 0.6, thr, field) * edge;

  float caStr = 0.0018 * edge;
  vec3 bgCA;
  bgCA.r = texture2D(uBg, clamp(refrBgUV + vec2(caStr, caStr * 0.5), 0.001, 0.999)).r;
  bgCA.g = texture2D(uBg, refrBgUV).g;
  bgCA.b = texture2D(uBg, clamp(refrBgUV - vec2(caStr, caStr * 0.5), 0.001, 0.999)).b;

  float depth = smoothstep(thr, thr + 3.0, field);
  vec3  tint  = mix(vec3(1.0), vec3(0.93, 0.96, 1.0), depth * 0.45);

  vec3 glassColor = bgCA * tint * (0.92 + 0.08 * diff)
                  + vec3(1.0) * spec * 0.85
                  + vec3(0.9, 0.95, 1.0) * rim * 0.22
                  + vec3(1.0) * fresnel * 0.10;

  vec3 bubbleBlue = vec3(0.21960784, 0.7411765, 0.972549);
  float blueAmt = 0.18 + 0.22 * depth;
  glassColor = mix(glassColor, bubbleBlue, blueAmt);

  float shadowField = smoothstep(thr - 0.35, thr - 0.05, field);
  vec3 bg = bgClean * (1.0 - shadowField * 0.06);

  float borderOuter = smoothstep(thr - 0.10, thr - 0.01, field);
  float borderInner = smoothstep(thr + 0.0, thr + 0.06, field);
  float border = borderOuter * (1.0 - borderInner) * 0.28;

  vec3  col = mix(bg, glassColor, edge);
  col += vec3(1.0) * border;

  gl_FragColor = vec4(col, 1.0);
}
`;

  const mat = new THREE.ShaderMaterial({
    vertexShader: vertSrc,
    fragmentShader: fragSrc,
    uniforms: {
      uRes: { value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) },
      uData: { value: dropletTex },
      uBg: { value: bgTexture },
      uCount: { value: 0 },
      uTime: { value: 0 },
      uParallax: { value: new THREE.Vector2(0, 0) },
    },
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

  let aspect = (app.clientWidth || innerWidth) / (app.clientHeight || innerHeight);
  const mouse = { x: 999, y: 999, active: false, down: false };
  let spawnCD = 0;
  const NAV_PAD_PX = 10;

  function getNavTopLimit() {
    const canvasRect = renderer.domElement.getBoundingClientRect();
    if (!canvasRect.height) return 0.5;
    const nav = document.querySelector(".navbar");
    if (!nav) return 0.5;
    const navRect = nav.getBoundingClientRect();
    const navBottomNorm = navRect.bottom / canvasRect.height;
    const padNorm = NAV_PAD_PX / canvasRect.height;
    const limit = 0.5 - navBottomNorm - padNorm;
    return Math.max(-0.5, Math.min(0.5, limit));
  }

  function updateMouseFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    const inside = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
    const nav = document.querySelector(".navbar");
    const overNav = !!nav && e.clientY <= nav.getBoundingClientRect().bottom + NAV_PAD_PX;
    mouse.active = inside && !overNav;
    if (!inside) return;
    mouse.x = (nx - 0.5) * aspect;
    mouse.y = 0.5 - ny;
  }

  window.addEventListener("pointermove", updateMouseFromEvent, { passive: true });
  window.addEventListener("pointerdown", (e) => {
    mouse.down = true;
    updateMouseFromEvent(e);
  });
  window.addEventListener("pointerup", () => {
    mouse.down = false;
  });
  window.addEventListener("blur", () => {
    mouse.active = false;
    mouse.down = false;
  });

  function resize() {
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(app.clientWidth || innerWidth, app.clientHeight || innerHeight);
    aspect = (app.clientWidth || innerWidth) / (app.clientHeight || innerHeight);
    mat.uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const t = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    parallaxTargetY = t * 0.02;
    drawBackground();
  }

  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(resize);
    ro.observe(app);
  } else {
    window.addEventListener("resize", resize, { passive: true });
  }

  const DAMP = 0.993;
  const MOUSE_R = 0.18;
  const MOUSE_F = 0.004;
  const TENSION_RANGE = 0.12;
  const TENSION_F = 0.0004;
  const MERGE_RATIO = 0.62;
  const SPLIT_SPEED = 0.013;
  const SPLIT_MIN_R = 0.04;
  const MAX_SPEED = 0.015;
  const BOUNCE = 0.4;
  const WANDER_F = 0.00004;
  const CENTER_PULL = 0.000008;

  function applyForces() {
    for (const d of drops) {
      d.wanderAngle += (Math.random() - 0.5) * d.wanderSpeed;
      d.vx += Math.cos(d.wanderAngle) * WANDER_F;
      d.vy += Math.sin(d.wanderAngle) * WANDER_F;

      d.vx -= d.x * CENTER_PULL;
      d.vy -= d.y * CENTER_PULL;

      if (mouse.active) {
        const dx = d.x - mouse.x;
        const dy = d.y - mouse.y;
        const dSq = dx * dx + dy * dy;
        const rr = MOUSE_R + d.r;
        if (dSq < rr * rr && dSq > 1e-5) {
          const dist = Math.sqrt(dSq);
          const s = 1 - dist / rr;
          const f = s * s * MOUSE_F;
          d.vx += (dx / dist) * f;
          d.vy += (dy / dist) * f;
        }
      }
    }

    for (let i = 0; i < drops.length; i++) {
      const a = drops[i];
      for (let j = i + 1; j < drops.length; j++) {
        const b = drops[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dSq = dx * dx + dy * dy;
        const rng = TENSION_RANGE + a.r + b.r;
        if (dSq < rng * rng && dSq > 1e-5) {
          const dist = Math.sqrt(dSq);
          const s = 1 - dist / rng;
          const f = s * TENSION_F;
          const fx = (dx / dist) * f;
          const fy = (dy / dist) * f;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
    }
  }

  function integrate() {
    const navTop = getNavTopLimit();
    for (const d of drops) {
      const sp = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (sp > MAX_SPEED) {
        const s = MAX_SPEED / sp;
        d.vx *= s;
        d.vy *= s;
      }
      d.x += d.vx;
      d.y += d.vy;
      d.vx *= DAMP;
      d.vy *= DAMP;

      const wx = aspect * 0.5;
      const wy = 0.5;
      if (d.x - d.r < -wx) {
        d.x = -wx + d.r;
        d.vx = Math.abs(d.vx) * BOUNCE;
      }
      if (d.x + d.r > wx) {
        d.x = wx - d.r;
        d.vx = -Math.abs(d.vx) * BOUNCE;
      }
      if (d.y - d.r < -wy) {
        d.y = -wy + d.r;
        d.vy = Math.abs(d.vy) * BOUNCE;
      }
      const topLimit = Math.min(wy, navTop);
      if (d.y + d.r > topLimit) {
        d.y = topLimit - d.r;
        d.vy = -Math.abs(d.vy) * BOUNCE;
      }
    }
  }

  function mergeDroplets() {
    for (let i = 0; i < drops.length; i++) {
      const a = drops[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < drops.length; j++) {
        const b = drops[j];
        if (!b.alive) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (a.r + b.r) * MERGE_RATIO) {
          const na = a.area + b.area;
          a.x = (a.x * a.area + b.x * b.area) / na;
          a.y = (a.y * a.area + b.y * b.area) / na;
          a.vx = (a.vx * a.area + b.vx * b.area) / na;
          a.vy = (a.vy * a.area + b.vy * b.area) / na;
          a.r = Math.sqrt(na / Math.PI);
          a.area = na;
          b.alive = false;
        }
      }
    }
    drops = drops.filter((d) => d.alive);
  }

  function splitDroplets() {
    const add = [];
    for (const d of drops) {
      if (d.r < SPLIT_MIN_R) continue;
      const sp = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      if (sp < SPLIT_SPEED) continue;

      const ha = d.area * 0.5;
      const nr = Math.sqrt(ha / Math.PI);
      const nx = -d.vy / sp;
      const ny = d.vx / sp;
      const off = nr * 0.7;

      d.r = nr;
      d.area = ha;
      d.x -= nx * off;
      d.y -= ny * off;

      add.push({
        id: uid++,
        x: d.x + nx * off * 2,
        y: d.y + ny * off * 2,
        r: nr,
        area: ha,
        vx: d.vx + nx * sp * 0.35,
        vy: d.vy + ny * sp * 0.35,
        alive: true,
        wanderAngle: Math.random() * Math.PI * 2,
        wanderSpeed: 0.3 + Math.random() * 0.5,
        softPrevX: d.x + nx * off * 2,
        softPrevY: d.y + ny * off * 2,
        softOffX: 0,
        softOffY: 0,
        softVelX: 0,
        softVelY: 0,
      });
    }
    for (const a of add) if (drops.length < MAX_DROPLETS) drops.push(a);
  }

  let autoTimer = 0;
  function autoSpawn() {
    autoTimer += FIXED_DT_MS;
    if (autoTimer > 2000 && drops.length < 10) {
      autoTimer = 0;
      spawn((Math.random() - 0.5) * aspect * 0.6, (Math.random() - 0.5) * 0.6, 0.025 + Math.random() * 0.03);
    }
  }

  function mouseSpawn() {
    if (!mouse.down || !mouse.active) return;
    const topLimit = getNavTopLimit();
    if (mouse.y > topLimit - 0.02) return;
    spawnCD -= FIXED_DT_MS;
    if (spawnCD <= 0 && drops.length < MAX_DROPLETS) {
      spawnCD = 120;
      spawn(
        mouse.x + (Math.random() - 0.5) * 0.02,
        mouse.y + (Math.random() - 0.5) * 0.02,
        0.02 + Math.random() * 0.015,
      );
    }
  }

  const SOFT_STIFFNESS = 0.22;
  const SOFT_DAMPING = 0.6;
  function updateSoftBodies() {
    for (const d of drops) {
      const dx = d.x - d.softPrevX;
      const dy = d.y - d.softPrevY;

      d.softVelX += (dx - d.softOffX) * SOFT_STIFFNESS;
      d.softVelY += (dy - d.softOffY) * SOFT_STIFFNESS;
      d.softVelX *= SOFT_DAMPING;
      d.softVelY *= SOFT_DAMPING;
      d.softOffX += d.softVelX;
      d.softOffY += d.softVelY;

      d.softPrevX = d.x;
      d.softPrevY = d.y;
    }
  }

  let simTime = 0;
  function fixedUpdate() {
    simTime += FIXED_DT_MS;
    applyForces(simTime);
    integrate();
    mergeDroplets();
    splitDroplets();
    updateSoftBodies();
    autoSpawn();
    mouseSpawn();
  }

  function sync() {
    dropletBuf.fill(0);
    const n = Math.min(drops.length, MAX_DROPLETS);
    for (let i = 0; i < n; i++) {
      const d = drops[i];
      dropletBuf[i * 4] = d.x;
      dropletBuf[i * 4 + 1] = d.y;
      dropletBuf[i * 4 + 2] = d.r;
      dropletBuf[i * 4 + 3] = 1;

      const ghostScale = 0.7;
      const trailStr = 3.5;
      const gi = (n + i) * 4;
      dropletBuf[gi] = d.x - d.softOffX * trailStr;
      dropletBuf[gi + 1] = d.y - d.softOffY * trailStr;
      dropletBuf[gi + 2] = d.r * ghostScale;
      dropletBuf[gi + 3] = 1;
    }
    dropletTex.needsUpdate = true;
    mat.uniforms.uCount.value = n * 2;
  }

  let last = performance.now();
  let acc = 0;
  let paused = false;

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused) last = performance.now();
  });

  (function loop() {
    if (paused) {
      requestAnimationFrame(loop);
      return;
    }
    const now = performance.now();
    const dt = Math.min(now - last, MAX_FRAME_DT_MS);
    last = now;
    acc += dt;

    let g = 0;
    while (acc >= FIXED_DT_MS && g < MAX_CATCHUP) {
      fixedUpdate();
      acc -= FIXED_DT_MS;
      g++;
    }
    if (g >= MAX_CATCHUP) acc = 0;

    mat.uniforms.uTime.value = now * 0.001;
    parallaxY += (parallaxTargetY - parallaxY) * 0.08;
    mat.uniforms.uParallax.value.set(0, parallaxY);
    if (bgDirty) {
      drawBackground();
      bgDirty = false;
    }
    sync();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  })();
}

initLiquidGlass();
