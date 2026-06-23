# Moki Alpha Brief

Moki Alpha Brief is a V0.1 public research brief clone for a buy-side style NVDA memo.

Current status: V0.1 static share page plus Phase 9.4 Company IR / Earnings Release Evidence MVP. It defaults to evidence-draft / mock-safe behavior and keeps the Moki black, white, and gold visual system.

## Local Run

```bash
npm install
npm run dev
```

Windows PowerShell can use `npm.cmd` if `npm.ps1` is blocked.

## Page Paths

- `/` - demo brief
- `/s/nvda` - public share brief
- `/s/test` - Moki-styled not found state
- `/generate` - internal LLM / mock generation MVP page with Fast and Deep Reasoning modes

## Checks

```bash
npm run lint
npm run build
```

## Not Connected In V0.1

- No database
- No committed LLM API key
- No real serenity-skill execution
- No real-time stock price or consensus estimate feed
- No login or saved user-generated task
- No saved generated share page
- No PDF full-text parsing or transcript full-text parsing

The optional DeepSeek provider uses `.env.local` only:

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
```

`/generate` can choose Fast (`deepseek-chat`) or Deep Reasoning (`deepseek-reasoner`). The reasoner mode does not show, save, or pass back `reasoning_content`; it only renders the final structured BriefDocument JSON.

`/generate` can also enable Search, SEC, and Company IR Evidence Draft modes. Without `TAVILY_API_KEY`, search-backed IR falls back to mock IR evidence.

## Docs

Start here:

- `docs/V0_1_ALPHA_BRIEF_HANDOFF.md`

Brief schema:

- `docs/V0_1_BRIEF_SCHEMA.md`

LLM generation MVP:

- `docs/V0_1_LLM_GENERATION_MVP.md`

Data boundary:

- `docs/V0_1_DATA_BOUNDARY.md`

Prompt quality:

- `docs/V0_1_PROMPT_QUALITY.md`

Search evidence:

- `docs/V0_1_SEARCH_EVIDENCE_MVP.md`
- `docs/V0_1_SEARCH_EVIDENCE_QA.md`

SEC evidence:

- `docs/V0_1_SEC_EVIDENCE_MVP.md`

Research evidence context:

- `docs/V0_1_RESEARCH_EVIDENCE_CONTEXT.md`

Company IR evidence:

- `docs/V0_1_COMPANY_IR_EVIDENCE_MVP.md`

Evidence status copy:

- Phase 9.3.1 fixed `search-and-sec` status copy so the UI no longer says SEC is missing when SEC Evidence is attached.

Mobile QA:

- `docs/V0_1_MOBILE_QA_REPORT.md`
