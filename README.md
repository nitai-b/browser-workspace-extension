# Workspace Organizer Extension

Workspace Organizer is a personal Brave/Chromium extension for saving, organizing, annotating, and restoring groups of tabs as named projects. It uses the browser side panel as the main UI and keeps all project data in `chrome.storage.local`.

## What It Does

- Create, rename, archive, unarchive, and delete projects
- Save the current tab into a project
- Save all saveable tabs from the current window into a project
- View and remove saved tabs inside a project
- Reorder saved tabs with simple up/down controls
- Keep saved tabs ordered like a most-recently-used stack as linked browser tabs are opened or activated
- Add and edit per-project notes
- Restore a project by opening all saved tabs in a new browser window
- Highlight the saved project tab that matches the currently active browser tab
- Keep a saved tab updated when the live browser tab it was saved from navigates
- Search globally across project names, notes, saved tab titles, and URLs
- Import and export all project data as JSON
- Skip restricted browser URLs such as `brave://` and `chrome://`

## Tech Stack

- React
- Vite
- Manifest V3
- Background service worker
- Chromium side panel
- `chrome.storage.local`
- `chrome.tabs`

## Install Dependencies

```bash
npm install
```

## Build

```bash
npm run build
```

For a rebuild-on-change workflow that is useful during extension development:

```bash
npm run dev
```

This runs `vite build --watch` and keeps the `dist/` folder up to date for reloading in Brave.

## Load In Brave As An Unpacked Extension

1. Run `npm install`.
2. Run `npm run build`.
3. Open Brave and go to `brave://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the generated `dist/` folder in this project.
7. Click the extension action button to open the side panel.

## Keyboard Shortcut

The extension registers `_execute_action`, which you can configure in Brave:

1. Open `brave://extensions/shortcuts`
2. Find **Workspace Organizer**
3. Set or change the shortcut for **Open Workspace Organizer side panel**

The manifest suggests:

- `Ctrl+Shift+Y` on Windows/Linux
- `Command+Shift+Y` on macOS

Whether the same shortcut also closes the side panel depends on current Brave/Chromium behavior. The extension guarantees the shortcut triggers the toolbar action that opens the panel.

## Search

The side panel includes global search for project names, notes, saved tab titles, and URLs.

- Press `/` or `Ctrl+Shift+K` / `Command+Shift+K` to focus search.
- Start typing anywhere outside an editable field to begin searching immediately.
- Press `Escape` while search is focused to clear it.
- Search includes archived projects so old workspaces are still discoverable.

## Development Notes

- The extension uses the side panel as the primary UI. The toolbar action opens that panel.
- The source of truth is extension-managed project data in `chrome.storage.local`, not browser tab groups.
- Saved tabs are appended to projects as-is. Duplicate URLs are allowed.
- Saved tab order is intentionally dynamic: opening or activating a linked saved tab moves it to the top of its project.
- Live browser-tab syncing is session scoped. If the extension or browser restarts, saved tabs remain stored, but the live tab association is cleared to avoid syncing against stale browser tab IDs.
- Restricted internal browser pages cannot be saved and are skipped safely.
- Import currently replaces the full stored state with the imported JSON payload.
- The project is written in JavaScript to keep the local extension setup straightforward.

## Project Layout

```text
.
├── public/
│   └── manifest.json
├── src/
│   ├── background/
│   │   └── index.js
│   ├── lib/
│   │   ├── chromeTabs.js
│   │   ├── constants.js
│   │   ├── storage.js
│   │   └── utils.js
│   ├── sidepanel/
│   │   ├── components/
│   │   │   ├── ProjectDetails.jsx
│   │   │   └── ProjectList.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── styles.css
├── sidepanel.html
├── vite.config.js
└── package.json
```
