# Sandbox troubleshooting

If **`npx ampx sandbox`** fails with **`ERR_MODULE_NOT_FOUND`** or **module not found**, try the following.

## 1. Use the correct command

- **Correct:** `npx ampx sandbox` or `npm run sandbox`
- **Wrong:** `npm ampx sandbox` or `npx ampx sanbox` (typo: **sandbox** has a **d**)

Run from the **project root** (where `package.json` and `amplify/` are):

```bash
cd C:\Users\Admin\forever-faded-booking
npx ampx sandbox
```

On **Windows**, use **Command Prompt** or **PowerShell** in the project folder.

## 2. Fix npm vulnerabilities and reinstall

If `npm install` reports **critical vulnerabilities**:

```bash
npm audit fix
npm install
```

If vulnerabilities remain, try (use with care — can introduce breaking changes):

```bash
npm audit fix --force
npm install
```

Then run the sandbox again. Updated **@aws-amplify/backend** and **@aws-amplify/backend-cli** to **^1.16.0** in this project to reduce module-not-found and compatibility issues.

## 3. Install dependencies (clean)

```bash
npm install
```

Then run the sandbox again.

## 3. Get the full error

Run with **`--debug`** to see the full stack trace and the exact module that’s missing:

```bash
npx ampx sandbox --debug
```

Note the **first line** that mentions a missing path (e.g. `Cannot find module '...'`). That tells you whether the problem is in the Amplify CLI, your `backend.ts`, or a dependency.

## 5. Node version — use Node 20 LTS (not Node 24)

If you see:

```text
Error: Cannot find package '...\node_modules\@aws-amplify\graphql-schema-generator\lib\index.js'
imported from ...\@aws-amplify\schema-generator\lib\generate_schema.js
code: 'ERR_MODULE_NOT_FOUND'
```

**Cause:** Node.js **24** uses stricter ESM resolution. The Amplify sandbox (and `@aws-amplify/graphql-schema-generator`) are not yet compatible with Node 24.

**Fix:** Use **Node 20 LTS** (or Node 18 LTS) when running the sandbox:

1. **Check your version:**
   ```bash
   node -v
   ```
   If you see `v24.x.x`, switch to Node 20.

2. **Switch to Node 20:**
   - **nvm (Windows):** `nvm install 20` then `nvm use 20`
   - **nvm-windows:** [nvm-windows](https://github.com/coreybutler/nvm-windows) — `nvm install 20` then `nvm use 20`
   - **Direct install:** Download **Node 20 LTS** from [nodejs.org](https://nodejs.org) and install it, then use that for this project.

3. **Reinstall and run sandbox:**
   ```bash
   Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json
   npm install
   npx ampx sandbox
   ```

For other issues, use **Node.js 18 or 20** (LTS). Avoid Node 24 for `npx ampx sandbox` until Amplify supports it.

## 6. Exclude `amplify` from root TypeScript

This project’s root **`tsconfig.json`** already **excludes** the `amplify` folder so the frontend build doesn’t try to resolve Amplify internals. If you added `amplify` back under `"include"`, remove it and add `"amplify"` to `"exclude"` to avoid module resolution errors.

## 7. Clean reinstall

If the error persists:

```bash
rm -rf node_modules package-lock.json
npm install
npx ampx sandbox --debug
```

On Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json; npm install; npx ampx sandbox --debug
```

## 8. Versions

Ensure **Amplify backend packages** are present and compatible:

- `@aws-amplify/backend` and `@aws-amplify/backend-cli` in `package.json` (devDependencies)
- Current supported versions: [Amplify Gen 2 docs](https://docs.amplify.aws/react/build-a-backend/)

If the **full error message** (from `--debug`) points to a specific file or package, share that line for more targeted help.
