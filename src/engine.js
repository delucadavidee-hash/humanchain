// ─────────────────────────────────────────────
// AI DETECTION ENGINE  –  multi-layer analysis
// ─────────────────────────────────────────────

const AI_PHRASES = [
  /\b(furthermore|moreover|additionally|consequently|nevertheless|notwithstanding)\b/gi,
  /\bit is worth noting that\b/gi,
  /\bit is important to (note|mention|highlight)\b/gi,
  /\bit should be (noted|mentioned|highlighted)\b/gi,
  /\bin (conclusion|summary|closing)\b/gi,
  /\bto summarize\b|\bto wrap up\b/gi,
  /\b(leverage|utilize|facilitate|optimize|streamline|synergize)\b/gi,
  /\b(delve into|shed light on|touch upon)\b/gi,
  /\bnavigating the (complex|ever-changing|digital) (landscape|world)\b/gi,
  /\bas an ai\b|\bi'm an ai\b|\bi am an ai\b/gi,
  /\bas a language model\b/gi,
  /\bcutting.edge (technology|solution|approach)\b/gi,
  /\bseamlessly integrat/gi,
  /\btailored to (your|their) needs\b/gi,
  /\brobust (solution|framework|system|approach|infrastructure)\b/gi,
  /\bcomprehensive (overview|guide|analysis|solution|understanding)\b/gi,
  /\bkey takeaways?\b/gi,
  /\bin today'?s (fast-paced|digital|modern|ever-changing|rapidly evolving)\b/gi,
  /\bempower(ing)? (individual|user|people|business|organization)/gi,
  /\bcertainly[,!]\b/gi,
  /\babsolutely[,!]\b/gi,
  /\bof course[,!]\b/gi,
  /\bi (cannot|can't|am unable to) (provide|assist|help with)\b/gi,
  /\bit's (important|essential|crucial) to (note|remember|understand)\b/gi,
  /\b(invaluable|multifaceted|nuanced|holistic|paradigm)\b/gi,
];

function linguisticScore(text) {
  let score = 0;
  const flags = [];
  for (const re of AI_PHRASES) {
    const m = text.match(re);
    if (m) {
      score += m.length * 18;
      flags.push(re.toString().slice(1, 35).replace(/\\/g, ''));
    }
  }
  return { score: Math.min(score, 75), flags };
}

function syntacticScore(text) {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 3);
  if (sentences.length < 3) return { score: 0, flags: [] };
  const flags = [];
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + (b - avg) ** 2, 0) / lengths.length;
  if (Math.sqrt(variance) < 2.5 && sentences.length >= 4) flags.push('uniform_sentence_length');
  const commas = (text.match(/,/g) || []).length;
  if (commas / sentences.length > 3.5) flags.push('comma_overuse');
  // Check for list-like structure (AI loves enumeration)
  const listItems = (text.match(/^\s*[-•*]\s/gm) || []).length;
  if (listItems >= 3) flags.push('list_structure');
  // Check for colon-introduced items
  const colonPatterns = (text.match(/:\s+\n/g) || []).length;
  if (colonPatterns >= 2) flags.push('colon_enumeration');
  return { score: flags.length * 18, flags };
}

function emotionalScore(text) {
  const flags = [];
  const low = text.toLowerCase();
  const humanMarkers = [
    'lol','lmao','haha','ahah','omg','wtf','ugh','yikes','boh',
    'dai','vabbè','mah','beh','ahahah','mannaggia','cavolo',
    'cioè','raga','cmq','comunque','tipo','cazzo','minchia',
    'però','porca','ammazza','oh no','purtroppo','per fortuna'
  ];
  const hasHumanMarker = humanMarkers.some(m => low.includes(m));
  if (!hasHumanMarker && text.length > 180) flags.push('no_colloquial_markers');
  // Check for first-person irregular usage
  const firstPerson = (text.match(/\b(io|mi|me|mio|mia|ho|sono|sto|stavo|andavo)\b/gi) || []).length;
  if (firstPerson === 0 && text.length > 120) flags.push('no_first_person');
  return { score: flags.length * 14, flags };
}

