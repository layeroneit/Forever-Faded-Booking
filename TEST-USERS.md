# Test users (4 preconfigured — same as platform)

The booking app uses **four preconfigured test accounts**. Create each account **once** via **Sign up** in the app, then sign in with the same email and password.

| Email | Password | Name | Role |
|-------|----------|------|------|
| `owner@foreverfaded.com` | `password123` | Sarah Williams | owner |
| `mike@foreverfaded.com` | `password123` | Mike Johnson | barber |
| `chris@foreverfaded.com` | `password123` | Chris Davis | barber |
| `john@example.com` | `password123` | John Doe | client |

These four users are shown on the sign-in/sign-up screen. Use **Create account** to register each one (email + password + name), then **Sign in** with the same credentials.

---

## New user registration flow

1. **Backend running:** Run `npx ampx sandbox` so the Cognito User Pool exists and `amplify_outputs.json` is generated. Without this, the app shows “Backend not configured”.
2. **Sign up:** On the auth screen, click **Create account**. Enter:
   - **Email** — use one of the four emails above (or any email for a new user).
   - **Password** — e.g. `password123` for test accounts.
   - **Preferred username (name)** — e.g. Sarah Williams, Mike Johnson, etc.
3. **Confirm (if required):** If Cognito is set to require verification, check the email and enter the code.
4. **Sign in:** Use the same email and password to sign in.
5. **UserProfile (role):** After first sign-in, create a **UserProfile** in Amplify Data so the app knows the user’s role (client, barber, owner, etc.). See below.

---

## After sign-up: link UserProfile (role)

This app links Cognito users to **UserProfile** (role, location, name). After signing up:

1. Sign in and open the **Profile** page. Copy your **User ID** (Cognito sub).
2. In **Amplify Console** → your app → **Data** → **Data manager**, create a **UserProfile**:
   - **userId** = the User ID from the Profile page (Cognito sub).
   - **email** = same as sign-in email.
   - **name** = display name (e.g. Sarah Williams).
   - **role** = `owner` | `barber` | `manager` | `client` | `admin`.
   - **locationId** = optional; use the seeded location id for staff.
3. Save. The sidebar and dashboard will then show the correct nav and stats for that role.

---

## Location (same as platform)

- **Forever Faded — Waukesha**  
  - 1427 E Racine Ave Suite H, Waukesha, WI 53186  
  - (262) 349-9289  
  - America/Chicago  

Use **Seed location & services** on the Dashboard (when signed in) to create this location and the same service list as the platform (Test Service $1, Face, Adults, Teens, Children, Seniors & Military).
