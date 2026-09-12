# Axiom business template

A living AI desk for a shop. The iridescent **halo** around the phone *is* Axiom — it thinks, listens, and answers. Customers **book** and **ask** on the same page.

This repo is the **master**. Do not overwrite it with a client. The demo copy inside is **Northline**, a Hawthorne barbershop.

## Turn this repo into a GitHub template (once)

1. Open [github.com/rankbotaiapp-byte/axiom-business-template](https://github.com/rankbotaiapp-byte/axiom-business-template).
2. **Settings → General → Template repository** (check the box).

After that, every job starts with the green **Use this template** button.

## New client

1. **Use this template → Create a new repository.** Name it after the shop (`juniper-cuts`, …).
2. In that new repo, edit [`src/config/business.ts`](src/config/business.ts) — name, kind, location, hours, prices, copy, prompts, voice.
3. Replace photos in [`public/business/`](public/business/):
   - `hero.jpg` — shop atmosphere (vertical)
   - `service-*.jpg` — each service
   - `product-*.jpg` — each product
   Point the `image` fields at those files.
4. Deploy that repo (Vercel is what the other shops use). Add `XAI_API_KEY` so Ask Axiom can answer.

Leave the halo, booking, and Ask Axiom code alone. They already read the config, so answers stay true to that shop.

Bookings stay on the visitor’s device (no accounts).

## What customers see

- **Shop** — name, hours chip, book, services, hours
- **Studio** — products with photos and tags
- **Ask Axiom** — the halo tightens, thinks, replies
- **Book now** — service → day → time → name