function entropyScore(text) {
  if (text.length < 30) return { score: 0, flags: [] };
  const flags = [];
  const freq = {};
  for (const ch of text.toLowerCase()) {
    if (/[a-zà-ù]/.test(ch)) freq[ch] = (freq[ch] || 0) + 1;
  }
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  if (total === 0) return { score: 0, flags: [] };
  let entropy = 0;
  for (const n of Object.values(freq)) {
    const p = n / total;
    entropy -= p * Math.log2(p);
  }
  if (entropy > 4.15 && text.length > 200) flags.push('high_character_entropy');
  // Perfect capitalization pattern
  const sentences = text.split(/[.!?]\s+/);
  let properlyCapped = 0;
  for (const s of sentences) {
    if (s.length > 0 && s[0] === s[0].toUpperCase()) properlyCapped++;
  }
  if (sentences.length > 4 && properlyCapped / sentences.length > 0.95) {
    flags.push('perfect_capitalization');
  }
  return { score: flags.length * 14, flags };
}

function behavioralScore(typingData) {
  if (!typingData || typingData.length < 3) return { score: 0, flags: [] };
  const flags = [];
  const avg = typingData.reduce((a, b) => a + b, 0) / typingData.length;
  const variance = typingData.reduce((a, b) => a + (b - avg) ** 2, 0) / typingData.length;
  if (variance < 80 && typingData.length > 8) flags.push('robotic_typing');
  const pasteProbability = typingData.filter(t => t < 5).length / typingData.length;
  if (pasteProbability > 0.6) flags.push('likely_pasted');
  return { score: flags.length * 25, flags };
}

export function analyzeContent(text, typingData = []) {
  if (!text || text.trim().length < 8) {
    return { isAI: false, score: 0, flags: [], verdict: 'too_short', layers: {} };
  }
  const ling = linguisticScore(text);
  const syn = syntacticScore(text);
  const emo = emotionalScore(text);
  const ent = entropyScore(text);
  const beh = behavioralScore(typingData);

  const total = Math.min(
    ling.score + syn.score + emo.score + ent.score + beh.score,
    100
  );

  return {
    isAI: total >= 42,
    score: total,
    flags: [...ling.flags, ...syn.flags, ...emo.flags, ...ent.flags, ...beh.flags],
    verdict: total >= 42 ? 'AI_DETECTED' : 'HUMAN_OK',
    confidence: total >= 70 ? 'HIGH' : total >= 42 ? 'MEDIUM' : 'LOW',
    layers: {
      linguistic: ling.score,
      syntactic: syn.score,
      emotional: emo.score,
      entropy: ent.score,
      behavioral: beh.score,
    },
  };
}

// ─────────────────────────────────────────────
// BLOCKCHAIN ENGINE
// ─────────────────────────────────────────────

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this._hash();
  }
  _hash() {
    const s = `${this.index}${this.previousHash}${this.timestamp}${JSON.stringify(this.data)}${this.nonce}`;
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
    return (h >>> 0).toString(16).padStart(8, '0');
  }
  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this._hash();
    }
    return this.hash;
  }
}

export class HumanChainBlockchain {
  constructor() {
    this.difficulty = 2;
    this.chain = [this._genesis()];
  }
  _genesis() {
    const b = new Block(0, Date.now(), { type: 'GENESIS' }, '0000000');
    b.mine(this.difficulty);
    return b;
  }
  get latest() { return this.chain[this.chain.length - 1]; }
  add(data) {
    const b = new Block(this.chain.length, Date.now(), data, this.latest.hash);
    b.mine(this.difficulty);
    this.chain.push(b);
    return b;
  }
  isValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const c = this.chain[i];
      const p = this.chain[i - 1];
      if (c.hash !== c._hash()) return false;
      if (c.previousHash !== p.hash) return false;
    }
    return true;
  }
}

