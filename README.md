# Hawa — Kya hawa hai? 🌬️🪙

> **"Kya hawa hai?"** (What's the buzz?)  
> A mobile-first virtual-coin prediction market for college students.

---

## ⚠️ HARD RULE
**Play coins only. No real money. Just bragging rights.**  
There are NO real-money deposits, withdrawals, cash-outs, UPI gateways, or coin purchases. Coins cannot be bought or converted to money anywhere in the app.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests (payout & referral engine)
npm test

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` to test the full flow on desktop or throttled mobile device simulations.

---

## 📐 Parimutuel Payout Formula

Hawa uses an integer-based parimutuel model:

1. **House Seed Coins**: Every new market is initialized with **100 virtual house coins** per option. This ensures implied odds never read $0\%$ or $100\%$ on launch. **House seed coins are excluded from user payouts**.
2. **Implied Chance**:
   $$\text{Implied \%} = \text{round}\left(\frac{\text{Option Total Pool}}{\text{Market Total Pool}} \times 100\right)$$
3. **Winner Settlement**:
   Winners split the **total USER pool** in proportion to their stake on the winning option:
   $$\text{Payout} = \left\lfloor \frac{\text{user\_stake}}{\text{winning\_option\_user\_pool}} \times \text{total\_user\_pool} \right\rfloor$$
4. **Rounding**: All coin balances and payouts are **strictly integers** (rounded down).
5. **Refunds**:
   - If a market is **Cancelled** by a moderator, **100% of all user stakes are refunded**.
   - If nobody predicted the winning option, **100% of all user stakes are refunded**.

---

## 🎁 Coin Economy & Referral Rules

- **Initial Balance**: New users receive **100 virtual coins**. If signing up through a valid referral link (`?ref=HAWA-XXXX`), the new user receives **+50 bonus coins** immediately (starts at 150).
- **Referral Rewards**: The referrer receives **+50 coins** only after the referred friend makes their **first prediction**.
- **Anti-Abuse Limits**: Max **10 rewarded referrals** per user (500 coins cap). Self-referrals are blocked.
- **Daily Drop**: **10 coins** claimable once per 24 hours (resets at **00:00 IST**).

---

## 🎨 Design System & Palette

- **Linen** (`#F3EDE2`): Warm editorial page background
- **Linen Deep** (`#E8DFCF`): Flat card borders and dividers
- **Petrol** (`#1E5560`): Primary brand, headings, Yes/Win calls
- **Baby Pink** (`#F5C6D2`): Soft chips, liquid-glass tint, podium rank 3
- **Tangerine** (`#FF8A3D`): Primary CTAs, highlights, 3D coin *(Never used for text on linen to ensure WCAG AA accessibility)*
- **Black Cherry** (`#3B0F20`): Primary typography, No/Loss calls
- **Cool Blue** (`#5B8EF2`): Charts, links, podium rank 2

---

## 🧊 3D & Shaders Architecture

3D appears strictly in 4 purposeful moments:
1. **Splash Hero**: Liquid metal wordmark floating over a soft linen-to-pink gradient with gentle pointer parallax.
2. **Coin Balance**: Embossed 3D "H" coin that flips on predictions and bursts into particle coins on a win.
3. **Leaderboard Podium**: Three blocks (Rank 1 petrol, Rank 2 cool-blue, Rank 3 baby-pink) that rise on load with an active tangerine marker for top 3 students.
4. **Ambient Background**: Gentle baby-pink and cool-blue air blobs drifting at low opacity.

### Performance & Fallback
- **Target**: 60fps on mid-range mobile devices (`dpr={[1, 1.5]}`).
- **Auto-Downgrade**: If FPS drops below 40 for 2 consecutive seconds, the ambient 3D layer is automatically disabled.
- **Glass Fallback**: If WebGL2 is unsupported, `hardwareConcurrency <= 4`, or `prefers-reduced-motion` is active, the app automatically switches to zero-cost CSS `backdrop-filter: blur(16px)` glass.

---

## 🔌 Backend Service Recommendation & Live OAuth

### Recommended: Supabase (PostgreSQL + Supabase Auth)
For a real deployment, we recommend **Supabase**:
1. **ACID Transactions**: Parimutuel calculations and balance deductions run in atomic PostgreSQL RPC functions (`FOR UPDATE` row locking) to prevent race conditions or double spending.
2. **College-Domain OAuth**: Google OAuth with email domain lock (`@college.edu`) ensures only registered students can sign in and stops multi-account referral abuse.
3. **Realtime**: Push odds updates live to everyone during campus matches.

The database migration and stored procedure are already written in **[`schema.sql`](./schema.sql)**.

To switch from localStorage to Supabase:
1. Run `schema.sql` in your Supabase SQL Editor.
2. Supply `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
3. Point `/src/services/api.ts` to call Supabase client functions.

---

## 🔮 Next Steps
- **College-Email Verification**: Restrict signups to verified `@university.edu` emails.
- **Push Notifications**: Web Push / FCM notifications for market closing and winning payouts.
- **Student Moderation Council**: Multi-signature consensus for resolving dispute-prone markets.
- **Sponsor-Funded Non-Cash Rewards**: Partner with campus fest canteens and bookstores for discount coupons (pending campus legal review).

---

## 📜 Credits & Licenses
- **[three.js](https://github.com/mrdoob/three.js/)** by Mr.doob and contributors (MIT License)
- **[liquid-glass-js](https://github.com/dashersw/liquid-glass-js)** by Şerif Ceylan (dashersw) (MIT License, preserved in `/src/vendor/liquid-glass/LICENSE`)
- **[liquid-logo](https://github.com/collidingScopes/liquid-logo)** by collidingScopes (MIT License)
