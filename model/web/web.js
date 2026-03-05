import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const CORE_BUILD_ID = "1772481939";
const WEB_BUILD_ID = "1772738546";
const MILESTONE_LABEL = "VERITAS";
const CACHE_BUST = `${CORE_BUILD_ID}-${WEB_BUILD_ID}`;

const TOPOLOGY_URL = `./topology.web.json?v=${CACHE_BUST}`;
const SCENARIOS_URL = `./scenarios.web.json?v=${CACHE_BUST}`;
const MODES_URL = `./neurotransmitters.web.json?v=${CACHE_BUST}`;
const SOURCES_URL = `./sources.web.json?v=${CACHE_BUST}`;

const CLICK_DRAG_THRESHOLD_PX = 6;
const SEARCH_FOCUS_DURATION_MS = 520;
const MAX_RENDER_PIXEL_RATIO =
  (window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0) ? 1.5 : 2;
const PRIMARY_DENDRITE_BRANCH_COUNT = 8;
const SECONDARY_DENDRITE_BRANCH_COUNT = 5;
const DENDRITE_BASE_LENGTH = 0.10;
const DENDRITE_LENGTH_VARIANCE = 0.05;
const DENDRITE_ROOT_OFFSET = 0.092; // Slightly closer to soma than before (0.10).
const DENDRITE_TIP_RADIUS = 0.010;
const DENDRITE_DISTAL_RADIUS = 0.015;
const DENDRITE_END_CAP_RADIUS = DENDRITE_DISTAL_RADIUS * 0.98;
const DENDRITE_END_CAP_FLATNESS = 0.22;
const DENDRITE_END_CAP_FORWARD_OFFSET = DENDRITE_END_CAP_RADIUS * DENDRITE_END_CAP_FLATNESS; // Back edge of cap is flush with dendrite tip.
const AXON_LENGTH_SCALE = 1.5;
const PROXIMAL_AXON_FRACTION = 0.25; // Proximal:distal = 1:3 while preserving total axon length.
const HILLOCK_RADIUS = 0.03;
const HILLOCK_SOMA_OVERLAP = 0.014;
const AXON_SEGMENT_OVERLAP = 0.006;
const AXON_COLLATERAL_MAX_COUNT = 2;
const AXON_COLLATERAL_BASE_FRACTION = 0.52;
const NUCLEUS_CLICK_GLOW_INTENSITY = 0.90;
// User-requested: 2.6x stronger section glow over current baseline.
const SECTION_PULSE_GLOW_GAIN = 5.10;
// Educational emphasis: source-side dendritic drive glows 2x receiving-side dendritic drive.
const DENDRITE_SOURCE_GLOW_MULTIPLIER = 2.0;
const DENDRITE_RECEIVE_GLOW_MULTIPLIER = 1.0;
const DENDRITE_EVENT_GLOW_DECAY = 8.0;
const SECTION_PULSE_ACTIVE_THRESHOLD = 0.06;
const SECTION_PULSE_TRAVEL_SPEED = 1.32;
const SECTION_AFTERGLOW_RETAIN = 0.978;
const PULSE_TRAIL_SEGMENTS = 4;
const PULSE_TRAIL_GAP = 0.075;
const PULSE_SIZE_SCALE = 0.88;
const PULSE_HALO_SIZE_SCALE = 0.90;
const PULSE_TRAIL_SIZE_SCALE = 0.86;
const PART_LABEL_FONT_SIZE_PX = 14;
const PART_LABEL_PADDING = "3px 10px";
const PART_LABEL_COLLISION_MIN_DX = 108;
const PART_LABEL_COLLISION_MIN_DY = 24;
const PART_LABEL_COLLISION_STEP_Y = 18;
const PART_LABEL_COLLISION_MAX_TRIES = 8;
const SELECTED_SECTION_VIBRANCE = 0.98;
const SELECTED_SECTION_EMISSIVE_FLOOR = 2.8;
const SELECTED_SECTION_EMISSIVE_BOOST = 1.45;

const CLASS_COLOR = {
  excitatory: 0x2ff2c0,
  inhibitory: 0xff57b3,
  modulatory: 0xf3ff3a,
};

const EDGE_BASE_COLOR = {
  excitatory: 0xcaa879,
  inhibitory: 0x6ea6d8,
  modulatory: 0x95b69c,
};
const PART_LABEL_TEXT = {
  soma: "Soma",
  nucleus: "Nucleus",
  dendrite: "Dendrites",
  hillock: "Axon hillock",
  proximal_axon: "Proximal axon",
  distal_axon: "Distal axon",
  bouton: "Terminal bouton",
};
const PART_EXPLAINERS = {
  soma: {
    title: "Soma",
    text: "The soma is the main body of the neuron. It combines incoming signals from dendrites and supports basic cell maintenance. This is the area where many small inputs are added together before the neuron decides whether to fire.",
  },
  nucleus: {
    title: "Nucleus",
    text: "The nucleus stores the cell's DNA and controls long-term cell behavior. It does not carry fast electrical signals, but it regulates protein production and helps the neuron adapt over time.",
  },
  dendrite: {
    title: "Dendrites",
    text: "Dendrites are the main input branches. They receive signals from other neurons and pass those signals toward the soma. Their shape and branching pattern affect how strongly inputs influence the cell.",
  },
  hillock: {
    title: "Axon Hillock",
    text: "The axon hillock is the trigger zone between soma and axon. If total input is strong enough, an action potential starts here and moves down the axon.",
  },
  proximal_axon: {
    title: "Proximal Axon",
    text: "The proximal axon is the first segment after the hillock. It helps stabilize and carry the spike away from the soma with reliable timing.",
  },
  distal_axon: {
    title: "Distal Axon",
    text: "The distal axon is the longer output cable. It carries the spike toward downstream targets, often across larger network distances. In many neurons, this segment gives off collateral branches that let one neuron influence multiple targets.",
  },
  bouton: {
    title: "Terminal Bouton",
    text: "Terminal boutons are output endings where chemical transmitters are released. When a spike arrives, these endings pass the signal to the next neuron at the synapse.",
  },
};

const STYLE_PRESETS = {
  diagram: {
    bg: 0x08111d,
    fog: 0x08111d,
    amb: [0xa4bacf, 0.82],
    key: [0xe0ecf8, 0.84],
    fill: [0x567698, 0.28],
    hemi: [0x58779a, 0x0b1422, 0.29],
  },
  schematic: {
    bg: 0x070f20,
    fog: 0x070f20,
    amb: [0x9ab6d8, 0.76],
    key: [0xd4e7ff, 1.06],
    fill: [0x6d8bb3, 0.44],
    hemi: [0x5d80a8, 0x0d1324, 0.40],
  },
  cinematic: {
    bg: 0x0b1019,
    fog: 0x0b1019,
    amb: [0xb6c7d8, 0.68],
    key: [0xffdeb2, 1.14],
    fill: [0x6fa7cb, 0.36],
    hemi: [0x6c98be, 0x0f1622, 0.34],
  },
  clinical: {
    bg: 0x0a111a,
    fog: 0x0a111a,
    amb: [0xa7bbcf, 0.80],
    key: [0xd5e4f2, 0.96],
    fill: [0x7e94aa, 0.38],
    hemi: [0x778ea8, 0x101821, 0.33],
  },
};

const TYPE_CARD = {
  excitatory: {
    title: "Excitatory projection neuron",
    text: "Excitatory neurons increase downstream activation probability through positive drive. In this model they carry long-range feedforward flow and sustain pathway momentum.",
  },
  inhibitory: {
    title: "Inhibitory interneuron",
    text: "Inhibitory neurons suppress downstream activity and prevent runaway spread. Here they sharpen selectivity, gate transitions, and stabilize late-stage output.",
  },
  modulatory: {
    title: "Modulatory control neuron",
    text: "Modulatory neurons tune gain and timing context rather than acting as binary drivers. They reshape responsiveness of hubs and decision pathways.",
  },
};

const buildEl = document.getElementById("build");
const hudEl = document.getElementById("hud");

const ui = {
  stimSelect: document.getElementById("stimSelect"),
  stimExplain: document.getElementById("stimExplain"),
  morphologySelect: document.getElementById("morphologySelect"),
  morphologyStatus: document.getElementById("morphologyStatus"),
  layoutSelect: document.getElementById("layoutSelect"),
  layoutStatus: document.getElementById("layoutStatus"),
  styleSelect: document.getElementById("styleSelect"),
  styleStatus: document.getElementById("styleStatus"),
  neuroModeSelect: document.getElementById("neuroModeSelect"),
  neuroModeStatus: document.getElementById("neuroModeStatus"),

  toggleAuto: document.getElementById("toggleAuto"),
  btnReset: document.getElementById("btnReset"),
  btnPlay: document.getElementById("btnPlay"),
  btnPause: document.getElementById("btnPause"),
  btnStop: document.getElementById("btnStop"),
  modeSelect: document.getElementById("modeSelect"),
  speedRange: document.getElementById("speedRange"),
  speedVal: document.getElementById("speedVal"),
  timelineText: document.getElementById("timelineText"),
  statusText: document.getElementById("statusText"),
  progressFill: document.getElementById("progressFill"),
  scrubRange: document.getElementById("scrubRange"),
  scrubVal: document.getElementById("scrubVal"),
  btnPrevArrival: document.getElementById("btnPrevArrival"),
  btnNextArrival: document.getElementById("btnNextArrival"),

  narrationRateVal: document.getElementById("narrationRateVal"),
  narrationStatus: document.getElementById("narrationStatus"),
  liveNarrationLog: document.getElementById("liveNarrationLog"),

  selectedPartExplain: document.getElementById("selectedPartExplain"),
  selectedPartTitle: document.getElementById("selectedPartTitle"),
  selectedPartText: document.getElementById("selectedPartText"),
  selectedNeuronTypeCard: document.getElementById("selectedNeuronTypeCard"),
  selectedNeuronTypeTitle: document.getElementById("selectedNeuronTypeTitle"),
  selectedNeuronTypeText: document.getElementById("selectedNeuronTypeText"),

  toggleHull: document.getElementById("toggleHull"),
  hullOpacityRange: document.getElementById("hullOpacityRange"),
  hullOpacityVal: document.getElementById("hullOpacityVal"),
  toggleHoverGroup: document.getElementById("toggleHoverGroup"),
  toggleNeuroNodes: document.getElementById("toggleNeuroNodes"),

  regionSearchInput: document.getElementById("regionSearchInput"),
  btnRegionSearch: document.getElementById("btnRegionSearch"),
  regionSearchSuggest: document.getElementById("regionSearchSuggest"),
  regionSearchStatus: document.getElementById("regionSearchStatus"),

  basisStatus: document.getElementById("basisStatus"),
  graphStatus: document.getElementById("graphStatus"),
  connectivityStatus: document.getElementById("connectivityStatus"),
  atlasMapStatus: document.getElementById("atlasMapStatus"),
  atlasCoverageLine: document.getElementById("atlasCoverageLine"),
  networkContextStatus: document.getElementById("networkContextStatus"),

  stimSourceTier: document.getElementById("stimSourceTier"),
  stimSourceEvidence: document.getElementById("stimSourceEvidence"),
  stimSourceMechanism: document.getElementById("stimSourceMechanism"),
  stimSourceDatasets: document.getElementById("stimSourceDatasets"),
  stimSourceCitations: document.getElementById("stimSourceCitations"),
  stimSourceLinks: document.getElementById("stimSourceLinks"),

  partLabels: document.getElementById("partLabels"),
  partExplainCard: document.getElementById("partExplainCard"),
  partExplainTitle: document.getElementById("partExplainTitle"),
  partExplainText: document.getElementById("partExplainText"),
};

const mobileUi = {
  btnPanel: document.getElementById("btnMobilePanel"),
  btnNarration: document.getElementById("btnMobileNarration"),
  btnCanvas: document.getElementById("btnMobileCanvas"),
};

const state = {
  running: false,
  paused: false,
  t: 0,
  durationS: 14,
  speed: 1,
  mode: "loop",
  autoRotate: false,
  hullOn: false,
  hullOpacity: 0.12,
  hoverGroupOn: true,
  showNeuroNodes: true,
  style: "diagram",
  neuroMode: "glutamate",
  layoutMode: "spiderweb",
};

let topology = null;
let scenarios = [];
let activeScenario = null;
let sourceInfo = null;
const modeProfiles = new Map();
const regionSpectrum = new Map();

const neuronById = new Map();
const edgeById = new Map();
let searchRows = [];
let suggestRows = [];
let suggestCursor = -1;
let selectedNeuronId = "";
let selectedPartId = "";
let selectedEdgeId = "";
let hoveredNeuronId = "";
let hoveredEdgeId = "";
let milestoneNeuronId = "";
let currentMilestoneIndex = -1;
let pointerDown = null;
let pointerDragging = false;
let cameraTween = null;
let lastMs = 0;

const raycaster = new THREE.Raycaster();
const mouseNdc = new THREE.Vector2();
const pickables = [];

