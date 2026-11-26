#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const CHANNELS = ["Blog", "X", "LinkedIn", "Hacker News", "TikTok", "即刻", "微信公众号"];

const TITLE = "标题";
const STATUS = "状态";
const DUE = "计划发布日期";
const TARGETS = "分发渠道";
const AUTO = "自动发布";
const KINDS = "文章类型";

export const DISPATCHABLE = new Set(["待发布", "Ready"]);

function plain(prop) {
  if (!prop) return undefined;
  switch (prop.type) {
    case "title":
      return (prop.title || []).map((t) => t.plain_text).join("");
    case "rich_text":
      return (prop.rich_text || []).map((t) => t.plain_text).join("");
    case "select":
      return prop.select?.name;
    case "status":
      return prop.status?.name;
    case "multi_select":
      return (prop.multi_select || []).map((s) => s.name);
    case "date":
      return prop.date?.start;
    case "checkbox":
      return Boolean(prop.checkbox);
    case "url":
      return prop.url;
    default:
      return undefined;
  }
}

export function normalizePage(page) {
  const p = page.properties || {};
  return {
    id: page.id,
    title: plain(p[TITLE]) || "untitled",
    status: plain(p[STATUS]),
    due: plain(p[DUE]),
    targets: plain(p[TARGETS]) || [],
    auto: plain(p[AUTO]) === true,
    kind: plain(p[KINDS]),
    body: page.body || "",
  };
}

export function slugify(title) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

export function withUtm(url, { channel, campaign }) {
  if (!url) return url;
  const u = new URL(url);
  u.searchParams.set("utm_source", channel.toLowerCase().replace(/\s+/g, "_"));
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

// Dispatchable = due now, explicitly marked for auto publish, has channels.
// Status "已发布" is never dispatchable, so a run cannot double-post.
export function selectDue(pages, now = new Date()) {
  return pages
    .map(normalizePage)
    .filter((p) => DISPATCHABLE.has(p.status))
    .filter((p) => p.auto === true)
    .filter((p) => p.targets.length > 0)
    .filter((p) => p.due && new Date(p.due) <= now)
    .sort((a, b) => new Date(a.due) - new Date(b.due));
}

export const LIMIT = 280;

function pack(text, budget) {
  const chunks = [];
  let rest = text.trim();
  while (rest.length > budget) {
    const seg = rest.slice(0, budget);
    const ends = [...seg.matchAll(/[.!?。！？](?=\s|$)/g)];
    let cut = ends.length ? ends[ends.length - 1].index + 1 : seg.lastIndexOf(" ");
    if (cut <= 0) cut = budget;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

export function toThread(body, { link, max = LIMIT } = {}) {
  const text = body.trim();
  if (!text) return [];
  const reserved = 10; // " (12/12)" plus a space
  const chunks = text.length <= max ? [text] : pack(text, max - reserved);
  const n = chunks.length;
  const numbered = chunks.map((c, i) => (n > 1 ? `${c} (${i + 1}/${n})` : c));
  if (link) {
    const last = numbered.length - 1;
    if (numbered[last].length + 1 + link.length <= max) {
      numbered[last] = `${numbered[last]}\n${link}`;
    } else if (link.length <= max) {
      numbered.push(link);
    }
  }
  return numbered;
}

export function renderBlog(page, { siteUrl, now = new Date() }) {
  const slug = slugify(page.title);
  const canonical = `${siteUrl.replace(/\/$/, "")}/blog/${slug}`;
  const fm = [
    "---",
    `title: "${page.title.replace(/"/g, '\\"')}"`,
    `date: ${now.toISOString().slice(0, 10)}`,
    `type: ${page.kind || "article"}`,
    `canonical: ${canonical}`,
    "---",
    "",
  ].join("\n");
  return { path: `blog/${slug}.md`, content: fm + page.body.trim() + "\n", link: canonical };
}

export function renderManualChecklist(page) {
  return [
    `## ${page.title}`,
    "",
    `- [ ] Confirm the claims are still true (Notion page ${page.id})`,
    "- [ ] Paste the intro below; keep the link in the first reply",
    "- [ ] After publishing, write the link into 发布链接 and fill 曝光/点击/互动/注册转化",
    "",
    "```",
    page.body.trim().slice(0, 1200),
    "```",
    "",
  ].join("\n");
}

export async function run({ databaseFile, outDir, siteUrl, now = new Date(), dryRun = true }) {
  const raw = JSON.parse(await readFile(databaseFile, "utf8"));
  const due = selectDue(raw.pages || raw, now);
  const plan = [];
  for (const page of due) {
    for (const channel of page.targets) {
      if (!CHANNELS.includes(channel)) {
        plan.push({ page: page.title, channel, action: "skipped", target: "", reason: "unknown channel" });
        continue;
      }
      if (channel === "Blog") {
        const post = renderBlog(page, { siteUrl, now });
        if (!dryRun) {
          const target = path.join(outDir, post.path);
          await mkdir(path.dirname(target), { recursive: true });
          await writeFile(target, post.content, "utf8");
        }
        plan.push({ page: page.title, channel, action: "write", target: post.path });
        continue;
      }
      if (channel === "X") {
        const thread = toThread(page.body, {
          link: withUtm(siteUrl, { channel: "X", campaign: slugify(page.title) }),
        });
        const rel = `x/${slugify(page.title)}.thread.json`;
        if (!dryRun) {
          const target = path.join(outDir, rel);
          await mkdir(path.dirname(target), { recursive: true });
          await writeFile(target, JSON.stringify(thread, null, 2), "utf8");
        }
        plan.push({ page: page.title, channel, action: "draft", target: rel, tweets: thread.length });
        continue;
      }
      const rel = `manual/${slugify(page.title)}-${slugify(channel)}.md`;
      if (!dryRun) {
        const target = path.join(outDir, rel);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, renderManualChecklist(page), "utf8");
      }
      plan.push({ page: page.title, channel, action: "manual", target: rel });
    }
  }
  return { due: due.length, plan };
}

function parseArgs(argv) {
  const args = {
    database: path.join(HERE, "fixtures/writing-db.sample.json"),
    out: path.join(HERE, "out"),
    site: "https://www.lansonai.com",
    dryRun: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--database") args.database = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--site") args.site = argv[++i];
    else if (a === "--now") args.now = new Date(argv[++i]);
    else if (a === "--write") args.dryRun = false;
  }
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = parseArgs(process.argv.slice(2));
  const res = await run({
    databaseFile: a.database,
    outDir: a.out,
    siteUrl: a.site,
    now: a.now || new Date(),
    dryRun: a.dryRun,
  });
  console.log(`due pages: ${res.due} (${a.dryRun ? "dry run" : "written to " + a.out})`);
  for (const s of res.plan) {
    const extra = s.tweets ? ` (${s.tweets} tweets)` : s.reason ? ` ${s.reason}` : "";
    console.log(`- [${s.action}] ${s.channel} · ${s.page} -> ${s.target}${extra}`);
  }
}
