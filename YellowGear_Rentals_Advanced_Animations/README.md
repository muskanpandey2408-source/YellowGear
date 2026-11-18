# YellowGear Rentals

A static, browser-only vehicle rental demo built with HTML, CSS, and JavaScript. No build tools or server are required.

## Run locally

Open `index.html` in a modern browser, or serve this folder with any static web server.

## Deploy with GitHub Pages

1. Push this project to a GitHub repository on the `main` or `master` branch.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. The **Deploy to GitHub Pages** workflow publishes the site after each push. You can also start it from the repository's **Actions** tab with **Run workflow**.
4. Open the URL shown in the completed workflow or under **Settings → Pages**.

The site uses relative stylesheet and script paths and hash-based navigation, so it works from a GitHub Pages project-site URL as well as a custom domain.

## Demo behavior

Login, bookings, and fleet changes are stored only in the current browser using `localStorage`; they are not shared across visitors or devices. The seeded admin demo account is `admin@yellowgear.in` / `admin123`. Do not use real or sensitive information. Vehicle photos and fonts load from external hosts and therefore require internet access.
