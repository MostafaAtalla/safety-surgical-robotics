# Safety in Surgical Robotics — IEEE RAS Working Group website

Static site (HTML/CSS/JS, no build step) for GitHub Pages.

## Deploy
1. Create a repository (e.g. `safety-surgical-robotics`) and push the contents of this folder to `main`.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. The site appears at `https://<user-or-org>.github.io/<repo>/` within a minute.

## Adding images
- **Logos:** place official files at `assets/img/logos/ieee-ras.png` and `assets/img/logos/tc-surgical-robotics.png`. Until they exist, the footer shows text labels.
- **Team photos:** place square-ish JPGs at `assets/img/team/{atalla,wu,legrand,paterno,horeman,menciassi}.jpg`. Missing photos fall back to coloured initials.

## Editing content
- Text sections: `index.html`.
- Evidence-map dimensions, example profiles, terminology questions, team and timeline dates: top-level arrays in `assets/js/main.js`.
- Colours and type: tokens at the top of `assets/css/style.css`.
