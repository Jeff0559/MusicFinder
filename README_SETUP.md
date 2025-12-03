Setup & build instructions (Windows)

1) Use Node 20
- If you use nvm: `nvm install 20` / `nvm use 20`
- If you use nvm-windows: `nvm install 20.24.0` / `nvm use 20.24.0`

2) Run the automated setup script (from project root):
```
scripts\setup.cmd
```

This script will uninstall possibly incompatible packages, install the SvelteKit 2 compatible versions, run `npm install` and then `npm run build`.

If the build fails, copy the full error output and open an issue or paste it back here for further help.
