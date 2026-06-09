import { useState, useRef, useCallback, useEffect } from 'react';
import {
  analyzeContent,
  blockchain,
  computeHumanProbability,
  checkImageMetadata,
  SEED_USERS,
  SEED_POSTS,
} from './engine.js';

// ─────────────────────────────────────────────
// ICONS (inline SVG, no external deps)
// ─────────────────────────────────────────────
const Icon = {
  Home: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Explore: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Profile: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Chain: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  Bell: () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Heart: ({ filled }) => filled
    ? <svg width="16" height="16" fill="#e8500a" stroke="#e8500a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  Comment: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Repost: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  Image: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Shield: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  UserPlus: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  UserCheck: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
  LogOut: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Info: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
};

// ─────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────

function Avatar({ user, size = 40 }) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: user.avatarColor || '#6b7280',
        flexShrink: 0,
      }}
    >
      {user.initials}
    </div>
  );
}

function HumanBadge({ userId, users }) {
  const user = users[userId];
  if (!user) return null;
  const hp = computeHumanProbability(user);
  return (
    <span
      className="badge"
      style={{
        background: hp.color + '18',
        color: hp.color,
        border: `1px solid ${hp.color}40`,
        fontSize: 11,
      }}
      title={`Human probability: ${hp.percentage}%`}
    >
      <Icon.Shield />
      {hp.percentage}%
    </span>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type}`}>{toast.msg}</div>;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{msg}</p>;
}

// ─────────────────────────────────────────────
// AUTH SCREENS
// ─────────────────────────────────────────────

function LandingPage({ onLogin, onSignup }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8 }}>
          HumanChain
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          Il social dove ogni voce è umana.<br />
          Nessun contenuto AI — verificato sulla blockchain.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto 32px' }}>
          <button className="btn btn-primary btn-full" style={{ padding: '12px' }} onClick={onSignup}>
            Crea un account
          </button>
          <button className="btn btn-secondary btn-full" style={{ padding: '12px' }} onClick={onLogin}>
            Accedi
          </button>
        </div>

        <div style={{
          display: 'flex',
          gap: 24,
          justifyContent: 'center',
          fontSize: 13,
          color: 'var(--text3)',
          flexWrap: 'wrap',
        }}>
          {['Identità verificata', 'Blockchain pubblica', 'Zero AI tollerata'].map(f => (
            <span key={f} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: 'var(--green)' }}><Icon.Check /></span>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoginModal({ onClose, onLogin, allUsers }) {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    const h = handle.trim().toLowerCase().replace('@', '');
    if (!h) { setError('Inserisci il tuo username'); return; }
    const user = Object.values(allUsers).find(u => u.handle === h);
    if (!user) { setError('Account non trovato'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onLogin(user.id);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Bentornato</h2>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>
          Per il demo usa: <code style={{ background: 'var(--bg3)', padding: '2px 5px', borderRadius: 4 }}>marco_b</code>,{' '}
          <code style={{ background: 'var(--bg3)', padding: '2px 5px', borderRadius: 4 }}>sara_c</code> o{' '}
          <code style={{ background: 'var(--bg3)', padding: '2px 5px', borderRadius: 4 }}>giulia_m</code>
        </p>
        <div className="field">
          <label className="label">Username</label>
          <input
            className={`input ${error ? 'error' : ''}`}
            placeholder="il_tuo_username"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoFocus
          />
          <FieldError msg={error} />
        </div>
        <button className="btn btn-primary btn-full" onClick={submit} disabled={loading} style={{ padding: '11px' }}>
          {loading ? <span className="spinner" /> : 'Accedi'}
        </button>
        <button className="btn btn-ghost btn-full" onClick={onClose} style={{ marginTop: 8 }}>
          Annulla
        </button>
      </div>
    </div>
  );
}

function SignupModal({ onClose, onCreate }) {
  const STEPS = ['info', 'identity', 'captcha', 'done'];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', handle: '', bio: '', email: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [idDoc, setIdDoc] = useState(null);
  const [selfie, setSelfie] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaCorrect, setCaptchaCorrect] = useState(false);
  const fileRef = useRef();

  // Simple math captcha
  const [captcha] = useState(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    return { q: `${a} + ${b}`, a: a + b };
  });

  const validateInfo = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Il nome è obbligatorio';
    if (!form.handle.trim()) e.handle = "L'username è obbligatorio";
    if (/\s/.test(form.handle)) e.handle = "L'username non può contenere spazi";
    if (!form.email.includes('@')) e.email = 'Email non valida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = async () => {
    if (step === 0) {
      if (!validateInfo()) return;
      setStep(1);
    } else if (step === 1) {
      if (!idDoc) { setErrors({ idDoc: 'Carica un documento' }); return; }
      if (!selfie) { setErrors({ selfie: 'Conferma il selfie live' }); return; }
      setLoading(true);
      await new Promise(r => setTimeout(r, 1200));
      setLoading(false);
      setStep(2);
    } else if (step === 2) {
      if (parseInt(captchaAnswer) !== captcha.a) {
        setErrors({ captcha: 'Risposta errata, riprova' });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const newUser = {
        id: form.handle.toLowerCase(),
        name: form.name,
        handle: form.handle.toLowerCase(),
        bio: form.bio || '',
        avatarColor: ['#4f46e5','#0891b2','#be185d','#059669','#d97706','#7c3aed'][Math.floor(Math.random()*6)],
        initials: form.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase(),
        followers: [],
        following: [],
        identityVerified: true,
        createdAt: Date.now(),
        metrics: {
          daysOld: 0,
          totalPosts: 0,
          aiRejections: 0,
          avgTypingVariance: 0,
          avgSessionMinutes: 0,
          interactionDiversity: 0,
          totalImages: 0,
          imagesWithoutMeta: 0,
          todayActivity: { posts: 0, comments: 0, likes: 0, follows: 0 },
        }
      };
      onCreate(newUser);
    }
  };

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 0 && <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Crea il tuo account</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Iniziamo con le informazioni base</p>
          <div className="field">
            <label className="label">Nome completo</label>
            <input className={`input ${errors.name ? 'error' : ''}`} placeholder="Mario Rossi" value={form.name} onChange={e => set('name', e.target.value)} />
            <FieldError msg={errors.name} />
          </div>
          <div className="field">
            <label className="label">Username</label>
            <input className={`input ${errors.handle ? 'error' : ''}`} placeholder="mario_rossi" value={form.handle} onChange={e => set('handle', e.target.value)} />
            <FieldError msg={errors.handle} />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input className={`input ${errors.email ? 'error' : ''}`} type="email" placeholder="mario@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
            <FieldError msg={errors.email} />
          </div>
          <div className="field">
            <label className="label">Bio <span style={{ color: 'var(--text3)' }}>(opzionale)</span></label>
            <input className="input" placeholder="Dimmi qualcosa su di te" value={form.bio} onChange={e => set('bio', e.target.value)} />
          </div>
        </>}

        {step === 1 && <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Verifica identità</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 4, lineHeight: 1.6 }}>
            HumanChain richiede la verifica dell'identità reale per garantire che ogni account sia gestito da un essere umano.
          </p>
          <div style={{
            background: 'var(--yellow-bg)', border: '1px solid var(--yellow)', borderRadius: 8,
            padding: '10px 12px', marginBottom: 20, fontSize: 12, color: 'var(--yellow)', display: 'flex', gap: 8,
          }}>
            <Icon.Info />
            <span>I dati del documento vengono verificati e poi eliminati. Non vengono conservati.</span>
          </div>

          {/* Document upload */}
          <div
            style={{
              border: `2px dashed ${idDoc ? 'var(--green)' : errors.idDoc ? 'var(--red)' : 'var(--border2)'}`,
              borderRadius: 10, padding: '20px 16px', textAlign: 'center',
              cursor: 'pointer', marginBottom: 12, background: idDoc ? 'var(--green-bg)' : 'var(--bg)',
              transition: 'all 0.15s',
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) { setIdDoc(e.target.files[0]); setErrors(er => ({ ...er, idDoc: '' })); } }} />
            {idDoc ? (
              <div style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon.Check /> {idDoc.name}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 22, marginBottom: 6 }}>📄</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Carica documento d'identità</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>carta d'identità, passaporto o patente</div>
              </>
            )}
          </div>
          <FieldError msg={errors.idDoc} />

          {/* Selfie live */}
          <div
            style={{
              border: `2px dashed ${selfie ? 'var(--green)' : errors.selfie ? 'var(--red)' : 'var(--border2)'}`,
              borderRadius: 10, padding: '20px 16px', textAlign: 'center',
              cursor: 'pointer', marginBottom: 4, background: selfie ? 'var(--green-bg)' : 'var(--bg)',
              transition: 'all 0.15s',
            }}
            onClick={() => { setSelfie(true); setErrors(e => ({ ...e, selfie: '' })); }}
          >
            {selfie ? (
              <div style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon.Check /> Selfie live confermato
              </div>
            ) : (
              <>
                <div style={{ fontSize: 22, marginBottom: 6 }}>🤳</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Selfie live</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>clicca per simulare la verifica (in produzione usa la webcam)</div>
              </>
            )}
          </div>
          <FieldError msg={errors.selfie} />
        </>}

        {step === 2 && <>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Sei un essere umano?</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>Un ultimo controllo veloce</p>
          <div style={{
            background: 'var(--bg3)', borderRadius: 10, padding: '20px',
            textAlign: 'center', marginBottom: 20,
          }}>
            <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>{captcha.q} = ?</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Risolvi il calcolo</div>
          </div>
          <div className="field">
            <label className="label">Risposta</label>
            <input
              className={`input ${errors.captcha ? 'error' : ''}`}
              type="number"
              placeholder="..."
              value={captchaAnswer}
              onChange={e => { setCaptchaAnswer(e.target.value); setErrors(er => ({ ...er, captcha: '' })); }}
              onKeyDown={e => e.key === 'Enter' && nextStep()}
              autoFocus
            />
            <FieldError msg={errors.captcha} />
          </div>
        </>}

        {step === 3 && <>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, background: 'var(--green-bg)',
              border: '2px solid var(--green)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px', color: 'var(--green)',
            }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Identità verificata!</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
              Benvenuto su HumanChain, <strong>{form.name}</strong>.<br />
              Il tuo account è pronto.
            </p>
          </div>
        </>}

        <button
          className="btn btn-primary btn-full"
          onClick={nextStep}
          disabled={loading}
          style={{ marginTop: 20, padding: '11px' }}
        >
          {loading ? <span className="spinner" /> : step === 3 ? 'Inizia a usare HumanChain' : 'Continua'}
        </button>
        {step < 3 && (
          <button className="btn btn-ghost btn-full" onClick={onClose} style={{ marginTop: 6 }}>
            Annulla
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// POST COMPOSER
// ─────────────────────────────────────────────

function Composer({ currentUser, onSubmit }) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [intervals, setIntervals] = useState([]);
  const [lastKey, setLastKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const fileRef = useRef();

  const handleChange = (val) => {
    setText(val);
    if (val.length > 10) setAnalysis(analyzeContent(val, intervals));
    else setAnalysis(null);
  };

  const handleKeyDown = () => {
    const now = Date.now();
    if (lastKey) setIntervals(prev => [...prev, now - lastKey]);
    setLastKey(now);
  };

  const handlePaste = () => {
    setIntervals(prev => [...prev, 0]);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const meta = await checkImageMetadata(file);
    setImageMeta(meta);
  };

  const submit = async () => {
    if (!text.trim() || loading) return;
    const res = analyzeContent(text, intervals);
    if (res.isAI) {
      onSubmit(null, res);
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);
    onSubmit({ text, imageFile, imageMeta, aiScore: res.score, intervals }, res);
    setText('');
    setAnalysis(null);
    setIntervals([]);
    setLastKey(null);
    setImageFile(null);
    setImageMeta(null);
  };

  const hasContent = text.trim().length > 0;

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar user={currentUser} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <textarea
            className="input"
            style={{ minHeight: 72, background: 'transparent', border: 'none', padding: '6px 0', fontSize: 15, resize: 'none' }}
            placeholder="Cosa sta succedendo?"
            value={text}
            onChange={e => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
          />

          {/* Image preview */}
          {imageFile && (
            <div style={{
              marginBottom: 10, background: 'var(--bg3)', borderRadius: 8,
              padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: 'var(--text2)' }}>📎 {imageFile.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {imageMeta && (
                  <span style={{ color: imageMeta.suspicious ? 'var(--yellow)' : 'var(--green)', fontSize: 11 }}>
                    {imageMeta.suspicious ? '⚠ Possibile AI' : '✓ EXIF ok'}
                  </span>
                )}
                <button onClick={() => { setImageFile(null); setImageMeta(null); }} style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Icon.X />
                </button>
              </div>
            </div>
          )}

          {/* Real-time analysis */}
          {analysis && (
            <div style={{
              marginBottom: 10,
              background: analysis.isAI ? 'var(--red-bg)' : analysis.score > 20 ? 'var(--yellow-bg)' : 'var(--green-bg)',
              border: `1px solid ${analysis.isAI ? '#fca5a5' : analysis.score > 20 ? '#fde68a' : '#a7f3d0'}`,
              borderRadius: 8, padding: '8px 12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: analysis.isAI ? 'var(--red)' : analysis.score > 20 ? 'var(--yellow)' : 'var(--green)',
                }}>
                  {analysis.isAI ? '✕ Contenuto AI rilevato' : analysis.score > 20 ? '⚠ Qualche segnale AI' : '✓ Sembra umano'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>rischio: {analysis.score}%</span>
              </div>
              {analysis.flags.length > 0 && analysis.isAI && (
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
                  Segnali: {analysis.flags.slice(0, 3).join(', ')}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => fileRef.current?.click()}
                title="Aggiungi immagine"
              >
                <Icon.Image />
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageSelect} />
              <span style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon.Chain />
                validato su blockchain
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {hasContent && (
                <span style={{
                  fontSize: 12,
                  color: text.length > 260 ? 'var(--red)' : text.length > 220 ? 'var(--yellow)' : 'var(--text3)',
                }}>
                  {280 - text.length}
                </span>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={submit}
                disabled={!hasContent || loading || text.length > 280}
              >
                {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Pubblica'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// POST CARD
// ─────────────────────────────────────────────

function PostCard({ post, users, currentUserId, onLike, onComment, onRepost, onProfileClick }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentIntervals, setCommentIntervals] = useState([]);
  const [lastKey, setLastKey] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const author = users[post.authorId];
  if (!author) return null;
  const liked = post.likes.includes(currentUserId);
  const timeAgo = (ts) => {
    const d = Date.now() - ts;
    if (d < 60000) return 'adesso';
    if (d < 3600000) return `${Math.floor(d / 60000)}m`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h`;
    return `${Math.floor(d / 86400000)}g`;
  };

  const handleCommentKey = (e) => {
    const now = Date.now();
    if (lastKey) setCommentIntervals(prev => [...prev, now - lastKey]);
    setLastKey(now);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
  };

  const submitComment = async () => {
    if (!commentText.trim() || submitting) return;
    const res = analyzeContent(commentText, commentIntervals);
    if (res.isAI) {
      alert('Commento bloccato: contenuto AI rilevato (' + res.score + '% di probabilità)');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 300));
    setSubmitting(false);
    onComment(post.id, commentText);
    setCommentText('');
    setCommentIntervals([]);
    setLastKey(null);
  };

  return (
    <div className="post-card fade-in">
      <div style={{ display: 'flex', gap: 12 }}>
        <div onClick={() => onProfileClick(post.authorId)} style={{ cursor: 'pointer' }}>
          <Avatar user={author} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            <span
              onClick={() => onProfileClick(post.authorId)}
              style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              {author.name}
            </span>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>@{author.handle}</span>
            <span style={{ color: 'var(--border2)', fontSize: 13 }}>·</span>
            <span style={{ color: 'var(--text3)', fontSize: 13 }}>{timeAgo(post.createdAt)}</span>
            <HumanBadge userId={post.authorId} users={users} />
          </div>

          {/* Content */}
          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--text)', marginBottom: 12, wordBreak: 'break-word' }}>
            {post.content}
          </p>

          {/* Blockchain + AI row */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'monospace', fontSize: 11, color: 'var(--text3)',
                background: 'var(--bg3)', padding: '2px 7px', borderRadius: 4,
                border: '1px solid var(--border)',
              }}
              title="Block hash sulla blockchain HumanChain"
            >
              ⛓ {post.blockHash?.slice(0, 10)}
            </span>
            <span style={{
              fontSize: 11, color: post.aiScore < 20 ? 'var(--green)' : post.aiScore < 42 ? 'var(--yellow)' : 'var(--red)',
              background: post.aiScore < 20 ? 'var(--green-bg)' : post.aiScore < 42 ? 'var(--yellow-bg)' : 'var(--red-bg)',
              padding: '2px 7px', borderRadius: 4, border: '1px solid',
              borderColor: post.aiScore < 20 ? '#a7f3d0' : post.aiScore < 42 ? '#fde68a' : '#fca5a5',
            }}>
              AI score: {post.aiScore}%
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              className={`post-action ${liked ? 'liked' : ''}`}
              onClick={() => onLike(post.id)}
            >
              <Icon.Heart filled={liked} />
              {post.likes.length > 0 && <span>{post.likes.length}</span>}
            </button>
            <button
              className="post-action"
              onClick={() => setShowComments(v => !v)}
              style={{ color: showComments ? 'var(--accent)' : undefined }}
            >
              <Icon.Comment />
              {post.comments.length > 0 && <span>{post.comments.length}</span>}
            </button>
            <button
              className="post-action"
              onClick={() => onRepost(post.id)}
            >
              <Icon.Repost />
              {post.reposts > 0 && <span>{post.reposts}</span>}
            </button>
          </div>

          {/* Comments section */}
          {showComments && (
            <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {post.comments.map(c => {
                const ca = users[c.authorId];
                if (!ca) return null;
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    <Avatar user={ca} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                        <span
                          style={{ fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                          onClick={() => onProfileClick(c.authorId)}
                        >
                          {ca.name}
                        </span>
                        <span style={{ color: 'var(--text3)', fontSize: 12 }}>{timeAgo(c.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  </div>
                );
              })}

              {/* Comment input */}
              <div style={{ display: 'flex', gap: 10 }}>
                <Avatar user={users[currentUserId]} size={30} />
                <div style={{ flex: 1 }}>
                  <textarea
                    className="input"
                    style={{ fontSize: 13, minHeight: 38, padding: '8px 10px' }}
                    placeholder="Scrivi un commento..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKey}
                    rows={2}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 6 }}
                    onClick={submitComment}
                    disabled={!commentText.trim() || submitting}
                  >
                    {submitting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Rispondi'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────

function ProfilePage({ userId, users, posts, currentUserId, onFollow, onBack }) {
  const user = users[userId];
  if (!user) return null;
  const hp = computeHumanProbability(user);
  const userPosts = posts.filter(p => p.authorId === userId).sort((a, b) => b.createdAt - a.createdAt);
  const isMe = userId === currentUserId;
  const amFollowing = users[currentUserId]?.following?.includes(userId);

  return (
    <div>
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 5,
      }}>
        {onBack && (
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginRight: 4 }}>
            ← Indietro
          </button>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{userPosts.length} post</div>
        </div>
      </div>

      {/* Profile header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <Avatar user={user} size={64} />
          {!isMe && (
            <button
              className={`btn ${amFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
              onClick={() => onFollow(userId)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {amFollowing ? <><Icon.UserCheck /> Seguito</> : <><Icon.UserPlus /> Segui</>}
            </button>
          )}
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{user.name}</div>
          <div style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 8 }}>@{user.handle}</div>
          {user.bio && <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 12 }}>{user.bio}</p>}
        </div>

        <div style={{ display: 'flex', gap: 20, fontSize: 14, marginBottom: 16 }}>
          <span><strong>{user.following?.length || 0}</strong> <span style={{ color: 'var(--text2)' }}>seguiti</span></span>
          <span><strong>{user.followers?.length || 0}</strong> <span style={{ color: 'var(--text2)' }}>follower</span></span>
        </div>

        {/* Humanity probability panel */}
        <div style={{
          background: 'var(--bg3)', borderRadius: 12, padding: 16,
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Probabilità Umano
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28, border: `3px solid ${hp.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 16, color: hp.color, background: 'var(--bg2)',
            }}>
              {hp.percentage}%
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: hp.color }}>{hp.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                basato su {hp.signals.length} segnali comportamentali
              </div>
            </div>
          </div>

          {/* Signal list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hp.signals.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 12, color: s.bad ? 'var(--red)' : 'var(--green)',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s.bad ? <Icon.X /> : <Icon.Check />}
                  {s.label}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                  {s.delta > 0 ? '+' : ''}{Math.round(s.delta * 100)}%
                </span>
              </div>
            ))}
          </div>

          {/* Daily rate bar */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Attività oggi</div>
            {[
              { label: 'Post', value: user.metrics?.todayActivity?.posts || 0, max: 20 },
              { label: 'Commenti', value: user.metrics?.todayActivity?.comments || 0, max: 60 },
              { label: 'Like', value: user.metrics?.todayActivity?.likes || 0, max: 200 },
            ].map(({ label, value, max }) => (
              <div key={label} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text2)' }}>{label}</span>
                  <span style={{ color: value / max > 0.8 ? 'var(--red)' : 'var(--text3)' }}>{value}/{max}</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(value / max * 100, 100)}%`,
                    background: value / max > 0.8 ? 'var(--red)' : value / max > 0.5 ? 'var(--yellow)' : 'var(--green)',
                    borderRadius: 3, transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Posts */}
      {userPosts.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
          Nessun post ancora
        </div>
      ) : (
        userPosts.map(post => (
          <div key={post.id} className="post-card">
            <p style={{ fontSize: 15, lineHeight: 1.55, marginBottom: 10 }}>{post.content}</p>
            <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text3)', flexWrap: 'wrap' }}>
              <span>♥ {post.likes.length}</span>
              <span>💬 {post.comments.length}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 11 }}>⛓ {post.blockHash?.slice(0,10)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// BLOCKCHAIN EXPLORER
// ─────────────────────────────────────────────

function BlockchainExplorer() {
  const chain = blockchain.chain;
  return (
    <div>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontWeight: 700, fontSize: 16 }}>
        Blockchain Explorer
      </div>
      <div style={{ padding: '16px 20px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20,
        }}>
          {[
            ['Blocchi', chain.length],
            ['Integrità', blockchain.isValid() ? '✓ Valida' : '✗ Corrotta'],
            ['PoW Diff.', blockchain.difficulty],
          ].map(([label, val]) => (
            <div key={label} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, fontWeight: 500 }}>
          Ultimi blocchi validati
        </div>
        {[...chain].reverse().map((block) => (
          <div key={block.hash} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 14px', marginBottom: 8, fontFamily: 'monospace',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>
                Block #{block.index}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {new Date(block.timestamp).toLocaleTimeString('it-IT')}
              </span>
            </div>
            <div style={{ fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: 'var(--text3)' }}>Hash: </span>
              <span style={{ color: 'var(--green)' }}>{block.hash}</span>
            </div>
            <div style={{ fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: 'var(--text3)' }}>Prev: </span>
              <span style={{ color: 'var(--text2)' }}>{block.previousHash?.slice(0, 16)}...</span>
            </div>
            <div style={{ fontSize: 11 }}>
              <span style={{ color: 'var(--text3)' }}>Type: </span>
              <span style={{ color: 'var(--blue)' }}>{block.data?.type}</span>
              <span style={{ color: 'var(--text3)', marginLeft: 8 }}>nonce: {block.nonce}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPLORE / DISCOVER
// ─────────────────────────────────────────────

function ExplorePage({ users, currentUserId, onProfileClick, onFollow }) {
  const others = Object.values(users).filter(u => u.id !== currentUserId);
  return (
    <div>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg2)', fontWeight: 700, fontSize: 16 }}>
        Esplora
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Tutti gli account verificati su HumanChain
        </p>
        {others.map(u => {
          const hp = computeHumanProbability(u);
          const amFollowing = users[currentUserId]?.following?.includes(u.id);
          return (
            <div key={u.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', background: 'var(--bg2)',
              border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8,
            }}>
              <div onClick={() => onProfileClick(u.id)} style={{ cursor: 'pointer' }}>
                <Avatar user={u} size={44} />
              </div>
              <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onProfileClick(u.id)}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>@{u.handle}</div>
                {u.bio && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: hp.color,
                  background: hp.color + '15', padding: '2px 8px', borderRadius: 20,
                }}>
                  {hp.percentage}%
                </div>
                <button
                  className={`btn ${amFollowing ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                  onClick={() => onFollow(u.id)}
                >
                  {amFollowing ? 'Seguito' : 'Segui'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RIGHT SIDEBAR WIDGETS
// ─────────────────────────────────────────────

function RightSidebar({ users, currentUserId, onProfileClick, onFollow }) {
  const others = Object.values(users)
    .filter(u => u.id !== currentUserId && !users[currentUserId]?.following?.includes(u.id))
    .slice(0, 3);

  return (
    <div>
      {/* Suggested users */}
      {others.length > 0 && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Chi seguire</div>
          {others.map(u => {
            const hp = computeHumanProbability(u);
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div onClick={() => onProfileClick(u.id)} style={{ cursor: 'pointer' }}>
                  <Avatar user={u} size={36} />
                </div>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onProfileClick(u.id)}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: hp.color }}>{hp.label}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => onFollow(u.id)}>
                  Segui
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Blockchain status */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Stato blockchain</div>
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text2)' }}>Blocchi</span>
            <span style={{ fontWeight: 600 }}>{blockchain.chain.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text2)' }}>Integrità</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{blockchain.isValid() ? '✓ Valida' : '✗ Errore'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text2)' }}>Difficoltà PoW</span>
            <span style={{ fontWeight: 600 }}>{blockchain.difficulty}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
        HumanChain · Solo voci umane · {new Date().getFullYear()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────

export default function App() {
  const [auth, setAuth] = useState(null); // null = landing, 'login', 'signup'
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState(SEED_USERS);
  const [posts, setPosts] = useState(SEED_POSTS);
  const [tab, setTab] = useState('home');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const handleLogin = (userId) => {
    setCurrentUserId(userId);
    setAuth(null);
    showToast(`Benvenuto, ${users[userId].name}!`);
  };

  const handleCreateAccount = (newUser) => {
    setUsers(prev => ({ ...prev, [newUser.id]: newUser }));
    setCurrentUserId(newUser.id);
    setAuth(null);
    showToast('Account creato con successo! Benvenuto su HumanChain.');
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setTab('home');
    setViewingProfile(null);
  };

  const handlePostSubmit = (data, analysis) => {
    if (!data) {
      // Blocked
      setUsers(prev => ({
        ...prev,
        [currentUserId]: {
          ...prev[currentUserId],
          metrics: {
            ...prev[currentUserId].metrics,
            aiRejections: (prev[currentUserId].metrics.aiRejections || 0) + 1,
          }
        }
      }));
      showToast(`Post bloccato: AI rilevata (${analysis.score}% di probabilità, ${analysis.confidence} confidence)`, 'error');
      return;
    }
    const block = blockchain.add({ type: 'POST', authorId: currentUserId, aiScore: data.aiScore });
    const newPost = {
      id: `post_${Date.now()}`,
      authorId: currentUserId,
      content: data.text,
      createdAt: Date.now(),
      likes: [],
      comments: [],
      blockHash: block.hash,
      aiScore: data.aiScore,
      reposts: 0,
      imageUrl: null,
    };
    setPosts(prev => [newPost, ...prev]);
    setUsers(prev => ({
      ...prev,
      [currentUserId]: {
        ...prev[currentUserId],
        metrics: {
          ...prev[currentUserId].metrics,
          totalPosts: (prev[currentUserId].metrics.totalPosts || 0) + 1,
          todayActivity: {
            ...prev[currentUserId].metrics.todayActivity,
            posts: (prev[currentUserId].metrics.todayActivity?.posts || 0) + 1,
          }
        }
      }
    }));
    showToast('Pubblicato! Validato sulla blockchain.');
  };

  const handleLike = (postId) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked = p.likes.includes(currentUserId);
      return { ...p, likes: liked ? p.likes.filter(u => u !== currentUserId) : [...p.likes, currentUserId] };
    }));
    setUsers(prev => ({
      ...prev,
      [currentUserId]: {
        ...prev[currentUserId],
        metrics: {
          ...prev[currentUserId].metrics,
          todayActivity: {
            ...prev[currentUserId].metrics.todayActivity,
            likes: (prev[currentUserId].metrics.todayActivity?.likes || 0) + 1,
          }
        }
      }
    }));
  };

  const handleComment = (postId, text) => {
    const block = blockchain.add({ type: 'COMMENT', authorId: currentUserId, postId });
    const newComment = {
      id: `c_${Date.now()}`,
      authorId: currentUserId,
      content: text,
      createdAt: Date.now(),
      likes: [],
      blockHash: block.hash,
    };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    setUsers(prev => ({
      ...prev,
      [currentUserId]: {
        ...prev[currentUserId],
        metrics: {
          ...prev[currentUserId].metrics,
          todayActivity: {
            ...prev[currentUserId].metrics.todayActivity,
            comments: (prev[currentUserId].metrics.todayActivity?.comments || 0) + 1,
          }
        }
      }
    }));
    showToast('Commento pubblicato');
  };

  const handleRepost = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, reposts: p.reposts + 1 } : p));
    showToast('Repostato');
  };

  const handleFollow = (userId) => {
    setUsers(prev => {
      const me = prev[currentUserId];
      const target = prev[userId];
      const alreadyFollowing = me.following.includes(userId);
      return {
        ...prev,
        [currentUserId]: {
          ...me,
          following: alreadyFollowing
            ? me.following.filter(id => id !== userId)
            : [...me.following, userId],
          metrics: {
            ...me.metrics,
            todayActivity: {
              ...me.metrics.todayActivity,
              follows: (me.metrics.todayActivity?.follows || 0) + (alreadyFollowing ? 0 : 1),
            }
          }
        },
        [userId]: {
          ...target,
          followers: alreadyFollowing
            ? target.followers.filter(id => id !== currentUserId)
            : [...target.followers, currentUserId],
        }
      };
    });
    const target = users[userId];
    const alreadyFollowing = users[currentUserId]?.following?.includes(userId);
    showToast(alreadyFollowing ? `Smesso di seguire @${target.handle}` : `Ora segui @${target.handle}`);
  };

  const handleProfileClick = (userId) => {
    setViewingProfile(userId);
    setTab('profile');
  };

  // Not logged in
  if (!currentUserId) {
    return (
      <>
        <LandingPage onLogin={() => setAuth('login')} onSignup={() => setAuth('signup')} />
        {auth === 'login' && <LoginModal onClose={() => setAuth(null)} onLogin={handleLogin} allUsers={users} />}
        {auth === 'signup' && <SignupModal onClose={() => setAuth(null)} onCreate={handleCreateAccount} />}
        <Toast toast={toast} />
      </>
    );
  }

  const currentUser = users[currentUserId];
  const sortedPosts = [...posts].sort((a, b) => b.createdAt - a.createdAt);

  const NAV = [
    { id: 'home', label: 'Home', Icon: Icon.Home },
    { id: 'explore', label: 'Esplora', Icon: Icon.Explore },
    { id: 'profile', label: 'Profilo', Icon: Icon.Profile },
    { id: 'blockchain', label: 'Blockchain', Icon: Icon.Chain },
  ];

  return (
    <>
      <div className="app-layout">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div style={{ marginBottom: 24, paddingLeft: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: -0.3 }}>HumanChain</span>
            </div>
          </div>

          {NAV.map(({ id, label, Icon: NavIcon }) => (
            <button
              key={id}
              className={`nav-item ${tab === id ? 'active' : ''}`}
              onClick={() => {
                setTab(id);
                if (id === 'profile') setViewingProfile(currentUserId);
              }}
            >
              <NavIcon />
              {label}
            </button>
          ))}

          <div style={{ marginTop: 'auto' }}>
            {/* Current user card */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 10px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg2)',
            }}>
              <Avatar user={currentUser} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>@{currentUser.handle}</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleLogout}
                title="Disconnetti"
                style={{ padding: 6 }}
              >
                <Icon.LogOut />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN COLUMN */}
        <div className="main-col">
          {tab === 'home' && (
            <>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg2)', fontWeight: 700, fontSize: 16,
                position: 'sticky', top: 0, zIndex: 5,
                backdropFilter: 'blur(8px)',
              }}>
                Home
              </div>
              <Composer currentUser={currentUser} onSubmit={handlePostSubmit} />
              {sortedPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  users={users}
                  currentUserId={currentUserId}
                  onLike={handleLike}
                  onComment={handleComment}
                  onRepost={handleRepost}
                  onProfileClick={handleProfileClick}
                />
              ))}
            </>
          )}

          {tab === 'explore' && (
            <ExplorePage
              users={users}
              currentUserId={currentUserId}
              onProfileClick={handleProfileClick}
              onFollow={handleFollow}
            />
          )}

          {tab === 'profile' && (
            <ProfilePage
              userId={viewingProfile || currentUserId}
              users={users}
              posts={posts}
              currentUserId={currentUserId}
              onFollow={handleFollow}
              onBack={viewingProfile && viewingProfile !== currentUserId ? () => { setViewingProfile(currentUserId); } : null}
            />
          )}

          {tab === 'blockchain' && <BlockchainExplorer />}
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-col">
          <RightSidebar
            users={users}
            currentUserId={currentUserId}
            onProfileClick={handleProfileClick}
            onFollow={handleFollow}
          />
        </div>
      </div>

      <Toast toast={toast} />
    </>
  );
}
