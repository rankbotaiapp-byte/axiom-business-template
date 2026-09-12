# Axiom business template

A living AI desk for a shop. The iridescent **halo** around the phone *is* Axiom — it thinks, listens, and answers. Customers **book** and **ask** on the same page.

This repo is the **master**. Do not overwrite it with a client. The demo copy inside is **Northline**, a Hawthorne barbershop.

## STEP 0 — Scout first

Use [axiom-scout](https://github.com/rankbotaiapp-byte/axiom-scout) before you clone. Search the city, enrich the shop, copy `business.ts`. If Scout says **skip**, they already have an AI desk — do not build a demo.

## New client

1. **Use this template → Create a new repository.** Name it after the shop (`juniper-cuts`, …).
2. Paste Scout’s packet over [`src/config/business.ts`](src/config/business.ts).
3. Replace photos in [`public/business/`](public/business/):
   - `hero.jpg` — shop atmosphere (vertical)
   - `service-*.jpg` — each service
   - `product-*.jpg` — each product
4. Deploy that repo. Add `XAI_API_KEY` so Ask Axiom can answer.

Leave the halo, booking, and Ask Axiom code alone. They already read the config, so answers stay true to that shop.

Bookings stay on the visitor’s device (no accounts).

## What customers see

- **Shop** — name, hours chip, book, services, hours
- **Studio** — products with photos and tags
- **Ask Axiom** — the halo tightens, thinks, replies
- **Book now** — service → day → time → name
