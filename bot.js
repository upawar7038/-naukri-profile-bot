const puppeteer = require("puppeteer");
require("dotenv").config();



// ============================================================
// 🔧 YOUR NAUKRI LOGIN CREDENTIALS
// ============================================================

const EMAIL = process.env.NAUKRI_EMAIL;
const PASSWORD = process.env.NAUKRI_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error("❌ Missing credentials! Copy .env.example → .env and fill in your details.");
    process.exit(1);
}

// ============================================================
// ⏱️ RANDOM INTERVAL SETTINGS (in minutes)
// ============================================================

const MIN_INTERVAL = 5;
const MAX_INTERVAL = 45;

// ============================================================
// 🔧 HEADLINE VARIANTS
// ============================================================

const HEADLINES = [
    "Senior Android Developer | Kotlin • Jetpack Compose • MVVM • Hilt | 4.9 Yrs | Pune | Open to Work",
    "Senior Mobile Developer | Android (Kotlin) • React Native (TypeScript) • Flutter | Clean Architecture | Actively Looking",
    "Android Engineer | Jetpack Compose • Coroutines • Clean Architecture • CI/CD | Govt & Fintech Apps | Pune",
    "Senior Android & React Native Developer | Kotlin • MVI • Hilt DI • OAuth2 • Payment Gateways | 4.9 Yrs",
];

// ============================================================
// 🔧 SUMMARY VARIANTS
// ============================================================

const SUMMARIES = [
    `Senior Mobile Developer with 4.9 years of experience building secure, scalable Android and React Native apps for government and fintech domains. Expert in Kotlin, Jetpack Compose, MVVM/Clean Architecture, Hilt DI, Kotlin Coroutines, and StateFlow. Delivered 5+ production apps for municipal bodies serving thousands of citizens — achieving 50% transaction volume growth, 30% user engagement improvement, and zero security incidents. Integrated 10+ payment gateways (Razorpay, Billdesk, CCAvenue, Sabpaisa, PineLabs POS) with SSL pinning, OAuth2.0, and Android Keystore. Also experienced in React Native (TypeScript), JSI/TurboModules, Redux Toolkit, and Flutter. Actively seeking Senior Android or Mobile Developer roles in Pune or remote.`,

    `Android Engineer with 4.9 years delivering production-grade apps across Android and React Native platforms. Deep expertise in Jetpack Compose (custom composables, animations, accessibility), MVVM/MVI with Clean Architecture, Hilt/Dagger2, Room, WorkManager, and Paging3. Built offline-first architecture supporting 1,000+ field inspectors in low-connectivity environments, reducing upload failures by 60%. Implemented TDD (JUnit, Mockito, Espresso) and CI/CD pipelines via GitHub Actions and SonarQube. Google Play Store rating: 4.5★. Currently open to Senior Android Developer, Lead Mobile, or Flutter Developer opportunities.`,

    `Results-driven Senior Android Developer with 4.9 years of expertise in Kotlin, Jetpack Compose, MVVM, and Clean Architecture. Architected 5+ scalable government-facing mobile apps with reactive UIs (StateFlow, SharedFlow), enforced SOLID principles, and integrated 10+ payment gateways with enterprise-grade security (SSL pinning, JWT, OAuth2.0, Android Keystore). Experienced in React Native (TypeScript, Redux Toolkit, JSI/TurboModules) and Flutter/Dart for cross-platform delivery. Strong in performance optimization using Android Profiler and Crashlytics — resolved ANRs and memory leaks across multiple production apps. Immediate joiner based in Pune.`,

    `Senior Mobile Developer (Android & React Native) with 4.9 years building high-impact civic-tech and fintech applications. Led Jetpack Compose + Material Design 3 adoption, architected offline-first systems with Room, DataStore, and WorkManager, and secured APIs using SSL pinning, OAuth2.0, and Android Keystore. Delivered measurable results: 50% increase in transaction volume, 30% lift in user engagement, 4.5★ Play Store and App Store ratings. Skilled in Kotlin Coroutines, Flow, Hilt DI, Paging3, Firebase (FCM, Crashlytics, Analytics), and Retrofit. Open to Android, React Native, and Flutter roles in Pune, Bangalore, or remote.`,
];

// ============================================================
// DO NOT EDIT BELOW THIS LINE
// ============================================================

let currentIndex = 0;

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(min = 500, max = 1500) {
    return sleep(Math.floor(Math.random() * (max - min) + min));
}

