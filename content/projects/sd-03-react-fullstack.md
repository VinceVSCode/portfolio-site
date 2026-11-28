---
title: "React Full-Stack Mini App"
summary: "A librarian's web app for the SD-02 Library API: sign in, then manage books, members and loans."
---

## Problem

The [SD-02 Library API](sd-02-library-api.html) holds a library's books, members and loans, but a librarian can only reach it through its OpenAPI page. The aim of this project was a web app on top of that API: sign in once, then find, add, change and delete books and members, lend books and take them back. The app had to work against the real API, not a copy of it. It also had to stay usable when a request fails, the session ends, or the network is slow.

## Approach

- **One place for the signed-in user.** A reducer behind a React context holds the token, the username and when the session ends. Every change to the session (sign in, sign out, time out, token refused) goes through that one function, which is easy to test.
- **A typed client for the API.** Every SD-02 endpoint has a typed function. Each failure becomes a readable message, and validation errors are shown next to the field they belong to.
- **A short, safe session.** The token is kept in memory and in `sessionStorage`: a reload keeps the librarian signed in, closing the tab signs them out. The app signs out 20 minutes after sign-in, before the token's own 30 minutes run out.
- **Screens that keep their place.** Each list has paging, search and a filter kept in the address, so a reload, a shared link or the Back button keeps them. Deleting and returning ask first, because neither can be undone.
- **One command to run.** Docker Compose starts PostgreSQL, the published SD-02 image, the demo data and the app. nginx serves the app and passes `/api/` on to SD-02, so the browser talks to one address and the API needs no CORS settings.

## Execution instructions

There is no live demo. The app, the API and the database run on your own machine with Docker:

```bash
git clone https://github.com/VinceVSCode/sd-03-react-fullstack.git
cd sd-03-react-fullstack
docker compose up
```

Then open **http://localhost:8080** and sign in as `librarian` with the password `local-only-demo-password`. The demo data (12 books, 4 members, 4 loans) is loaded on the first run. The API's own page is at http://localhost:8000/docs.

**These sign-in values are for a local run only.** They come from `.env.example`; to change them, copy it to `.env` and edit the copy. `docker compose down` stops everything, and `docker compose down --volumes` also deletes the data.

## Tech stack

- **React 19** and **TypeScript 7**, built with **Vite**, with **React Router** for the pages.
- **React Context with a reducer** for the signed-in user; no state library.
- **Vitest** and **React Testing Library**, against a small fake of the SD-02 API.
- **oxlint** with the React hooks rules, and `tsc` for the types.
- **nginx** (unprivileged) in **Docker Compose**, with a strict content security policy, and **GitHub Actions** that runs the checks and then the whole stack.
- The **SD-02 API** from its published image, `ghcr.io/vincevscode/sd-02-library-api:1.0.1`.

## Challenges and solutions

- **Old answers replacing new ones.** When a librarian moves quickly between pages or searches, a slow answer can arrive after a newer one. Each screen loads its data through one hook that cancels requests no longer needed, so an old answer never replaces a newer one.
- **A session timer that sleeps.** A timer does not run while a laptop sleeps, so the session could outlive its 20 minutes. The app also checks the time whenever the tab becomes visible again.
- **A token the API refuses.** If the API answers 401 to a request that carried a token, the app signs out, says why, and after the next sign-in returns the librarian to the page they were on.
- **Deep links behind nginx.** Opening an address such as `/books/3/edit` directly failed at first, because the built files were linked relative to that address. They are now linked from the root, and nginx answers every page address with the app.
- **Security headers that disappeared.** In nginx, a header set inside one location replaces those set for the whole server, so the content security policy was lost on the cached files. The cache time is now set with `expires`, which keeps the shared headers.
- **Publishing the API image.** The first publish of the SD-02 image was refused at the last step. The package had to give the SD-02 repository write access, and be made public so anyone can pull it.

## Results

The loans, with open, overdue and returned loans, each with its book and member:

![The Loans page: four loans with book, member, lent and due dates, and the status Returned, Overdue or Out, with a Return button on each open loan.](../assets/img/projects/sd-03/demo.png)

Lending a book: the book and the member are chosen by searching, and the due date is shown before lending.

![The Lend a book form: Frankenstein and the member Giorgos Demo chosen, a loan of 14 days, due on Dec 10, 2026.](../assets/img/projects/sd-03/lend.png)

| Check | Result |
|---|---|
| Sign-in to sign-out against the real API | works in the browser, through nginx and in development |
| Automated tests | 90 pass: the API client, the session, and every screen's loading, error and empty states |
| Whole stack | `docker compose up` passes all 8 outside checks, locally and in CI |
| Lint and types | oxlint and `tsc` with no warnings |

## What I learned

Coming soon.
