// postbuild guard: the committed résumé PDF must exist and must have been
// generated from the current portfolio.public.json. make-resume stamps a
// sha256 of the data into public/resume.stamp; here we recompute and compare.
// Content-based, so it works on fresh clones (CI) where mtimes are useless.
// Over-triggering is fine — the rule is "change the data, regenerate the PDF."
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const data = readFileSync("portfolio.public.json");
const pdfPath = `public/${JSON.parse(data.toString()).resume.fileName}`;
const stampPath = "public/resume.stamp";

if (!existsSync(pdfPath)) {
  console.error(`check-resume: ${pdfPath} is missing. Run \`npm run resume\` and commit the PDF and stamp.`);
  process.exit(1);
}

if (!existsSync(stampPath)) {
  console.error(`check-resume: ${stampPath} is missing. Run \`npm run resume\` and commit the PDF and stamp.`);
  process.exit(1);
}

const expected = createHash("sha256").update(data).digest("hex");
const stamped = readFileSync(stampPath, "utf8").trim();

if (stamped !== expected) {
  console.error(
    `check-resume: portfolio.public.json changed since ${pdfPath} was generated — the résumé has drifted. Run \`npm run resume\` and commit the PDF and stamp.`,
  );
  process.exit(1);
}

console.log("check-resume: résumé PDF matches the current data.");
