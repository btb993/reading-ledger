READING LEDGER: phone + desktop app with sync
=============================================

What's in this folder
  index.html             the app
  manifest.webmanifest   makes it installable on phones and computers
  sw.js                  lets it open offline and remembers covers
  icons/                 the app icon

1) PUT THE APP ONLINE (free, about 5 minutes) with GitHub Pages
  a. Sign up at https://github.com (free).
  b. Click "+" (top right) > New repository. Name it: reading-ledger
     Leave it Public. Click "Create repository".
  c. On the new page click "uploading an existing file".
     Drag in EVERYTHING from this folder (index.html, manifest.webmanifest,
     sw.js and the icons folder). Click "Commit changes".
  d. Open Settings > Pages. Under "Build and deployment" choose
     Source: Deploy from a branch, Branch: main, folder: / (root). Save.
  e. After a minute your app lives at:
        https://YOUR-GITHUB-NAME.github.io/reading-ledger/
     Bookmark it. (Only the app's code is public. Your books are not.)

2) SET UP SYNC (free, about 10 minutes, once)
  Open your new web address on the computer and click "Set up sync".
  The app walks you through creating a free Supabase project, with a
  button that copies the database setup for you. Then create an account
  (email + password) inside the app.

3) BRING YOUR EXISTING LIBRARY ACROSS
  The new web address starts empty, because browsers keep each address's
  data separately.
  a. Open your old My Book Nook.html file > "Save a backup".
  b. Open the new web address > "Restore a backup" > choose that file.
  It uploads to sync automatically.

4) CONNECT YOUR PHONE
  In the sync panel (click the ☁ button) scan the QR code with your
  phone, sign in with the same email and password, then:
    iPhone:  Safari > Share > Add to Home Screen
    Android: Chrome > ⋮ menu > Install app

GOOD TO KNOW
  - Changes sync within a few seconds both ways. If you're offline,
    they sync when you're back.
  - Supabase pauses free projects after a week with no use at all.
    If sync stops after a long break, sign in at supabase.com and press
    "Restore project". Your data is kept.
  - To update the app later, upload the new index.html to the same
    GitHub repository (Add file > Upload files) and it replaces the old one.
  - Dragging books between shelves needs a mouse. On the phone, tap a
    book and choose its shelf.
