# Family Meal Planner — Setup Guide

## Stack
- **Next.js 14** (App Router, TypeScript)
- **Supabase** — database + auth
- **Anthropic Claude** — AI recipe generation
- **Vercel** — hosting
- **Tailwind CSS + Framer Motion** — styling + animations

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. In the **SQL Editor**, paste and run the entire contents of `supabase/schema.sql`
3. This creates all tables, RLS policies, and seeds 5 built-in recipes

## 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=    # From Supabase Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # From Supabase Settings > API
ANTHROPIC_API_KEY=    # From console.anthropic.com
```

## 3. Install & run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Deploy to Vercel

```bash
npx vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard. Add the 3 env vars in Vercel's project settings under **Settings > Environment Variables**.

## 5. Add the app to your phone home screen

On iOS/Android, open the deployed URL in Safari/Chrome → Share → "Add to Home Screen". It works as a PWA!

---

## App features

| Page | What it does |
|---|---|
| **Home** | Dashboard with stats and quick nav |
| **Fridge** (`/ingredients`) | Add/remove ingredients with categories, quantities, expiry dates |
| **Recipes** (`/recipes`) | Browse recipes filtered by what you own. AI "Surprise Me!" generates a custom recipe |
| **Shopping** (`/shopping`) | Family shopping list with quick-add, checkboxes, share via native share |
| **Family** (`/family`) | Create or join a family group. Share the 6-letter invite code with family members |

## How family sharing works

1. First person signs up → goes to `/family` → creates a family
2. Gets a **6-letter invite code** (e.g. `ABC123`)
3. Shares code with family
4. Each family member signs up → goes to `/family` → enters the code
5. Everyone now shares the same ingredient inventory, recipes, and shopping list in real time

## AI recipe generation

The "✨ Surprise Me!" button on the Recipes page calls Claude Haiku with your current ingredient list and generates a brand-new recipe complete with steps and tips. It's saved to your family's recipe collection automatically.

---

## Need icons?

The app references `/public/icon-192.png` and `/public/icon-512.png` for the PWA manifest. Create simple PNG icons (an emoji on a coloured background works great) and add them to the `public/` folder.