export const blockchain = new HumanChainBlockchain();

// ─────────────────────────────────────────────
// HUMANITY PROBABILITY ENGINE
// Statistical model for human probability
// ─────────────────────────────────────────────

const MAX_DAILY = {
  posts: 20,
  comments: 60,
  likes: 200,
  follows: 50,
};

export function computeHumanProbability(user) {
  const m = user.metrics || {};
  const today = m.todayActivity || {};
  let prob = 0.5; // neutral prior
  const signals = [];

  // --- RATE ANALYSIS (bots exceed limits) ---
  const postRate = (today.posts || 0) / MAX_DAILY.posts;
  const commentRate = (today.comments || 0) / MAX_DAILY.comments;
  const likeRate = (today.likes || 0) / MAX_DAILY.likes;
  const followRate = (today.follows || 0) / MAX_DAILY.follows;
  const maxRate = Math.max(postRate, commentRate, likeRate, followRate);
  if (maxRate > 1.0) { prob -= 0.35; signals.push({ label: 'Rate giornaliero superato', delta: -0.35, bad: true }); }
  else if (maxRate > 0.7) { prob -= 0.15; signals.push({ label: 'Rate giornaliero elevato', delta: -0.15, bad: true }); }
  else if (maxRate < 0.3) { prob += 0.08; signals.push({ label: 'Attività moderata', delta: +0.08, bad: false }); }

  // --- TYPING VARIANCE (irregularity = human) ---
  const typingVar = m.avgTypingVariance || 0;
  if (typingVar > 800) { prob += 0.12; signals.push({ label: 'Digitazione irregolare (umana)', delta: +0.12, bad: false }); }
  else if (typingVar < 100 && m.totalPosts > 5) { prob -= 0.15; signals.push({ label: 'Digitazione sospettosamente uniforme', delta: -0.15, bad: true }); }

  // --- AI REJECTION HISTORY ---
  const rejections = m.aiRejections || 0;
  if (rejections === 0) { prob += 0.05; signals.push({ label: 'Nessun contenuto AI rilevato', delta: +0.05, bad: false }); }
  else if (rejections >= 3) { prob -= rejections * 0.08; signals.push({ label: `${rejections} contenuti AI bloccati`, delta: -(rejections * 0.08), bad: true }); }

  // --- SESSION PATTERNS ---
  const avgSession = m.avgSessionMinutes || 0;
  if (avgSession > 3 && avgSession < 180) { prob += 0.06; signals.push({ label: 'Sessioni di durata naturale', delta: +0.06, bad: false }); }
  else if (avgSession < 0.5 && m.totalPosts > 3) { prob -= 0.1; signals.push({ label: 'Sessioni troppo brevi', delta: -0.1, bad: true }); }

  // --- IMAGE METADATA ---
  const imagesWithoutMeta = m.imagesWithoutMeta || 0;
  const totalImages = m.totalImages || 0;
  if (totalImages > 0) {
    const noMetaRatio = imagesWithoutMeta / totalImages;
    if (noMetaRatio > 0.8) { prob -= 0.12; signals.push({ label: 'Molte immagini senza metadati EXIF', delta: -0.12, bad: true }); }
    else if (noMetaRatio < 0.3) { prob += 0.08; signals.push({ label: 'Immagini con metadati reali', delta: +0.08, bad: false }); }
  }

  // --- INTERACTION DIVERSITY ---
  const diversity = m.interactionDiversity || 0; // 0-1 score
  if (diversity > 0.6) { prob += 0.1; signals.push({ label: 'Interazioni varie e diversificate', delta: +0.1, bad: false }); }
  else if (diversity < 0.2 && m.totalPosts > 10) { prob -= 0.08; signals.push({ label: 'Pattern interazioni ripetitivo', delta: -0.08, bad: true }); }

  // --- ACCOUNT AGE ---
  const daysOld = m.daysOld || 0;
  if (daysOld > 30) { prob += 0.07; signals.push({ label: 'Account consolidato', delta: +0.07, bad: false }); }
  else if (daysOld === 0) { prob -= 0.03; signals.push({ label: 'Account nuovo', delta: -0.03, bad: true }); }

  // --- VERIFIED IDENTITY ---
  if (user.identityVerified) { prob += 0.15; signals.push({ label: 'Identità verificata', delta: +0.15, bad: false }); }

  const clamped = Math.max(0.02, Math.min(0.99, prob));
  const pct = Math.round(clamped * 100);

  return {
    probability: clamped,
    percentage: pct,
    signals,
    label: pct >= 85 ? 'Umano Verificato' : pct >= 65 ? 'Probabilmente Umano' : pct >= 40 ? 'Incerto' : 'Sospetto',
    color: pct >= 85 ? '#2d7a4f' : pct >= 65 ? '#4a9e6b' : pct >= 40 ? '#b45309' : '#c0392b',
    tier: pct >= 85 ? 4 : pct >= 65 ? 3 : pct >= 40 ? 2 : 1,
  };
}

