// Prints /resume to public/<resume.fileName> with Puppeteer. Run manually via
// `npm run resume` and commit the PDF: public/ is copied at the start of the
// deploying build, so that build cannot produce it.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import puppeteer from "puppeteer";

const PORT = process.env.RESUME_PORT ?? "4517";
const data = JSON.parse(readFileSync("portfolio.public.json", "utf8"));
const outPath = `public/${data.resume.fileName}`;
const pageLimit = data.resume.pageLimit;

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} ${args.join(" ")} exited ${code}`)),
    );
  });
}

// `npx next build` directly (not `npm run build`) so the postbuild freshness
// check does not fire against the PDF we are about to regenerate.
if (!process.env.RESUME_SKIP_BUILD) {
  console.log("make-resume: building the site…");
  await run("npx", ["next", "build"]);
}

// Fail fast if a previous run left a server on the port — printing a stale
// build is worse than an error.
try {
  await fetch(`http://localhost:${PORT}/`);
  throw new Error(`port ${PORT} is already in use; kill the old server first`);
} catch (err) {
  if (!(err instanceof TypeError)) throw err; // TypeError = connection refused = free
}

console.log(`make-resume: starting next start on :${PORT}…`);
// detached → own process group, so we can kill npx AND the next-server child.
const server = spawn("npx", ["next", "start", "-p", PORT], {
  stdio: "pipe",
  detached: true,
});
try {
  let ready = false;
  for (let i = 0; i < 60 && !ready; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://localhost:${PORT}/resume`);
      ready = res.ok;
    } catch {
      /* server not up yet */
    }
  }
  if (!ready) throw new Error("next start never became ready");

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}/resume`, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: false,
      margin: { top: "13mm", bottom: "13mm", left: "13mm", right: "13mm" },
    });
  } finally {
    await browser.close();
  }

  // Selectable-text A4 with a hard page limit: count page objects in the PDF.
  const pdf = readFileSync(outPath).toString("latin1");
  const pages = (pdf.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pages > pageLimit) {
    throw new Error(
      `make-resume: PDF is ${pages} pages; resume.pageLimit is ${pageLimit}. Trim content.`,
    );
  }
  console.log(`make-resume: wrote ${outPath} (${pages} page${pages === 1 ? "" : "s"}).`);
} finally {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}