const scene = new THREE.Scene();
scene.background = new THREE.Color(STYLE_PRESETS.diagram.bg);
scene.fog = new THREE.Fog(STYLE_PRESETS.diagram.fog, 2.6, 9.6);

const camera = new THREE.PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.01, 500);
camera.position.set(1.2, 1.1, 5.4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.style.position = "fixed";
renderer.domElement.style.inset = "0";
renderer.domElement.style.zIndex = "0";
document.body.insertBefore(renderer.domElement, document.body.firstChild);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.35;
controls.minDistance = 0.16;
controls.maxDistance = 80;
controls.target.set(0, 0, 0);
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
controls.update();

const ambient = new THREE.AmbientLight(0xa4bacf, 0.82);
const keyLight = new THREE.DirectionalLight(0xe0ecf8, 0.84);
const fillLight = new THREE.DirectionalLight(0x567698, 0.28);
const hemi = new THREE.HemisphereLight(0x58779a, 0x0b1422, 0.29);
keyLight.position.set(2.8, 2.2, 1.6);
fillLight.position.set(-2.4, -1.6, -1.5);
scene.add(ambient, keyLight, fillLight, hemi);

const nodeGroup = new THREE.Group();
const edgeGroup = new THREE.Group();
const pulseGroup = new THREE.Group();
const hullGroup = new THREE.Group();
scene.add(nodeGroup, edgeGroup, pulseGroup, hullGroup);

function hud(text, isError = false) {
  if (!hudEl) return;
  hudEl.textContent = text;
  hudEl.classList.toggle("error", Boolean(isError));
}

function safeText(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp01(v) {
  return THREE.MathUtils.clamp(v, 0, 1);
}

function bandPulse(phase, center, width = 0.16) {
  const d0 = Math.abs(phase - center);
  const d = Math.min(d0, 1 - d0);
  if (d >= width) return 0;
  const t = 1 - (d / width);
  return t * t * (3 - (2 * t));
}

function normalizeSearch(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizePartId(partId) {
  const id = safeText(partId).toLowerCase();
  return Object.prototype.hasOwnProperty.call(PART_LABEL_TEXT, id) ? id : "";
}

function hash01(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function applySelectedSectionVibrance(material, boost = 1) {
  if (!material) return;
  const vivid = material.color.clone();
  vivid.offsetHSL(0, 0.46, 0.08);
  material.color.lerp(vivid, SELECTED_SECTION_VIBRANCE);
  material.emissive.copy(vivid).multiplyScalar(0.44 + (0.46 * SELECTED_SECTION_VIBRANCE));
  material.emissiveIntensity = Math.max(
    material.emissiveIntensity + (SELECTED_SECTION_EMISSIVE_BOOST * boost),
    SELECTED_SECTION_EMISSIVE_FLOOR
  );
}

function setStatus(text) {
  if (ui.statusText) ui.statusText.textContent = text;
}

function setBuildBadge() {
  if (buildEl) {
    buildEl.textContent = `WEB | ${MILESTONE_LABEL} | BUILD ${WEB_BUILD_ID}`;
    buildEl.style.display = "block";
  }
  if (hudEl) hudEl.style.display = "block";
}

async function fetchJson(url, label) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed ${label}: HTTP ${res.status}`);
  return res.json();
}

function activeModeProfile() {
  return modeProfiles.get(state.neuroMode) || modeProfiles.get("glutamate") || null;
}

function clusterRowsFor(count) {
  return Math.max(1, Math.ceil(Math.sqrt(Math.max(1, count))));
}

function buildSpiderClusterMap(count) {
  const total = Math.max(1, Math.trunc(toNumber(count, 1)));
  const out = [];
  out.push({ cluster: 0, ring: 0, pos: 0, ringSize: 1, angle: 0, x: 0, z: 0, parent: -1 });
  if (total === 1) return out;

  let idx = 1;
  let ring = 1;
  while (idx < total) {
    const ringSize = 6 * ring;
    const radius = 1 + (ring * 0.95);
    for (let p = 0; p < ringSize && idx < total; p++, idx++) {
      const angle = (p / ringSize) * Math.PI * 2;
      const parentRing = Math.max(1, 6 * (ring - 1));
      const parentPos = Math.floor((p / ringSize) * parentRing);
      let parent = 0;
      if (ring > 1) {
        const parentStart = 1 + (3 * (ring - 1) * (ring - 2));
        parent = parentStart + parentPos;
      }
      out.push({
        cluster: idx,
        ring,
        pos: p,
        ringSize,
        angle,
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        parent,
      });
    }
    ring += 1;
  }
  return out;
}

function expandDataset(rawTopology, rawScenarios, factor) {
  const f = Math.max(1, Math.trunc(toNumber(factor, 1)));
  const topo = JSON.parse(JSON.stringify(rawTopology));
  const scenariosIn = JSON.parse(JSON.stringify(rawScenarios));

  const baseNeurons = topo.neurons.slice();
  const baseEdges = topo.connections.slice();
  const clusterMap = buildSpiderClusterMap(f);

  const scaleX = 1.28;
  const scaleZ = 1.28;
  const expandedNeurons = [];
  const expandedEdges = [];

  const nid = (baseId, c) => (c === 0 ? baseId : `${baseId}_C${String(c).padStart(2, "0")}`);
  const eid = (baseId, c) => (c === 0 ? baseId : `${baseId}_C${String(c).padStart(2, "0")}`);

  for (let c = 0; c < f; c++) {
    const cm = clusterMap[c] || clusterMap[0];
    const centerX = cm.x * scaleX;
    const centerZ = cm.z * scaleZ;
    const rot = cm.angle + ((hash01(`crot_${c}`) - 0.5) * 0.20);
    const offY = (hash01(`cy_${c}`) - 0.5) * 0.12;

    for (const n of baseNeurons) {
      const p = Array.isArray(n.position) ? n.position : [0, 0, 0];
      const sx = toNumber(p[0], 0);
      const sy = toNumber(p[1], 0);
      const sz = toNumber(p[2], 0);
      const rx = (sx * Math.cos(rot)) - (sz * Math.sin(rot));
      const rz = (sx * Math.sin(rot)) + (sz * Math.cos(rot));

      const id = nid(n.id, c);
      expandedNeurons.push({
        ...n,
        id,
        label: c === 0 ? n.label : `${n.label} [${c}]`,
        aliases: [...(n.aliases || []), id.toLowerCase(), `cluster ${c}`],
        cluster_index: c,
        seed_position: [centerX + (rx * 0.34), (sy * 0.76) + offY, centerZ + (rz * 0.34)],
        position: [centerX + (rx * 0.34), (sy * 0.76) + offY, centerZ + (rz * 0.34)],
      });
    }

    for (const e of baseEdges) {
      expandedEdges.push({
        ...e,
        id: eid(e.id, c),
        from: nid(e.from, c),
        to: nid(e.to, c),
        bridge: false,
      });
    }
  }

  const bridgeTemplate = [
    ["N23", "N01", 0.30, "modulatory"],
    ["N24", "N03", 0.28, "modulatory"],
    ["N17", "N05", 0.24, "excitatory"],
    ["N19", "N08", 0.22, "excitatory"],
    ["N22", "N10", 0.26, "inhibitory"],
  ];

  const seenPairs = new Set();
  function pairKey(a, b) { return `${Math.min(a, b)}_${Math.max(a, b)}`; }

  function addBridgePair(a, b, kind = "adj") {
    if (a < 0 || b < 0 || a >= f || b >= f || a === b) return;
    const key = pairKey(a, b);
    if (seenPairs.has(key)) return;
    seenPairs.add(key);

    const scale = kind === "diag" ? 0.86 : (kind === "mesh" ? 0.72 : 1.0);
    for (let i = 0; i < bridgeTemplate.length; i++) {
      const [fromBase, toBase, w, type] = bridgeTemplate[i];
      expandedEdges.push({
        id: `BX_${String(a).padStart(2, "0")}_${String(b).padStart(2, "0")}_${String(i).padStart(2, "0")}`,
        from: nid(fromBase, a),
        to: nid(toBase, b),
        weight: w * scale,
        type,
        bridge: true,
      });
    }
  }

  const byRing = new Map();
  for (const cm of clusterMap) {
    if (!byRing.has(cm.ring)) byRing.set(cm.ring, []);
    byRing.get(cm.ring).push(cm.cluster);
  }

  for (const cm of clusterMap) {
    if (cm.cluster === 0) continue;
    if (cm.parent >= 0) addBridgePair(cm.cluster, cm.parent, "adj");
  }

  for (const [ring, ids] of byRing.entries()) {
    if (ring === 0 || ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      addBridgePair(ids[i], ids[(i + 1) % ids.length], "diag");
    }
  }

  for (let c = 0; c < f; c++) {
    const c0 = clusterMap[c] || clusterMap[0];
    const nearest = [];
    for (let d = 0; d < f; d++) {
      if (d === c) continue;
      const c1 = clusterMap[d] || clusterMap[0];
      const dist2 = ((c0.x - c1.x) ** 2) + ((c0.z - c1.z) ** 2);
      nearest.push([dist2, d]);
    }
    nearest.sort((a, b) => a[0] - b[0]);
    for (const [, d] of nearest.slice(0, 2)) addBridgePair(c, d, "mesh");
  }

  topo.neurons = expandedNeurons;
  topo.connections = expandedEdges;

  const scenariosOut = scenariosIn.map((s) => {
    const duration = Math.max(2, toNumber(s.duration_s, 14));
    const events = Array.isArray(s.events) ? s.events : [];
    const expandedEvents = [];

    for (let c = 0; c < f; c++) {
      const phase = ((c * 0.06) % (duration * 0.40));
      const strengthScale = Math.max(0.66, 1 - (c * 0.0024));
      for (const ev of events) {
        const start = toNumber(ev.start, 0) + phase;
        const end = toNumber(ev.end, 0) + phase;
        if (start >= duration || end <= 0 || end <= start) continue;
        expandedEvents.push({
          edge_id: eid(ev.edge_id, c),
          start: Math.max(0, start),
          end: Math.min(duration - 0.02, end),
          strength: Math.max(0.18, toNumber(ev.strength, 0.5) * strengthScale),
        });
      }
    }

    return { ...s, events: expandedEvents };
  });

  return { topology: topo, scenarios: scenariosOut };
}

function applyLayout(topoNeurons, mode) {
  if (!Array.isArray(topoNeurons)) return;

  for (const n of topoNeurons) {
    if (Array.isArray(n.seed_position)) n.position = [...n.seed_position];
  }

  if (mode === "layered") {
    for (const n of topoNeurons) {
      const p = n.position;
      const layer = toNumber(n.layer, 0);
      p[0] = (layer * 0.88) + ((hash01(`${n.id}_lx`) - 0.5) * 0.12);
      p[1] *= 0.92;
      p[2] *= 0.82;
      n.position = p;
    }
  } else if (mode === "anatomical") {
    const maxLayer = Math.max(...topoNeurons.map((n) => toNumber(n.layer, 0)), 1);
    for (const n of topoNeurons) {
      const p = n.position;
      const layerNorm = THREE.MathUtils.clamp(toNumber(n.layer, 0) / maxLayer, 0, 1);
      p[1] = 1.08 - (layerNorm * 2.34) + ((hash01(`${n.id}_ay`) - 0.5) * 0.13);
      if (n.class === "inhibitory") p[1] -= 0.10;
      if (n.class === "modulatory") p[1] += 0.28;
      n.position = p;
    }
  } else {
    // spiderweb default: preserve radial seed positions.
  }
}

function setMobileMode(mode) {
  document.body.classList.remove("mobile-panel-open", "mobile-log-open");
  if (mode === "panel") document.body.classList.add("mobile-panel-open");
  if (mode === "log") document.body.classList.add("mobile-log-open");
  if (!mobileUi.btnPanel || !mobileUi.btnNarration || !mobileUi.btnCanvas) return;
  mobileUi.btnPanel.setAttribute("aria-pressed", mode === "panel" ? "true" : "false");
  mobileUi.btnNarration.setAttribute("aria-pressed", mode === "log" ? "true" : "false");
  mobileUi.btnCanvas.setAttribute("aria-pressed", mode === "canvas" ? "true" : "false");
}

function renderLayoutStatus() {
  if (!ui.layoutStatus) return;
  ui.layoutStatus.textContent =
    state.layoutMode === "spiderweb"
      ? "Arrangement: radial spider web"
      : (state.layoutMode === "anatomical"
          ? "Arrangement: anatomical laminar microcircuit"
          : "Arrangement: layered deterministic");
}

function applyVisualStyle(styleId) {
  const id = STYLE_PRESETS[styleId] ? styleId : "diagram";
  state.style = id;
  if (ui.styleSelect) ui.styleSelect.value = id;
  if (ui.styleStatus) ui.styleStatus.textContent = `Visual style: ${id}`;
  if (document.body) document.body.setAttribute("data-style", id);

  const p = STYLE_PRESETS[id];
  scene.background.setHex(p.bg);
  scene.fog.color.setHex(p.fog);
  ambient.color.setHex(p.amb[0]);
  ambient.intensity = p.amb[1];
  keyLight.color.setHex(p.key[0]);
  keyLight.intensity = p.key[1];
  fillLight.color.setHex(p.fill[0]);
  fillLight.intensity = p.fill[1];
  hemi.color.setHex(p.hemi[0]);
  hemi.groundColor.setHex(p.hemi[1]);
  hemi.intensity = p.hemi[2];
}

function makeLabel(text) {
  if (!ui.partLabels) return null;
  const el = document.createElement("div");
  el.className = "part-label";
  el.textContent = text;
  ui.partLabels.appendChild(el);
  return el;
}

function clearGroups() {
  while (nodeGroup.children.length) nodeGroup.remove(nodeGroup.children[0]);
  while (edgeGroup.children.length) edgeGroup.remove(edgeGroup.children[0]);
  while (pulseGroup.children.length) pulseGroup.remove(pulseGroup.children[0]);
  while (hullGroup.children.length) hullGroup.remove(hullGroup.children[0]);
  if (ui.partLabels) ui.partLabels.innerHTML = "";
  pickables.length = 0;
  neuronById.clear();
  edgeById.clear();
}

function setPartExplainCard(neuron, partId) {
  const pid = normalizePartId(partId);
  if (!neuron || !pid) {
    if (ui.partExplainTitle) ui.partExplainTitle.textContent = "No anatomical structure selected";
    if (ui.partExplainText) ui.partExplainText.textContent = "Select a highlighted structure on the selected neuron to see a plain-language morphology note.";
    if (ui.partExplainCard) ui.partExplainCard.classList.add("empty");
    return;
  }
  const ex = PART_EXPLAINERS[pid] || null;
  if (ui.partExplainTitle) ui.partExplainTitle.textContent = `${safeText(neuron.id)} | ${safeText(ex?.title, PART_LABEL_TEXT[pid] || pid)}`;
  if (ui.partExplainText) ui.partExplainText.textContent = safeText(ex?.text, "Plain-language note unavailable for this structure.");
  if (ui.partExplainCard) ui.partExplainCard.classList.remove("empty");
}

function setEdgeExplainCard(edge) {
  if (!edge) {
    if (selectedNeuronId) setPartExplainCard(neuronById.get(selectedNeuronId), selectedPartId);
    else setPartExplainCard(null, "");
    return;
  }
  const from = neuronById.get(edge.from);
  const to = neuronById.get(edge.to);
  const weight = THREE.MathUtils.clamp(toNumber(edge.weight, 0.5), 0, 1.5);
  const strengthBand = weight >= 0.85 ? "strong"
    : (weight >= 0.6 ? "medium" : "light");
  const fromLabel = safeText(from?.label, edge.from);
  const toLabel = safeText(to?.label, edge.to);
  const modeLabel = safeText(activeModeProfile()?.label, "current");
  const typeText = edge.type === "inhibitory"
    ? "This is a braking connection. It makes the next neuron less likely to fire."
    : (edge.type === "modulatory"
        ? "This is a tuning connection. It changes how strongly the next neuron reacts to other inputs."
        : "This is a drive connection. It makes the next neuron more likely to fire.");
  const transmitterText = edge.type === "inhibitory"
    ? `In ${modeLabel} mode, this pathway is shown as inhibitory chemistry with a stronger \"slow down\" effect at this step.`
    : (edge.type === "modulatory"
        ? `In ${modeLabel} mode, this pathway is shown as modulatory chemistry that sets network gain rather than directly forcing a spike.`
        : `In ${modeLabel} mode, this pathway is shown as mainly excitatory chemistry that helps the signal move forward.`);
  const strengthText = `Strength: ${strengthBand} (weight ${weight.toFixed(2)}). Stronger weights have more influence on ${toLabel}.`;
  const routeText = `Pathway direction: ${fromLabel} -> ${toLabel}.`;
  const text = `${typeText} ${strengthText} ${transmitterText} ${routeText}`;
  if (ui.partExplainTitle) ui.partExplainTitle.textContent = `${edge.id} | ${safeText(edge.from)} -> ${safeText(edge.to)}`;
  if (ui.partExplainText) ui.partExplainText.textContent = text;
  if (ui.partExplainCard) ui.partExplainCard.classList.remove("empty");
}

function setSelectedPart(partId) {
  const pid = normalizePartId(partId);
  if (!selectedNeuronId || !pid) {
    selectedPartId = "";
    setPartExplainCard(neuronById.get(selectedNeuronId), "");
    updateNeuronMaterials();
    updateLabels();
    return;
  }
  selectedPartId = pid;
  selectedEdgeId = "";
  setPartExplainCard(neuronById.get(selectedNeuronId), pid);
  updateEdgeStyle();
  updateNeuronMaterials();
  updateLabels();
}

function setSelectedEdge(edgeId) {
  const eid = safeText(edgeId);
  const edge = edgeById.get(eid);
  if (!edge) {
    selectedEdgeId = "";
    setEdgeExplainCard(null);
    updateEdgeStyle();
    return;
  }
  selectedEdgeId = eid;
  selectedPartId = "";
  setEdgeExplainCard(edge);
  updateEdgeStyle();
  updateNeuronMaterials();
  updateLabels();
}

function neuronClassColor(c) {
  return CLASS_COLOR[c] || 0x2ff2c0;
}

function rebuildRegionSpectrum(neurons) {
  regionSpectrum.clear();
  if (!Array.isArray(neurons) || !neurons.length) return;

  const statsByRegion = new Map();
  for (const n of neurons) {
    const key = safeText(n?.region, "unmapped");
    if (!statsByRegion.has(key)) {
      statsByRegion.set(key, {
        count: 0,
        layerSum: 0,
        classCounts: new Map(),
        xSum: 0,
      });
    }
    const s = statsByRegion.get(key);
    s.count += 1;
    s.layerSum += toNumber(n?.layer, 0);
    s.xSum += toNumber(n?.position?.[0], 0);
    const cls = safeText(n?.class, "excitatory").toLowerCase();
    s.classCounts.set(cls, (s.classCounts.get(cls) || 0) + 1);
  }

  const entries = Array.from(statsByRegion.entries()).map(([region, s]) => {
    let dominantClass = "excitatory";
    let dominantCount = -1;
    for (const [cls, count] of s.classCounts.entries()) {
      if (count > dominantCount) {
        dominantClass = cls;
        dominantCount = count;
      }
    }
    return {
      region,
      avgLayer: s.layerSum / Math.max(1, s.count),
      avgX: s.xSum / Math.max(1, s.count),
      dominantClass,
    };
  });

  // Correlate color with circuit progression first, then with lateral position.
  entries.sort((a, b) =>
    (a.avgLayer - b.avgLayer) ||
    (a.avgX - b.avgX) ||
    a.region.localeCompare(b.region)
  );

  const total = Math.max(1, entries.length);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const baseHue = i / total;
    const classHueOffset =
      entry.dominantClass === "inhibitory" ? -0.05
        : (entry.dominantClass === "modulatory" ? 0.05 : 0);
    const hue = (baseHue + classHueOffset + 1) % 1;
    const sat =
      entry.dominantClass === "modulatory" ? 0.96
        : (entry.dominantClass === "inhibitory" ? 0.90 : 0.93);
    const lit =
      entry.dominantClass === "inhibitory" ? 0.53
        : (entry.dominantClass === "modulatory" ? 0.61 : 0.57);
    regionSpectrum.set(entry.region, new THREE.Color().setHSL(hue, sat, lit));
  }
}

function neuronRegionColor(n) {
  const baseClass = new THREE.Color(neuronClassColor(n?.class));
  const regionKey = safeText(n?.region, "unmapped");
  const regionColor = regionSpectrum.get(regionKey) || new THREE.Color().setHSL(0.56, 0.90, 0.56);
  return regionColor.clone().lerp(baseClass, 0.12);
}

function averageOutgoingDirection(neuronId) {
  const n = neuronById.get(neuronId);
  if (!n) return new THREE.Vector3(1, 0, 0);
  const outs = n.outgoing || [];
  if (!outs.length) return new THREE.Vector3(1, 0, 0);
  const v = new THREE.Vector3();
  for (const e of outs) {
    const t = neuronById.get(e.to);
    if (!t) continue;
    v.add(new THREE.Vector3(
      t.position[0] - n.position[0],
      t.position[1] - n.position[1],
      t.position[2] - n.position[2]
    ).normalize());
  }
  if (v.lengthSq() < 1e-6) return new THREE.Vector3(1, 0, 0);
  return v.normalize();
}

function buildMeshes() {
  clearGroups();

  for (const n of topology.neurons) {
    n.outgoing = [];
    n.activity = 0;
    n.modulation = 0;
    neuronById.set(n.id, n);
  }

  for (const e of topology.connections) {
    const from = neuronById.get(e.from);
    const to = neuronById.get(e.to);
    if (!from || !to) continue;
    edgeById.set(e.id, e);
    from.outgoing.push(e);
  }

  for (const n of neuronById.values()) {
    const g = new THREE.Group();
    g.position.set(n.position[0], n.position[1], n.position[2]);

    const primary = toNumber(n.cluster_index, 0) === 0;
    const somaRadius = primary ? 0.10 : 0.09;

    const somaMaterial = new THREE.MeshStandardMaterial({
      color: neuronRegionColor(n),
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.34,
      metalness: 0.05,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
    });
    const soma = new THREE.Mesh(new THREE.SphereGeometry(somaRadius, 18, 18), somaMaterial);
    soma.userData.neuronId = n.id;
    soma.userData.partId = "soma";
    g.add(soma);
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(somaRadius * 0.42, 14, 14),
      new THREE.MeshStandardMaterial({
        color: 0xdce9ff,
        emissive: 0x8fb8ff,
        emissiveIntensity: 0.30,
        roughness: 0.22,
        metalness: 0.03,
        transparent: false,
        opacity: 1,
      })
    );
    nucleus.userData.neuronId = n.id;
    nucleus.userData.partId = "nucleus";
    g.add(nucleus);

    const neuronBaseColor = neuronRegionColor(n);

    const dendriteMaterial = new THREE.MeshStandardMaterial({
      color: neuronBaseColor.clone().multiplyScalar(0.84),
      roughness: 0.44,
      metalness: 0.02,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const proxAxonMaterial = new THREE.MeshStandardMaterial({
      color: neuronBaseColor.clone().multiplyScalar(0.86),
      roughness: 0.38,
      metalness: 0.02,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const distAxonMaterial = new THREE.MeshStandardMaterial({
      color: neuronBaseColor.clone().multiplyScalar(0.86),
      roughness: 0.38,
      metalness: 0.02,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });

    const branchCount = primary ? PRIMARY_DENDRITE_BRANCH_COUNT : SECONDARY_DENDRITE_BRANCH_COUNT;
    let dendCentroid = new THREE.Vector3();
    const dendriteTipLocals = [];
    const dendriteTerminalCenterLocals = [];
    const dendriteTerminalMaterials = [];
    for (let i = 0; i < branchCount; i++) {
      const h = hash01(`${n.id}_d${i}`);
      const theta = h * Math.PI * 2;
      const phi = 0.42 + (i * 0.36);
      const dir = new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi),
        Math.sin(phi) * 0.48,
        Math.sin(theta) * Math.cos(phi)
      ).normalize();
      const len = DENDRITE_BASE_LENGTH + (DENDRITE_LENGTH_VARIANCE * (0.5 + h));
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(DENDRITE_DISTAL_RADIUS, DENDRITE_TIP_RADIUS, len, 8), dendriteMaterial);
      cyl.userData.neuronId = n.id;
      cyl.userData.partId = "dendrite";
      cyl.position.copy(dir).multiplyScalar(DENDRITE_ROOT_OFFSET + (len * 0.5));
      cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      g.add(cyl);
      pickables.push(cyl);
      const tipLocal = dir.clone().multiplyScalar(DENDRITE_ROOT_OFFSET + len);
      const terminalEndCapMat = new THREE.MeshStandardMaterial({
        color: neuronBaseColor.clone().multiplyScalar(0.96),
        roughness: 0.24,
        metalness: 0.03,
        emissive: 0x000000,
        emissiveIntensity: 0,
      });
      // Apply a flatter rounded end directly to the dendrite tube tip.
      const terminalEndCap = new THREE.Mesh(
        new THREE.SphereGeometry(DENDRITE_END_CAP_RADIUS, 12, 10),
        terminalEndCapMat
      );
      terminalEndCap.scale.set(1, DENDRITE_END_CAP_FLATNESS, 1);
      terminalEndCap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      terminalEndCap.position.copy(tipLocal).add(dir.clone().multiplyScalar(DENDRITE_END_CAP_FORWARD_OFFSET));
      terminalEndCap.userData.neuronId = n.id;
      terminalEndCap.userData.partId = "dendrite";
      g.add(terminalEndCap);
      pickables.push(terminalEndCap);

      // Terminate incoming signal paths exactly at dendrite tube tip so geometry is flush.
      const terminalCenterLocal = tipLocal.clone();
      dendriteTerminalMaterials.push(terminalEndCapMat);
      dendriteTipLocals.push(tipLocal);
      dendriteTerminalCenterLocals.push(terminalCenterLocal);
      dendCentroid.add(tipLocal);
    }
    dendCentroid.multiplyScalar(1 / branchCount);

    const axonDir = averageOutgoingDirection(n.id);
    const hillockMaterial = new THREE.MeshStandardMaterial({
      color: neuronBaseColor.clone().lerp(new THREE.Color(0xffc692), 0.34),
      roughness: 0.3,
      metalness: 0.02,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const hillock = new THREE.Mesh(
      new THREE.SphereGeometry(HILLOCK_RADIUS, 10, 10),
      hillockMaterial
    );
    hillock.userData.neuronId = n.id;
    hillock.userData.partId = "hillock";
    const hillockOffset = Math.max(0.02, somaRadius + HILLOCK_RADIUS - HILLOCK_SOMA_OVERLAP);
    hillock.position.copy(axonDir).multiplyScalar(hillockOffset);
    g.add(hillock);
    pickables.push(hillock);

    const totalAxonLength = (0.16 + 0.12) * AXON_LENGTH_SCALE;
    const proxLength = totalAxonLength * PROXIMAL_AXON_FRACTION;
    const distLength = totalAxonLength - proxLength;
    const proxStartOffset = hillockOffset + HILLOCK_RADIUS - AXON_SEGMENT_OVERLAP;
    const proxCenterOffset = proxStartOffset + (proxLength * 0.5);
    const distStartOffset = proxStartOffset + proxLength - AXON_SEGMENT_OVERLAP;
    const distCenterOffset = distStartOffset + (distLength * 0.5);
    const boutonOffset = distStartOffset + distLength + 0.014;

    const prox = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, proxLength, 8), proxAxonMaterial);
    prox.userData.neuronId = n.id;
    prox.userData.partId = "proximal_axon";
    prox.position.copy(axonDir).multiplyScalar(proxCenterOffset);
    prox.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axonDir);
    g.add(prox);
    pickables.push(prox);

    const dist = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.008, distLength, 8), distAxonMaterial);
    dist.userData.neuronId = n.id;
    dist.userData.partId = "distal_axon";
    dist.position.copy(axonDir).multiplyScalar(distCenterOffset);
    dist.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axonDir);
    g.add(dist);
    pickables.push(dist);

    const boutonMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4d8c2,
      roughness: 0.24,
      metalness: 0.02,
      emissive: 0x000000,
      emissiveIntensity: 0,
    });
    const bouton = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 10, 10),
      boutonMaterial
    );
    bouton.userData.neuronId = n.id;
    bouton.userData.partId = "bouton";
    bouton.position.copy(axonDir).multiplyScalar(boutonOffset);
    g.add(bouton);
    pickables.push(bouton);
    let axonTipLocal = bouton.position.clone();

    // Most neurons have one primary axon, but many have collateral branches from that axon.
    const collateralChance = n.class === "inhibitory" ? 0.34 : (n.class === "modulatory" ? 0.72 : 0.58);
    const collateralEnabled = hash01(`${n.id}_collateral_enabled`) < collateralChance;
    if (collateralEnabled) {
      const collateralCountSeed = hash01(`${n.id}_collateral_count`);
      const collateralCount =
        collateralCountSeed < 0.30 ? AXON_COLLATERAL_MAX_COUNT : 1;
      const lateralA = new THREE.Vector3().crossVectors(axonDir, new THREE.Vector3(0, 1, 0));
      if (lateralA.lengthSq() < 1e-6) {
        lateralA.crossVectors(axonDir, new THREE.Vector3(1, 0, 0));
      }
      lateralA.normalize();
      const lateralB = new THREE.Vector3().crossVectors(axonDir, lateralA).normalize();

      for (let i = 0; i < collateralCount; i++) {
        const seed = hash01(`${n.id}_collateral_${i}`);
        const startOffset = distStartOffset + (distLength * (0.28 + (0.38 * seed)));
        const branchLen = distLength * (AXON_COLLATERAL_BASE_FRACTION + (0.20 * hash01(`${n.id}_collateral_len_${i}`)));
        const side = i % 2 === 0 ? 1 : -1;
        const lateralMix = side * (0.40 + (0.22 * seed));
        const tiltMix = (hash01(`${n.id}_collateral_tilt_${i}`) - 0.5) * 0.22;
        const branchDir = axonDir.clone()
          .multiplyScalar(0.78)
          .add(lateralA.clone().multiplyScalar(lateralMix))
          .add(lateralB.clone().multiplyScalar(tiltMix))
          .normalize();

        const start = axonDir.clone().multiplyScalar(startOffset);
        const center = start.clone().add(branchDir.clone().multiplyScalar(branchLen * 0.5));
        const collateral = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0086, 0.0066, branchLen, 8),
          distAxonMaterial
        );
        collateral.userData.neuronId = n.id;
        collateral.userData.partId = "distal_axon";
        collateral.position.copy(center);
        collateral.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), branchDir);
        g.add(collateral);
        pickables.push(collateral);

        const collateralTip = start.clone().add(branchDir.clone().multiplyScalar(branchLen + 0.010));
        const collateralBouton = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 9, 9),
          boutonMaterial
        );
        collateralBouton.userData.neuronId = n.id;
        collateralBouton.userData.partId = "bouton";
        collateralBouton.position.copy(collateralTip);
        g.add(collateralBouton);
        pickables.push(collateralBouton);

        if (collateralTip.lengthSq() > axonTipLocal.lengthSq()) {
          axonTipLocal.copy(collateralTip);
        }
      }
    }

    n.meshGroup = g;
    n.somaMesh = soma;
    n.nucleusMesh = nucleus;
    n.somaMaterial = somaMaterial;
    n.dendriteMaterial = dendriteMaterial;
    n.dendriteTerminalMaterials = dendriteTerminalMaterials;
    n.proxAxonMaterial = proxAxonMaterial;
    n.distAxonMaterial = distAxonMaterial;
    n.hillockMaterial = hillockMaterial;
    n.boutonMaterial = boutonMaterial;
    n.axonDir = axonDir;
    n.axonTipLocal = axonTipLocal.clone();
    n.dendriteTipLocals = dendriteTipLocals;
    n.dendriteTerminalCenterLocals = dendriteTerminalCenterLocals;
    const nucleusLabelOffsetY = somaRadius * 0.18;
    const somaLabelOffsetY = -somaRadius * 0.82;
    n.componentAnchors = {
      soma: new THREE.Vector3(0, somaLabelOffsetY, 0),
      nucleus: new THREE.Vector3(0, nucleusLabelOffsetY, 0),
      dendrite: dendCentroid.clone(),
      hillock: hillock.position.clone(),
      proximal_axon: prox.position.clone(),
      distal_axon: dist.position.clone(),
      bouton: bouton.position.clone(),
    };
    n.labelNode = makeLabel(`${n.id} ${n.label}`);
    n.partLabelNodes = {};
    for (const [partId, label] of Object.entries(PART_LABEL_TEXT)) {
      n.partLabelNodes[partId] = makeLabel(label);
    }

    nodeGroup.add(g);
    pickables.push(soma);
    pickables.push(nucleus);
  }

  const dense = edgeById.size > 1200;
  const pathSeg = dense ? 9 : 16;
  const radialSeg = dense ? 6 : 9;

  for (const e of edgeById.values()) {
    const from = neuronById.get(e.from);
    const to = neuronById.get(e.to);
    if (!from || !to) continue;

    const p0 = new THREE.Vector3(...from.position).add(from.axonTipLocal);
    let p2 = new THREE.Vector3(...to.position);
    if (Array.isArray(to.dendriteTerminalCenterLocals) && to.dendriteTerminalCenterLocals.length) {
      let bestDist2 = Number.POSITIVE_INFINITY;
      let bestPoint = null;
      for (const terminalCenterLocal of to.dendriteTerminalCenterLocals) {
        const centerWorld = new THREE.Vector3(...to.position).add(terminalCenterLocal);
        const d2 = centerWorld.distanceToSquared(p0);
        if (d2 < bestDist2) {
          bestDist2 = d2;
          bestPoint = centerWorld;
        }
      }
      if (bestPoint) p2.copy(bestPoint);
    } else if (to.componentAnchors?.dendrite instanceof THREE.Vector3) {
      p2.add(to.componentAnchors.dendrite.clone().multiplyScalar(0.96));
    }
    const mid = p0.clone().lerp(p2, 0.5);
    const baseRise = e.bridge ? 0.12 : 0.19;
    mid.y += baseRise + (0.14 * (1 - Math.abs(p0.y - p2.y)));

    const curve = new THREE.CatmullRomCurve3([p0, mid, p2], false, "centripetal");
    const radius = (e.bridge ? 0.0044 : 0.0062) + (toNumber(e.weight, 0.2) * (e.bridge ? 0.003 : 0.004));
    const geom = new THREE.TubeGeometry(curve, pathSeg, radius, radialSeg, false);
    const mat = new THREE.MeshStandardMaterial({
      color: EDGE_BASE_COLOR[e.type] || EDGE_BASE_COLOR.excitatory,
      transparent: true,
      opacity: e.bridge ? 0.19 : 0.30,
      roughness: 0.58,
      metalness: 0.02,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.userData.edgeId = e.id;
    edgeGroup.add(mesh);
    pickables.push(mesh);

    const edgeWeight = toNumber(e.weight, 0.2);
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry((0.018 + (edgeWeight * 0.015)) * PULSE_SIZE_SCALE, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff963e,
        emissive: 0xff9b45,
        emissiveIntensity: 0.8,
        roughness: 0.15,
        metalness: 0,
        transparent: true,
        opacity: 0,
      })
    );
    pulse.userData.edgeId = e.id;
    pulse.visible = false;
    pulseGroup.add(pulse);
    pickables.push(pulse);
    const pulseHalo = new THREE.Mesh(
      new THREE.SphereGeometry((0.032 + (edgeWeight * 0.02)) * PULSE_HALO_SIZE_SCALE, 9, 9),
      new THREE.MeshStandardMaterial({
        color: 0xffa24a,
        emissive: 0xffb164,
        emissiveIntensity: 0.9,
        roughness: 0.2,
        metalness: 0,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    pulseHalo.userData.edgeId = e.id;
    pulseHalo.visible = false;
    pulseGroup.add(pulseHalo);
    pickables.push(pulseHalo);

    const pulseTrailMeshes = [];
    for (let i = 0; i < PULSE_TRAIL_SEGMENTS; i++) {
      const tailFactor = 1 - ((i + 1) / (PULSE_TRAIL_SEGMENTS + 1));
      const trail = new THREE.Mesh(
        new THREE.SphereGeometry(((0.014 + (edgeWeight * 0.012)) * (0.78 + (tailFactor * 0.34))) * PULSE_TRAIL_SIZE_SCALE, 7, 7),
        new THREE.MeshStandardMaterial({
          color: 0xff9438,
          emissive: 0xffa24a,
          emissiveIntensity: 0.76,
          roughness: 0.18,
          metalness: 0,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
      );
      trail.visible = false;
      pulseGroup.add(trail);
      pulseTrailMeshes.push(trail);
    }

    e.curve = curve;
    e.mesh = mesh;
    e.material = mat;
    e.pulseMesh = pulse;
    e.pulseHaloMesh = pulseHalo;
    e.pulseTrailMeshes = pulseTrailMeshes;
  }

  buildHull();
  updateHullOpacity();
  frameNetwork(false);
}

function buildHull() {
  while (hullGroup.children.length) hullGroup.remove(hullGroup.children[0]);
  const box = new THREE.Box3().setFromObject(nodeGroup);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.z) * 0.5;

  const geom = new THREE.TorusGeometry(Math.max(1.2, r * 0.62), Math.max(0.08, r * 0.03), 16, 72);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x9cb9d5,
    emissive: 0x304a65,
    emissiveIntensity: 0.16,
    transparent: true,
    opacity: state.hullOpacity,
    side: THREE.DoubleSide,
    roughness: 0.48,
    metalness: 0.03,
    depthWrite: false,
  });
  const torus = new THREE.Mesh(geom, mat);
  torus.position.copy(center);
  torus.rotation.x = Math.PI * 0.5;
  hullGroup.add(torus);
  hullGroup.userData.materials = [mat];
  hullGroup.visible = state.hullOn;
}

function updateHullOpacity() {
  const mats = hullGroup.userData.materials || [];
  for (const m of mats) m.opacity = state.hullOpacity;
  if (ui.hullOpacityVal) ui.hullOpacityVal.textContent = state.hullOpacity.toFixed(2);
}

function updateEdgeStyle() {
  const profile = activeModeProfile();
  const tint = new THREE.Color(profile?.edge_color || "#f0b06e");
  const denseFactor = edgeById.size > 1200 ? 0.82 : 1;

  for (const e of edgeById.values()) {
    if (!e.material) continue;
    const base = new THREE.Color(EDGE_BASE_COLOR[e.type] || EDGE_BASE_COLOR.excitatory);
    const blend = e.type === "modulatory" ? 0.58 : (e.type === "inhibitory" ? 0.38 : 0.26);
    base.lerp(tint, blend);
    if (e.bridge) base.lerp(new THREE.Color(0x9dc8ff), 0.20);
    const selected = selectedEdgeId === e.id;
    const hovered = hoveredEdgeId === e.id;
    if (selected) base.lerp(new THREE.Color(0xffef9a), 0.38);
    if (hovered) base.lerp(new THREE.Color(0xc8f1ff), 0.22);
    e.material.color.copy(base);
    const w = toNumber(e.weight, 0.2);
    e.material.opacity = ((e.bridge ? 0.17 : 0.22 + (w * 0.32)) * denseFactor) + (selected ? 0.26 : (hovered ? 0.10 : 0));
    e.material.emissive.copy(base).multiplyScalar(selected ? 0.18 : (hovered ? 0.08 : 0.02));
    e.material.emissiveIntensity = selected ? 0.94 : (hovered ? 0.62 : 0.28);
  }
}

function updateNeuronMaterials() {
  const profile = activeModeProfile();
  const glow = new THREE.Color(profile?.neuron_glow || "#ffbe7f");

  for (const n of neuronById.values()) {
    const base = neuronRegionColor(n);
    const warm = new THREE.Color(profile?.signal_color || "#ff8e3a");
    const cool = new THREE.Color("#74c4ff");

    const act = THREE.MathUtils.clamp(n.activity + (n.modulation * 0.5), -1, 1.2);
    const absAct = Math.abs(act);
    const selected = selectedNeuronId === n.id;
    const hovered = hoveredNeuronId === n.id;
    const milestone = milestoneNeuronId === n.id;
    const active = selected || hovered || milestone;
    if (!n.sectionAfterglow) {
      n.sectionAfterglow = {
        nucleus: 0,
        soma: 0,
        dendrite: 0,
        dendriteTerminal: 0,
        hillock: 0,
        prox: 0,
        dist: 0,
        bouton: 0,
      };
    }
    const trail = n.sectionAfterglow;
    trail.nucleus *= SECTION_AFTERGLOW_RETAIN;
    trail.soma *= SECTION_AFTERGLOW_RETAIN;
    trail.dendrite *= SECTION_AFTERGLOW_RETAIN;
    trail.dendriteTerminal *= SECTION_AFTERGLOW_RETAIN;
    trail.hillock *= SECTION_AFTERGLOW_RETAIN;
    trail.prox *= SECTION_AFTERGLOW_RETAIN;
    trail.dist *= SECTION_AFTERGLOW_RETAIN;
    trail.bouton *= SECTION_AFTERGLOW_RETAIN;

    const c = base.clone().lerp(act >= 0 ? warm : cool, absAct * 0.7);
    if (hovered) c.lerp(new THREE.Color(0xffefbb), 0.32);
    if (milestone) c.lerp(new THREE.Color(0xbfe9ff), 0.24);
    if (selected) c.lerp(new THREE.Color(0xe3f6ff), 0.48);

    if (n.somaMaterial) {
      n.somaMaterial.color.copy(c);
      n.somaMaterial.emissive.copy(glow).multiplyScalar(0.14 + (absAct * 0.72) + (selected ? 0.42 : 0));
      n.somaMaterial.emissiveIntensity = 0.72 + (absAct * 0.65) + (hovered ? 0.20 : 0);
    }
    const sc = new THREE.Color(base).multiplyScalar(0.84).lerp(c, 0.24 + (selected ? 0.22 : 0));
    if (n.dendriteMaterial) {
      n.dendriteMaterial.color.copy(sc);
      n.dendriteMaterial.emissive.copy(glow).multiplyScalar(selected ? 0.14 : 0.04);
      n.dendriteMaterial.emissiveIntensity = selected ? 0.86 : 0.42;
    }
    if (Array.isArray(n.dendriteTerminalMaterials)) {
      for (const tm of n.dendriteTerminalMaterials) {
        tm.emissive.copy(glow).multiplyScalar(selected ? 0.17 : 0.05);
        tm.emissiveIntensity = selected ? 0.94 : 0.48;
      }
    }
    if (n.proxAxonMaterial) {
      n.proxAxonMaterial.color.copy(sc.clone().lerp(new THREE.Color(0xffc58a), 0.18));
      n.proxAxonMaterial.emissive.copy(glow).multiplyScalar(selected ? 0.16 : 0.05);
      n.proxAxonMaterial.emissiveIntensity = selected ? 0.9 : 0.46;
    }
    if (n.distAxonMaterial) {
      n.distAxonMaterial.color.copy(sc.clone().lerp(new THREE.Color(0xffc58a), 0.18));
      n.distAxonMaterial.emissive.copy(glow).multiplyScalar(selected ? 0.16 : 0.05);
      n.distAxonMaterial.emissiveIntensity = selected ? 0.9 : 0.46;
    }
    if (n.nucleusMesh?.material) {
      n.nucleusMesh.material.emissive.copy(glow).multiplyScalar(0.10 + (absAct * 0.34) + (selected ? 0.24 : 0));
      n.nucleusMesh.material.emissiveIntensity = 0.38 + (absAct * 0.42);
    }
    if (n.hillockMaterial) {
      n.hillockMaterial.emissive.copy(glow).multiplyScalar(0.08 + (absAct * 0.28) + (selected ? 0.18 : 0));
      n.hillockMaterial.emissiveIntensity = 0.45 + (absAct * 0.34);
    }
    if (n.boutonMaterial) {
      n.boutonMaterial.emissive.copy(glow).multiplyScalar(0.06 + (absAct * 0.26) + (selected ? 0.16 : 0));
      n.boutonMaterial.emissiveIntensity = 0.4 + (absAct * 0.32);
    }

    const pulseActive = selected || milestone || (absAct > SECTION_PULSE_ACTIVE_THRESHOLD);
    if (pulseActive) {
      const phaseOffset = hash01(`${n.id}_section_phase`) * 0.22;
      const seq = ((state.t * SECTION_PULSE_TRAVEL_SPEED) + phaseOffset) % 1;
      const drive = Math.max(Math.abs(act), 0.10);
      const pulseGain = 0.32 + (drive * 1.05);
      // Pulse order: nucleus -> soma -> dendrites -> hillock -> proximal axon -> distal axon -> bouton.
      const nucleusPulse = bandPulse(seq, 0.08, 0.14) * pulseGain;
      const somaPulse = bandPulse(seq, 0.20, 0.16) * pulseGain;
      const dendPulse = bandPulse(seq, 0.34, 0.18) * pulseGain;
      const hillockPulse = bandPulse(seq, 0.50, 0.16) * pulseGain;
      const proxPulse = bandPulse(seq, 0.64, 0.16) * pulseGain;
      const distPulse = bandPulse(seq, 0.78, 0.16) * pulseGain;
      const boutonPulse = bandPulse(seq, 0.92, 0.16) * pulseGain;

      const nucleusGlow = 0.36 * nucleusPulse * SECTION_PULSE_GLOW_GAIN;
      const somaGlow = 0.20 * somaPulse * SECTION_PULSE_GLOW_GAIN;
      const dendriteGlow = 0.65 * dendPulse * SECTION_PULSE_GLOW_GAIN;
      const dendriteTerminalGlow = 0.78 * dendPulse * SECTION_PULSE_GLOW_GAIN;
      const hillockGlow = 0.85 * hillockPulse * SECTION_PULSE_GLOW_GAIN;
      const proxGlow = 0.80 * proxPulse * SECTION_PULSE_GLOW_GAIN;
      const distGlow = 0.90 * distPulse * SECTION_PULSE_GLOW_GAIN;
      const boutonGlow = 1.08 * boutonPulse * SECTION_PULSE_GLOW_GAIN;

      if (n.somaMaterial) {
        n.somaMaterial.emissiveIntensity += somaGlow;
        trail.soma = Math.max(trail.soma, somaGlow);
      }
      if (n.nucleusMesh?.material) {
        n.nucleusMesh.material.emissiveIntensity += nucleusGlow;
        trail.nucleus = Math.max(trail.nucleus, nucleusGlow);
      }
      if (n.dendriteMaterial) {
        n.dendriteMaterial.emissiveIntensity += dendriteGlow;
        trail.dendrite = Math.max(trail.dendrite, dendriteGlow);
      }
      if (Array.isArray(n.dendriteTerminalMaterials)) {
        for (const tm of n.dendriteTerminalMaterials) tm.emissiveIntensity += dendriteTerminalGlow;
        trail.dendriteTerminal = Math.max(trail.dendriteTerminal, dendriteTerminalGlow);
      }
      if (n.hillockMaterial) {
        n.hillockMaterial.emissiveIntensity += hillockGlow;
        trail.hillock = Math.max(trail.hillock, hillockGlow);
      }
      if (n.proxAxonMaterial) {
        n.proxAxonMaterial.emissiveIntensity += proxGlow;
        trail.prox = Math.max(trail.prox, proxGlow);
      }
      if (n.distAxonMaterial) {
        n.distAxonMaterial.emissiveIntensity += distGlow;
        trail.dist = Math.max(trail.dist, distGlow);
      }
      if (n.boutonMaterial) {
        n.boutonMaterial.emissiveIntensity += boutonGlow;
        trail.bouton = Math.max(trail.bouton, boutonGlow);
      }
    }

    // Linger glow so section lighting decays gradually after pulse departure.
    if (n.somaMaterial) n.somaMaterial.emissiveIntensity += trail.soma;
    if (n.nucleusMesh?.material) n.nucleusMesh.material.emissiveIntensity += trail.nucleus;
    if (n.dendriteMaterial) n.dendriteMaterial.emissiveIntensity += trail.dendrite;
    if (Array.isArray(n.dendriteTerminalMaterials)) {
      for (const tm of n.dendriteTerminalMaterials) tm.emissiveIntensity += trail.dendriteTerminal;
    }
    if (n.hillockMaterial) n.hillockMaterial.emissiveIntensity += trail.hillock;
    if (n.proxAxonMaterial) n.proxAxonMaterial.emissiveIntensity += trail.prox;
    if (n.distAxonMaterial) n.distAxonMaterial.emissiveIntensity += trail.dist;
    if (n.boutonMaterial) n.boutonMaterial.emissiveIntensity += trail.bouton;

    if (selected && selectedPartId) {
      const boost = 1.05 + (0.28 * Math.abs(Math.sin((state.t * 6.6) + 0.9)));
      if (selectedPartId === "soma" && n.somaMaterial) {
        applySelectedSectionVibrance(n.somaMaterial, boost);
      }
      if (selectedPartId === "nucleus" && n.nucleusMesh?.material) {
        applySelectedSectionVibrance(n.nucleusMesh.material, boost * 1.06);
        n.nucleusMesh.material.emissiveIntensity = Math.max(
          SELECTED_SECTION_EMISSIVE_FLOOR + 0.24,
          NUCLEUS_CLICK_GLOW_INTENSITY,
          n.nucleusMesh.material.emissiveIntensity + (1.22 * boost)
        );
        n.nucleusMesh.material.emissive.lerp(new THREE.Color(0xffffff), 0.36);
      }
      if (selectedPartId === "dendrite" && n.dendriteMaterial) {
        applySelectedSectionVibrance(n.dendriteMaterial, boost);
        if (Array.isArray(n.dendriteTerminalMaterials)) {
          for (const tm of n.dendriteTerminalMaterials) applySelectedSectionVibrance(tm, boost * 1.06);
        }
      }
      if (selectedPartId === "hillock" && n.hillockMaterial) applySelectedSectionVibrance(n.hillockMaterial, boost * 1.08);
      if (selectedPartId === "proximal_axon" && n.proxAxonMaterial) applySelectedSectionVibrance(n.proxAxonMaterial, boost * 1.04);
      if (selectedPartId === "distal_axon" && n.distAxonMaterial) applySelectedSectionVibrance(n.distAxonMaterial, boost * 1.04);
      if (selectedPartId === "bouton" && n.boutonMaterial) applySelectedSectionVibrance(n.boutonMaterial, boost * 1.10);
    }

    if (n.labelNode) {
      n.labelNode.style.opacity = active ? "1" : "0.70";
    }
  }
}

function frameNetwork(animate = true) {
  const box = new THREE.Box3().setFromObject(nodeGroup);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z, 1.2) * 0.84;

  controls.maxDistance = Math.max(12, radius * 4.2);
  scene.fog.near = Math.max(2.6, radius * 0.45);
  scene.fog.far = Math.max(9.6, radius * 3.8);

  const pos = center.clone().add(new THREE.Vector3(radius * 1.18, radius * 0.64, radius * 1.56));
  if (!animate) {
    controls.target.copy(center);
    camera.position.copy(pos);
    controls.update();
    controls.saveState();
    return;
  }

  cameraTween = {
    startMs: performance.now(),
    durMs: 420,
    fromPos: camera.position.clone(),
    toPos: pos,
    fromTarget: controls.target.clone(),
    toTarget: center,
  };
}

