# Safety in Surgical Robotics — IEEE RAS Working Group website

Static site (HTML/CSS/JS, no build step) for GitHub Pages.

## Deploy
1. Create a repository (e.g. `safety-surgical-robotics`) and push the contents of this folder to `main`.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. The site appears at `https://<user-or-org>.github.io/<repo>/` within a minute.

## Adding images
- **Logos:** upload to `assets/img/logos/` with these names: ieee-ras.png, tc-surgical-robotics.png, tc-soft-robotics.png, tc-pebras.png, tc-haptics.png, tu-delft.png, sdu.png, tue.png, sssa.png. Missing logos show as dashed tiles with the name.
- **Team photos:** place square-ish JPGs at `assets/img/team/{atalla,wu,legrand,paterno,horeman,menciassi}.jpg`. Missing photos fall back to coloured initials.

## Editing content
- Text sections: `index.html`.
- Evidence-map dimensions, example profiles, terminology questions, team and timeline dates: top-level arrays in `assets/js/main.js`.
- Colours and type: tokens at the top of `assets/css/style.css`.