// ─────────────────────────────────────────────
// IMAGE METADATA CHECKER
// ─────────────────────────────────────────────

export async function checkImageMetadata(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      const result = {
        hasExif: false,
        hasMake: false,
        hasGPS: false,
        suspicious: false,
        flags: [],
      };

      // Check JPEG EXIF marker (FFD8FF + APP1 = 0xFFE1)
      if (arr[0] === 0xFF && arr[1] === 0xD8) {
        let offset = 2;
        while (offset < arr.length - 1) {
          if (arr[offset] !== 0xFF) break;
          const marker = arr[offset + 1];
          const segLen = (arr[offset + 2] << 8) | arr[offset + 3];
          if (marker === 0xE1) {
            // APP1 — check for Exif header
            const header = String.fromCharCode(...arr.slice(offset + 4, offset + 10));
            if (header.startsWith('Exif')) {
              result.hasExif = true;
              // Minimal check: if EXIF present, likely real camera
              result.hasMake = true;
            }
          }
          if (marker === 0xDA) break; // start of scan
          offset += 2 + segLen;
        }
      }

      // PNG check
      if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
        // PNG — AI-generated images are almost always PNG without metadata
        result.suspicious = true;
        result.flags.push('PNG senza EXIF (possibile AI)');
      }

      if (!result.hasExif && file.size > 200000) {
        result.flags.push('File grande senza metadati EXIF');
      }
      if (result.hasExif) {
        result.flags.push('EXIF presente — fotocamera reale probabile');
      }

      resolve(result);
    };
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

// ─────────────────────────────────────────────
// INITIAL SEED DATA
// ─────────────────────────────────────────────

