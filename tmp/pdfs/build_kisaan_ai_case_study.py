from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[2]
SCREENS = ROOT / "tmp/pdfs/screens"
WORK = ROOT / "tmp/pdfs/derived"
OUT = ROOT / "output/pdf/kisaan-ai-product-case-study.pdf"
WORK.mkdir(parents=True, exist_ok=True)
OUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = landscape(A4)
M = 36

GREEN = HexColor("#0B6B46")
MINT = HexColor("#65D9AD")
PALE = HexColor("#EAF8F1")
INK = HexColor("#15221C")
MUTED = HexColor("#607168")
LINE = HexColor("#DDE9E2")
CREAM = HexColor("#F7F6EF")
AMBER = HexColor("#F4B740")
RED = HexColor("#D9574E")
BLUE = HexColor("#3B82F6")

FONT_DIR = ROOT / "node_modules/@expo-google-fonts/inter"
pdfmetrics.registerFont(TTFont("Inter", str(FONT_DIR / "400Regular/Inter_400Regular.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Medium", str(FONT_DIR / "500Medium/Inter_500Medium.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Semi", str(FONT_DIR / "600SemiBold/Inter_600SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Bold", str(FONT_DIR / "700Bold/Inter_700Bold.ttf")))
pdfmetrics.registerFont(TTFont("Inter-Black", str(FONT_DIR / "900Black/Inter_900Black.ttf")))


def prep_images():
    src = Image.open(SCREENS / "profile-preferences.png").convert("RGB")
    draw = ImageDraw.Draw(src)
    draw.rounded_rectangle((335, 525, 710, 590), radius=22, fill=(249, 249, 249))
    src.save(WORK / "profile-sanitized.jpg", quality=94)

    hero = Image.open(ROOT / "assets/images/onboarding-farming-companion-realistic.png").convert("RGB")
    hero = ImageEnhance.Color(hero).enhance(0.85)
    hero = ImageEnhance.Contrast(hero).enhance(0.92)
    hero.save(WORK / "hero.jpg", quality=90)


def set_fill(c, color):
    c.setFillColor(color)


def rr(c, x, y, w, h, r=12, fill=white, stroke=None, sw=1):
    c.saveState()
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    else:
        c.setStrokeColor(fill)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1 if stroke else 0)
    c.restoreState()


def text(c, value, x, y, size=10, font="Inter", color=INK, max_width=None, leading=None):
    c.setFont(font, size)
    c.setFillColor(color)
    if max_width is None:
        c.drawString(x, y, value)
        return y
    if leading is None:
        leading = size * 1.35
    avg = max(size * 0.53, 1)
    lines = wrap(value, max(8, int(max_width / avg)), break_long_words=False)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def centered(c, value, x, y, size=10, font="Inter", color=INK):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(x, y, value)


def label(c, value, x, y, color=GREEN):
    text(c, value.upper(), x, y, 7.6, "Inter-Bold", color)


def title(c, value, subtitle=None, section=None, dark=False):
    fg = white if dark else INK
    muted = Color(1, 1, 1, 0.72) if dark else MUTED
    if section:
        label(c, section, M, PAGE_H - 38, MINT if dark else GREEN)
    text(c, value, M, PAGE_H - 68, 25, "Inter-Bold", fg)
    if subtitle:
        text(c, subtitle, M, PAGE_H - 88, 9.4, "Inter", muted, PAGE_W - 2 * M)


def footer(c, page_no, chapter=None, dark=False):
    color = Color(1, 1, 1, 0.62) if dark else MUTED
    c.setStrokeColor(Color(1, 1, 1, 0.15) if dark else LINE)
    c.setLineWidth(0.7)
    c.line(M, 22, PAGE_W - M, 22)
    text(c, "KISAAN AI  /  PRODUCT CASE STUDY", M, 10, 6.7, "Inter-Semi", color)
    if chapter:
        centered(c, chapter.upper(), PAGE_W / 2, 10, 6.7, "Inter-Semi", color)
    c.setFont("Inter-Semi", 7)
    c.setFillColor(color)
    c.drawRightString(PAGE_W - M, 10, f"{page_no:02d}")


def image_cover(c, path, x, y, w, h, radius=18, darken=0.0):
    img = Image.open(path).convert("RGB")
    target_ratio = w / h
    ratio = img.width / img.height
    if ratio > target_ratio:
        new_w = int(img.height * target_ratio)
        left = (img.width - new_w) // 2
        img = img.crop((left, 0, left + new_w, img.height))
    else:
        new_h = int(img.width / target_ratio)
        top = (img.height - new_h) // 2
        img = img.crop((0, top, img.width, top + new_h))
    if darken:
        overlay = Image.new("RGB", img.size, (0, 42, 28))
        img = Image.blend(img, overlay, darken)
    tmp = WORK / f"crop-{abs(hash((str(path), x, y, w, h, darken)))}.jpg"
    img.save(tmp, quality=90)
    c.saveState()
    p = c.beginPath()
    p.roundRect(x, y, w, h, radius)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(str(tmp), x, y, w, h, preserveAspectRatio=False, mask="auto")
    c.restoreState()


def phone(c, path, x, y, h=430, caption=None, bg=white):
    img = Image.open(path)
    ratio = img.width / img.height
    w = h * ratio
    shadow = Color(0, 0, 0, 0.12)
    rr(c, x + 5, y - 5, w + 12, h + 12, 22, shadow)
    rr(c, x, y, w + 12, h + 12, 22, HexColor("#111614"))
    c.saveState()
    p = c.beginPath()
    p.roundRect(x + 6, y + 6, w, h, 17)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(str(path), x + 6, y + 6, w, h, preserveAspectRatio=True, anchor="c", mask="auto")
    c.restoreState()
    if caption:
        centered(c, caption, x + w / 2 + 6, y - 15, 7.3, "Inter-Medium", MUTED)
    return w + 12


def bullet(c, x, y, heading, body, width, color=GREEN, icon=None):
    rr(c, x, y - 2, 20, 20, 7, color)
    centered(c, icon or "-", x + 10, y + 4, 8.5, "Inter-Bold", white)
    text(c, heading, x + 30, y + 9, 10, "Inter-Semi", INK)
    return text(c, body, x + 30, y - 6, 8, "Inter", MUTED, width - 30, 11.2) - 14


def stat(c, x, y, w, value, name, color=GREEN):
    rr(c, x, y, w, 58, 13, white, LINE)
    text(c, value, x + 14, y + 29, 20, "Inter-Bold", color)
    text(c, name, x + 14, y + 12, 7.7, "Inter-Medium", MUTED)


def callout(c, x, y, w, h, heading, body, fill=PALE, accent=GREEN, heading_color=INK, body_color=MUTED):
    rr(c, x, y, w, h, 13, fill)
    c.setFillColor(accent)
    c.roundRect(x, y, 5, h, 2.5, fill=1, stroke=0)
    text(c, heading, x + 16, y + h - 21, 9.7, "Inter-Semi", heading_color)
    text(c, body, x + 16, y + h - 38, 7.7, "Inter", body_color, w - 30, 10.5)


def page_cover(c, p):
    c.setFillColor(HexColor("#062F23"))
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    image_cover(c, WORK / "hero.jpg", PAGE_W * 0.47, 0, PAGE_W * 0.53, PAGE_H, 0, 0.28)
    c.setFillColor(Color(0.02, 0.18, 0.13, 0.50))
    c.rect(PAGE_W * 0.43, 0, PAGE_W * 0.57, PAGE_H, fill=1, stroke=0)
    label(c, "Voice-first farming companion", M, PAGE_H - 54, MINT)
    text(c, "Kisaan AI", M, PAGE_H - 115, 47, "Inter-Black", white)
    text(c, "Practical farm intelligence,", M, PAGE_H - 153, 22, "Inter-Semi", white)
    text(c, "online and off the grid.", M, PAGE_H - 182, 22, "Inter-Semi", MINT)
    text(c, "A product case study of the Expo mobile app for smallholder farmers in Pakistan.", M, PAGE_H - 222, 10, "Inter", Color(1, 1, 1, 0.78), 320, 15)
    rr(c, M, 72, 322, 92, 15, Color(1, 1, 1, 0.09), Color(1, 1, 1, 0.16))
    text(c, "THE PROMISE", M + 18, 142, 7.5, "Inter-Bold", MINT)
    text(c, "Weather, market prices, crop learning and AI guidance - together in the farmer's own language.", M + 18, 118, 11.5, "Inter-Semi", white, 285, 16)
    text(c, "Simulator walkthrough  |  8 September 2026", M, 44, 7.5, "Inter-Medium", Color(1, 1, 1, 0.60))


def page_problem(c, p):
    c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title(c, "The problem is not a lack of data. It is a lack of usable decisions.", "Smallholder farmers make time-sensitive choices while information is fragmented, technical, language-heavy, and often unavailable when connectivity drops.", "01  /  Opportunity")
    cols = [
        ("Disconnected signals", "Weather, crop symptoms, local prices and field context live in separate channels. Farmers must connect the dots themselves.", RED, "01"),
        ("Low-confidence advice", "A photo or generic answer can sound certain without acknowledging uncertainty, local conditions, or the need for verification.", AMBER, "02"),
        ("Connectivity gaps", "Live services are least reliable in the places where farm decisions are made. A useful assistant must degrade gracefully.", BLUE, "03"),
        ("Language and literacy", "Formal English and dense interfaces create friction. Farmers need simple wording, Urdu support, readable type and spoken output.", GREEN, "04"),
    ]
    x = M
    for heading, body, color, num in cols:
        rr(c, x, 198, 180, 210, 16, white, LINE)
        rr(c, x + 14, 362, 42, 28, 9, color)
        centered(c, num, x + 35, 371, 9, "Inter-Bold", white)
        text(c, heading, x + 14, 330, 12, "Inter-Semi", INK, 150, 16)
        text(c, body, x + 14, 292, 8.4, "Inter", MUTED, 150, 12)
        x += 190
    callout(c, M, 92, PAGE_W - 2 * M, 78, "Design challenge", "How might we turn live data, local context and AI into clear next actions - without excluding farmers who prefer Urdu, speech, or have no signal?", HexColor("#DFF4E9"), GREEN)
    footer(c, p, "Opportunity")


def page_solution(c, p):
    c.setFillColor(white); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title(c, "A single decision layer for the farmer's day", "Kisaan AI combines four practical jobs in one profile-aware, bilingual experience.", "02  /  Solution")
    phone(c, SCREENS / "home-dashboard.png", 55, 58, 420, "Personalized home dashboard")
    x = 280; y = 394
    items = [
        ("Ask", "Voice, text and crop photos connect the farmer to a live AI assistant with farm context.", GREEN, "AI"),
        ("Prepare", "Local forecast, a farming advisory and risk alerts turn weather into a next action.", BLUE, "WX"),
        ("Sell", "Daily mandi rates make price discovery searchable, bilingual and audible.", AMBER, "RS"),
        ("Keep working", "An on-device farm helper provides text guidance after a one-time model download.", RED, "OFF"),
    ]
    for i, item in enumerate(items):
        col = i % 2; row = i // 2
        bx = x + col * 242; by = y - row * 148
        rr(c, bx, by, 224, 126, 15, CREAM, LINE)
        rr(c, bx + 14, by + 82, 40, 28, 9, item[2])
        centered(c, item[3], bx + 34, by + 91, 7.5, "Inter-Bold", white)
        text(c, item[0], bx + 14, by + 57, 12, "Inter-Semi", INK)
        text(c, item[1], bx + 14, by + 37, 8, "Inter", MUTED, 194, 11)
    stat(c, 280, 78, 143, "4", "PRIMARY JOBS")
    stat(c, 435, 78, 143, "2", "LANGUAGES")
    stat(c, 590, 78, 143, "1", "SHARED FARM PROFILE")
    footer(c, p, "Solution")


def page_journey(c, p):
    c.setFillColor(HexColor("#082F24")); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title(c, "From first launch to a confident next action", "The experience captures only the context needed to personalize advice, then keeps the four daily jobs one tap away.", "03  /  Experience", dark=True)
    stages = [
        ("1", "Choose", "Language and appearance"),
        ("2", "Identify", "Phone sign-in"),
        ("3", "Describe", "Farm, crops and size"),
        ("4", "Locate", "GPS or district picker"),
        ("5", "Act", "Home, AI, Mandi, Profile"),
    ]
    y = 335; x0 = 48; gap = 150
    c.setStrokeColor(Color(0.4, 0.85, 0.68, 0.35)); c.setLineWidth(3)
    c.line(x0 + 22, y + 24, x0 + gap * 4 + 22, y + 24)
    for i, (num, head, body) in enumerate(stages):
        x = x0 + i * gap
        c.setFillColor(MINT); c.circle(x + 22, y + 24, 22, fill=1, stroke=0)
        centered(c, num, x + 22, y + 17, 12, "Inter-Bold", HexColor("#082F24"))
        text(c, head, x, y - 16, 11, "Inter-Semi", white)
        text(c, body, x, y - 34, 7.6, "Inter", Color(1, 1, 1, 0.68), 120, 10.5)
    callout(c, 48, 162, 226, 92, "Profile as the shared context", "The same crops, district, farm size and preferred language inform weather, alerts, AI prompts and settings.", Color(1, 1, 1, 0.08), MINT, white, Color(1, 1, 1, 0.72))
    callout(c, 291, 162, 226, 92, "Accessible interaction", "Large touch targets, bilingual labels, simple copy and text-to-speech reduce reading and navigation friction.", Color(1, 1, 1, 0.08), BLUE, white, Color(1, 1, 1, 0.72))
    callout(c, 534, 162, 226, 92, "Resilient by design", "Cached weather, prices and articles remain useful; the on-device helper covers farm Q&A without internet.", Color(1, 1, 1, 0.08), AMBER, white, Color(1, 1, 1, 0.72))
    footer(c, p, "Experience", dark=True)


def feature_page(c, p, section, heading, subtitle, shots, bullets, callout_data=None):
    c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title(c, heading, subtitle, section)
    sx = 42
    total_w = 0
    for path, caption in shots:
        total_w += phone(c, path, sx + total_w, 59, 395, caption) + 18
    x = max(382, sx + total_w + 8)
    y = 399
    width = PAGE_W - M - x
    for i, (head, body) in enumerate(bullets):
        y = bullet(c, x, y, head, body, width, [GREEN, BLUE, AMBER, RED][i % 4], f"{i+1}")
    if callout_data:
        h, b, col = callout_data
        callout(c, x, 72, width, 78, h, b, HexColor("#E2F5EB"), col)
    footer(c, p, section.split("/")[-1].strip())


def page_architecture(c, p):
    c.setFillColor(white); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title(c, "How the product turns signals into guidance", "Expo SDK 57 and React Native provide the mobile shell; providers coordinate shared farm context, network state and cached data.", "10  /  Product architecture")
    layers = [
        ("FARMER INPUT", ["Voice", "Text", "Crop photo", "Location", "Farm profile"], HexColor("#E4F7ED"), GREEN),
        ("APP LAYER", ["Expo Router", "English + Urdu", "Theme", "Network state", "Device cache"], HexColor("#E8F1FE"), BLUE),
        ("INTELLIGENCE", ["Gemini Live", "Qwen3 0.6B", "Weather rules", "Farmer context", "Safety prompt"], HexColor("#FFF4D8"), AMBER),
        ("DATA SERVICES", ["Open-Meteo", "IR Farm", "Supabase", "GPS/districts", "On-device TTS"], HexColor("#FCE8E6"), RED),
    ]
    y = 380
    for idx, (head, chips, fill, accent) in enumerate(layers):
        rr(c, 55, y, PAGE_W - 110, 58, 14, fill)
        rr(c, 70, y + 14, 116, 30, 9, accent)
        centered(c, head, 128, y + 24, 7.4, "Inter-Bold", white)
        cx = 205
        for chip in chips:
            cw = 84 if len(chip) < 12 else 102
            rr(c, cx, y + 13, cw, 32, 9, white, Color(0, 0, 0, 0.06))
            centered(c, chip, cx + cw / 2, y + 24, 7.2, "Inter-Medium", INK)
            cx += cw + 10
        if idx < len(layers) - 1:
            centered(c, "v", PAGE_W / 2, y - 14, 11, "Inter-Bold", MUTED)
        y -= 82
    stat(c, 55, 56, 215, "SDK 57", "EXPO + REACT NATIVE 0.86")
    stat(c, 283, 56, 215, "LOCAL-FIRST", "CACHE + ON-DEVICE MODEL")
    stat(c, 511, 56, 215, "CONTEXTUAL", "PROFILE + DISTRICT + RATES")
    footer(c, p, "Architecture")


def page_safety(c, p):
    c.setFillColor(CREAM); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    title(c, "Trust comes from clear boundaries", "The prototype already communicates uncertainty, but production readiness depends on stronger identity, secrets and service architecture.", "11  /  Safety and readiness")
    left = [
        ("Visible uncertainty", "The AI and offline helper warn that guidance can be wrong and important decisions should be checked locally."),
        ("Careful crop-photo framing", "Guidance describes visible symptoms and offers likely causes rather than claiming a certain diagnosis."),
        ("Weather risk, not disease proof", "Wet-weather disease alerts are presented as a risk signal, not a confirmed outbreak."),
        ("Graceful degradation", "Cached content and the offline helper keep the product useful when live services fail."),
    ]
    right = [
        ("Replace demo OTP", "Current prototype OTP is generated on-device. Production must use a real SMS verification flow."),
        ("Move secrets server-side", "Gemini credentials and scraping logic should not ship as production client wiring."),
        ("Validate sources and freshness", "Show timestamps, source attribution and failure states for prices, articles and forecasts."),
        ("Field-test language and advice", "Test Urdu, speech, comprehension and agricultural usefulness with farmers and local experts."),
    ]
    label(c, "Already designed in", 54, 399, GREEN)
    label(c, "Before production", 430, 399, RED)
    y = 363
    for i, item in enumerate(left):
        y = bullet(c, 54, y, item[0], item[1], 330, GREEN, str(i + 1))
    y = 363
    for i, item in enumerate(right):
        y = bullet(c, 430, y, item[0], item[1], 330, RED, str(i + 1))
    callout(c, 54, 72, 706, 68, "Product principle", "Kisaan AI should support judgment, not replace it. The interface must make source, freshness, uncertainty and next verification steps easy to understand.", HexColor("#E1F4EA"), GREEN)
    footer(c, p, "Safety")


def page_close(c, p):
    c.setFillColor(HexColor("#062F23")); c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    image_cover(c, SCREENS / "home-dashboard.png", 574, 60, 166, 361, 24, 0)
    label(c, "Conclusion", 52, 440, MINT)
    text(c, "Useful today.", 52, 390, 34, "Inter-Black", white)
    text(c, "Resilient tomorrow.", 52, 350, 34, "Inter-Black", MINT)
    text(c, "Kisaan AI brings the farmer's most common information and advice needs into one clear mobile workflow.", 52, 305, 12, "Inter", Color(1, 1, 1, 0.76), 440, 18)
    points = [
        "One shared farm profile personalizes every module.",
        "Bilingual text, voice and imagery widen access.",
        "Live intelligence is backed by practical offline paths.",
        "Weather and mandi data lead to decisions, not dashboards alone.",
    ]
    y = 246
    for point in points:
        c.setFillColor(MINT); c.circle(59, y + 4, 4, fill=1, stroke=0)
        text(c, point, 73, y, 9.7, "Inter-Medium", white)
        y -= 31
    rr(c, 52, 70, 456, 63, 13, Color(1, 1, 1, 0.08), Color(1, 1, 1, 0.14))
    text(c, "NORTH STAR", 68, 112, 7.2, "Inter-Bold", MINT)
    text(c, "Help a farmer make the next good decision - wherever the field is.", 68, 88, 12, "Inter-Semi", white)
    footer(c, p, "Summary", dark=True)


def build():
    prep_images()
    c = canvas.Canvas(str(OUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("Kisaan AI - Product Case Study")
    c.setAuthor("Kisaan AI")
    c.setSubject("Problem, solution, features, architecture and product readiness")
    pages = []
    pages.append(page_cover)
    pages.append(page_problem)
    pages.append(page_solution)
    pages.append(page_journey)
    pages.append(lambda c,p: feature_page(c,p,"04  /  Live AI","A multimodal assistant grounded in the farmer's context","Farmers can speak, type or attach a crop photo; the live session responds in simple English or everyday Urdu.",[(SCREENS/"ai-assistant.png","Voice, text and crop photo")],[
        ("Conversation in the natural channel", "Voice-first controls reduce typing; text and photos support quiet or visual questions."),
        ("Context follows the farmer", "Crops, district, farm size and current app-provided mandi rates are included in the assistant context."),
        ("Practical local language", "Responses use Pakistani units and familiar terms for irrigation, selling and field work."),
        ("Safe starting points", "Suggested questions guide farmers toward crop leaves, watering and weather protection."),
    ],("Important boundary","Live guidance can be wrong. The interface asks farmers to verify high-impact decisions locally.",GREEN)))
    pages.append(lambda c,p: feature_page(c,p,"05  /  Offline intelligence","Advice that stays available beyond the signal","A compact Qwen3 model runs entirely on the phone after a one-time download, keeping farm Q&A available offline.",[(SCREENS/"offline-advisor.png","On-device farm helper")],[
        ("No network required", "After the model is stored and loaded, text questions and answers stay on the device."),
        ("Same farmer context", "The helper uses the saved farm profile and language with a shorter prompt suited to a small model."),
        ("Honest capability framing", "The product labels it as simpler than live Kisaan AI and repeats the need to verify advice."),
        ("Accessible playback", "Answers can be read aloud using on-device text-to-speech."),
    ],("Resilience pattern","Live AI for richer sessions; cached content and on-device inference for continuity.",BLUE)))
    pages.append(lambda c,p: feature_page(c,p,"06  /  Weather and alerts","Forecasts translated into farm actions","The dashboard surfaces local conditions; the detail view adds a five-day outlook and a plain-language work advisory.",[(SCREENS/"home-dashboard.png","Today's farm picture"),(SCREENS/"weather-details.png","Five-day forecast")],[
        ("Location-aware", "Forecasts use GPS or a farmer-selected district across Pakistan's regions."),
        ("Action, not just weather", "Advisories connect dry, wet, hot, cold or windy conditions to spraying, watering and harvesting."),
        ("Prioritized risk", "Storm, rain, heat, frost, wind and wet-weather crop-risk alerts are ranked for the home screen."),
        ("Cache-aware", "A saved forecast remains visible offline and the UI communicates when the data is not fresh."),
    ],("Data source","Open-Meteo powers forecasts; a shared Supabase cache reduces duplicate district fetches.",GREEN)))
    pages.append(lambda c,p: feature_page(c,p,"07  /  Market access","Daily mandi rates farmers can search and hear","Produce prices are presented in English and Urdu with national averages, city ranges, trend and spoken playback.",[(SCREENS/"mandi-rates.png","Searchable daily list"),(SCREENS/"mandi-price-detail.png","City price breakdown")],[
        ("Fast price discovery", "Search works across English and Urdu names for dozens of produce items."),
        ("Useful granularity", "Each detail sheet shows an average, daily movement and city-level price ranges."),
        ("Speech playback", "A listen action makes price information available without sustained reading."),
        ("Offline continuity", "The latest device-cached list stays available when the network drops."),
    ],("Current scope","Lahore, Karachi, Multan and Islamabad are shown from the daily IR Farm source.",AMBER)))
    pages.append(lambda c,p: feature_page(c,p,"08  /  Learning","Crop guides in both languages","Five current farming articles support deeper learning, with English and Urdu available inside each article.",[(SCREENS/"crop-guides.png","Latest crop guides"),(SCREENS/"article-detail.png","Bilingual article view")],[
        ("Curated and current", "The app fetches the five latest guides and highlights the newest item."),
        ("Bilingual reading", "A language switch keeps English and Urdu content together in one article experience."),
        ("Visual explanation", "Illustrated cover graphics make long-form agricultural topics easier to scan."),
        ("Offline reading", "Device caching keeps recently fetched guidance available without a connection."),
    ],("Content role","Guides complement AI answers with longer, source-based educational material.",GREEN)))
    pages.append(lambda c,p: feature_page(c,p,"09  /  Personalization","One profile, many tailored experiences","Farm details and preferences are managed in one place and reused throughout the app.",[(WORK/"profile-sanitized.jpg","Profile and preferences")],[
        ("Farm facts", "Name, village, nearest city, farm size, crops and district form the shared personalization layer."),
        ("Language", "English and Urdu can be changed immediately, including right-to-left layouts and appropriate fonts."),
        ("Appearance", "System, light and dark modes adapt the interface to farmer preference and environment."),
        ("Control", "Farmers can edit details, change location, repeat onboarding or sign out."),
    ],("Privacy note","The phone number in this case study screenshot is intentionally redacted.",GREEN)))
    pages.append(page_architecture)
    pages.append(page_safety)
    pages.append(page_close)
    for i, fn in enumerate(pages, 1):
        fn(c, i)
        c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