function focusNeuron(neuronId) {
  const n = neuronById.get(neuronId);
  if (!n?.meshGroup) return;
  const target = n.meshGroup.position.clone();
  const offset = n.axonDir.clone().multiplyScalar(0.38).add(new THREE.Vector3(0.30, 0.22, 0.48));
  cameraTween = {
    startMs: performance.now(),
    durMs: SEARCH_FOCUS_DURATION_MS,
    fromPos: camera.position.clone(),
    toPos: target.clone().add(offset),
    fromTarget: controls.target.clone(),
    toTarget: target,
  };
}

function setSelectedCards(neuron) {
  if (!neuron) {
    if (ui.selectedPartTitle) ui.selectedPartTitle.textContent = "No neuron selected";
    if (ui.selectedPartText) ui.selectedPartText.textContent = "Click a neuron to see a plain-language regional summary.";
    if (ui.selectedPartExplain) ui.selectedPartExplain.classList.add("empty");

    if (ui.selectedNeuronTypeTitle) ui.selectedNeuronTypeTitle.textContent = "No phenotype profile selected";
    if (ui.selectedNeuronTypeText) ui.selectedNeuronTypeText.textContent = "Select a neuron to view its clinical-functional phenotype profile.";
    if (ui.selectedNeuronTypeCard) ui.selectedNeuronTypeCard.classList.add("empty");
    setPartExplainCard(null, "");
    return;
  }

  const ex = neuron.explainer || {};
  const text = [
    ["What it is", safeText(ex.what)],
    ["How it works", safeText(ex.how)],
    ["Where it sits", safeText(ex.where)],
    ["Why it matters", safeText(ex.why)],
  ]
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (ui.selectedPartTitle) ui.selectedPartTitle.textContent = `${neuron.id} | ${neuron.label}`;
  if (ui.selectedPartText) ui.selectedPartText.textContent = text || "Educational explainer unavailable for this neuron.";
  if (ui.selectedPartExplain) ui.selectedPartExplain.classList.remove("empty");

  const type = TYPE_CARD[safeText(neuron.class).toLowerCase()] || { title: "Neuron role", text: "Type-level context unavailable." };
  if (ui.selectedNeuronTypeTitle) ui.selectedNeuronTypeTitle.textContent = `${safeText(neuron.class, "unknown")} | ${type.title}`;
  if (ui.selectedNeuronTypeText) ui.selectedNeuronTypeText.textContent = `${type.text} Regional context: ${safeText(neuron.region, "unmapped")}.`;
  if (ui.selectedNeuronTypeCard) ui.selectedNeuronTypeCard.classList.remove("empty");
  setPartExplainCard(neuron, selectedPartId);
}

