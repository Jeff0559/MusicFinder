@echo off
REM Setup script for Windows (cmd.exe). Run from project root.
echo Ensure you're using Node 20 (nvm or nvm-windows required).
node -v
echo --- Uninstall possibly broken packages ---
npm uninstall @sveltejs/kit @sveltejs/adapter-netlify vite @sveltejs/vite-plugin-svelte || echo skip
echo --- Install compatible SvelteKit 2 deps ---
npm install -D @sveltejs/kit@latest @sveltejs/adapter-netlify@latest vite@latest @sveltejs/vite-plugin-svelte@latest
echo --- Install remaining deps ---
npm install
echo --- Run build ---
npm run build
if %errorlevel% neq 0 (
  echo Build failed. Inspect the output above.
  pause
) else (
  echo Build succeeded.
)
