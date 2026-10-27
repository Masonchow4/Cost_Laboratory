# Swyft Pricing and Cost Laboratory

A static, browser-only pricing lab built for Mission 3. It imports the Mission 1 competitor dataset, keeps the student's working model in browser local storage, and exports a student-confirmed decision as a real Word document plus structured JSON.

## Run and verify

```powershell
npm test
npm run build
python -m http.server 4173 --directory dist
```

Open `http://127.0.0.1:4173/`. The app uses `fetch()` for its bundled research file, so serve the site over HTTP instead of opening `index.html` as a `file://` URL. It has no runtime API, database, required account, or npm dependency.

## Model choices

- The source venture describes a proposed AI clothing preview plus personalized style advice. Consumer subscription pricing is only a scenario: who pays is still unknown, and a retailer-funded feature needs a different model.
- One editable monthly plan is preloaded at $6.99, inside Mission 1's $4.99–$7.99 preliminary monthly range. The annual $29.99–$39.99 range remains an alternative from Mission 1, not an activated or confirmed plan.
- No office, inventory, manufacturing, shipping, or full-time staff is assumed. Optional founder time and customer support start disabled.
- Each cost has a status: Researched, Estimated, Illustrative, or Student-Entered. Researched vendor prices are dated references; BLS wages are employee data, not contractor quotes. Illustrative estimates are not claimed as averages.
- Recurring fixed expenses normalize to monthly equivalents. Startup cash is reported separately. Startup amortization is disabled until the student supplies an explicit treatment and duration.
- Contribution per unit = monthly-equivalent price less per-customer variable costs. Break-even units = monthly fixed costs divided by weighted contribution per unit. Zero or negative contribution has no finite break-even.
- Annual plan revenue is divided by 12 for the operating run-rate view. Expected volume means average active paying units per month; this is not a demand forecast. The model does not estimate churn, taxes, refunds, cash timing, or willingness to pay.
- Multi-product break-even uses the student's entered unit mix. Business-wide fixed costs are counted once.
- The review's risk labels use visible deterministic rules and describe the model only; they do not predict failure probability.
- The DOCX and JSON exports are assembled from one frozen, student-confirmed snapshot. `customerFacing` JSON fields contain product text and price details; internal cost and risk detail stays in separate sections. No custom input is sent to this site or repository.

## Sources used in the initial model

| Input | Reference | Meaning |
| --- | --- | --- |
| Virtual try-on inference | [fal.ai virtual try-on](https://fal.ai/models/fal-ai/image-apps-v2/virtual-try-on) | Published $0.04 per output image when checked Oct 27, 2026. Endpoint is a proxy benchmark, not a selected vendor or quality claim. |
| Online card processing | [Stripe standard pricing](https://stripe.com/pricing) | 2.9% plus $0.30 per successful domestic-card transaction; actual methods and terms vary. |
| Object storage | [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) | $0.015 per GB-month, plus a stated Standard storage free tier of 10 GB-month as checked Oct 27, 2026. |
| Software labor | [U.S. BLS May 2025 OEWS tables](https://www.bls.gov/oes/2025/may/oes151252.htm) | $65.38 median hourly software developer wage; hourly effort is a model assumption. |
| Competitor research | `data/research.json`, copied from Mission 1 | Four competitors and 28 price observations, checked Oct 27, 2026. Listed prices are a dated snapshot, not live quotes. |

## Personal model data

The public GitHub Pages site serves its code and the original illustrative model. After page load, student edits stay in that browser's local storage; the site does not upload them. Export `Swyft_Pricing_Lab_Backup.json` before clearing browser data or moving to another device. Do not put a private decision report or backup in the public repository.

## GitHub Pages

The workflow checks the calculations, builds `dist/`, and publishes it from the repository subpath. Relative asset and JSON paths are used so the page works at `https://masonchow4.github.io/Cost_Laboratory/`.