function selectNeuron(neuronId, focus = true) {
  const n = neuronById.get(neuronId);
  if (!n) return;
  if (selectedNeuronId !== neuronId) selectedPartId = "";
  selectedEdgeId = "";
  selectedNeuronId = neuronId;
  setSelectedCards(n);
  if (ui.regionSearchStatus) ui.regionSearchStatus.textContent = `Search: selected ${n.id} (${n.region})`;
  if (focus) focusNeuron(neuronId);
  updateEdgeStyle();
  updateNeuronMaterials();
  updateLabels();
}

function clearSelection() {
  selectedNeuronId = "";
  selectedPartId = "";
  selectedEdgeId = "";
  setSelectedCards(null);
  if (ui.regionSearchStatus) ui.regionSearchStatus.textContent = "Search: click a neuron or use find";
  updateEdgeStyle();
  updateNeuronMaterials();
  updateLabels();
}

function renderNarration(reset = false) {
  const s = activeScenario;
  if (!ui.liveNarrationLog) return;
  if (!s || !Array.isArray(s.milestones)) {
    ui.liveNarrationLog.textContent = "Waiting for pathway events...";
    return;
  }

  const html = [];
  for (let i = 0; i < s.milestones.length; i++) {
    const m = s.milestones[i];
    const current = i === currentMilestoneIndex;
    html.push(
      `<div class="line stage ${current ? "current" : ""}" data-ms-id="${m.id}" tabindex="0">` +
      `<span class="stage-badge">T+${toNumber(m.t, 0).toFixed(1)}s</span>` +
      `<span>${safeText(m.title)} - ${safeText(m.narration)}</span>` +
      `</div>`
    );
  }
  ui.liveNarrationLog.innerHTML = html.join("");

  const rows = Array.from(ui.liveNarrationLog.querySelectorAll(".line.stage"));
  for (const row of rows) {
    row.addEventListener("click", () => {
      const id = row.getAttribute("data-ms-id");
      const ms = s.milestones.find((x) => x.id === id);
      if (!ms) return;
      state.t = THREE.MathUtils.clamp(toNumber(ms.t, 0), 0, state.durationS);
      state.running = false;
      state.paused = true;
      setStatus(`jumped ${safeText(ms.title)}`);
      syncMilestoneFromTime();
      updateTimelineUi();
    });
  }

  if (!reset && currentMilestoneIndex >= 0 && rows[currentMilestoneIndex]) {
    rows[currentMilestoneIndex].scrollIntoView({ block: "nearest" });
  }
}

