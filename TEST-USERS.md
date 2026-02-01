# Test users (same as forever-faded-platform)

Use these accounts to sign in. In this app, auth is **Cognito** — there are no pre-created users. **Sign up** with each email and the password below to create the account; then you can sign in with the same credentials.

| Email | Password | Name | Role |
|-------|----------|------|------|
| `owner@foreverfaded.com` | `password123` | Sarah Williams | owner |
| `mike@foreverfaded.com` | `password123` | Mike Johnson | barber |
| `chris@foreverfaded.com` | `password123` | Chris Davis | barber |
| `john@example.com` | `password123` | John Doe | client |

## After sign-up: UserProfile

This app links Cognito users to **UserProfile** (role, location, name). After signing up:

1. **Option A — Data manager:** In **Amplify Console** → your app → **Data** → **Data manager**, create a **UserProfile** for each user:
   - **userId** = Cognito user sub (see Profile page in the app after signing in; or Amplify Console → Authentication → Users → select user → copy "User sub").
   - **email**, **name**, **role**, **locationId** (use the location id from the seeded location, or leave blank for client).

2. **Option B — Seed data:** Use the **Seed location & services** button on the Dashboard (when signed in) to create the Waukesha location and services. Then create UserProfiles in Data manager as above.

## Location (same as platform)

- **Forever Faded — Waukesha**  
  - 1427 E Racine Ave Suite H, Waukesha, WI 53186  
  - (262) 349-9289  
  - America/Chicago  

The seed creates this location and the same service list as the platform (Test Service $1, Face, Adults, Teens, Children, Seniors & Military).
