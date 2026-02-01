# How to find what’s causing “Something went wrong”

Use these steps to see the **real** error instead of the generic message.

## 1. Open DevTools

- **Chrome / Edge:** Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Or right‑click the page → **Inspect**

## 2. Check the Console tab

- Go to the **Console** tab.
- Look for messages that start with **`[FOREVER FADED DEBUG]`** — those show the actual error.
- Also look for **`ErrorBoundary caught:`** — that’s the error React caught (with stack trace).
- Red lines are errors; expand them to see the full message and stack.

## 3. Check the red banner at the bottom of the page

- If an **uncaught error** or **unhandled promise rejection** happens, a **red banner** appears at the **bottom** of the page.
- It shows **`[FOREVER FADED DEBUG]`** and the error message (and stack if available).
- That tells you exactly what failed (e.g. network, auth, missing config).

## 4. Check the Network tab

- Go to the **Network** tab.
- Reload the page and trigger the error again.
- Look for **red** or **failed** requests (status 4xx/5xx or “Failed”).
- Click a failed request → **Preview** or **Response** to see the server’s error message.

## 5. Common causes

| What you see | Likely cause |
|--------------|--------------|
| `amplify_outputs.json` missing / empty | Backend not deployed or wrong build; run `npx ampx sandbox` and ensure Amplify injects the file. |
| `No matching state found in storage` | OIDC redirect/callback issue; try clearing cookies for the site or using a normal (non‑incognito) window. |
| `invalid redirect_uri` | Your app URL isn’t in Cognito App Client “Allowed callback URLs”. Add your URL (e.g. `https://your-domain.com` or `http://localhost:5173`). |
| CORS or 403/401 on API | Auth token or API URL wrong; check Cognito domain and Amplify API URL in the Network response. |
| Blank or “Something went wrong” only | Use steps 1–4 above; the Console or the red banner will show the real error. |

## 6. If you still don’t see an error

- Make sure **“Preserve log”** is checked in the Console so messages aren’t cleared on redirect.
- Reproduce the issue **once** with DevTools **already open** so nothing is missed.
- Copy any **`[FOREVER FADED DEBUG]`** or **`ErrorBoundary caught:`** lines and share them when asking for help.
