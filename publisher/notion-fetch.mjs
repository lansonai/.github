#!/usr/bin/env node
// Pulls pages from a Notion data source into the shape notion-publish.mjs consumes.
// Requires NOTION_TOKEN (integration token) and NOTION_DATABASE_ID.
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";

const ctor = {
  token: () => process.env.NOTION_TOKEN,
};

async function call(pathname, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Notion ${method} ${pathname} -> ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function textOf(block) {
  const rich = block[block.type]?.rich_text || [];
  return rich.map((t) => t.plain_text).join("");
}

export function blocksToMarkdown(blocks) {
  const out = [];
  for (const b of blocks) {
    const t = textOf(b);
    switch (b.type) {
      case "heading_1":
        out.push(`# ${t}`);
        break;
      case "heading_2":
        out.push(`## ${t}`);
        break;
      case "heading_3":
        out.push(`### ${t}`);
        break;
      case "bulleted_list_item":
        out.push(`- ${t}`);
        break;
      case "numbered_list_item":
        out.push(`1. ${t}`);
        break;
      case "quote":
        out.push(`> ${t}`);
        break;
      case "code":
        out.push("```" + (b.code?.language || ""), t, "```");
        break;
      case "divider":
        out.push("---");
        break;
      default:
        if (t) out.push(t);
    }
  }
  return out.join("\n\n").trim();
}

async function pageBody(pageId, token) {
  const blocks = [];
  let cursor;
  do {
    const qs = new URLSearchParams({ page_size: "100" });
    if (cursor) qs.set("start_cursor", cursor);
    const page = await call(`/blocks/${pageId}/children?${qs}`, { token });
    blocks.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return blocksToMarkdown(blocks);
}

export async function fetchDatabase({ token, databaseId }) {
  const pages = [];
  let cursor;
  do {
    const res = await call(`/databases/${databaseId}/query`, {
      method: "POST",
      token,
      body: { page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  const withBody = [];
  for (const p of pages) {
    if (p.archived || p.in_trash) continue;
    withBody.push({ id: p.id, properties: p.properties, body: await pageBody(p.id, token) });
  }
  return { fetchedAt: new Date().toISOString(), pages: withBody };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = ctor.token();
  const databaseId = process.env.NOTION_DATABASE_ID;
  const out = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "writing-db.live.json");
  if (!token || !databaseId) {
    console.error("Set NOTION_TOKEN and NOTION_DATABASE_ID before running this script.");
    process.exit(2);
  }
  const data = await fetchDatabase({ token, databaseId });
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(data, null, 2), "utf8");
  console.log(`wrote ${data.pages.length} pages to ${out}`);
}
