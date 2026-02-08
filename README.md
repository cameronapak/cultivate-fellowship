# WIP: Cultivate

> [!NOTE]
> This is very much a work in progress. 

A calm space to cultivatecultivate fellowship, deep thought, and meaningful conversation.

## Vision

[Ponder](https://ponder.us) unfortunately shut down. I got permission to build a tool inspired by it. The goal: cultivate fellowship, deep thought, and meaningful conversation.

No algorithmic feeds. No read receipts. No typing indicators. No online status. Just calm discussion.

## Core Concepts

### Groups

The top-level concept. A group has:

- **Discussions** — threaded conversations with a title, body, and flat replies
- **Members** — people invited to the group and their roles
- **About** — group description and info

**Visibility** is set at the group level:

- **Public** — anyone can read discussions, only members can post. Good for those who want their conversations searchable on the web via SEO
- **Private** — members-only for reading and posting

**Membership** is invite-only:

- Admins share an invite link
- Admins can manually add members

**Roles:**

- **Admin** — can delete any post/discussion/reply, remove members, manage group settings
- **Member** — can create discussions, reply, edit/delete own content

### Discussions

- **Title + Body + Replies** (flat, no nesting)
- **Markdown** supported in body and replies
- **Images and attachments** allowed (reasonable size limits, stored on R2)
- **Long-form encouraged** — the UI should invite thoughtful writing
- **Editable** — authors can edit their own posts, with an "edited" indicator
- **Deletable** — authors can delete their own posts, admins can delete any

### Users

Lightweight profiles:

- Name
- Avatar (user-uploaded, stored on R2)
- Bio
- Email (only visible to members)

### Search

Users can search discussions within a group.

### Reporting

Any member can report content. Admins review reports.

---

## Intentionally Excluded (For Now)

- Reactions/likes
- Nested/threaded replies
- Tags/categories
- Dark mode
- Real-time updates (no SSE/WebSockets — manual refresh is calm)
- Typing indicators, read receipts, online status
- Algorithmic ranking or feeds
- Per-discussion visibility controls

---

## Future Considerations

- **Digest email notifications** — batched, not instant
- **RSS feeds** per group or discussion
- **Anyone can create a group** (currently curated/single-group)
- **Reactions** (e.g., a single "ponder" or heart reaction)
- **Dark mode**

---

## Tech Stack

- **[Hono](https://hono.dev)** — web framework, built on Web Standards
- **[Hono JSX](https://hono.dev)** — server-side rendering
- **[Bknd](https://bknd.io)** — auth, database, storage, admin UI
- **[Datastar](https://data-star.dev/)** — hypermedia frontend (HTMX + Alpine.js concepts)
- **[Basecoat](https://basecoatui.com/)** — component CSS library (no React)
- **[UnoCSS](https://unocss.dev/)** — runtime CSS

### Deployment

- **Cloudflare Workers** — compute
- **Cloudflare D1** — SQLite database
- **Cloudflare R2** — file storage (avatars, attachments)

### Philosophy

- No build step
- State lives on the backend (HATEOAS)
- Simple, calm UI — no visual noise
- Works well with AI coding agents

---

## Data Model (Draft)

### groups

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| name | string | group name |
| description | text | shown on About tab |
| visibility | enum | `public` or `private` |
| icon | string | group icon URL (R2) |
| created_at | timestamp | |

### users

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| name | string | display name |
| email | string | unique |
| avatar | string | URL (R2) |
| bio | text | optional |
| created_at | timestamp | |

### memberships

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| user_id | string | FK → users |
| group_id | string | FK → groups |
| role | enum | `admin` or `member` |
| joined_at | timestamp | |

### discussions

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| group_id | string | FK → groups |
| author_id | string | FK → users |
| title | string | |
| body | text | markdown |
| edited | boolean | default false |
| created_at | timestamp | |
| updated_at | timestamp | |

### replies

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| discussion_id | string | FK → discussions |
| author_id | string | FK → replies |
| body | text | markdown |
| edited | boolean | default false |
| created_at | timestamp | |
| updated_at | timestamp | |

### attachments

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| url | string | R2 URL |
| filename | string | |
| size | integer | bytes |
| mime_type | string | |
| uploaded_by | string | FK → users |
| discussion_id | string | nullable FK |
| reply_id | string | nullable FK |
| created_at | timestamp | |

### invites

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| group_id | string | FK → groups |
| code | string | unique invite code |
| created_by | string | FK → users |
| expires_at | timestamp | nullable |
| created_at | timestamp | |

### reports

| Field | Type | Notes |
|-------|------|-------|
| id | string | primary key |
| reporter_id | string | FK → users |
| discussion_id | string | nullable FK |
| reply_id | string | nullable FK |
| reason | text | |
| resolved | boolean | default false |
| created_at | timestamp | |

---

## Pages (Draft)

| Route | Description |
|-------|-------------|
| `/` | Landing / marketing page |
| `/login` | Login |
| `/register` | Register (via invite link) |
| `/g/:slug` | Group home — discussions list |
| `/g/:slug/members` | Members tab |
| `/g/:slug/about` | About tab |
| `/g/:slug/d/:id` | Discussion detail + replies |
| `/g/:slug/d/new` | New discussion form |
| `/g/:slug/settings` | Group settings (admin) |
| `/profile` | Edit own profile |
| `/admin` | Bknd admin UI |

---

## Getting Started

```bash
cp .env.example .env
bun install
bun run dev
```
