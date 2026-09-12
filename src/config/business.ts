/**
 * ──────────────────────────────────────────────────────────────────────────
 * AXIOM BUSINESS TEMPLATE — edit THIS file for each client job.
 * Swap copy, hours, prices, images, and voice. Leave the rest of the app.
 *
 * Images live in /public/business/  (hero, services, products).
 * Owner PIN lives in src/config/desk.server.ts (not on the public shop page).
 * ──────────────────────────────────────────────────────────────────────────
 */

export type Weekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";

export type Service = {
  id: string;
  name: string;
  tag: string;
  price: number;
  durationMin: number;
  image: string;
  description: string;
};

export type Product = {
  id: string;
  name: string;
  tag: string;
  price: number;
  image: string;
  description: string;
};

export type HourBlock = {
  days: Weekday[];
  open: string;
  close: string;
};

export type Business = {
  name: string;
  kind: string;
  location: string;
  timezone: string;
  tagline: string;
  story: string;
  heroImage: string;
  phone: string;
  email: string;
  bookingIntervalMin: number;
  hours: HourBlock[];
  afterHoursLabel: string;
  afterHoursNote: string;
  walkins: string;
  policies: string[];
  services: Service[];
  products: Product[];
  prompts: string[];
  axiomName: string;
  axiomVoice: string;
};

export const business: Business = {
  name: "Northline",
  kind: "Barbershop",
  location: "Hawthorne · Portland, OR",
  timezone: "America/Los_Angeles",
  tagline: "A proper chair. A sharp line. Out in forty.",
  story:
    "Walk-ins when we can. Booked chairs stay booked. After seven, the desk still answers.",
  heroImage: "/business/hero.jpg",
  phone: "(503) 555-0140",
  email: "desk@northline.shop",
  bookingIntervalMin: 30,
  hours: [
    { days: ["Tue", "Wed", "Thu", "Fri"], open: "10:00", close: "19:00" },
    { days: ["Sat"], open: "09:00", close: "17:00" },
  ],
  afterHoursLabel: "After hours",
  afterHoursNote: "After seven, the desk still answers.",
  walkins: "Walk-ins when a chair opens. Booked times are held.",
  policies: [
    "Late by ten minutes releases the chair.",
    "Card or cash. No surprise fees.",
    "Beard work is with a cut, or on its own.",
  ],
  services: [
    {
      id: "line",
      name: "The Line",
      tag: "Skin fade",
      price: 45,
      durationMin: 40,
      image: "/business/service-line.jpg",
      description: "A tight fade and a clean line. Out in forty.",
    },
    {
      id: "chair",
      name: "The Chair",
      tag: "Classic cut",
      price: 40,
      durationMin: 35,
      image: "/business/service-chair.jpg",
      description: "Scissors, comb, and a proper finish.",
    },
    {
      id: "beard",
      name: "The Edge",
      tag: "Beard + line",
      price: 28,
      durationMin: 25,
      image: "/business/service-beard.jpg",
      description: "Cheeks, neck, and a sharp cheek line.",
    },
  ],
  products: [
    {
      id: "pomade",
      name: "Northline Paste",
      tag: "Hold",
      price: 22,
      image: "/business/product-pomade.jpg",
      description: "Matte paste. All-day hold, no shine.",
    },
    {
      id: "oil",
      name: "Cedar Oil",
      tag: "Beard",
      price: 24,
      image: "/business/product-oil.jpg",
      description: "Cedar and bergamot. A few drops is enough.",
    },
  ],
  prompts: [
    "Do you take walk-ins?",
    "How much is a fade?",
    "Are you open Saturday?",
  ],
  axiomName: "Axiom",
  axiomVoice:
    "You are the desk at this shop. Short, warm, exact. Never invent a price, hour, or policy that is not listed. If they want a chair, point them to Book now.",
};