function syncMilestoneFromTime() {
  const ms = activeScenario?.milestones || [];
  let idx = -1;
  for (let i = 0; i < ms.length; i++) {
    if (state.t >= toNumber(ms[i].t, 0)) idx = i;
    else break;
  }
  if (idx !== currentMilestoneIndex) {
    currentMilestoneIndex = idx;
    const m = ms[idx];
    milestoneNeuronId = safeText(m?.neuron_id);
    renderNarration();
    updateNeuronMaterials();
    updateLabels();
  }
}

function updateSourceBlock() {
  const s = activeScenario;
  if (ui.stimSourceTier) ui.stimSourceTier.textContent = `Scenario source: ${safeText(sourceInfo?.tier, "Deterministic local dataset")}`;
  if (ui.stimSourceEvidence) ui.stimSourceEvidence.textContent = `Evidence basis: ${safeText(s?.evidence || sourceInfo?.evidence, "Educational synthesis")}`;
  if (ui.stimSourceMechanism) ui.stimSourceMechanism.textContent = `Mechanism context: ${safeText(s?.mechanism || sourceInfo?.mechanism, "Directed weighted propagation")}`;
  if (ui.stimSourceDatasets) {
    const list = Array.isArray(sourceInfo?.datasets) ? sourceInfo.datasets.join("; ") : "topology/scenario/profile JSON";
    ui.stimSourceDatasets.textContent = `Datasets: ${list}`;
  }
  if (ui.stimSourceCitations) {
    const tags = Array.isArray(s?.citation_tags) && s.citation_tags.length
      ? s.citation_tags.join("; ")
      : (Array.isArray(sourceInfo?.citations) ? sourceInfo.citations.join("; ") : "n/a");
    ui.stimSourceCitations.textContent = `Scenario citation tags: ${tags}`;
  }

  if (ui.stimSourceLinks) {
    const links = Array.isArray(s?.links) && s.links.length ? s.links : (sourceInfo?.links || []);
    if (!links.length) {
      ui.stimSourceLinks.textContent = "Links: n/a";
      return;
    }
    const chunks = ["Links:"];
    for (const item of links) {
      const label = safeText(item.label, item.href || "source");
      const href = safeText(item.href);
      if (href) chunks.push(`<a href="${href}" target="_blank" rel="noopener">${label}</a>`);
    }
    ui.stimSourceLinks.innerHTML = chunks.join(" | ");
  }
}