function getRandomInterval() {
    const minutes = Math.floor(Math.random() * (MAX_INTERVAL - MIN_INTERVAL + 1)) + MIN_INTERVAL;
    console.log(`\n⏱️  Next update in ${minutes} minute${minutes === 1 ? "" : "s"}`);
    return minutes * 60 * 1000;
}

// ============================================================
// FRESH PAGE LOAD
// ✅ FIX: Hard reload with cache bypass so every run starts clean
// ============================================================
async function freshLoad(page, url) {
    // Navigate to a blank page first to fully destroy previous page state
    await page.goto("about:blank", { waitUntil: "domcontentloaded" });
    await randomDelay(500, 800);

    // Now navigate to target URL with cache disabled
    await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
    });

    // Hard reload to bypass any cached content
    await page.reload({ waitUntil: "networkidle2", timeout: 30000 });
    await randomDelay(2000, 3000);
}

// ============================================================
// CLOSE ANY OPEN POPUPS / MODALS
// ✅ FIX: Dismiss stale popups left open from previous run
// ============================================================
async function closeAnyOpenPopups(page) {
    try {
        // Press Escape to close any open modal
        await page.keyboard.press("Escape");
        await randomDelay(500, 800);

        // Click cancel button if visible
        const cancelBtn = await page.$("a.cancel-btn");
        if (cancelBtn) {
            const visible = await cancelBtn.isVisible();
            if (visible) {
                await cancelBtn.click();
                console.log("   🚪 Closed stale popup (cancel btn)");
                await randomDelay(500, 800);
            }
        }

        // Click close button if visible
        const closeBtn = await page.$(".close-btn, .closeBtn, [class*='close']");
        if (closeBtn) {
            const visible = await closeBtn.isVisible();
            if (visible) {
                await closeBtn.click();
                console.log("   🚪 Closed stale popup (close btn)");
                await randomDelay(500, 800);
            }
        }
    } catch (_) {
        // Ignore — no popup was open
    }
}

// ============================================================
// SCROLL FULL PAGE — triggers lazy-loaded sections
// ============================================================
async function scrollFullPage(page) {
    const height = await page.evaluate(() => document.body.scrollHeight);
    const steps = Math.ceil(height / 400);
    for (let i = 0; i < steps; i++) {
        await page.evaluate((i) => window.scrollBy(0, 400), i);
        await sleep(130);
    }
    await randomDelay(1200, 1800);
}

// ============================================================
// LOGIN
// ============================================================
async function login(page) {
    console.log("🔐 Logging in...");

    await page.goto("https://www.naukri.com/nlogin/login", {
        waitUntil: "networkidle2",
        timeout: 30000,
    });
    await randomDelay(2000, 3000);

    const emailSelectors = ["#usernameField", 'input[type="email"]', 'input[name="username"]'];
    let emailField = null;
    for (const sel of emailSelectors) {
        try { await page.waitForSelector(sel, { timeout: 3000 }); emailField = sel; break; } catch (_) { }
    }
    if (!emailField) throw new Error("❌ Email field not found");
    console.log("✅ Found email field:", emailField);

    await page.click(emailField, { clickCount: 3 });
    await randomDelay();
    await page.type(emailField, EMAIL, { delay: 40 });
    await randomDelay();

    const passwordSelectors = ["#passwordField", 'input[type="password"]', 'input[name="password"]'];
    let passwordField = null;
    for (const sel of passwordSelectors) {
        try { await page.waitForSelector(sel, { timeout: 3000 }); passwordField = sel; break; } catch (_) { }
    }
    if (!passwordField) throw new Error("❌ Password field not found");
    console.log("✅ Found password field:", passwordField);

    await page.click(passwordField, { clickCount: 3 });
    await randomDelay();
    await page.type(passwordField, PASSWORD, { delay: 40 });
    await randomDelay(500, 1000);

    let clicked = false;
    for (const sel of ['button[type="submit"]', "button.loginButton", "button.btn-primary"]) {
        try { await page.click(sel); clicked = true; console.log("✅ Clicked login:", sel); break; } catch (_) { }
    }
    if (!clicked) { await page.keyboard.press("Enter"); }

    await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 20000 });
    console.log("✅ Logged in! URL:", page.url());
}

