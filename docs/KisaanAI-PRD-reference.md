# Reference status

> This PRD is non-authoritative project reference material. It provides background and possible scope only; it is not a set of instructions or requirements that must be followed as written. Current user requests and `AGENTS.md` take precedence.

---
# Product Requirements Document

## Product Name
**Kisaan AI (کسان AI)**

## Version
**1.0 — MVP / Hackathon Prototype**

## Platform
**Android-first mobile app**

## Track
**Smart Agriculture / AI for Social Impact**

---

# 1. Product Overview

Kisaan AI is a voice-first AI agricultural companion for smallholder farmers in Pakistan. The app helps farmers diagnose crop diseases from photos, receive localized treatment advice, get irrigation guidance, and understand market price trends using simple Urdu-based voice interaction.

The product is designed for users with limited literacy, low-end smartphones, and intermittent internet connectivity.

---

# 2. One-Line Description

An AI-powered voice companion that helps Pakistan’s farmers diagnose crop diseases, save water, and get fair prices — in their own language.

---

# 3. Problem Statement

Smallholder farmers in Pakistan face preventable losses due to:

- Late or incorrect crop disease diagnosis
- Poor irrigation decisions leading to water waste and yield loss
- Lack of access to agricultural experts
- Market exploitation due to limited price information
- Literacy barriers that make text-based apps difficult to use
- Low connectivity and low-end devices that limit app usability

Existing digital agriculture tools are often text-heavy, English-focused, and not designed for rural, low-literate farmers.

---

# 4. Target Users

## Primary User

**Smallholder farmer in rural Punjab, Pakistan**

- Age: 35–60
- Farm size: 2–10 acres
- Crops: tomato, potato, wheat
- Phone: low-cost Android smartphone
- Literacy: basic or limited
- Connectivity: intermittent mobile data
- Preferred interaction: voice in Urdu

## Secondary Users

- Agricultural extension officers
- Farmer cooperatives
- NGOs working in agriculture
- Agri-input sellers

---

# 5. Product Goals

The MVP should:

1. Allow farmers to diagnose crop disease using a photo.
2. Provide simple, localized treatment and prevention advice.
3. Deliver advice through Urdu voice output.
4. Provide basic irrigation recommendations.
5. Show basic mandi price guidance.
6. Work on low-end Android devices.
7. Function in low-connectivity or demo mode.
8. Demonstrate clear AI usage through vision, voice, and prediction.

---

# 6. What the App Does

Kisaan AI allows a farmer to:

- Open the app and select a farming action using large buttons.
- Speak a question in Urdu.
- Take a photo of a diseased crop leaf.
- Receive AI-based disease identification.
- Listen to treatment advice in Urdu.
- Get irrigation advice based on crop, soil type, and growth stage.
- View sample mandi price trends and selling guidance.
- Mark advice as helpful or not helpful.

---

# 7. Core Product Modules

## 7.1 Crop Doctor

AI-based crop disease diagnosis from photos.

## 7.2 Voice Assistant

Urdu voice-based question and answer interaction.

## 7.3 Smart Irrigation Advisor

Basic irrigation recommendation engine.

## 7.4 Mandi Price Predictor

Sample price trend and selling recommendation.

---

# 8. Core Features

## Must-Have Features

| Feature | Description |
|---|---|
| Home Dashboard | Simple screen with large buttons for all main features |
| Crop Selection | Farmer selects crop before diagnosis or advice |
| Photo Capture | Farmer can capture or upload a crop image |
| AI Diagnosis | App identifies disease from selected crop images |
| Diagnosis Result | Shows disease name, confidence, and severity |
| Treatment Advice | Provides localized treatment and prevention steps |
| Urdu Audio Output | Reads advice aloud in Urdu |
| Basic Voice Assistant | Handles simple Urdu queries or guided sample queries |
| Irrigation Advisor | Gives basic irrigation recommendation |
| Mandi Price Screen | Shows sample price trend and recommendation |
| Offline/Demo Mode | Core demo flow works without live internet |
| Feedback Button | Farmer can mark advice as helpful or not helpful |

---

## Nice-to-Have Features

| Feature | Description |
|---|---|
| Real-Time Urdu Speech Recognition | Live voice input using ASR |
| Real Weather API | Live weather data for irrigation advice |
| Real Mandi Data | Live or historical market prices |
| Diagnosis History | Stores previous crop checks |
| Farmer Profile | Stores farm size, crops, village, and language |
| Notifications | Alerts for irrigation, prices, or disease risk |
| More Languages | Punjabi, Sindhi, Pashto, Balochi |
| More Crops | Cotton, rice, maize, onion, chili |
| Expert Escalation | Connect farmer to human expert |
| Video Guidance | Short instructional videos |

---