function setScenarioById(sid) {
  const found = scenarios.find((s) => s.id === sid) || scenarios[0] || null;
  if (!found) return;
  activeScenario = found;
  state.durationS = Math.max(2, toNumber(found.duration_s, 14));
  state.t = 0;
  state.running = false;
  state.paused = false;
  currentMilestoneIndex = -1;
  milestoneNeuronId = "";

  if (ui.stimSelect) ui.stimSelect.value = found.id;
  if (ui.stimExplain) ui.stimExplain.textContent = safeText(found.summary, "Scenario summary unavailable.");
  renderNarration(true);
  updateSourceBlock();
  updateTimelineUi();
  setStatus("ready");
}

function updateTimelineUi() {
  if (!activeScenario) return;
  const dur = Math.max(0.01, state.durationS);
  const pct = clamp01(state.t / dur);

  if (ui.progressFill) ui.progressFill.style.width = `${(pct * 100).toFixed(1)}%`;
  if (ui.scrubRange) {
    ui.scrubRange.max = dur.toFixed(3);
    if (!ui.scrubRange.matches(":active")) ui.scrubRange.value = state.t.toFixed(3);
  }
  if (ui.scrubVal) ui.scrubVal.textContent = `${Math.round(pct * 100)}%`;

  const modeLabel = activeModeProfile()?.label || "Glutamate";
  const run = state.running ? "running" : (state.paused ? "paused" : "idle");
  if (ui.timelineText) ui.timelineText.textContent = `Scenario progress: ${Math.round(pct * 100)}% (${run}) | mode ${modeLabel}`;
}

function updateLabels() {
  if (!ui.partLabels) return;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const edgePadX = 56;
  const edgePadY = 20;
  const vp = new THREE.Vector3();
  const world = new THREE.Vector3();

  for (const n of neuronById.values()) {
    if (!n.labelNode || !n.meshGroup) continue;
    vp.copy(n.meshGroup.position).project(camera);
    const visible = vp.z < 1 && vp.z > -1;
    const active = selectedNeuronId === n.id || hoveredNeuronId === n.id || milestoneNeuronId === n.id;
    n.labelNode.style.display = (visible && active) ? "block" : "none";
    if (!visible) continue;
    const neuronLabelX = ((vp.x * 0.5) + 0.5) * width;
    const neuronLabelY = (((-vp.y * 0.5) + 0.5) * height) - 16;
    n.labelNode.style.left = `${neuronLabelX}px`;
    n.labelNode.style.top = `${neuronLabelY}px`;
    n.labelNode.style.borderColor = active ? "rgba(206,237,255,0.86)" : "rgba(196,231,255,0.44)";
    n.labelNode.style.background = active ? "rgba(28,56,88,0.95)" : "rgba(11,24,44,0.88)";

    const showParts = selectedNeuronId === n.id && n.componentAnchors && n.partLabelNodes;
    const occupiedSlots = [];
    if (visible && active) occupiedSlots.push({ x: neuronLabelX, y: neuronLabelY });
    for (const [partId, anchorLocal] of Object.entries(n.componentAnchors || {})) {
      const partNode = n.partLabelNodes?.[partId];
      if (!partNode) continue;
      if (!showParts) {
        partNode.style.display = "none";
        continue;
      }
      world.copy(anchorLocal);
      n.meshGroup.localToWorld(world);
      vp.copy(world).project(camera);
      const partVisible = vp.z < 1 && vp.z > -1;
      partNode.style.display = partVisible ? "block" : "none";
      if (!partVisible) continue;

      let partX = ((vp.x * 0.5) + 0.5) * width;
      let partY = ((-vp.y * 0.5) + 0.5) * height;
      for (let attempt = 0; attempt < PART_LABEL_COLLISION_MAX_TRIES; attempt++) {
        const collides = occupiedSlots.some((slot) =>
          Math.abs(partX - slot.x) < PART_LABEL_COLLISION_MIN_DX
          && Math.abs(partY - slot.y) < PART_LABEL_COLLISION_MIN_DY
        );
        if (!collides) break;
        const dir = attempt % 2 === 0 ? 1 : -1;
        const ring = Math.floor(attempt / 2) + 1;
        partY += dir * ring * PART_LABEL_COLLISION_STEP_Y;
      }
      partX = THREE.MathUtils.clamp(partX, edgePadX, width - edgePadX);
      partY = THREE.MathUtils.clamp(partY, edgePadY, height - edgePadY);

      partNode.style.left = `${partX}px`;
      partNode.style.top = `${partY}px`;
      const selectedPart = selectedPartId === partId;
      partNode.style.borderColor = selectedPart ? "rgba(255,241,176,0.95)" : "rgba(206,237,255,0.78)";
      partNode.style.background = selectedPart ? "rgba(85,70,22,0.96)" : "rgba(20,40,72,0.94)";
      partNode.style.fontSize = `${PART_LABEL_FONT_SIZE_PX}px`;
      partNode.style.padding = PART_LABEL_PADDING;
      occupiedSlots.push({ x: partX, y: partY });
    }
  }
}

