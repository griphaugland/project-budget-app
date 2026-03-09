# Budget Guardian — Architecture Document

**Version 1.1 · March 2026 · Status: Draft**

-----

## Product Overview

Budget Guardian is a mobile-first personal finance app that transforms passive spending tracking into active behavioral change. Rather than simply visualizing where money went, the app creates real-time awareness and psychological friction around spending decisions.

The app connects to the user's bank account via Open Banking APIs, uses AI to categorize and analyze transactions, and presents a clear, emotionally resonant picture of the user's financial position at any given moment. A conversational AI assistant allows the user to manage their budget through natural language, making adjustments as frictionless as sending a text message.

> **Core Philosophy:** The app does not block spending — it creates awareness. Like stepping on a scale every morning, the number alone changes behavior. The app is a gatekeeper that makes you conscious of every financial decision.

-----

## Core Concepts

### The Envelope Model

Every krone of income gets assigned to a category (envelope). The app tracks spending against each envelope in real time. The key innovation is the **Pocket Money** envelope — this is the user's discretionary spending budget, and its remaining balance is the primary number displayed on the home screen.

### Budget Cycle

Budgets are set monthly and automatically broken into weekly targets. Surplus from underspending rolls forward within the month, creating a natural incentive to be disciplined early.

```
Weekly Pocket Money = (Monthly pocket money budget − pocket money spent this month) ÷ weeks remaining
Daily Pocket Money  = Weekly pocket money remaining ÷ days remaining in the week
```

### Expected Payments

Users (or the AI assistant) can register upcoming charges that haven't hit the bank yet. These are factored into budget calculations immediately, preventing artificially inflated available balances. When the actual transaction arrives via bank sync, it is automatically reconciled against the expected payment, and any difference is adjusted.

### Gatekeeper Model: Notifications + Visual Warnings

The app uses a notification-based friction system with escalating intensity:

- **Morning briefing (08:00)** — daily snapshot of remaining budget and week position
- **Transaction alerts** — instant notification on any new charge with updated balance
- **25% warning** — triggered when weekly pocket money drops below 25%
- **10% critical** — triggered when weekly pocket money drops below 10%
- **Weekly summary (Sunday 20:00)** — recap of the week with trends and comparisons
- **New recurring charge detected** — flags newly identified subscriptions
- **Budget reset (1st of month)** — fresh start notification with new monthly figures

### AI Categorization

A daily background job (plus on-demand sync on app open) processes new transactions through the Claude API. The AI categorizes each transaction into one of the user's envelopes, flags whether it appears to be recurring or one-time, and provides a confidence score. User corrections are stored as merchant mappings and take priority over AI suggestions in the future.

### AI Assistant

A conversational AI layer embedded in the app allows the user to manage their budget through natural language. The assistant has read access to the full budget state and can execute a defined set of actions (tools) to modify budgets, add expected payments, reallocate funds, and answer spending questions. Contextual quick actions on each screen provide shortcuts into the assistant with pre-loaded context.

-----

## Category System

The app ships with 6 default categories. Users can rename them but the count stays intentionally low to keep categorization accurate and management minimal.

|Category            |Type         |Examples                                 |
|--------------------|-------------|-----------------------------------------|
|**Essentials**      |Fixed        |Rent, utilities, insurance, phone plan   |
|**Groceries**       |Variable     |REMA 1000, Meny, Kiwi, Bunnpris          |
|**Transport**       |Variable     |Fuel, Skyss, car maintenance, parking    |
|**Food & Drink Out**|Variable     |Restaurants, cafés, takeaway, bars       |
|**Subscriptions**   |Fixed        |Spotify, Netflix, gym, streaming services|
|**Pocket Money**    |Discretionary|Everything else — the free-spend envelope|

-----

## Technical Stack

