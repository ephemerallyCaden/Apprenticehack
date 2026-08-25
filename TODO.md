# ApprenticeHack Website — TODO

Tasks split into three categories. File/line references point at the current code so whoever picks a task up can go straight to it.

---

## 1. Aesthetic

- [ ] **Make the dark grey text easier to read** — audit the muted/hint text colours in `style.css` and either brighten them or give them a highlight treatment. Target WCAG AA contrast (4.5:1) against the dark background. Affects: `.field__hint`, form notes, badge `dt` labels, bios.
- [ ] **Create a banner image** *(assigned: Caden)* — hero section of `index.html`.
- [ ] **Fix the team card shine effect: glossy black, not glossy white** — the sheen gradient is `style.css:613-619` (white `rgba(237,238,236,0.22)` + teal sweep) with `mix-blend-mode: screen` at `style.css:624`. `screen` can only lighten — switch to a dark gradient with `mix-blend-mode: multiply` (or `overlay`) so the sweep reads as glossy black. The pointer-tracking vars are set in `script.js:68-69` and don't need to change.
- [ ] **Improve badge text hierarchy** — the badge fields (`.badge__fields` dt/dd) currently read as one flat style. Introduce priority structure: e.g. name largest/boldest, role secondary, company accent, labels smallest. Applies to hero badge (`index.html:56-69`), team cards, and the success badge on `register.html`.

## 2. Information + Content

- [ ] **Fix the content** *(assigned: Caden)* — rewrite site copy to match the one-pager voice (`Documents/ONE_PAGER.md`).
- [ ] **Expand the privacy policy** — `privacy.html` is currently 3 paragraphs. Add: lawful basis for processing (consent/legitimate interest), where the data actually goes (Google Sheets via Apps Script), named retention period, who has access, no third-party sharing statement, full list of UK GDPR rights, and what happens to data if someone asks to be deleted. Keep the plain-English tone.
- [ ] **Add our story/journey to the site** — pull from `Documents/ONE_PAGER.md` (Summary, The Problem, Our Future Vision) and present it engagingly — e.g. a timeline or "why we exist" section on `index.html`, not a wall of text. The "Levelling the playing field" section (`index.html:76-85`) is the natural place to expand or link from.
- [ ] **Make it clear what joining actually means** — signing the form does NOT sign you up for hackathons; it makes you part of the group, gives you access to the network, and *then* you choose which hackathons to join. Update: `register.html:32` (lede), `register.html:148` (form note — currently says "place you in a team and email you about the event", which implies event commitment), `register.html:154` (success text — "dates, team placement" implies the same), and `privacy.html:36-38` to match.

## 3. CTA + Functionality

- [ ] **Form: add "What AI tools do you have access to?"** — new question in `register.html`; add the field to the payload in `script.js:206-213` and a matching column in the Apps Script/Google Sheet.
- [ ] **Form: remove the specialism question** — the "What are you into?" tag list (`register.html:112-127`, Frontend/Backend/Data...) can scare away non-technical users. Remove it (and `interests` from the payload, `script.js:212`).
- [ ] **Form: remove the Student option** — we aren't built for students yet. Remove the radio at `register.html:73-79`. With one option left, drop the "Which are you?" fieldset entirely and hardcode `route: "apprentice"` — also remove the route entry from `FIELDS` in `script.js:123-128` and fix `showSuccess` (`script.js:242-243`), which reads the checked route radio and will throw if the fieldset is gone.
- [ ] **Add a "Share" CTA after joining** — let new members post their badge to LinkedIn from the success screen (`register.html:151-172`). LinkedIn's share URL only takes a link (no pre-filled image), so the flow that works: render the badge to an image (canvas or html-to-image) → "Download badge" + "Share on LinkedIn" button opening `https://www.linkedin.com/sharing/share-offsite/?url=<site-url>` with suggested copy the user pastes. Badge markup: `register.html:156-166`, populated by `script.js:241-255`.
- [ ] **Hide `.html` from URLs** — GitHub Pages serves `folder/index.html` at `/folder/`. Move `register.html` → `register/index.html` and `privacy.html` → `privacy/index.html` (root `index.html` is already served at `/`). Update every internal link (`index.html:25,36,215,224`, `register.html`, `privacy.html`, and asset paths which become relative to the new folder — safest to switch asset links to `/style.css`, `/script.js`, `/logo.svg`). Optionally add a redirect stub at the old `register.html` so shared links don't break.
- [ ] **Security review** — findings from an initial pass (24 Aug):
  - **No XSS found**: form code uses `textContent`/`createElement` throughout; `innerHTML` only used to clear (`script.js:177,247`). Keep it that way.
  - **Apps Script endpoint is public** (`script.js:91`) — unavoidable for a static site, but anyone can POST junk rows. The honeypot (`register.html:129-132`) is client-side only. Action: validate/sanitise + rate-limit inside the Apps Script itself (reject missing/oversized fields, cap rows per minute), and confirm the Google Sheet is not link-shared (PII lives there).
  - **Enable "Enforce HTTPS"** in the GitHub Pages settings for apprenticehack.co.uk if not already on.
  - **Add a CSP via meta tag** in each page head (GitHub Pages can't set headers): restrict script/style/font sources to self + fonts.googleapis.com/fonts.gstatic.com, connect-src to script.google.com.
  - `target="_blank"` links already use `rel="noopener"` — good.
  - No dependencies, no cookies, no analytics — nothing else flagged.