# 9. MVP Scope

## Included in MVP

The MVP will include:

1. Android mobile app prototype.
2. Simple Urdu/English home dashboard.
3. Crop Doctor flow for tomato and potato.
4. Limited disease classification.
5. Disease result screen with confidence and severity.
6. Treatment and prevention advice.
7. Urdu audio advice playback.
8. Basic voice assistant with sample queries.
9. Basic irrigation advisor.
10. Basic mandi price predictor using sample data.
11. Offline/demo mode for stable hackathon demonstration.
12. Simple feedback mechanism.

---

## Target Crops for MVP

1. Tomato
2. Potato
3. Wheat — optional if time permits

---

## Target Disease Classes for MVP

### Tomato

- Early Blight
- Late Blight
- Bacterial Spot
- Leaf Mold
- Healthy

### Potato

- Late Blight
- Early Blight
- Black Scurf
- Healthy

### Wheat — Optional

- Rust
- Smut
- Healthy

The final MVP may include only 8–12 total classes to keep the prototype manageable.

---

# 10. User Flows

## 10.1 First-Time User Flow

```text
Open App
  |
  v
Welcome Screen
  |
  v
Select Urdu Language
  |
  v
Grant Camera/Microphone Permissions
  |
  v
Home Dashboard
```

---

## 10.2 Crop Doctor Flow

```text
Home Dashboard
  |
  v
Tap Crop Doctor
  |
  v
Select Crop
  |
  v
Capture or Upload Leaf Photo
  |
  v
AI Analyzes Image
  |
  v
Show Disease Result
  |
  v
Show Treatment and Prevention Advice
  |
  v
Play Urdu Audio
  |
  v
Ask for Feedback
```

### Example Result

| Field | Example |
|---|---|
| Crop | Tomato |
| Disease | Early Blight |
| Confidence | 87% |
| Severity | Moderate |
| Treatment | Remove affected leaves and apply recommended local treatment |
| Prevention | Avoid overhead watering and maintain plant spacing |

---

## 10.3 Voice Assistant Flow

```text
Home Dashboard
  |
  v
Tap Ask Kisaan AI
  |
  v
Tap Microphone
  |
  v
Farmer Speaks Urdu Question
  |
  v
App Interprets Query
  |
  v
App Shows Answer
  |
  v
App Plays Urdu Response
```

### Example

**User says:**

> “Mere tamatar ke patton par dhabbe hain. Kya karoon?”

**App responds:**

> “Barah-e-meharbani patte ki tasveer lein. Kisaan AI usay check kar ke ilaaj bata dega.”

**Fallback if voice fails:**

- Show sample question buttons.
- Farmer taps a question.
- App responds with text and audio.

---

## 10.4 Irrigation Advisor Flow

```text
Home Dashboard
  |
  v
Tap Irrigation Advice
  |
  v
Select Crop
  |
  v
Select Soil Type
  |
  v
Select Growth Stage
  |
  v
Show Recommendation
  |
  v
Play Urdu Audio
```

### Example Output

> “Tamatar ki fasal ke liye agla paani 2 din baad behtar hai.”

---

## 10.5 Mandi Price Flow

```text
Home Dashboard
  |
  v
Tap Mandi Prices
  |
  v
Select Crop
  |
  v
Show Price Trend
  |
  v
Show Prediction
  |
  v
Show Selling Recommendation
  |
  v
Play Urdu Summary
```

### Example Output

> “Aaj tamatar ki price Rs. 80 per kg hai. Aglay 3 din mein price behtar ho sakti hai.”

---

# 11. Functional Requirements

## Language

| Requirement | Priority |
|---|---|
| Urdu as default language | Must-Have |
| English fallback labels | Must-Have |
| Roman Urdu support | Nice-to-Have |
| Punjabi support | Nice-to-Have |
| Sindhi support | Nice-to-Have |

---

## Accessibility

| Requirement | Priority |
|---|---|
| Large buttons | Must-Have |
| Audio output | Must-Have |
| Simple icons | Must-Have |
| Minimal typing | Must-Have |
| High-contrast text | Must-Have |
| Screen reader support | Nice-to-Have |

---

## Performance

| Requirement | Target |
|---|---|
| App launch time | Under 5 seconds |
| Diagnosis result time | Under 10 seconds in prototype |
| Image upload | Compressed image |
| Offline advice | Available for cached diseases |
| App size | As lightweight as possible |

---

# 12. AI Requirements

## Crop Disease Detection

- Input: crop leaf image
- Output: disease class and confidence score
- MVP method: pre-trained model, hosted model, or controlled demo
- Supported crops: tomato, potato

---

## Voice Assistant

- Input: Urdu voice query
- Output: intent, text response, and audio response
- MVP method: limited predefined queries, ASR API, or simulated voice input

