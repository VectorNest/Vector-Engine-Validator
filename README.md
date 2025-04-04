# Vector Engine Protocol Validator

This repository implements the **Validator Daemon** for the **Vector Engine Protocol** — a decentralized, multi-modal vector search protocol supporting text, image, and content-based retrieval.

This daemon enables validators to evaluate **provider quality** through real-time automated testing. These scores influence each provider’s emissions and protocol ranking.

---

## 🚀 Features

✅ CLIP-based semantic relevance testing  
✅ Ranking accuracy detection  
✅ Latency benchmarking  
✅ Multi-run consistency testing  
✅ Automated evaluation per output  
✅ Weighted scoring for emissions  
✅ Fully extensible validation system  

---

## 🎯 Purpose

This validator ensures that providers in the Vector Engine Protocol:

- Return **semantically relevant** content
- Are **fast**, **consistent**, and **accurate**
- Are evaluated **fairly** and **automatically**

Higher-quality providers earn **higher emissions**.

---

## 🔬 Test Overview

| Test               | What it Validates                                         |
|--------------------|------------------------------------------------------------|
| `CLIPRelevanceTest` | Are results semantically close to the query?              |
| `RankingTest`      | Are the most relevant results ranked at the top?          |
| `LatencyTest`      | Does the provider return results quickly?                 |
| `ConsistencyTest`  | Are results repeatable for identical queries?             |

Each test produces multiple scored outputs. Scores are auto-evaluated and logged.

---

## 🧮 Scoring

Each test returns multiple results that are scored between **0.0 to 1.0**. The final provider score is a **weighted average**:

```
Final Score = (Relevance × 0.5)
            + (Ranking × 0.2)
            + (Latency × 0.2)
            + (Consistency × 0.1)
```

Final score is normalized to a **0–100 scale**. These scores affect the provider's emission rate.

---

## 📦 Installation

```bash
git clone https://github.com/VectorNest/Vector-Engine-Validator.git
cd Vector-Engine-Validator
npm install
```

---

## 🧪 Running the Validator

```bash
npm run validate
```

Validators will:
- Fetch offers from the protocol
- Run all 4 validation tests on each provider
- Log results and submit scores

---

## 📁 File Structure

```
src/
├── protocol/
│   ├── validation.ts             # Entry point with all 4 tests + scoring
│   └── tests/
│       ├── CLIPRelevanceTest.ts
│       ├── RankingTest.ts
│       ├── LatencyTest.ts
│       └── ConsistencyTest.ts
├── base/
│   └── AbstractTest.ts   # Auto-scoring base class
```

---

## 🧑‍💻 Become a Validator

To become a validator:

1. Fork this repo
2. Install and run the validator daemon
3. Make sure your machine is online during validation cycles

Top-performing validators may receive additional rewards.

---

## 🙌 Contributing

Contributions are welcome!

- Submit PRs for new test types
- File issues for bugs or improvements
- Help optimize scoring logic or embeddings

---

## 📜 License

MIT © 2025 — Vector Engine Protocol Core Team

