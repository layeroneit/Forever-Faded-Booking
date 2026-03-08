# Amplify build troubleshooting

When you see **"Command failed with exit code 1"** in AWS Amplify (Hosting or Sandbox), that means one of the build steps failed. The message itself is generic; you need the **real** error from the log.

## Find the real error

1. Open the **full build log** (Amplify Console → your app → the failed run → **View build log** or expand the failed phase).
2. Scroll to the **first** failure. Look for:
   - Red text or `Error:` / `failed` lines
   - The **last command** that ran before the failure (e.g. `npm install` or `npm run build`)
   - The error message **immediately below** that command

The log also prints `node -v` and `npm -v` at the start of preBuild so you can confirm the Node version.

## Common causes and fixes

### 1. **Node version (Sandbox or Hosting)**

- **Symptom:** `ERR_MODULE_NOT_FOUND` for `@aws-amplify/graphql-schema-generator` or similar when running `npx ampx sandbox`.
- **Fix:** Use **Node 20 LTS** (or 18). Node 24 is not fully supported. See [SANDBOX.md](./SANDBOX.md).
- **Amplify Hosting:** In **App settings → Build settings → Edit → Build image settings**, set **Node.js version** to **20** (or 18). Save and redeploy.

### 2. **`npm install` failed (Hosting)**

- **Symptom:** Exit code 1 during the **preBuild** phase; log shows npm errors (network, peer deps, etc.).
- **Fix:**  
  - Ensure **Node 20** (or 18) is selected in build settings.  
  - If you see peer dependency warnings that cause failure, the project uses `.npmrc` with `legacy-peer-deps=true`; ensure that file is committed.  
  - Retry the build (sometimes transient network issues).

### 3. **`npm run build` failed (Hosting)**

- **Symptom:** Exit code 1 during the **build** phase; log shows Vite/TypeScript errors.
- **Fix:** Run **`npm run build`** locally and fix the reported errors (missing env, type errors, etc.). Commit and push.

### 4. **Sandbox: "Command failed with exit code 1"**

- **Symptom:** `npx ampx sandbox` exits with code 1.
- **Fix:** See [SANDBOX.md](./SANDBOX.md) (Node version, clean install, `npm run sandbox`).

## Build config reference

- **amplify.yml** in this repo: preBuild runs `node -v`, `npm -v`, then `npm install`; build runs `npm run build`; artifacts are in `dist`.
- **Node:** Use **Node 20** for the sandbox and in Amplify Hosting build settings (see `.nvmrc` and [SANDBOX.md](./SANDBOX.md)).

---

## Login / auth theme not updating on Amplify Hosting

If the **sign-in page still shows the old theme or colors** after you push:

### 1. **Redeploy with cache cleared (recommended)**

- In **Amplify Console** → your app → **Hosting** (or **Build history**).
- Open the **latest build** → **Redeploy this version** (or **Trigger build**).
- Before redeploying: **App settings → Build settings → Edit** → under **Build image settings**, enable **Clear cache** (or equivalent) if your Amplify version has it, then save and trigger a new build.

### 2. **Force a new build**

- Push a small commit (e.g. comment or version bump) to trigger a fresh build.
- Ensures `npm install` and `npm run build` run again and new CSS/JS are deployed.

### 3. **Browser / CDN cache**

- Do a **hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).
- Or open the app in an **incognito/private** window.
- Amplify uses a CDN; new builds get new asset hashes, so after a successful redeploy, a hard refresh usually loads the new theme.

### 4. **Confirm theme in code**

- The app applies the **logo theme** (gold, royal blue, charcoal) in two places:
  - **index.css**: global `[data-amplify-authenticator]` tokens and overrides (so the login form always gets the theme even if wrapper classes differ).
  - **AuthTheme.css**: `.auth-portal-theme [data-amplify-authenticator]` for the split-screen layout and extra overrides.
- Both use the same `:root` variables (`--ff-gold`, `--ff-royal-blue-accent`, etc.). If you see old colors, it’s almost always **cache or an old deploy**; the code is set up to apply the theme globally.
