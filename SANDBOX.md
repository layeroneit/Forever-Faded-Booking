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

Then run the sandbox again. This project uses **@aws-amplify/backend** ^1.16.0 and **@aws-amplify/backend-cli** ^1.8.0 (backend-cli has no 1.16.x on npm; latest is 1.8.x).

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

## 5. Node version — use Node 20

This project uses **Node.js 20 LTS** (see `.nvmrc`). If you use Node 22 or 24 you may see:

```text
Error: Cannot find package '...\node_modules\@aws-amplify\graphql-schema-generator\lib\index.js'
imported from ...\@aws-amplify\schema-generator\lib\generate_schema.js
code: 'ERR_MODULE_NOT_FOUND'
```

**Cause:** The published `@aws-amplify/graphql-schema-generator` package points to `lib/index.js` but that file is missing or not resolved correctly on Node 22. The sandbox works on **Node 20**.

**Fix:** Use **Node 20** when running the sandbox:

1. **Check your version:**
   ```bash
   node -v
   ```
   You need `v20.x.x` for the sandbox. If you see `v22.x.x` or `v24.x.x`, switch to Node 20 for this project.

2. **Switch to Node 20:**
   - **nvm (Windows):** `nvm install 20` then `nvm use 20`
   - **nvm-windows:** [nvm-windows](https://github.com/coreybutler/nvm-windows) — `nvm install 20` then `nvm use 20`
   - **Direct install:** Download **Node 20 LTS** from [nodejs.org](https://nodejs.org) and use it when running the sandbox.

3. **Reinstall and run sandbox (from project root):**
   ```bash
   Remove-Item -Recurse -Force node_modules; Remove-Item package-lock.json
   npm install
   npx ampx sandbox
   ```

This project is set up for **Node 20** (`.nvmrc`). Run `nvm use 20` in the project folder so dev, build, and sandbox all use Node 20.

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
