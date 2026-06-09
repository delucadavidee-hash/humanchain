# HumanChain

Social network dove ogni contenuto è garantito umano. Zero AI tollerata.

## Come funziona

### Registrazione con verifica identità obbligatoria
Ogni nuovo account deve completare 3 step:
1. Dati personali (nome, username, email)
2. Caricamento documento d'identità + selfie live
3. CAPTCHA matematico anti-bot

### AI Detection Engine — 5 layer
Ogni post e commento viene analizzato prima della pubblicazione:

| Layer | Cosa analizza | Peso |
|-------|--------------|------|
| Linguistico | Pattern tipici degli LLM (furthermore, leverage, cutting-edge…) | 0-75 |
| Sintattico | Uniformità frasi, uso eccessivo virgole, strutture a lista | 0-36 |
| Emotivo | Assenza di marcatori colloquiali, nessuna voce personale | 0-28 |
| Entropia | Testo troppo "pulito", capitalizzazione perfetta | 0-28 |
| Comportamentale | Varianza digitazione, copy-paste detection | 0-50 |

Se il punteggio totale ≥ 42/100 → contenuto bloccato e registrato.

### Blockchain Proof-of-Work
Ogni contenuto approvato viene hashato e aggiunto alla catena:
- Difficoltà PoW: 2 zeri iniziali
- Hash chain verificabile dall'explorer integrato
- Ogni blocco referenzia il precedente → immutabilità

### Human Probability Score
Sistema statistico che stima la probabilità che un account sia umano, basato su:
- **Rate giornalieri**: post max 20/g, commenti max 60/g, like max 200/g, follow max 50/g
- **Varianza digitazione**: irregolarità = umano, costanza = bot
- **Storico AI rejections**: ogni contenuto bloccato abbassa il punteggio
- **Metadati EXIF immagini**: immagini senza EXIF sono sospette (spesso AI-generated)
- **Diversità interazioni**: pattern ripetitivi indicano automazione
- **Durata sessioni**: sessioni anomale (troppo brevi o lunghissime)
- **Verifica identità**: +15% di base

## Stack

- React 18 + Vite 4
- Nessun framework CSS esterno
- Blockchain implementata da zero (PoW, SHA personalizzato)
- AI detection engine completamente client-side
- Zero dipendenze backend per il demo

## Deploy locale

```bash
npm install
npm run dev
```

## Deploy su Render

1. Push su GitHub
2. New Static Site su render.com
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`

Il file `render.yaml` configura tutto automaticamente.

## Account demo

| Username | Profilo |
|----------|---------|
| marco_b | Dev frontend, Milano |
| sara_c | Barista + scrittrice, Roma |
| giulia_m | Fotografa, Genova |

## Struttura file

```
humanchain/
├── index.html
├── render.yaml
├── package.json
├── vite.config.js
├── .gitignore
└── src/
    ├── main.jsx        # entry point
    ├── App.jsx         # componenti UI + logica app
    ├── engine.js       # AI detection, blockchain, human probability
    └── index.css       # design system
```