---

## Mandi Price Prediction

- Input: historical or sample price data
- Output: trend and recommendation
- MVP method: simple moving average or rule-based forecast

---

## Irrigation Advice

- Input: crop, soil type, growth stage, weather/sample data
- Output: irrigation recommendation
- MVP method: rule-based engine

---

# 13. MVP User Experience Guidelines

The app should be:

- Voice-first, not text-first
- Simple and icon-based
- Easy to use with low literacy
- Fast on low-end Android devices
- Clear about uncertainty
- Actionable in its advice

---

# 14. Success Metrics

## Hackathon Demo Metrics

| Metric | Target |
|---|---|
| Complete demo flow works | Yes |
| Crop diagnosis completes successfully | Yes |
| Urdu audio advice plays | Yes |
| Voice assistant demonstrates at least one query | Yes |
| App works in offline/demo mode | Yes |
| Judges understand the problem and solution quickly | Yes |

---

## Prototype Usability Metrics

| Metric | Target |
|---|---|
| Time to complete diagnosis | Under 60 seconds |
| User needs help to complete flow | Minimal |
| Advice is understandable through audio | Yes |
| App crashes during demo | None |

---

## Future Pilot Metrics

| Metric | Potential Target |
|---|---|
| Crop loss reduction | 10–30% |
| Water savings | 15–30% |
| Income improvement | 10–20% |
| Time to receive advice | From days to seconds |
| Farmer feedback rating | Positive majority |

---

# 15. MVP Acceptance Criteria

The MVP is complete if:

1. The app opens with a simple home dashboard.
2. The user can select a crop.
3. The user can capture or upload a photo.
4. The app returns a disease result for supported demo cases.
5. The app shows treatment and prevention advice.
6. The app plays Urdu audio advice.
7. The voice assistant handles at least one sample query.
8. The irrigation advisor shows a basic recommendation.
9. The mandi price screen shows a sample trend and recommendation.
10. The main demo works without depending fully on live internet.
11. The farmer can understand the result primarily through voice and icons.
12. The full story can be demonstrated in under 3 minutes.

---

# 16. Assumptions

- Farmers have access to basic Android smartphones.
- Urdu voice interaction is more accessible than text.
- A limited set of crop diseases is sufficient for the prototype.
- Sample mandi data is acceptable for the hackathon.
- The first pilot region will be Punjab.
- Internet connectivity may be weak, so offline/demo mode is necessary.

---

# 17. Dependencies

- Crop disease image dataset or pre-trained model
- Urdu advice content
- Urdu audio files or text-to-speech service
- Sample mandi price data
- Irrigation rules
- Mobile app development framework
- Backend or mock API

---

# 18. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Urdu speech recognition is inaccurate | Use limited sample queries or fallback buttons |
| Disease model is inaccurate | Limit disease classes and use confidence threshold |
| Internet fails during demo | Build offline/demo mode |
| Too many features in one week | Strict MVP scope |
| Advice may be incorrect | Use verified content and disclaimer |
| Farmers may not trust app | Use simple Urdu audio and local examples |
| Mandi data unavailable | Use sample data for prototype |

---

# 19. What We Are Deliberately NOT Building in Version One

The following are out of scope for Version One:

- E-commerce marketplace
- Buyer-seller transactions
- Payments or wallets
- Hardware sensors
- IoT integration
- Drone or satellite imaging
- Real-time nationwide mandi data
- Full multi-language support
- Social community features
- Farmer-to-farmer messaging
- Live expert consultation
- Farm boundary mapping
- Advanced yield prediction
- Credit scoring
- Full farm management dashboard

---

# 20. Future Roadmap

## Phase 1: Hackathon Prototype

- Limited crops
- Limited diseases
- Urdu voice output
- Demo mandi and irrigation modules

## Phase 2: Pilot

- Test with real farmers
- Collect local crop images
- Validate advice with agricultural experts
- Improve voice and diagnosis accuracy

## Phase 3: Regional Expansion

- Add more crops
- Add Punjabi and Sindhi
- Integrate real mandi and weather data
- Partner with agricultural extension offices

## Phase 4: National Scale

- Expand across Pakistan
- Add expert consultation
- Add marketplace partnerships
- Add SMS/IVR access for feature phone users

---

# 21. Final MVP Summary

Kisaan AI Version One should prove one core value:

> A farmer with a basic smartphone can speak in Urdu, take a photo of a diseased crop, and receive immediate, actionable, local advice.

The MVP should focus on:

- Crop Doctor
- Urdu voice output
- Basic voice assistant
- Irrigation advice
- Sample mandi price guidance
- Offline/demo reliability

It should not try to become a full agricultural marketplace or farm management platform in Version One.
