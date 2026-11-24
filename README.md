# North Lawndale Works: Round 1 concept prototype

Illustrative concept, to be tested with residents in months 1–3. All names, listings, schedules and phone numbers are synthetic.

**Live:** https://wklumpen.github.io/cities-deliver-mockup/

## Using it

- On a computer, it shows a 16:9 video stage. Press **Play** for a hands-free walkthrough (about 4:20). The controls fade when the mouse is still.
- Keys: arrows move between steps, Space plays or pauses, Home restarts.
- On a phone, it shows the resident app with Back and Next.
- Link to a step with its name, for example `#navigator` or `#architecture`.

## Running locally

```bash
npm install
npm run dev           # this machine only
npm run dev:tailnet   # reachable over Tailscale at http://<host>:5180
```

Pushing to `main` deploys to GitHub Pages.