function runSearch(query) {
  const q = normalizeSearch(query);
  if (!q) {
    suggestRows = [];
    suggestCursor = -1;
    renderSuggest();
    return null;
  }

  const scored = [];
  for (const row of searchRows) {
    if (!row.hay.includes(q)) continue;
    const score = (row.hay.startsWith(q) ? 2 : 0) + (row.id.toLowerCase() === q ? 3 : 0) + (1 / (row.hay.length + 1));
    scored.push({ row, score });
  }
  scored.sort((a, b) => b.score - a.score);
  suggestRows = scored.slice(0, 8).map((x) => x.row);
  suggestCursor = suggestRows.length ? 0 : -1;
  renderSuggest();
  return suggestRows[0] || null;
}

function renderSuggest() {
  if (!ui.regionSearchSuggest) return;
  if (!suggestRows.length) {
    ui.regionSearchSuggest.hidden = true;
    ui.regionSearchSuggest.innerHTML = "";
    return;
  }

  ui.regionSearchSuggest.hidden = false;
  ui.regionSearchSuggest.innerHTML = suggestRows.map((r, i) =>
    `<button class="item ${i === suggestCursor ? "active" : ""}" data-neuron-id="${r.id}" type="button">${r.id} | ${r.label} <span class="small">(${r.region})</span></button>`
  ).join("");

  for (const btn of Array.from(ui.regionSearchSuggest.querySelectorAll(".item"))) {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-neuron-id");
      if (id) selectNeuron(id, true);
      suggestRows = [];
      suggestCursor = -1;
      renderSuggest();
    });
  }
}

function rebuildSearchRows() {
  searchRows = [];
  for (const n of topology.neurons) {
    const hay = [n.id, n.label, n.region, ...(n.aliases || [])].map(normalizeSearch).join(" ");
    searchRows.push({ id: n.id, label: n.label, region: n.region, hay });
  }
}

function pickNeuron(clientX, clientY, options = {}) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouseNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouseNdc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  raycaster.setFromCamera(mouseNdc, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  if (!hits.length) return null;

  const primary = hits[0]?.object || null;
  if (!primary) return null;
  if (!options?.preferNucleusThroughSoma) return primary;

  const primaryPartId = normalizePartId(primary?.userData?.partId);
  if (primaryPartId !== "soma") return primary;
  const neuronId = safeText(primary?.userData?.neuronId);
  if (!neuronId) return primary;

  for (const hit of hits) {
    const obj = hit?.object;
    if (!obj) continue;
    if (safeText(obj.userData?.neuronId) !== neuronId) continue;
    if (normalizePartId(obj.userData?.partId) === "nucleus") return obj;
  }

  // Fallback: if the click is near the projected nucleus center, treat it as nucleus selection.
  const neuron = neuronById.get(neuronId);
  if (neuron?.nucleusMesh) {
    const nucleusWorld = new THREE.Vector3();
    const nucleusNdc = new THREE.Vector3();
    neuron.nucleusMesh.getWorldPosition(nucleusWorld);
    nucleusNdc.copy(nucleusWorld).project(camera);
    if (nucleusNdc.z < 1 && nucleusNdc.z > -1) {
      const sx = ((nucleusNdc.x * 0.5) + 0.5) * rect.width + rect.left;
      const sy = ((-nucleusNdc.y * 0.5) + 0.5) * rect.height + rect.top;
      const dx = clientX - sx;
      const dy = clientY - sy;
      const nucleusPickRadiusPx = 28;
      if ((dx * dx) + (dy * dy) <= (nucleusPickRadiusPx * nucleusPickRadiusPx)) {
        return neuron.nucleusMesh;
      }
    }
  }
  return primary;
}

function installUI() {
  if (ui.btnPlay) ui.btnPlay.addEventListener("click", () => {
    state.running = true;
    state.paused = false;
    setStatus("playing");
  });

  if (ui.btnPause) ui.btnPause.addEventListener("click", () => {
    state.running = false;
    state.paused = true;
    setStatus("paused");
  });

  if (ui.btnStop) ui.btnStop.addEventListener("click", () => {
    state.running = false;
    state.paused = false;
    state.t = 0;
    currentMilestoneIndex = -1;
    milestoneNeuronId = "";
    for (const n of neuronById.values()) { n.activity = 0; n.modulation = 0; }
    renderNarration(true);
    updateNeuronMaterials();
    updateTimelineUi();
    setStatus("stopped");
  });

  if (ui.modeSelect) ui.modeSelect.addEventListener("change", () => {
    state.mode = ui.modeSelect.value === "once" ? "once" : "loop";
  });

  if (ui.speedRange) ui.speedRange.addEventListener("input", () => {
    state.speed = THREE.MathUtils.clamp(toNumber(ui.speedRange.value, 1), 0.25, 3);
    if (ui.speedVal) ui.speedVal.textContent = `${state.speed.toFixed(2)}x`;
  });

  if (ui.scrubRange) ui.scrubRange.addEventListener("input", () => {
    state.t = THREE.MathUtils.clamp(toNumber(ui.scrubRange.value, 0), 0, state.durationS);
    state.running = false;
    state.paused = true;
    syncMilestoneFromTime();
    updateTimelineUi();
  });

  if (ui.btnPrevArrival) ui.btnPrevArrival.addEventListener("click", () => {
    const ms = activeScenario?.milestones || [];
    let idx = 0;
    for (let i = 0; i < ms.length; i++) {
      if (toNumber(ms[i].t, 0) >= state.t - 0.15) {
        idx = Math.max(0, i - 1);
        break;
      }
    }
    state.t = toNumber(ms[idx]?.t, 0);
    state.running = false;
    state.paused = true;
    syncMilestoneFromTime();
    updateTimelineUi();
  });

  if (ui.btnNextArrival) ui.btnNextArrival.addEventListener("click", () => {
    const ms = activeScenario?.milestones || [];
    let idx = ms.length - 1;
    for (let i = 0; i < ms.length; i++) {
      if (toNumber(ms[i].t, 0) > state.t + 0.15) {
        idx = i;
        break;
      }
    }
    state.t = toNumber(ms[idx]?.t, state.durationS);
    state.running = false;
    state.paused = true;
    syncMilestoneFromTime();
    updateTimelineUi();
  });

  if (ui.toggleAuto) ui.toggleAuto.addEventListener("change", () => {
    state.autoRotate = ui.toggleAuto.checked;
    controls.autoRotate = state.autoRotate;
  });

  if (ui.btnReset) ui.btnReset.addEventListener("click", () => {
    frameNetwork(true);
    setStatus("camera reset");
  });

  if (ui.toggleHull) ui.toggleHull.addEventListener("change", () => {
    state.hullOn = ui.toggleHull.checked;
    hullGroup.visible = state.hullOn;
  });

  if (ui.hullOpacityRange) ui.hullOpacityRange.addEventListener("input", () => {
    state.hullOpacity = THREE.MathUtils.clamp(toNumber(ui.hullOpacityRange.value, 0.12), 0.1, 0.95);
    updateHullOpacity();
  });

  if (ui.toggleHoverGroup) ui.toggleHoverGroup.addEventListener("change", () => {
    state.hoverGroupOn = ui.toggleHoverGroup.checked;
  });

  if (ui.toggleNeuroNodes) ui.toggleNeuroNodes.addEventListener("change", () => {
    state.showNeuroNodes = ui.toggleNeuroNodes.checked;
    for (const e of edgeById.values()) {
      if (e.pulseMesh) e.pulseMesh.visible = false;
      if (e.pulseHaloMesh) e.pulseHaloMesh.visible = false;
      if (Array.isArray(e.pulseTrailMeshes)) {
        for (const tm of e.pulseTrailMeshes) tm.visible = false;
      }
    }
  });

  if (ui.styleSelect) ui.styleSelect.addEventListener("change", () => {
    applyVisualStyle(ui.styleSelect.value);
  });

  if (ui.layoutSelect) ui.layoutSelect.addEventListener("change", () => {
    const v = ui.layoutSelect.value;
    state.layoutMode = (v === "layered" || v === "anatomical") ? v : "spiderweb";
    renderLayoutStatus();
    applyLayout(topology.neurons, state.layoutMode);
    buildMeshes();
    if (selectedNeuronId) selectNeuron(selectedNeuronId, false);
    setStatus(`layout ${state.layoutMode}`);
  });

  if (ui.neuroModeSelect) ui.neuroModeSelect.addEventListener("change", () => {
    state.neuroMode = ui.neuroModeSelect.value;
    renderModeStatus();
    updateEdgeStyle();
    updateNeuronMaterials();
    setStatus(`mode ${safeText(activeModeProfile()?.label, state.neuroMode)}`);
  });

  if (ui.stimSelect) ui.stimSelect.addEventListener("change", () => setScenarioById(ui.stimSelect.value));

  if (ui.regionSearchInput) {
    ui.regionSearchInput.addEventListener("input", () => runSearch(ui.regionSearchInput.value));
    ui.regionSearchInput.addEventListener("keydown", (ev) => {
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        if (suggestRows.length) {
          suggestCursor = (suggestCursor + 1) % suggestRows.length;
          renderSuggest();
        }
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        if (suggestRows.length) {
          suggestCursor = (suggestCursor + suggestRows.length - 1) % suggestRows.length;
          renderSuggest();
        }
      } else if (ev.key === "Enter") {
        ev.preventDefault();
        const row = suggestRows[Math.max(0, suggestCursor)] || runSearch(ui.regionSearchInput.value);
        if (row) selectNeuron(row.id, true);
        suggestRows = [];
        suggestCursor = -1;
        renderSuggest();
      } else if (ev.key === "Escape") {
        suggestRows = [];
        suggestCursor = -1;
        renderSuggest();
      }
    });
  }

  if (ui.btnRegionSearch) ui.btnRegionSearch.addEventListener("click", () => {
    const row = runSearch(ui.regionSearchInput?.value || "");
    if (!row) {
      if (ui.regionSearchStatus) ui.regionSearchStatus.textContent = "Search: no neuron match";
      return;
    }
    selectNeuron(row.id, true);
    suggestRows = [];
    suggestCursor = -1;
    renderSuggest();
  });

  if (mobileUi.btnPanel) mobileUi.btnPanel.addEventListener("click", () => {
    const open = document.body.classList.contains("mobile-panel-open");
    setMobileMode(open ? "canvas" : "panel");
  });

  if (mobileUi.btnNarration) mobileUi.btnNarration.addEventListener("click", () => {
    const open = document.body.classList.contains("mobile-log-open");
    setMobileMode(open ? "canvas" : "log");
  });

  if (mobileUi.btnCanvas) mobileUi.btnCanvas.addEventListener("click", () => setMobileMode("canvas"));

  renderer.domElement.addEventListener("pointerdown", (ev) => {
    pointerDown = { x: ev.clientX, y: ev.clientY, button: ev.button };
    pointerDragging = false;
  });

  renderer.domElement.addEventListener("pointermove", (ev) => {
    if (pointerDown) {
      const dx = ev.clientX - pointerDown.x;
      const dy = ev.clientY - pointerDown.y;
      if ((dx * dx) + (dy * dy) > (CLICK_DRAG_THRESHOLD_PX * CLICK_DRAG_THRESHOLD_PX)) pointerDragging = true;
    }
    const hit = pickNeuron(ev.clientX, ev.clientY, { preferNucleusThroughSoma: true });
    hoveredNeuronId = hit?.userData?.neuronId || "";
    hoveredEdgeId = hit?.userData?.edgeId || "";
    updateEdgeStyle();
    updateNeuronMaterials();
  });

  renderer.domElement.addEventListener("pointerleave", () => {
    hoveredNeuronId = "";
    hoveredEdgeId = "";
    updateEdgeStyle();
    updateNeuronMaterials();
  });

  renderer.domElement.addEventListener("pointerup", (ev) => {
    if (!pointerDown) return;
    const drag = pointerDragging;
    const btn = pointerDown.button;
    pointerDown = null;
    pointerDragging = false;
    if (drag || btn !== 0) return;

    const hit = pickNeuron(ev.clientX, ev.clientY, { preferNucleusThroughSoma: true });
    const id = safeText(hit?.userData?.neuronId);
    const partId = normalizePartId(hit?.userData?.partId);
    const edgeId = safeText(hit?.userData?.edgeId);
    if (edgeId) {
      setSelectedEdge(edgeId);
    } else if (id) {
      const shouldFocus = selectedNeuronId !== id;
      selectNeuron(id, shouldFocus);
      setSelectedPart(partId || "soma");
    } else {
      clearSelection();
    }
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_RENDER_PIXEL_RATIO));
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateLabels();
  });
}

function renderModeStatus() {
  const p = activeModeProfile();
  if (ui.neuroModeSelect) ui.neuroModeSelect.value = state.neuroMode;
  if (ui.neuroModeStatus) {
    ui.neuroModeStatus.textContent = `Mode: ${safeText(p?.label, state.neuroMode)} - ${safeText(p?.mode_summary, "")}`;
  }
  if (ui.narrationRateVal) ui.narrationRateVal.textContent = "text only";
  if (ui.narrationStatus) ui.narrationStatus.textContent = "Narration: text only";
}

