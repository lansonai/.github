import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import {
  CHANNELS,
  LIMIT,
  selectDue,
  toThread,
  withUtm,
  slugify,
  normalizePage,
  run,
} from "./notion-publish.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, "fixtures/writing-db.sample.json");
const load = async () => JSON.parse(await readFile(FIXTURE, "utf8")).pages;

test("selectDue picks only ready + auto + due + channelled pages", async () => {
  const pages = await load();
  const due = selectDue(pages, new Date("2026-11-26T00:00:00Z"));
  assert.equal(due.length, 1);
  assert.equal(due[0].id, "page-blog-ready");
});

test("selectDue is empty before the scheduled date", async () => {
  assert.equal(selectDue(await load(), new Date("2026-10-01T00:00:00Z")).length, 0);
});

test("selectDue never returns 已发布 pages", async () => {
  const published = {
    id: "p",
    properties: {
      标题: { type: "title", title: [{ plain_text: "done" }] },
      状态: { type: "status", status: { name: "已发布" } },
      计划发布日期: { type: "date", date: { start: "2020-01-01" } },
      分发渠道: { type: "multi_select", multi_select: [{ name: "Blog" }] },
      自动发布: { type: "checkbox", checkbox: true },
    },
  };
  assert.equal(selectDue([published], new Date("2026-11-26T00:00:00Z")).length, 0);
});

test("toThread keeps every tweet within the platform limit", async () => {
  const body = Array.from({ length: 40 }, (_, i) => `Sentence number ${i + 1} explains one part of the topic clearly.`).join(" ");
  const link = "https://www.lansonai.com/blog/why-live-captions-still-flicker?utm_source=x";
  const thread = toThread(body, { link });
  assert.ok(thread.length > 1, "long text should split");
  for (const tweet of thread) assert.ok(tweet.length <= LIMIT, `tweet too long: ${tweet.length}`);
  assert.ok(thread.at(-1).includes(link), "link belongs on the last tweet");
});

test("toThread returns one chunk for short text", () => {
  const thread = toThread("Short note.", { link: "https://x.test" });
  assert.equal(thread.length, 1);
  assert.ok(thread[0].startsWith("Short note."));
});

test("toThread preserves all sentence content across chunks", () => {
  const sentences = Array.from({ length: 25 }, (_, i) => `Point ${i} is stated here.`);
  const thread = toThread(sentences.join(" "), { max: 200 });
  const joined = thread.join(" ").replace(/\s*\(\d+\/\d+\)/g, "");
  for (const s of sentences) assert.ok(joined.includes(s), `lost: ${s}`);
});

test("withUtm sets source/medium/campaign without dropping existing params", () => {
  const url = withUtm("https://www.lansonai.com/blog/x?ref=hn", { channel: "Hacker News", campaign: "post-a" });
  const u = new URL(url);
  assert.equal(u.searchParams.get("ref"), "hn");
  assert.equal(u.searchParams.get("utm_source"), "hacker_news");
  assert.equal(u.searchParams.get("utm_medium"), "social");
  assert.equal(u.searchParams.get("utm_campaign"), "post-a");
});

test("slugify keeps Chinese and strips punctuation", () => {
  assert.equal(slugify("为什么实时字幕会闪烁？"), "为什么实时字幕会闪烁");
  assert.equal(slugify("Hello, World!"), "hello-world");
});

test("normalizePage maps Notion property shapes", async () => {
  const [first] = await load();
  const p = normalizePage(first);
  assert.equal(p.title, "Why Live Captions Still Flicker");
  assert.deepEqual(p.targets, ["Blog", "X", "Hacker News"]);
  assert.equal(p.auto, true);
});

test("run produces one step per due (page, channel) pair", async () => {
  const res = await run({
    databaseFile: FIXTURE,
    outDir: path.join(HERE, "out"),
    siteUrl: "https://www.lansonai.com",
    now: new Date("2026-11-26T00:00:00Z"),
    dryRun: true,
  });
  assert.equal(res.due, 1);
  assert.deepEqual(res.plan.map((s) => s.channel).sort(), ["Blog", "Hacker News", "X"]);
  assert.ok(res.plan.every((s) => CHANNELS.includes(s.channel)));
});

test("unknown channel is skipped, not crashed on", async () => {
  const page = {
    id: "p2",
    properties: {
      标题: { type: "title", title: [{ plain_text: "Edge" }] },
      状态: { type: "status", status: { name: "待发布" } },
      计划发布日期: { type: "date", date: { start: "2026-01-01" } },
      分发渠道: { type: "multi_select", multi_select: [{ name: "Threads" }, { name: "Blog" }] },
      自动发布: { type: "checkbox", checkbox: true },
    },
    body: "Body.",
  };
  const { writeFile, mkdir, mkdtemp } = await import("node:fs/promises");
  const dir = await mkdtemp(path.join((await import("node:os")).tmpdir(), "pub-"));
  const db = path.join(dir, "db.json");
  await mkdir(dir, { recursive: true });
  await writeFile(db, JSON.stringify({ pages: [page] }), "utf8");
  const res = await run({ databaseFile: db, outDir: dir, siteUrl: "https://example.test", now: new Date("2026-02-01"), dryRun: true });
  const skipped = res.plan.find((s) => s.channel === "Threads");
  assert.equal(skipped.action, "skipped");
  assert.ok(res.plan.some((s) => s.channel === "Blog" && s.action === "write"));
});

test("toThread handles an empty body without throwing", () => {
  assert.deepEqual(toThread("", { link: "https://x.test" }), []);
});

test("blocksToMarkdown maps Notion block text to markdown", async () => {
  const { blocksToMarkdown } = await import("./notion-fetch.mjs");
  const rich = (t) => [{ plain_text: t }];
  const md = blocksToMarkdown([
    { type: "heading_2", heading_2: { rich_text: rich("Why it flickers") } },
    { type: "paragraph", paragraph: { rich_text: rich("Because the last line is rewritten.") } },
    { type: "bulleted_list_item", bulleted_list_item: { rich_text: rich("Lock finalized segments") } },
    { type: "divider", divider: {} },
  ]);
  assert.equal(
    md,
    "## Why it flickers\n\nBecause the last line is rewritten.\n\n- Lock finalized segments\n\n---",
  );
});
