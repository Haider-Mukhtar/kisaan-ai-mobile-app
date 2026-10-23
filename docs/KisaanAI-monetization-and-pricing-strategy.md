# KisaanAI Monetization and Pricing Strategy

*Prepared 23 October 2026. All vendor prices, exchange rates, taxes, and app-store fees are planning assumptions rather than quotes. Recalculate the model using production billing data before launch.*

## Executive recommendation

Use a three-tier model:

| Plan | Monthly | Annual | Audience |
|---|---:|---:|---|
| **Free** | PKR 0 | PKR 0 | Acquisition and essential farmer utility |
| **Kisaan Plus** | **PKR 499** | **PKR 4,990** | Individual smallholder farmers |
| **Kisaan Pro** | **PKR 1,499** | **PKR 14,990** | Progressive farmers, farm managers, and advisers |

Annual pricing gives approximately two months free. At the proposed quotas, estimated subscription gross margins remain around 62-70% after a conservative 20% allowance for store commission, tax, foreign-exchange, and refund leakage.

The economics require one important architecture change: routine text and photo requests should use a standard asynchronous Gemini Flash endpoint with on-device text-to-speech. The expensive Gemini Live audio connection should be reserved for metered real-time voice sessions.

## 1. Product and customer definition

The current project targets rural Pakistani farmers, typically smallholders using low-end Android phones, with limited literacy and unreliable connectivity.

Relevant technology and cost drivers identified in the project include:

- `gemini-3.1-flash-live-preview` over a bidirectional WebSocket.
- Live microphone input and model-generated audio.
- Image-based crop diagnosis.
- Qwen3 0.6B on-device model through ExecuTorch.
- Approximately 400 MB initial offline-model download.
- Supabase authentication, profiles, storage, weather caching, and RLS.
- Open-Meteo weather data.
- IR Farm mandi-price and article scraping.
- Device-based text-to-speech through `expo-speech`.
- Demo OTP that must eventually be replaced with real SMS authentication.

Vector search, cloud push notifications, production SMS, subscriptions, and payment libraries are not currently implemented.

## 2. Cost-model assumptions

These are planning estimates, not vendor quotes. Replace them with actual billing-console data before launch.

- Planning exchange rate: **USD 1 = PKR 280**.
- Store and payment deduction reserve: **20% of customer price**.
  - Approximately 15% store commission when eligible.
  - An additional 5% buffer for taxes, FX conversion, refunds, and leakage.
- AI responses are concise, following the current 3-6 sentence system prompt.
- Weather and mandi requests are cached and shared by district.
- SMS sessions persist, avoiding an OTP on every app opening.

### Per-operation cost matrix

| Cost driver | Estimated unit cost | Planning cost |
|---|---:|---:|
| Standard cloud text response | $0.001-$0.004 | PKR 0.3-1.1; budget **PKR 0.60** |
| Photo diagnosis through standard vision API | $0.004-$0.015 | PKR 1.1-4.2; budget **PKR 3** |
| Gemini Live two-way audio | $0.025-$0.050/minute | PKR 7-14; budget **PKR 9/minute** |
| Offline Qwen inference | No cloud inference | Near zero |
| Offline-model delivery | $0.03-$0.07/download | PKR 8-20 one-time |
| SMS OTP | Approximately $0.01-$0.025 | PKR 3-7 per event |
| Supabase DB/auth/storage | Base plan plus overages | PKR 2-10 per MAU |
| Secure AI proxy/edge functions | Usage dependent | PKR 1-8 per paid MAU |
| FCM/APNs push | Normally no message charge | Near zero |
| Open-Meteo | Prototype may be free | Reserve PKR 0-5/MAU for commercial terms |
| Mandi/content ingestion | Low compute cost | PKR 1-5/MAU, excluding licensing |
| Vector search, if introduced | $0.001-$0.005/query | PKR 0.3-1.4/query |

### Important architectural cost issue

The current Live service returns audio even for typed or image turns. A 15-30 second audio answer can cost materially more than generating text and reading it through the phone's built-in TTS.

Recommended routing:

```text
Offline question
    -> On-device Qwen: no inference charge

Typed question / photo
    -> Secure server -> standard Gemini Flash text
    -> Device TTS reads the answer

Real-time conversation
    -> Gemini Live
    -> Metered by live-audio minute
```

Without this routing change, the proposed affordable quotas will not reliably maintain a 60-70% margin.

## 3. Usage-credit model

Use a backend credit ledger so different AI modes consume cost proportionally.

| Activity | Credits |
|---|---:|
| One standard text question | 1 |
| One crop-photo diagnosis | 5 |
| One minute of Gemini Live voice | 15 |
| Offline Qwen question | 0 |
| Cached weather, mandi, alerts, and guides | 0 |

Credits should be explained in the interface as questions, photos, and voice minutes, not as an abstract token balance.