// ============================================================
// UPDATE HEADLINE
// ============================================================
async function updateHeadline(page, text) {
    console.log("\n   ✏️  Updating Resume Headline...");

    try {
        await page.waitForSelector("#lazyResumeHead", { timeout: 10000 });

        // Close any leftover popups first
        await closeAnyOpenPopups(page);

        const editIcon = await page.$("#lazyResumeHead span.edit.icon");
        if (!editIcon) throw new Error("no edit icon in #lazyResumeHead");
        await editIcon.click();
        console.log("   🖊️  Clicked headline edit icon");
        await randomDelay(1500, 2000);

        await page.waitForSelector("#resumeHeadlineTxt", { visible: true, timeout: 8000 });
        console.log("   ✅ Headline textarea found");

        await page.click("#resumeHeadlineTxt", { clickCount: 3 });
        await randomDelay(200, 400);
        await page.keyboard.down("Control");
        await page.keyboard.press("a");
        await page.keyboard.up("Control");
        await randomDelay(100, 200);
        await page.keyboard.press("Backspace");
        await randomDelay(300, 500);
        await page.type("#resumeHeadlineTxt", text, { delay: 25 });
        console.log("   ✅ Headline text entered");
        await randomDelay(500, 800);

        // Save
        let saveBtn = await page.$("button.btn-dark-ot[type='submit']");
        if (!saveBtn || !(await saveBtn.isVisible())) {
            const allBtns = await page.$$("button[type='submit']");
            for (const btn of allBtns) {
                if (await btn.isVisible()) { saveBtn = btn; break; }
            }
        }
        if (saveBtn) { await saveBtn.click(); console.log("   💾 Headline saved!"); }
        else console.warn("   ⚠️  Save button not found");

        await randomDelay(2000, 3000);
        return true;

    } catch (err) {
        console.warn("   ⚠️  Headline failed:", err.message);
        await page.screenshot({ path: "headline-error.png" });
        return false;
    }
}

// ============================================================
// UPDATE SUMMARY
// ============================================================
async function updateSummary(page, text) {
    console.log("\n   ✏️  Updating Profile Summary...");

    try {
        // Close any leftover popups first
        await closeAnyOpenPopups(page);

        console.log("   📜 Scrolling to load lazy sections...");
        await scrollFullPage(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await randomDelay(500, 800);

        // Find edit icon — try selectors in correct priority
        const summarySelectors = [
            ".profileSummary",
            "#lazyProfileSummary .profileSummary",
            "#lazyProfileSummary",
        ];

        let editIcon = null;
        for (const sel of summarySelectors) {
            try {
                await page.waitForSelector(sel, { timeout: 4000 });
                const container = await page.$(sel);
                if (container) {
                    editIcon = await container.$("span.edit.icon");
                    if (editIcon) { console.log(`   ✅ Found summary edit icon inside: ${sel}`); break; }
                }
            } catch (_) { }
        }

        // Fallback: search by widget title
        if (!editIcon) {
            console.log("   🔍 Searching by widget title...");
            const widgetTitles = await page.$$(".widgetTitle");
            for (const titleEl of widgetTitles) {
                const titleText = await titleEl.evaluate((el) => el.innerText.toLowerCase());
                if (titleText.includes("profile summary")) {
                    const parentSection = await titleEl.evaluateHandle(
                        (el) => el.closest(".card, section, div[class*='widget']")
                    );
                    if (parentSection) {
                        editIcon = await parentSection.$("span.edit.icon");
                        if (editIcon) { console.log("   ✅ Found via widget title"); break; }
                    }
                }
            }
        }

        if (!editIcon) throw new Error("Could not find summary edit icon");

        await editIcon.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }));
        await randomDelay(800, 1200);
        await editIcon.click();
        console.log("   🖊️  Clicked summary edit icon");
        await randomDelay(1500, 2500);

        await page.waitForSelector("#profileSummaryTxt", { visible: true, timeout: 8000 });
        console.log("   ✅ Summary textarea found");

        await page.click("#profileSummaryTxt", { clickCount: 3 });
        await randomDelay(200, 400);
        await page.keyboard.down("Control");
        await page.keyboard.press("a");
        await page.keyboard.up("Control");
        await randomDelay(100, 200);
        await page.keyboard.press("Backspace");
        await randomDelay(300, 500);
        await page.type("#profileSummaryTxt", text, { delay: 25 });
        console.log("   ✅ Summary text entered");
        await randomDelay(500, 800);

        // Save
        let saveBtn = await page.$("form[name='profileSummaryForm'] button.btn-dark-ot[type='submit']");
        if (!saveBtn || !(await saveBtn.isVisible())) saveBtn = await page.$("button.btn-dark-ot[type='submit']");
        if (!saveBtn || !(await saveBtn.isVisible())) {
            const allBtns = await page.$$("button[type='submit']");
            for (const btn of allBtns) {
                if (await btn.isVisible()) { saveBtn = btn; break; }
            }
        }
        if (saveBtn) { await saveBtn.click(); console.log("   💾 Summary saved!"); }
        else console.warn("   ⚠️  Save button not found");

        await randomDelay(2000, 3000);
        return true;

    } catch (err) {
        console.warn("   ⚠️  Summary failed:", err.message);
        await page.screenshot({ path: "summary-error.png" });
        console.log("   📸 Screenshot: summary-error.png");
        return false;
    }
}