|Layer             |Technology           |Rationale                                                                       |
|------------------|---------------------|--------------------------------------------------------------------------------|
|Mobile App        |Expo + React Native  |Native push notifications, smooth animations, Expo Router for file-based routing|
|Navigation        |Expo Router          |File-based routing familiar from Next.js, deep linking support                  |
|State Management  |Zustand              |Lightweight, minimal boilerplate, great React Native support                    |
|Charts/Visuals    |Victory Native / Skia|Performant budget ring, progress bars, spending charts                          |
|Backend           |Supabase             |PostgreSQL, auth, Edge Functions, cron — all-in-one platform                    |
|Database          |PostgreSQL (Supabase)|Relational model fits budget/transaction data perfectly                         |
|Auth              |Supabase Auth        |Built-in, supports email + social, handles tokens/sessions                      |
|AI Categorization |Claude API (Sonnet)  |Norwegian language support, JSON output, fast batch categorization              |
|AI Assistant      |Claude API (Sonnet)  |Tool-use pattern for budget modifications via natural language                  |
|Bank Data         |Neonomics            |Norwegian Open Banking aggregator, SpareBank 1 supported, PSD2 compliant        |
|Push Notifications|Expo Notifications   |Managed push token handling, reliable cross-platform delivery                   |
|Deployment        |EAS (Expo)           |Cloud builds, OTA updates, App Store submission management                      |

-----

## System Architecture

### High-Level Data Flow

1. Daily cron job (06:00) triggers bank sync via Supabase Edge Function
1. On app open, client requests sync (with 15-minute cooldown to avoid API abuse)
1. Edge Function fetches new transactions from Neonomics API
1. New transactions are checked against merchant mappings — matches are auto-categorized
1. Remaining transactions are sent to Claude API for AI categorization
1. New transactions are reconciled against expected payments (fuzzy match on merchant + amount)
1. Categorized transactions are stored in PostgreSQL with budget state updated
1. Push notifications are evaluated and sent based on threshold rules
1. Client receives updated budget state and renders the home screen

### Sync Cooldown Logic

When the user opens the app, the client calls `POST /bank/sync`. The server checks `last_synced_at` — if more than 15 minutes have passed, it runs the full sync flow for that user. If within cooldown, it returns cached data with a "last synced X minutes ago" indicator. The cooldown can be adjusted per user or globally as the app scales.

### Expected Payment Reconciliation

When the daily sync pulls in new transactions, each one is checked against open expected payments using:

- Fuzzy matching on merchant name (e.g., "HAFSLUND STRØM" matches expected payment "Power bill")
- Approximate amount matching within a configurable tolerance (default: 10%)
- Date proximity to the expected date (within 7 days)

When matched, the expected payment is marked as fulfilled. If the actual charge differs from the expected amount, the difference is reconciled: surplus flows back to the category, overage pulls from the category budget, and the user receives a notification explaining the adjustment.

-----

## AI Assistant Architecture

### Overview

The AI assistant is a conversational interface backed by the Claude API using a tool-use pattern. The assistant receives the user's message along with a compact JSON snapshot of their current budget state, and can call defined tools to make changes. Each interaction is stateless — the full budget context is loaded fresh per request.

### Endpoint

```
POST /assistant/chat
```

**Request body:**

```json
{
  "message": "Power bill this month will be 1500kr",
  "screen_context": "home",
  "selected_item_id": null
}
```

The `screen_context` tells the AI where the user is in the app (home, transactions, budget, etc.) and `selected_item_id` provides additional context if they're viewing a specific transaction or category.

### Budget State Snapshot

On each request, the handler loads the user's current state and injects it as system context. The snapshot is structured for efficient token usage:

```json
{
  "month": "2026-03",
  "income": 35000,
  "days_remaining_in_month": 22,
  "days_remaining_in_week": 3,
  "categories": [
    {
      "id": "cat_1",
      "name": "Essentials",
      "type": "fixed",
      "allocated": 15000,
      "spent": 12400,
      "remaining": 2600
    },
    {
      "id": "cat_6",
      "name": "Pocket Money",
      "type": "discretionary",
      "allocated": 4000,
      "spent": 2150,
      "remaining": 1850,
      "weekly_target": 925,
      "weekly_remaining": 487
    }
  ],
  "expected_payments": [
    {
      "id": "exp_1",
      "description": "Netflix",
      "amount": 159,
      "category": "Subscriptions",
      "expected_date": "2026-03-15",
      "status": "pending"
    }
  ],
  "recent_transactions": [
    {
      "merchant": "REMA 1000 BERGEN",
      "amount": -342,
      "category": "Groceries",
      "date": "2026-03-08"
    }
  ]
}
```