## 4. Recommended subscription tiers

### Feature matrix

| Feature | Free | Kisaan Plus | Kisaan Pro |
|---|---:|---:|---:|
| Price | PKR 0 | PKR 499/month | PKR 1,499/month |
| Annual price | - | PKR 4,990 | PKR 14,990 |
| Monthly cloud credits | 7 | 160 | 450 |
| Example text allowance | 3/month | 50/month | 150/month |
| Example photo allowance | 1/month | 10/month | 30/month |
| Example Live voice allowance | One-time two-minute trial | 4 minutes/month | 10 minutes/month |
| Offline Qwen questions | Unlimited | Unlimited | Unlimited |
| Weather and basic alerts | Included | Included | Included |
| Current mandi prices | Included | Included | Included |
| Price history | 7 days | 30 days | 90 days |
| Farm profiles | 1 | 1 | Up to 3 |
| Saved diagnosis history | Limited | Included | Included |
| Export/share case report | - | Basic | Advanced |
| Priority alerts | - | Included | Included |
| Support | Self-service | Standard | Priority |

The example allowances are one possible mix. A Plus subscriber could spend the same credits on more text and less voice.

### Free tier design

The Free tier should deliver genuine recurring value without becoming an unmetered cloud-AI product.

Include:

- Unlimited offline Qwen questions after download.
- Weather, alerts, mandi rates, crop guides, and cached content.
- Three cloud text questions and one photo diagnosis per month.
- One two-minute Live AI trial after onboarding.
- One farm profile.
- Basic seven-day price history.

Estimated cost:

- Steady-state active user: **PKR 5-8/month**.
- First month with model download and Live trial: approximately **PKR 25-45**.
- Dormant users generate almost no variable cost.

Do not automatically download the 400 MB model. Make it opt-in and recommend Wi-Fi.

### Kisaan Plus

Recommended price:

- **PKR 499/month**.
- **PKR 4,990/year**.
- Optional 90-day crop-season pass: **PKR 1,299**.

A representative monthly allocation is:

- 50 text questions.
- 10 photo diagnoses.
- 4 Live voice minutes.
- Unlimited offline advice.

Estimated maximum monthly COGS, including contingency: **PKR 125**.

### Kisaan Pro

Recommended price:

- **PKR 1,499/month**.
- **PKR 14,990/year**.

A representative monthly allocation is:

- 150 text questions.
- 30 photo diagnoses.
- 10 Live voice minutes.
- Three farm profiles.
- Longer market history.
- Advanced case export and priority alerts.
- Unlimited offline advice.

Estimated maximum monthly COGS, including contingency: **PKR 365**.

Human agronomist consultations should not be bundled as unlimited Pro benefits. Sell them separately or fund them through a partner because labor costs would materially change the margins.

## 5. Profitability validation

### Per-subscriber margins

A conservative 20% deduction is applied before calculating gross margin.

| Plan | Customer price | Net monthly receipt | Estimated COGS | Gross profit | Margin |
|---|---:|---:|---:|---:|---:|
| Plus monthly | PKR 499 | PKR 399 | PKR 125 | PKR 274 | **68.7%** |
| Plus annual, monthly equivalent | PKR 416 | PKR 333 | PKR 125 | PKR 208 | **62.4%** |
| Pro monthly | PKR 1,499 | PKR 1,199 | PKR 365 | PKR 834 | **69.6%** |
| Pro annual, monthly equivalent | PKR 1,249 | PKR 999 | PKR 365 | PKR 634 | **63.5%** |

Formula:

```text
Gross margin = (net receipt - variable COGS) / net receipt
```

### Example at 10,000 monthly active users

Assume:

- 500 Plus subscribers.
- 100 Pro subscribers.
- 9,400 Free users.
- 6% total paid conversion.
- PKR 30,000/month shared infrastructure.
- Monthly subscribers used for conservative revenue calculation.

| Item | Monthly amount |
|---|---:|
| Gross subscription revenue | PKR 399,400 |
| Net after 20% deduction | PKR 319,520 |
| Plus COGS | PKR 62,500 |
| Pro COGS | PKR 36,500 |
| Free-user COGS | PKR 65,800 |
| Shared infrastructure | PKR 30,000 |
| Contribution after platform costs | **PKR 124,720** |

The paid product produces approximately a 69% gross margin. After subsidizing Free users and shared infrastructure, the blended contribution margin is approximately 39%.

At this scale, core platform breakeven occurs at roughly **3-4% paid conversion**, depending on monthly versus annual-plan mix.

This excludes:

- Employee salaries.
- Paid acquisition.
- Agronomist labor.
- Customer support.
- Licensed market data.
- Legal and compliance expenses.
- Office and corporate overhead.

Those costs must be included when calculating company-level breakeven.

