const k = process.env.GEMINI_API_KEY;
if (!k) { console.log("MISSING: GEMINI_API_KEY not found in .env"); process.exit(1); }
console.log("length:", k.length, "| starts:", k.slice(0, 4), "| ends:", k.slice(-2), "| quotes/spaces:", /["'\s]/.test(k));
const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + k);
console.log("Google status:", r.status, r.status === 200 ? "(key OK)" : "(key rejected)");