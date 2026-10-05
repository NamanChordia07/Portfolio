import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const pages = ["/", "/work/proofline", "/work/voice-sales-agent", "/work/cluecode", "/work/enterprise-automation", "/resume"];

async function noHorizontalOverflow(page: Page) {
  const offenders = await page.evaluate(() => {
    const out: string[] = [];
    // Anything inside a container that clips horizontally (tables that scroll, decorative glows,
    // the marquee) cannot widen the page, so only unclipped elements count.
    const clipped = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === "hidden" || o === "clip" || o === "auto" || o === "scroll") return true;
      }
      return false;
    };
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      if (clipped(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > window.innerWidth + 1) out.push(`${el.tagName} ${el.className}`.slice(0, 120));
    }
    return out;
  });
  expect(offenders, "elements wider than the viewport").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "page scrolls sideways").toBe(true);
}

for (const path of pages) {
  test(`${path} renders, has one h1, and fits the viewport`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/Naman Chordia/);
    await noHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  for (const theme of ["light", "dark"] as const) {
    test(`${path} has no WCAG 2.1 AA violations (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
      expect(summary).toEqual([]);
    });
  }
}

test("the resume downloads as a PDF", async ({ request }) => {
  const res = await request.get("/resume/Naman_Chordia_Resume.pdf");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/pdf");
  expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");
  for (const old of ["Naman_Chordia_FDE_Resume", "Naman_Chordia_AI_Engineer_Resume", "Naman_Chordia_SDE_Resume"]) {
    expect((await request.get(`/resume/${old}.pdf`)).status(), old).toBe(404);
  }
});

test("resume page offers exactly one resume", async ({ page }) => {
  await page.goto("/resume");
  const hrefs = await page.locator('a[download][href$=".pdf"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(new Set(hrefs)).toEqual(new Set(["/resume/Naman_Chordia_Resume.pdf"]));
});

test("contact links point at the right profiles", async ({ page }) => {
  await page.goto("/");
  const hrefs = await page.locator("a[href]").evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""));
  expect(hrefs).toContain("https://www.linkedin.com/in/naman-chordia-291b7a22a/");
  expect(hrefs.filter((h) => h.includes("linkedin.com") && !h.includes("291b7a22a"))).toEqual([]);
  expect(hrefs).toContain("https://github.com/NamanChordia07/Proofline");
  expect(hrefs).toContain("tel:+918799955051");
  await expect(page.getByText("+91 87999 55051").first()).toBeVisible();
});

test("the portrait is on the home page", async ({ page }) => {
  await page.goto("/");
  const photo = page.getByRole("img", { name: "Portrait of Naman Chordia" });
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
});

test("command menu opens with Ctrl+K and navigates", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard shortcut is a desktop feature; the header button covers touch");
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Command menu" });
  // The shortcut listener attaches on hydration; retry the key press until it does.
  await expect(async () => {
    await page.keyboard.press("Control+k");
    await expect(dialog).toBeVisible({ timeout: 500 });
  }).toPass();
  await page.keyboard.type("proofline");
  await expect(dialog.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work\/proofline$/);
  await expect(dialog).toBeHidden();
});

test("command menu opens from the header button", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open command menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Command menu" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("option", { name: /Copy email address/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("case studies are reachable from the home page", async ({ page }) => {
  await page.goto("/");
  for (const title of ["Proofline", "AI Voice Sales Agent", "ClueCode", "Enterprise automation at IDeaS"]) {
    await page.goto("/");
    // The hero also links Proofline and ClueCode by name; either link goes to the same page.
    await page.getByRole("link", { name: title, exact: true }).first().click();
    await expect(page.locator("h1")).toHaveText(title);
  }
});

test("Proofline demo switches samples and shows repairs", async ({ page }) => {
  await page.goto("/work/proofline#demo");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(3);
  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("retail_monthly", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "After repair" }).click();
  await expect(page.getByText(/minimal edits/)).toBeVisible();
  await expect(page.getByText("0 contradicted")).toBeVisible();
});

test("a claim reveals its source on focus", async ({ page }) => {
  await page.goto("/work/proofline");
  const claim = page.locator(".claim").first();
  await claim.focus();
  await expect(claim.getByRole("tooltip")).toBeVisible();
  await expect(claim.getByRole("tooltip")).toContainText("Source");
});

test("theme defaults to dark, switches and persists", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile menu opens and navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.locator("#mobile-nav").getByRole("link", { name: "Resume" }).click();
  await expect(page).toHaveURL(/\/resume$/);
  await expect(page.locator("#mobile-nav")).toHaveCount(0);
});

test("SEO: metadata, JSON-LD, sitemap, robots and OG images", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Naman Chordia/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\//);
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(ld["@type"]).toBe("Person");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const p of ["/work/proofline", "/work/voice-sales-agent", "/work/cluecode", "/work/enterprise-automation", "/resume"])
    expect(sitemap).toContain(p);
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
  for (const p of ["/opengraph-image", "/work/proofline/opengraph-image"]) {
    const img = await request.get(p);
    expect(img.headers()["content-type"]).toBe("image/png");
  }
});

test("external links open safely", async ({ page }) => {
  for (const path of pages) {
    await page.goto(path);
    const bad = await page.locator('a[target="_blank"]').evaluateAll((els) =>
      els.filter((e) => !(e.getAttribute("rel") ?? "").includes("noopener")).map((e) => e.getAttribute("href")),
    );
    expect(bad, path).toEqual([]);
  }
});

test("unknown routes return 404", async ({ page }) => {
  const res = await page.goto("/does-not-exist");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("No page matches");
});
