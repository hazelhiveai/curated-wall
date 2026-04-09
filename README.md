# Curated Wall — WhatsApp Store

A temporary online store for selling premium photo frame + art print bundles in Bengaluru.

## Quick Start

1. Open `index.html` in your browser to preview the site
2. Deploy to GitHub Pages (see below)

## Managing Stock

After each sale, update `data/stock.json`:

1. Open `data/stock.json` (on GitHub or locally)
2. Find the bundle by name or ID (e.g., `"id": "bundle-01"`)
3. Decrease the `"stock"` value (e.g., `3` → `2` → `1` → `0`)
4. Commit and push — the site updates automatically

When stock reaches `0`, the bundle shows as **Sold Out** with a disabled button.

### Example

```json
{ "id": "bundle-01", "name": "Golden Hour", "description": "...", "stock": 2 }
```
↓ After a sale:
```json
{ "id": "bundle-01", "name": "Golden Hour", "description": "...", "stock": 1 }
```

## Adding Product Photos

Each bundle needs 3 photos. Place them at:

```
images/bundles/bundle-01/print-1.jpg
images/bundles/bundle-01/print-2.jpg
images/bundles/bundle-01/print-3.jpg
```

**Recommended photo specs:**
- Aspect ratio: **4:3** (landscape)
- Min resolution: **800 x 600px**
- Format: JPG (keep file size under 200KB for fast loading)

Until photos are added, colorful placeholders are shown automatically.

## Deploying to GitHub Pages

1. Create a new GitHub repository
2. Push this project to the repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Go to **Settings → Pages** in your GitHub repo
4. Set source to **Deploy from a branch → main → / (root)**
5. Your site will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Shutting Down

When all stock is cleared, simply delete the GitHub repository or disable GitHub Pages in Settings.