### Available Tools

The AI assistant can call the following tools. Each has built-in validation rules.

#### `create_expected_payment`

Registers an upcoming charge that should be factored into the budget.

|Parameter    |Type   |Required|Description                                  |
|-------------|-------|--------|---------------------------------------------|
|description  |string |yes     |Human-readable label (e.g., "Power bill")    |
|amount       |number |yes     |Expected amount in NOK                       |
|category_id  |string |yes     |Which envelope to deduct from                |
|expected_date|string |yes     |ISO date when the charge is expected         |
|is_recurring |boolean|no      |Whether this repeats monthly (default: false)|

**Validation:** Amount must be positive. Category must exist. Expected date must be in the future.

#### `update_expected_payment`

Modifies or deletes an existing expected payment.

|Parameter          |Type   |Required|Description                         |
|-------------------|-------|--------|------------------------------------|
|expected_payment_id|string |yes     |ID of the payment to update         |
|amount             |number |no      |New expected amount                 |
|expected_date      |string |no      |New expected date                   |
|category_id        |string |no      |Move to different category          |
|delete             |boolean|no      |Remove the expected payment entirely|

#### `reallocate_budget`

Moves money between category envelopes.

|Parameter         |Type  |Required|Description          |
|------------------|------|--------|---------------------|
|source_category_id|string|yes     |Category to take from|
|target_category_id|string|yes     |Category to give to  |
|amount            |number|yes     |Amount to move in NOK|

**Validation:** Source category must have sufficient remaining balance (allocated − spent ≥ amount). Cannot reduce a fixed category below its already-spent amount.

#### `adjust_category_budget`

Sets a new allocation for a specific category.

|Parameter  |Type  |Required|Description           |
|-----------|------|--------|----------------------|
|category_id|string|yes     |Category to adjust    |
|new_amount |number|yes     |New monthly allocation|

**Validation:** New amount cannot be less than what's already been spent this month. Total allocations across all categories cannot exceed monthly income.

#### `add_income`

Registers additional income (bonus, reimbursement, gift) and distributes it.

|Parameter   |Type  |Required|Description                                                    |
|------------|------|--------|---------------------------------------------------------------|
|amount      |number|yes     |Income amount in NOK                                           |
|description |string|yes     |Source description                                             |
|distribution|object|no      |How to split across categories (defaults to all → Pocket Money)|

#### `get_spending_summary`

Retrieves spending data for analytical questions. Returns data the AI uses to formulate a response.

|Parameter  |Type   |Required|Description                                         |
|-----------|-------|--------|----------------------------------------------------|
|category_id|string |no      |Filter to specific category (omit for all)          |
|period     |string |yes     |"this_week", "last_week", "this_month", "last_month"|
|compare    |boolean|no      |Include comparison to previous period               |

### Guardrails

The AI assistant operates within strict boundaries:

- **Cannot exceed income.** Total category allocations + expected payments cannot exceed monthly income. The AI communicates this clearly if a request would breach the limit.
- **Cannot reduce below spent.** If you've already spent 2,800 kr on groceries, the AI can't set the grocery budget to 2,500 kr. It will explain why and suggest alternatives.
- **Confirmation on large changes.** Any reallocation above 25% of a category's budget triggers a confirmation step before execution.
- **Undo support.** Every tool action returns a confirmation card with an undo button. Undo is available for 24 hours.
- **No destructive actions without explicit confirmation.** Deleting expected payments or zeroing out categories requires the user to confirm.

### AI System Prompt Structure

The assistant system prompt includes:

1. Role definition: "You are a budget assistant for a Norwegian personal finance app."
1. The full budget state snapshot (JSON, as shown above)
1. Tool definitions with parameter schemas
1. Behavioral rules: be concise, confirm changes clearly, push back on risky adjustments, respond in the same language the user writes in (Norwegian or English)
1. Current screen context for relevant suggestions

### Example Interactions

**User:** "Power bill this month will be 1500kr"
**AI action:** Calls `create_expected_payment(description: "Power bill", amount: 1500, category_id: "cat_1", expected_date: "2026-03-20")`
**AI response:** "Added expected payment: Power bill, 1,500 kr on March 20, under Essentials. Your weekly pocket money is now 812 kr."