## 6. Overage and abuse guardrails

### Credit packs

Sell overages through the same billing platform as the subscription.

| Pack | Price | Approximate net receipt | Maximum estimated COGS | Margin |
|---|---:|---:|---:|---:|
| 100 credits | PKR 249 | PKR 199 | PKR 75 | Approximately 62% |
| 300 credits | PKR 699 | PKR 559 | PKR 225 | Approximately 60% |

Subscription credits should reset monthly. Optionally roll over no more than 25% for one month. Purchased packs can remain valid for 12 months or longer where consumer law requires it.

### Technical controls

Implement:

- Server-side entitlement and credit checks.
- Maximum Live session length of 5-10 minutes.
- Per-hour and per-day request limits.
- Image compression before upload.
- Maximum image count and file size.
- Maximum response-token limits.
- Short, agriculture-only prompts.
- Semantic caching for common weather and agronomy questions.
- District-level weather and mandi caching.
- Play Integrity and Apple App Attest/DeviceCheck.
- Phone, account, device, and IP abuse signals.
- Concurrent-session limits.
- Per-user daily cost circuit breakers.
- Automatic downgrade from Live audio to standard text when a cost ceiling is reached.
- Administrative kill switches by model, feature, or region.

Do not rely on limits implemented only in the mobile client.

## 7. Payment implementation

### Google Play

Use Google Play Billing for subscriptions and digital credit packs distributed inside the Android app.

Recommended products:

- `kisaan_plus_monthly`.
- `kisaan_plus_annual`.
- `kisaan_pro_monthly`.
- `kisaan_pro_annual`.
- `kisaan_credits_100`.
- `kisaan_credits_300`.

Implement:

- Server-side purchase verification.
- Real-time Developer Notifications.
- Grace periods and account holds.
- Restore-purchase handling.
- Refund and chargeback entitlement reversal.
- Eligibility for Google's applicable 15% service-fee tier.

### Apple App Store

Use StoreKit 2 and auto-renewable subscription groups.

Implement:

- App Store Server API verification.
- App Store Server Notifications V2.
- Family sharing only if intentionally supported.
- Grace periods and billing-retry state.
- Restore purchases.
- Eligibility for the App Store Small Business Program where applicable.

### RevenueCat option

RevenueCat is a practical early-stage choice for synchronizing Android and iOS entitlements and handling receipt edge cases.

Advantages:

- Faster implementation.
- Unified subscriber records.
- Easier trials, offers, and analytics.
- Less billing-specific backend work.

Tradeoff:

- Additional platform cost once revenue exceeds its free allowance.

Regardless of whether RevenueCat is used, the KisaanAI backend, not the device, should remain the source of truth for usage credits.

### JazzCash, Easypaisa, and local gateways

Local payment options are valuable for:

- A web subscription portal.
- Cooperative or dealer bulk purchases.
- NGO-sponsored farmer access.
- B2B invoices.
- Voucher or prepaid-code distribution.
- Physical goods and offline services.

Potential providers include JazzCash, Easypaisa, PayFast, and Safepay, subject to merchant approval and current fees.

Do not use a local web checkout inside the mobile app to bypass mandatory Play Store or App Store billing for digital subscriptions. External purchase links and steering rules differ by store and region and must be reviewed before implementation.

A useful rural distribution model is:

1. A cooperative, dealer, NGO, or extension program buys access in bulk.
2. Farmers receive a phone-number-bound voucher.
3. The backend grants a time-limited Plus entitlement.
4. Agronomic recommendations remain neutral and are not influenced by the sponsor.

## 8. Required implementation changes

Before monetization, prioritize:

1. Replace the public Gemini API key with a secure backend AI gateway.
2. Split standard text/photo inference from Live audio.
3. Replace demo OTP with production phone verification.
4. Add a server-side entitlement and credit ledger.
5. Add Play/App Store receipt verification.
6. Instrument cost per request, user, plan, and feature.
7. Add remote configuration for quotas and model routing.
8. Review Open-Meteo commercial terms and mandi-data licensing.
9. Replace the preview Gemini model with a production model or maintain a remotely configurable fallback.
10. Build subscription-expiry behavior that never removes offline safety information or already-downloaded farmer data.

## 9. Pricing principles

- Keep weather warnings, essential safety guidance, mandi prices, and offline advice free.
- Charge primarily for expensive cloud intelligence, convenience, history, and multi-farm capabilities.
- Never advertise unlimited Live AI.
- Offer a crop-season pass because farmers often budget seasonally rather than monthly.
- Use sponsored plans and bulk vouchers to reach farmers who cannot maintain a subscription.
- Recalculate COGS monthly and trigger a pricing review if paid-plan gross margin falls below 60%.
- Test **PKR 399 introductory pricing versus PKR 499 standard pricing**, but do not permanently price below the unit-economic floor.