function populateUI() {
  if (ui.stimSelect) {
    ui.stimSelect.innerHTML = scenarios.map((s) => `<option value="${s.id}">${safeText(s.label, s.id)}</option>`).join("");
  }

  if (ui.morphologySelect) {
    ui.morphologySelect.innerHTML = `<option value="template" selected>Deterministic radial-web layout (${topology.neurons.length} neurons)</option>`;
    ui.morphologySelect.disabled = true;
  }
  if (ui.morphologyStatus) ui.morphologyStatus.textContent = `Geometry: deterministic radial-web layout with ${topology.connections.length} directed edges`;
  if (ui.basisStatus) ui.basisStatus.textContent = "Basis: deterministic educational circuit synthesis";
  if (ui.graphStatus) ui.graphStatus.textContent = `Graph: directed network (${topology.neurons.length} nodes)`;
  if (ui.connectivityStatus) ui.connectivityStatus.textContent = `Connectivity: ${topology.connections.length} weighted directed edges`;
  if (ui.atlasMapStatus) ui.atlasMapStatus.textContent = "Atlas map: deterministic region map loaded";
  if (ui.atlasCoverageLine) ui.atlasCoverageLine.textContent = `Coverage: ${topology.neurons.length} mapped neurons across radial rings`;
  if (ui.networkContextStatus) ui.networkContextStatus.textContent = "Context: full radial web visible";

  if (ui.layoutSelect) {
    ui.layoutSelect.innerHTML = `<option value="spiderweb" selected>Radial spider web</option>`;
    ui.layoutSelect.value = state.layoutMode;
    ui.layoutSelect.disabled = true;
  }
  renderLayoutStatus();

  if (ui.styleSelect) ui.styleSelect.value = state.style;
  if (ui.styleStatus) ui.styleStatus.textContent = `Visual style: ${state.style}`;

  if (ui.speedRange) ui.speedRange.value = "1.00";
  if (ui.speedVal) ui.speedVal.textContent = "1.00x";
  if (ui.modeSelect) ui.modeSelect.value = "loop";

  if (ui.toggleAuto) ui.toggleAuto.checked = false;
  if (ui.toggleHull) ui.toggleHull.checked = false;
  if (ui.toggleHoverGroup) ui.toggleHoverGroup.checked = true;
  if (ui.toggleNeuroNodes) ui.toggleNeuroNodes.checked = true;
  if (ui.hullOpacityRange) ui.hullOpacityRange.value = state.hullOpacity.toFixed(2);
  if (ui.hullOpacityVal) ui.hullOpacityVal.textContent = state.hullOpacity.toFixed(2);

  if (ui.scrubRange) {
    ui.scrubRange.min = "0";
    ui.scrubRange.step = "0.01";
    ui.scrubRange.value = "0";
  }

  setSelectedCards(null);
  setMobileMode("canvas");
}

function updateSimulation(dt) {
  if (!activeScenario) return;

  const profile = activeModeProfile();
  const speedScale = state.speed * toNumber(profile?.pulse_speed_scale, 1);

  if (state.running) {
    state.t += (dt * speedScale);
    if (state.t > state.durationS) {
      if (state.mode === "loop") {
        state.t %= state.durationS;
        currentMilestoneIndex = -1;
        milestoneNeuronId = "";
        for (const n of neuronById.values()) {
          n.activity = 0;
          n.modulation = 0;
        }
      } else {
        state.t = state.durationS;
        state.running = false;
        state.paused = false;
        setStatus("complete");
      }
    }
  }

  const decay = 1.56;
  const modDecay = 1.04;
  for (const n of neuronById.values()) {
    n.activity *= Math.exp(-dt * decay);
    n.modulation *= Math.exp(-dt * modDecay);
    // Track source-vs-receive dendritic glow so sections can light with event direction.
    n.dendriteSourceDrive = Math.max(0, toNumber(n.dendriteSourceDrive, 0) * Math.exp(-dt * DENDRITE_EVENT_GLOW_DECAY));
    n.dendriteReceiveDrive = Math.max(0, toNumber(n.dendriteReceiveDrive, 0) * Math.exp(-dt * DENDRITE_EVENT_GLOW_DECAY));
  }

  const modeStrength = toNumber(profile?.strength_scale, 1);
  const inhScale = toNumber(profile?.inhibitory_scale, 1);
  const modScale = toNumber(profile?.modulatory_scale, 1);
  const signalColor = new THREE.Color(profile?.signal_color || "#ff8e3a");
  const coolColor = new THREE.Color("#67bfff");

  const events = activeScenario.events || [];
  for (const ev of events) {
    const e = edgeById.get(ev.edge_id);
    if (!e?.curve || !e?.pulseMesh) continue;

    const start = toNumber(ev.start, 0);
    const end = toNumber(ev.end, 0);
    const dur = Math.max(0.001, end - start);
    const t = (state.t - start) / dur;
    const on = t >= 0 && t <= 1;

    if (!on || !state.showNeuroNodes) {
      e.pulseMesh.visible = false;
      if (e.pulseHaloMesh) e.pulseHaloMesh.visible = false;
      if (Array.isArray(e.pulseTrailMeshes)) {
        for (const trailMesh of e.pulseTrailMeshes) trailMesh.visible = false;
      }
      continue;
    }

    const p = clamp01(t);
    const pos = e.curve.getPointAt(p);
    const haloPos = e.curve.getPointAt(clamp01(Math.max(0, p - 0.055)));
    e.pulseMesh.position.copy(pos);
    if (e.pulseHaloMesh) e.pulseHaloMesh.position.copy(haloPos);

    let s = toNumber(ev.strength, 0.5) * modeStrength;
    if (e.type === "inhibitory") s *= inhScale;
    if (e.type === "modulatory") s *= modScale;
    if (e.bridge) s *= 0.72;

    const finalWindow = THREE.MathUtils.smoothstep(p, 0.72, 1.0);
    const target = neuronById.get(e.to);
    const source = neuronById.get(e.from);

    // Source side is emphasized as "initiating dendritic drive"; target side is receiving drive.
    const sourceDrive = Math.max(0, (1 - p) * s);
    const receiveDrive = Math.max(0, finalWindow * s);
    if (source) source.dendriteSourceDrive = Math.max(toNumber(source.dendriteSourceDrive, 0), sourceDrive);
    if (target) target.dendriteReceiveDrive = Math.max(toNumber(target.dendriteReceiveDrive, 0), receiveDrive);

    if (target) {
      if (e.type === "inhibitory") target.activity -= (s * finalWindow * dt * 1.52);
      else if (e.type === "modulatory") target.modulation += (s * finalWindow * dt * 1.42);
      else target.activity += (s * finalWindow * dt * 1.38);
    }
    if (source) source.activity += (s * dt * 0.06);

    e.pulseMesh.visible = true;
    if (e.pulseHaloMesh) e.pulseHaloMesh.visible = true;
    const c = e.type === "inhibitory" ? coolColor : signalColor;
    e.pulseMesh.material.color.copy(c);
    e.pulseMesh.material.emissive.copy(c).multiplyScalar(0.78 + (0.48 * finalWindow));
    e.pulseMesh.material.opacity = 0.48 + (0.46 * finalWindow);
    e.pulseMesh.scale.setScalar((0.96 + (0.64 * finalWindow) + (e.type === "modulatory" ? 0.15 : 0)) * PULSE_SIZE_SCALE);
    if (e.pulseHaloMesh?.material) {
      const hc = c.clone().lerp(new THREE.Color(0xffffff), 0.22);
      e.pulseHaloMesh.material.color.copy(hc);
      e.pulseHaloMesh.material.emissive.copy(hc).multiplyScalar(0.88 + (0.28 * finalWindow));
      e.pulseHaloMesh.material.opacity = 0.14 + (0.22 * finalWindow);
      e.pulseHaloMesh.scale.setScalar((1.10 + (0.80 * finalWindow)) * PULSE_HALO_SIZE_SCALE);
    }
    if (Array.isArray(e.pulseTrailMeshes)) {
      for (let i = 0; i < e.pulseTrailMeshes.length; i++) {
        const trailMesh = e.pulseTrailMeshes[i];
        if (!trailMesh?.material) continue;
        const trailOffset = (i + 1) * PULSE_TRAIL_GAP;
        const trailParam = p - trailOffset;
        if (trailParam <= 0) {
          trailMesh.visible = false;
          continue;
        }
        const trailPosition = e.curve.getPointAt(clamp01(trailParam));
        trailMesh.position.copy(trailPosition);
        trailMesh.visible = true;

        const leadIn = clamp01((trailParam + 0.02) / 0.22);
        const distanceFade = Math.exp(-(i + 1) * 0.34);
        const arrivalFade = 1 - (finalWindow * 0.55);
        const intensity = leadIn * distanceFade * arrivalFade;
        if (intensity <= 0.015) {
          trailMesh.visible = false;
          continue;
        }
        const tc = c.clone().lerp(new THREE.Color(0xffffff), 0.10);
        trailMesh.material.color.copy(tc);
        trailMesh.material.emissive.copy(tc).multiplyScalar(0.38 + (0.66 * intensity));
        trailMesh.material.opacity = 0.06 + (0.28 * intensity);
        trailMesh.scale.setScalar((0.90 + (0.42 * intensity)) * PULSE_TRAIL_SIZE_SCALE);
      }
    }
  }

  for (const n of neuronById.values()) {
    n.activity = THREE.MathUtils.clamp(n.activity, -1, 1.2);
    n.modulation = THREE.MathUtils.clamp(n.modulation, -1, 1.2);
  }

  syncMilestoneFromTime();
  updateNeuronMaterials();
  updateTimelineUi();
}

function updateCameraTween(nowMs) {
  if (!cameraTween) return;
  const tw = cameraTween;
  const t = clamp01((nowMs - tw.startMs) / Math.max(1, tw.durMs));
  const e = t * t * (3 - 2 * t);
  camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
  controls.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
  if (t >= 1) cameraTween = null;
}

function animate(nowMs) {
  requestAnimationFrame(animate);
  if (!lastMs) lastMs = nowMs;
  const dt = Math.min(0.05, Math.max(0.001, (nowMs - lastMs) / 1000));
  lastMs = nowMs;

  updateCameraTween(nowMs);
  updateSimulation(dt);
  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

function normalizeData(rawTopology, rawScenarios, rawModes, rawSources) {
  if (!Array.isArray(rawTopology?.neurons) || rawTopology.neurons.length < 20 || rawTopology.neurons.length > 30) {
    throw new Error("Topology must contain 20-30 neurons.");
  }
  if (!Array.isArray(rawTopology?.connections) || rawTopology.connections.length < 25) {
    throw new Error("Topology connections missing or insufficient.");
  }

  topology = JSON.parse(JSON.stringify(rawTopology));
  rebuildRegionSpectrum(topology.neurons);
  scenarios = Array.isArray(rawScenarios?.scenarios) ? rawScenarios.scenarios : [];
  if (!scenarios.length) throw new Error("No scenarios available.");

  sourceInfo = rawSources || {};
  modeProfiles.clear();
  for (const p of (rawModes?.profiles || [])) {
    if (!p?.id) continue;
    modeProfiles.set(p.id, p);
  }
  if (!modeProfiles.size) throw new Error("No neurotransmitter mode profiles.");

  applyLayout(topology.neurons, state.layoutMode);
}

async function boot() {
  setBuildBadge();
  applyVisualStyle("diagram");

  try {
    hud(`${MILESTONE_LABEL}\nLoading deterministic web datasets...`);
    setStatus("loading");

    const [rawTopology, rawScenarios, rawModes, rawSources] = await Promise.all([
      fetchJson(TOPOLOGY_URL, "topology.web.json"),
      fetchJson(SCENARIOS_URL, "scenarios.web.json"),
      fetchJson(MODES_URL, "neurotransmitters.web.json"),
      fetchJson(SOURCES_URL, "sources.web.json"),
    ]);

    normalizeData(rawTopology, rawScenarios, rawModes, rawSources);
    populateUI();
    renderModeStatus();
    updateEdgeStyle();

    hud(`${MILESTONE_LABEL}\nBuilding ${topology.neurons.length}-neuron radial web...`);
    buildMeshes();
    rebuildSearchRows();
    setScenarioById(scenarios[0].id);
    selectNeuron(topology.neurons[0]?.id || "N01", false);
    updateNeuronMaterials();
    updateLabels();

    installUI();

    hud(`${MILESTONE_LABEL}\nReady\n${topology.neurons.length} neurons | ${topology.connections.length} directed edges`);
    setStatus("ready");
    requestAnimationFrame(animate);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    hud(`${MILESTONE_LABEL}\nUnable to load neuron web view\n${msg}`, true);
    setStatus("error");
    console.error(err);
  }
}

boot();