**User:** "I overspent on eating out, move 500 from pocket money"
**AI action:** Calls `reallocate_budget(source: "cat_6", target: "cat_4", amount: 500)`
**AI response:** "Moved 500 kr from Pocket Money to Food & Drink Out. Pocket money remaining this month: 1,350 kr (337 kr/week)."

**User:** "Am I spending more on groceries than last month?"
**AI action:** Calls `get_spending_summary(category_id: "cat_2", period: "this_month", compare: true)`
**AI response:** "You've spent 4,200 kr on groceries so far this month with 22 days left. Last month at this point you'd spent 3,800 kr. You're trending about 10% higher."

**User:** "Move all grocery money to pocket money"
**AI response:** "That would leave 0 kr for groceries with 22 days remaining, and you've been averaging 200 kr/day on groceries. Would you like me to move a partial amount instead — maybe 500 kr?"

-----

## Contextual Quick Actions

Each screen surfaces smart shortcuts that open the AI assistant with pre-loaded context.

### Home Screen

Quick actions adapt to the current budget state:

|Condition               |Quick Action Shown        |
|------------------------|--------------------------|
|Pocket money < 25%      |"Reallocate my budget"    |
|Default state           |"Add expected payment"    |
|Near end of month       |"How did I do this month?"|
|Large recent transaction|"What was this charge?"   |

### Transactions Screen

|Context                          |Quick Action                   |
|---------------------------------|-------------------------------|
|Viewing a transaction            |"What is this?", "Recategorize"|
|Low-confidence AI categorization |"Review this categorization"   |
|Viewing a merchant for first time|"Is this recurring?"           |

### Budget Screen

|Context                 |Quick Action             |
|------------------------|-------------------------|
|Category over 80% spent |"Adjust this budget"     |
|Category under 30% spent|"Reallocate surplus"     |
|Expected payment pending|"Update expected payment"|
|Viewing category detail |"Show spending trend"    |

### Implementation

Quick actions are not separate features. Every quick action composes a message and opens the chat with that message pre-filled, plus the relevant `screen_context` and `selected_item_id`. This keeps the engineering unified — one AI endpoint handles everything.

```typescript
// Example: tapping "Adjust this budget" on the Budget screen
const quickAction = {
  message: `I need to adjust my ${category.name} budget. Currently at ${category.spent}/${category.allocated} kr.`,
  screen_context: "budget",
  selected_item_id: category.id,
};
navigation.navigate("assistant", { prefill: quickAction });
```

-----

## API Endpoints

All endpoints are Supabase Edge Functions, secured with Supabase Auth JWT tokens.

|Method|Endpoint                 |Description                                                      |
|------|-------------------------|-----------------------------------------------------------------|
|POST  |`/auth/register`         |Create account with email/password                               |
|POST  |`/auth/login`            |Authenticate and receive JWT                                     |
|POST  |`/bank/connect`          |Initiate Neonomics BankID flow                                   |
|POST  |`/bank/sync`             |Trigger on-demand transaction sync (15-min cooldown)             |
|GET   |`/transactions`          |List transactions, filterable by category, date, search          |
|PATCH |`/transactions/:id`      |Edit category, notes, or split a transaction                     |
|GET   |`/budget/current`        |Current month budget state with all envelopes                    |
|PUT   |`/budget/categories`     |Update monthly category allocations                              |
|GET   |`/summary/home`          |Home screen payload: pocket money, weekly remaining, visual state|
|GET   |`/summary/weekly`        |Weekly breakdown with daily spending and trends                  |
|POST  |`/expected-payments`     |Create an expected payment                                       |
|PATCH |`/expected-payments/:id` |Update or delete an expected payment                             |
|GET   |`/expected-payments`     |List expected payments for current month                         |
|POST  |`/assistant/chat`        |AI assistant conversation endpoint                               |
|PUT   |`/settings/notifications`|Update notification preferences and thresholds                   |
|PUT   |`/settings/push-token`   |Register/update Expo push notification token                     |

-----

## Database Schema

PostgreSQL via Supabase. Row Level Security (RLS) is enabled on all tables, ensuring users can only access their own data.

### `users`