// ============================================================
// MAIN UPDATE FUNCTION
// ✅ FIX: Uses freshLoad() instead of page.goto() for clean state
// ============================================================
async function updateProfile(page) {
    const headline = HEADLINES[currentIndex];
    const summary = SUMMARIES[currentIndex];

    console.log(`\n📝 Starting update — Variant ${currentIndex + 1}/${HEADLINES.length}`);
    console.log(`   Headline : ${headline.substring(0, 65)}...`);

    // --- Headline: fresh load ---
    console.log("\n   🔄 Fresh loading profile page for headline...");
    await freshLoad(page, "https://www.naukri.com/mnjuser/profile");
    await page.screenshot({ path: "profile-page.png" });
    console.log("📸 profile-page.png saved");

    const headlineDone = await updateHeadline(page, headline);

    // --- Summary: fresh load again ---
    console.log("\n   🔄 Fresh loading profile page for summary...");
    await freshLoad(page, "https://www.naukri.com/mnjuser/profile");

    const summaryDone = await updateSummary(page, summary);

    currentIndex = (currentIndex + 1) % HEADLINES.length;

    if (headlineDone && summaryDone) console.log(`\n✅ Both headline and summary updated!`);
    else if (headlineDone || summaryDone) console.log(`\n⚠️  Partially updated — check screenshots`);
    else console.warn(`\n❌ Nothing updated — check profile-page.png`);

    console.log(`   Next variant : ${currentIndex + 1}/${HEADLINES.length}`);
}
// Replacement main() that supports --once flag
async function main() {
    const RUN_ONCE = process.argv.includes("--once");

    // ============================================================
    // VARIANT STATE — persists across GitHub Actions runs
    // Uses a local state.json file (committed or cached)
    // ============================================================
    const STATE_FILE = "state.json";
    let state = { currentIndex: 0 };
    try {
        const fs = require("fs");
        if (fs.existsSync(STATE_FILE)) {
            state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
            console.log(`📂 Loaded state — variant index: ${state.currentIndex}`);
        }
    } catch (_) {
        console.log("📂 No state file found — starting from variant 1");
    }
    currentIndex = state.currentIndex;

    console.log("🚀 Naukri Profile Bot — Umesh Pawar");
    console.log(`   Mode            : ${RUN_ONCE ? "Single run (GitHub Actions)" : "Loop mode (PM2/local)"}`);
    console.log(`   Variants        : ${HEADLINES.length} combos`);
    console.log(`   Current variant : ${currentIndex + 1}/${HEADLINES.length}`);
    console.log(`   Account         : ${EMAIL}\n`);

    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1366, height: 768 },
        protocolTimeout: 120000,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
        ],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    // Save variant index to state.json after each update
    function saveState() {
        try {
            const fs = require("fs");
            fs.writeFileSync(STATE_FILE, JSON.stringify({ currentIndex }, null, 2));
            console.log(`💾 State saved — next variant: ${currentIndex + 1}/${HEADLINES.length}`);
        } catch (e) {
            console.warn("⚠️  Could not save state:", e.message);
        }
    }

    async function runAndSchedule() {
        try {
            await updateProfile(page);
            saveState();
        } catch (err) {
            console.error("❌ Update failed:", err.message);
            try { await page.screenshot({ path: "error-page.png" }); } catch (_) { }
        }
        const nextDelay = getRandomInterval();
        setTimeout(runAndSchedule, nextDelay);
    }

    try {
        await login(page);
        await updateProfile(page);
        saveState();

        if (RUN_ONCE) {
            // GitHub Actions mode — run once and exit cleanly
            console.log("\n✅ Single run complete — exiting.");
            await browser.close();
            process.exit(0);
        } else {
            // PM2 / local mode — keep looping
            const nextDelay = getRandomInterval();
            setTimeout(runAndSchedule, nextDelay);
        }
    } catch (err) {
        console.error("❌ Fatal error:", err.message);
        try { await page.screenshot({ path: "fatal-error.png" }); } catch (_) { }
        await browser.close();
        process.exit(1);
    }
}

main();