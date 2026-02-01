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