|Column        |Type       |Notes                                   |
|--------------|-----------|----------------------------------------|
|id            |UUID (PK)  |Supabase auth.users reference           |
|email         |TEXT       |User email                              |
|push_token    |TEXT       |Expo push notification token            |
|last_synced_at|TIMESTAMPTZ|Last bank sync time (cooldown reference)|
|created_at    |TIMESTAMPTZ|Account creation date                   |

### `bank_connections`

|Column         |Type       |Notes                                  |
|---------------|-----------|---------------------------------------|
|id             |UUID (PK)  |Primary key                            |
|user_id        |UUID (FK)  |References users.id                    |
|aggregator_ref |TEXT       |Neonomics consent/session reference    |
|bank_name      |TEXT       |e.g., "SpareBank 1 SR-Bank"            |
|account_iban   |TEXT       |Connected account identifier           |
|connected_at   |TIMESTAMPTZ|Connection date                        |
|consent_expires|TIMESTAMPTZ|PSD2 consent expiry (90 days typically)|

### `categories`

|Column    |Type     |Notes                               |
|----------|---------|------------------------------------|
|id        |UUID (PK)|Primary key                         |
|user_id   |UUID (FK)|References users.id                 |
|name      |TEXT     |Display name (e.g., "Groceries")    |
|type      |ENUM     |'fixed', 'variable', 'discretionary'|
|color     |TEXT     |Hex color for UI display            |
|icon      |TEXT     |Icon identifier for UI              |
|sort_order|INT      |Display order in lists              |

### `transactions`

|Column             |Type       |Notes                                          |
|-------------------|-----------|-----------------------------------------------|
|id                 |UUID (PK)  |Primary key                                    |
|user_id            |UUID (FK)  |References users.id                            |
|external_id        |TEXT       |Bank transaction ID (deduplication key)        |
|amount             |DECIMAL    |Transaction amount (negative = expense)        |
|merchant_name      |TEXT       |Cleaned merchant name from bank                |
|raw_description    |TEXT       |Full original transaction text                 |
|category_id        |UUID (FK)  |References categories.id                       |
|is_recurring       |BOOLEAN    |AI-detected or user-flagged recurring charge   |
|ai_confidence      |DECIMAL    |0.0–1.0 confidence score from AI categorization|
|manually_edited    |BOOLEAN    |True if user overrode AI category              |
|expected_payment_id|UUID (FK)  |References expected_payments.id if reconciled  |
|transaction_date   |DATE       |Date the transaction occurred                  |
|synced_at          |TIMESTAMPTZ|When this was fetched from the bank            |

### `budgets`

|Column           |Type     |Notes                                       |
|-----------------|---------|--------------------------------------------|
|id               |UUID (PK)|Primary key                                 |
|user_id          |UUID (FK)|References users.id                         |
|month            |DATE     |First day of budget month (e.g., 2026-03-01)|
|total_income     |DECIMAL  |Expected monthly income                     |
|total_fixed_costs|DECIMAL  |Sum of fixed category allocations           |

### `category_budgets`

|Column          |Type     |Notes                           |
|----------------|---------|--------------------------------|
|id              |UUID (PK)|Primary key                     |
|budget_id       |UUID (FK)|References budgets.id           |
|category_id     |UUID (FK)|References categories.id        |
|allocated_amount|DECIMAL  |Monthly budget for this category|

### `merchant_mappings`

> **Key Table:** This is the most important table for personalization. When a user recategorizes a transaction, the merchant pattern is stored here. All future transactions matching that pattern skip AI categorization entirely. This is what makes the app learn and feel personal over time.

|Column          |Type       |Notes                               |
|----------------|-----------|------------------------------------|
|id              |UUID (PK)  |Primary key                         |
|user_id         |UUID (FK)  |References users.id                 |
|merchant_pattern|TEXT       |Pattern to match (e.g., "REMA 1000")|
|category_id     |UUID (FK)  |Category to assign on match         |
|created_at      |TIMESTAMPTZ|When this mapping was created       |

### `expected_payments`

