# 🎙️ Echo Guard  
## AI-Powered Audio Forgery Detection System

Echo Guard is a full-stack audio forensics platform designed to detect potential voice forgery using MFCC feature extraction and AI-based classification.

The system analyzes uploaded audio files, extracts spectral speech characteristics, evaluates authenticity using machine learning inference, and stores results securely with row-level access control.

---

## 🌐 Live System

Deployed on production infrastructure with:

- **Frontend:** Vite + React  
- **Backend:** Supabase Edge Functions & API handlers  
- **Database:** Supabase PostgreSQL with Row-Level Security (RLS)  
- **Hosting:** Optimized static deployment (Vercel-compatible)  

---

## 🧠 System Overview

The application processes audio through the following pipeline:

1. Audio Upload  
2. Audio Decoding via Web Audio API  
3. MFCC Feature Extraction  
4. AI Model Inference  
5. Authenticity Scoring  
6. Verdict Classification  
7. Secure Storage & History Retrieval  

### Outputs include:

- Authenticity Score (0–100%)  
- Verdict (Authentic / Forged / Uncertain)  
- Confidence Level  
- Audio Duration  
- Sample Rate  
- Model Version  
- Timestamped Analysis History  

---

## 🏗️ Project Structure

```
root
│
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/        # UI components (visualizers, results, uploader)
│   ├── contexts/          # AuthContext & global state management
│   ├── hooks/             # Custom reusable logic
│   ├── integrations/      # Supabase client integration
│   ├── lib/               # Shared utilities
│   ├── pages/             # App routes (Index, History, Auth)
│   ├── utils/             # Audio processing + MFCC extraction logic
│   ├── App.tsx
│   ├── main.tsx
│   └── App.css / index.css
│
├── supabase/
│   ├── functions/analyze-audio/   # Edge Function for audio analysis
│   ├── migrations/                # Database schema migrations
│   └── config.toml
│
├── API health check               # Server health endpoint
├── Run Guardrails                 # Analysis request handler
├── Database Schema                # Audio table with RLS setup
├── Auth and supabase integration  # Auth validation layer
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔐 Authentication & Security

- ✔ Supabase Authentication  
- ✔ Row-Level Security (RLS) enforced  
- ✔ User-scoped data queries  
- ✔ Token-based API validation  
- ✔ Secure analysis history per user  

### Each analysis record contains:

- `id`  
- `user_id`  
- `file_name`  
- `authenticity_score`  
- `verdict`  
- `confidence`  
- `duration`  
- `sample_rate`  
- `model_version`  
- `details (JSON)`  
- `created_at`  

Indexed for optimized retrieval.

---

## 🎧 Audio Processing Layer

Implemented in:

```
src/utils/audioProcessing
```

Includes:

- Audio decoding using Web Audio API  
- MFCC feature extraction  
- CNN-MFCC based classification  
- Verdict decision logic  
- Confidence scoring  

Designed to support:

- Offline file-based processing  
- Future real-time streaming mode  

---

## 📊 Visualization Layer

Components include:

- `WaveformVisualizer`  
- `MFCCVisualizer`  
- `AnalysisResults` panel  
- `AudioUploader` interface  
- Historical analysis viewer  

Built using:

- React  
- Tailwind CSS  
- shadcn-ui  

Optimized rendering for smooth UI performance.

---

## 🗄️ Backend Layer

### Supabase Edge Function

```
functions/analyze-audio
```

Handles:

- Audio analysis requests  
- Model execution  
- Guardrail validation  
- Standardized response schema  

### API Health Endpoint

Monitors backend availability and system status.

### Database Migrations

Complete schema control via:

```
supabase/migrations
```

---

## ⚡ Performance Considerations

- Asynchronous audio decoding  
- Non-blocking feature extraction  
- Optimized React rendering  
- Indexed database queries  
- Lightweight JSON storage  
- Scalable edge-function architecture  

Prepared for real-time streaming adaptation.

---

## 🚀 Running Locally

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

App runs at:

```
http://localhost:5173
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 📦 Deployment

Build production bundle:

```bash
npm run build
```

Deploy via:

- Vercel  
- Netlify  
- Supabase hosting  
- Any static-compatible platform  

---

## 🔮 Future Enhancements

- Real-time microphone streaming analysis  
- Sliding-window live authenticity scoring  
- Transformer-based audio classifier  
- Detailed forensic reporting dashboard  
- API-based enterprise deployment mode  

---
