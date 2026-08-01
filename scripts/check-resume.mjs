// postbuild guard: the committed résumé PDF must exist and must not be older
// than the data it is generated from, so content drift fails the build instead
// of shipping. The small tolerance absorbs same-checkout mtimes on CI clones.
import { readFileSync, statSync } from "node:fs";

const data = JSON.parse(readFileSync("portfolio.public.json", "utf8"));
const pdfPath = `public/${data.resume.fileName}`;
const TOLERANCE_MS = 5000;

let pdfStat;
try {
  pdfStat = statSync(pdfPath);
} catch {
  console.error(
    `check-resume: ${pdfPath} is missing. Run \`npm run resume\` and commit the PDF.`,
  );
  process.exit(1);
}

const jsonStat = statSync("portfolio.public.json");
if (pdfStat.mtimeMs + TOLERANCE_MS < jsonStat.mtimeMs) {
  console.error(
    `check-resume: ${pdfPath} is older than portfolio.public.json — the résumé has drifted. Run \`npm run resume\` and commit the PDF.`,
  );
  process.exit(1);
}

console.log("check-resume: résumé PDF is present and up to date.");
