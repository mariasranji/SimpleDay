# SimpleDay — Netlify Version

This is the Netlify-ready version of SimpleDay. The Flask + SQLite backend has been removed from the deployed version because Netlify can host the static frontend directly. Task data is stored in the browser with `localStorage`.

## Deploy on Netlify
1. Extract this folder.
2. Push the contents to GitHub, or drag the folder into Netlify's manual deploy area.
3. If Netlify asks for settings, use **Publish directory: `.`** and leave the build command empty.
4. Deploy.

## Features
- Add, edit, delete and complete tasks
- All / To do / Completed filters
- Search
- Categories, notes and due dates
- Completion percentage
- DummyJSON public API task suggestion
- WebAssembly completion module
- WebNN availability check
- Browser persistence through localStorage

## Important
The Netlify version stores tasks separately in each browser. The original Flask/SQLite project remains a backend version and can be used when demonstrating REST APIs and SQLite locally.
