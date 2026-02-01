# Push Forever Faded Booking to GitHub

## 1. Create the new repository on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `forever-faded-booking` (or `Forever-Faded-Booking`)
3. **Description:** Barbershop booking app — AWS Amplify Gen 2
4. Choose **Public** (or Private)
5. Do **not** add a README, .gitignore, or license (this repo already has them)
6. Click **Create repository**

## 2. Add remote and push (from this folder)

In a terminal, from the `forever-faded-booking` folder:

```bash
cd C:\Users\Admin\forever-faded-booking

# Use YOUR GitHub username/org and repo name:
git remote add origin https://github.com/YOUR_USERNAME/forever-faded-booking.git

# Rename branch to main (optional; GitHub default is main)
git branch -M main

# Push
git push -u origin main
```

**Example** (if your GitHub username is `layeroneit`):

```bash
git remote add origin https://github.com/layeroneit/forever-faded-booking.git
git branch -M main
git push -u origin main
```

If GitHub asks for credentials, use a **Personal Access Token** (Settings → Developer settings → Personal access tokens) as the password.

---

Your project is already committed locally. After you create the repo on GitHub and run the commands above, the code will be on GitHub.