|Column               |Type       |Notes                                         |
|---------------------|-----------|----------------------------------------------|
|id                   |UUID (PK)  |Primary key                                   |
|user_id              |UUID (FK)  |References users.id                           |
|description          |TEXT       |Human-readable label (e.g., "Power bill")     |
|amount               |DECIMAL    |Expected charge amount                        |
|category_id          |UUID (FK)  |Which envelope this belongs to                |
|expected_date        |DATE       |When the charge is expected to hit            |
|is_recurring         |BOOLEAN    |If true, auto-recreate for next month         |
|status               |ENUM       |'pending', 'fulfilled', 'overdue', 'cancelled'|
|actual_transaction_id|UUID (FK)  |References transactions.id when reconciled    |
|reconciled_at        |TIMESTAMPTZ|When the actual transaction was matched       |
|created_by           |ENUM       |'user', 'ai_assistant', 'system'              |
|created_at           |TIMESTAMPTZ|When this expected payment was created        |

-----

## AI Categorization (Daily Job)

### Prompt Strategy

The categorization prompt includes the user's category names and descriptions, any existing merchant mappings (as learning examples), and the batch of new transactions. The AI returns structured JSON.

**System prompt:** "You are a financial transaction categorizer for a Norwegian bank account. Categorize each transaction into exactly one of the provided categories. Return JSON only."

**User message includes:** categories with descriptions, known merchant mappings as reference examples, and the array of new transactions (amount, merchant_name, raw_description, date).

### Expected Response Format

```json
[
  {
    "external_id": "txn_abc123",
    "category_id": "cat_2",
    "confidence": 0.95,
    "is_recurring": false,
    "reasoning": null
  },
  {
    "external_id": "txn_def456",
    "category_id": "cat_4",
    "confidence": 0.62,
    "is_recurring": false,
    "reasoning": "Merchant name unclear — 'BGN CAFE AS' could be food or groceries"
  }
]
```

### Fallback Handling

- Transactions with confidence below 0.7 are flagged for user review in the app
- If the AI API is unavailable, transactions are stored as "uncategorized" and queued for the next run
- Merchant mappings always take priority — AI is only called for unmapped merchants

-----

## Notification System

|Trigger                    |Timing      |Content Example                                                                           |
|---------------------------|------------|------------------------------------------------------------------------------------------|
|Morning Briefing           |08:00 daily |"You have 487 kr left this week (3 days to go). You're on track."                         |
|Transaction Alert          |On sync     |"Meny Bergen: -342 kr (Groceries). Pocket money this week: 645 kr"                        |
|25% Warning                |On sync     |"Heads up — you've used 75% of this week's pocket money with 3 days left"                 |
|10% Critical               |On sync     |"Only 97 kr left for pocket money this week. Consider holding off on non-essentials"      |
|Weekly Summary             |Sunday 20:00|"This week: spent 3,420 kr. Pocket money: 870/1,000 kr used. 2 new subscriptions detected"|
|New Recurring              |On detection|"New recurring charge detected: Netflix 159 kr/month. Categorized as Subscriptions"       |
|Budget Reset               |1st of month|"New month! Your budgets have been reset. Monthly pocket money: 4,000 kr"                 |
|Expected Payment Reconciled|On sync     |"Power bill arrived: 1,650 kr (expected 1,500 kr). Essentials adjusted by +150 kr"        |
|Expected Payment Overdue   |Daily check |"Expected payment 'Power bill' (1,500 kr) is 3 days overdue. Still expecting it?"         |

-----

## Key Screens

### Home Screen

The primary screen on every app open. Designed for instant comprehension.

- Large pocket money number (remaining for the week) — the hero element
- Circular progress ring around the number, color-coded: green (>50%), yellow (25–50%), red (<25%)
- Secondary line: "X kr per day for the next Y days"
- Quick summary cards: week spending vs target, month spending vs target
- Recent transactions list (last 5, tappable for detail)
- Contextual AI quick actions based on current state

### Transactions Screen

- Full scrollable list grouped by date
- Each row: merchant name, category badge (color), amount
- Swipe right to recategorize (opens category picker)
- Tap for detail: full description, category, recurring toggle, notes
- Filter bar: by category, date range, search by merchant
- Items flagged for review (low AI confidence) shown with a subtle indicator
- AI quick actions: "What is this?", "Recategorize"

### Budget Screen

