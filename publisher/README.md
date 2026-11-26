# Content publisher

Turns finished Notion drafts into channel-ready posts on a schedule, so already-written content keeps going out without anyone re-typing it.

## What it does

1. `notion-fetch.mjs` pulls every page of a Notion data source, plus each page body as markdown.
2. `notion-publish.mjs` picks the pages that are due and renders one artifact per channel.
3. `notion-publish.yml` runs the two steps every 6 hours and uploads the result as a workflow artifact.

## Notion field contract

The script reads these properties. Names are matched literally, so rename them only in both places.

| Property | Type | Role |
| --- | --- | --- |
| `标题` | title | Used for the slug and title |
| `状态` | status | Only `待发布` (or `Ready`) is dispatchable; `已发布` is never picked, so nothing double-posts |
| `计划发布日期` | date | Dispatched when `start <= now` |
| `分发渠道` | multi_select | `Blog`, `X`, `LinkedIn`, `Hacker News`, `TikTok`, `即刻`, `微信公众号` |
| `自动发布` | checkbox | Must be checked; a page without it is left for a human |
| `文章类型` | select | Optional, becomes the blog front-matter `type` |

The write-back fields (`发布链接`, `曝光`, `点击`, `互动`, `注册转化`, `效果备注`) are not written by this script yet; the manual checklists tell you where to fill them.

## Channels

- **Blog** — writes `blog/<slug>.md` with YAML front matter and a UTM-tagged canonical URL.
- **X** — splits the body on sentence boundaries into a numbered thread of at most 280 characters per tweet, with the UTM link on the last one. Written as JSON so a posting step can consume it.
- **LinkedIn / Hacker News / TikTok / 即刻 / 微信公众号** — a short checklist with the intro text. These stay manual on purpose: Hacker News and Chinese platforms punish automation, and a real account has to answer replies.

## Run it

```bash
node --test publisher/test.mjs                       # 11 tests, no network
node publisher/notion-publish.mjs                    # dry run against the fixture
node publisher/notion-publish.mjs --write --out out  # render the artifacts
```

Flags: `--database <json>`, `--out <dir>`, `--site <url>`, `--now <iso>`, `--write`.

Live pull needs two repository secrets:

```bash
gh secret set NOTION_TOKEN ...        # integration token with read access to the database
gh secret set NOTION_DATABASE_ID ...  # the data source id
```

Then share the database with that integration in Notion, or the query returns 404.

## Cadence it is built for

Two or three X posts a week, one comparison or tutorial article, one short-video script — one piece of content cut four ways. Everything here assumes the writing is already done; the job is choosing and shipping, not generating.