export const SEED_USERS = {
  'marco_b': {
    id: 'marco_b',
    name: 'Marco Bianchi',
    handle: 'marco_b',
    bio: 'dev frontend a Milano. mangio pizza ogni venerdì senza eccezioni',
    avatarColor: '#4f46e5',
    initials: 'MB',
    followers: ['sara_c', 'giulia_m'],
    following: ['sara_c'],
    identityVerified: true,
    createdAt: Date.now() - 86400000 * 45,
    metrics: {
      daysOld: 45,
      totalPosts: 23,
      aiRejections: 0,
      avgTypingVariance: 1240,
      avgSessionMinutes: 18,
      interactionDiversity: 0.72,
      totalImages: 4,
      imagesWithoutMeta: 1,
      todayActivity: { posts: 3, comments: 12, likes: 28, follows: 1 },
    }
  },
  'sara_c': {
    id: 'sara_c',
    name: 'Sara Conti',
    handle: 'sara_c',
    bio: 'barista + aspirante scrittrice. Roma. leggo troppi romanzi',
    avatarColor: '#0891b2',
    initials: 'SC',
    followers: ['marco_b'],
    following: ['marco_b', 'giulia_m'],
    identityVerified: true,
    createdAt: Date.now() - 86400000 * 12,
    metrics: {
      daysOld: 12,
      totalPosts: 8,
      aiRejections: 1,
      avgTypingVariance: 980,
      avgSessionMinutes: 9,
      interactionDiversity: 0.58,
      totalImages: 2,
      imagesWithoutMeta: 2,
      todayActivity: { posts: 1, comments: 5, likes: 14, follows: 0 },
    }
  },
  'giulia_m': {
    id: 'giulia_m',
    name: 'Giulia Marini',
    handle: 'giulia_m',
    bio: 'fotografa. gatti. caffè freddo. Genova',
    avatarColor: '#be185d',
    initials: 'GM',
    followers: ['sara_c', 'marco_b'],
    following: [],
    identityVerified: true,
    createdAt: Date.now() - 86400000 * 78,
    metrics: {
      daysOld: 78,
      totalPosts: 41,
      aiRejections: 0,
      avgTypingVariance: 1560,
      avgSessionMinutes: 22,
      interactionDiversity: 0.81,
      totalImages: 19,
      imagesWithoutMeta: 3,
      todayActivity: { posts: 2, comments: 8, likes: 31, follows: 0 },
    }
  }
};

export const SEED_POSTS = [
  {
    id: 'post_1',
    authorId: 'marco_b',
    content: 'ho provato a fare la cacio e pepe ieri sera per la prima volta. risultato: una valanga di pecorino rappreso che assomigliava più a calcestruzzo che a pasta 😭 però il gusto c\'era. ci riprovo sabato',
    createdAt: Date.now() - 3600000 * 3,
    likes: ['sara_c', 'giulia_m'],
    comments: [
      { id: 'c1', authorId: 'sara_c', content: 'ahahah la reazione del formaggio è una scienza esatta!! devi usare l\'acqua di cottura tiepida, non calda. ti manda a fare in bocca al lupo', createdAt: Date.now() - 3400000, likes: ['marco_b'] },
      { id: 'c2', authorId: 'giulia_m', content: 'io ho fallito almeno 6 volte prima di farcela. è normale', createdAt: Date.now() - 3200000, likes: [] },
    ],
    blockHash: blockchain.add({ type: 'POST', authorId: 'marco_b', aiScore: 3 }).hash,
    aiScore: 3,
    reposts: 0,
    imageUrl: null,
  },
  {
    id: 'post_2',
    authorId: 'giulia_m',
    content: 'alle 6 di mattina c\'era questa luce sul porto che non si descrive. ho scattato forse 80 foto e ne terrò 3. questo è il lavoro',
    createdAt: Date.now() - 3600000 * 7,
    likes: ['marco_b'],
    comments: [
      { id: 'c3', authorId: 'marco_b', content: 'quella luce dell\'alba sul mare è altra roba davvero. che svegli presto!', createdAt: Date.now() - 3600000 * 6, likes: ['giulia_m'] },
    ],
    blockHash: blockchain.add({ type: 'POST', authorId: 'giulia_m', aiScore: 5 }).hash,
    aiScore: 5,
    reposts: 4,
    imageUrl: null,
  },
  {
    id: 'post_3',
    authorId: 'sara_c',
    content: 'stavo leggendo sul treno e la signora di fianco mi chiede che libro fosse. le dico il titolo. risposta: "ah, mai sentito". silenzio totale per i successivi 40 minuti',
    createdAt: Date.now() - 3600000 * 11,
    likes: ['giulia_m', 'marco_b'],
    comments: [],
    blockHash: blockchain.add({ type: 'POST', authorId: 'sara_c', aiScore: 7 }).hash,
    aiScore: 7,
    reposts: 2,
    imageUrl: null,
  },
];