- Monthly overview with all category envelopes
- Each category shows: allocated amount, spent, remaining, progress bar
- Expected payments section showing pending upcoming charges
- Weekly breakdown toggle — see the month divided into weeks
- Tap a category to see its transactions for the month
- Edit mode to reallocate between categories mid-month
- AI quick actions: "Adjust this budget", "Reallocate surplus"

### AI Assistant (Chat Tab)

- Suggested quick action buttons at top (rotating based on budget state)
- Text input for free conversation
- Conversation displays messages and confirmation cards for actions taken
- Each action card includes: description of change, before/after numbers, undo button
- Screen context indicator showing which screen the user came from (if via quick action)

### Onboarding Flow

1. Welcome screen explaining the concept
1. Connect bank account via Neonomics BankID flow
1. Set monthly income
1. Review AI-suggested fixed costs (from initial transaction scan)
1. Allocate remaining income across variable categories
1. Set pocket money amount
1. Configure notification preferences
1. Done — home screen with initial data

-----

## Security Considerations

- All bank data is accessed read-only via PSD2 AISP scope — the app cannot initiate payments or transfers
- Supabase Row Level Security (RLS) ensures complete data isolation between users
- Bank connection consent is managed by Neonomics and requires BankID authentication — the app never handles bank credentials directly
- PSD2 consent expires every 90 days — the app prompts re-authentication before expiry
- JWT tokens from Supabase Auth secure all API endpoints
- Transaction data and merchant mappings are stored in Supabase's managed PostgreSQL with encryption at rest
- The AI categorization prompt never includes account numbers or balances — only transaction descriptions and amounts
- The AI assistant operates through defined tools only — it cannot execute arbitrary database operations
- All AI tool actions are logged for audit and undo support

-----

## Development Roadmap

### Phase 1 — Foundation (Weeks 1–3)

Get the basic app running with manual data entry. No bank connection yet.

- Expo project setup with Expo Router, Zustand, and base UI components
- Supabase project setup: auth, database schema, RLS policies
- Home screen with pocket money display (static/manual data)
- Budget setup flow: income, categories, allocations
- Transaction list with manual add/edit/categorize

### Phase 2 — AI Brain (Weeks 4–5)

Add the intelligence layer. Still manual transaction input but AI helps categorize.

- Claude API integration for batch categorization
- Merchant mapping system (corrections persist)
- Budget calculation engine: weekly targets, daily amounts, rolling surplus
- Low-confidence flagging and review UI

### Phase 3 — Bank Connection (Weeks 6–8)

Connect to real bank data. This is where the app becomes truly useful.

- Neonomics integration: BankID auth flow, transaction fetching
- Daily cron sync job via Supabase Edge Functions
- On-demand sync with 15-minute cooldown logic
- Deduplication and incremental sync
- Onboarding flow with bank connection step

### Phase 4 — Expected Payments & AI Assistant (Weeks 9–11)

The smart layer that makes budget management conversational.

- Expected payments: create, track, reconcile against real transactions
- AI assistant backend: tool-use pattern with Claude API
- Chat UI in dedicated tab with message history (session-scoped)
- Contextual quick actions on Home, Transactions, and Budget screens
- Guardrails: validation rules, confirmation steps, undo support

### Phase 5 — Notifications & Polish (Weeks 12–14)

The gatekeeper comes alive. This is where behavioral change starts.

- Expo Push Notifications setup
- Morning briefing, transaction alerts, threshold warnings
- Weekly summary generation
- Expected payment reconciliation notifications
- Visual polish: animations, color transitions on budget ring, haptic feedback
- Settings screen for notification preferences

### Phase 6 — Refinement & Launch (Weeks 15+)

- TestFlight beta distribution
- AI accuracy tuning based on real transaction data
- Performance optimization (sync speed, app launch time)
- App Store submission
- Monitoring, error tracking, analytics setup

-----

## Future Considerations (Post-V1)

- Savings goals and visual progress tracking
- "Strict mode" with commitment device (cooling-off period for budget overrides)
- Spending insights and trends over multiple months
- Shared household budgets
- Export and reporting functionality
- Home screen widget showing pocket money at a glance
- AI conversation history across sessions for richer context
- Voice input for AI assistant
