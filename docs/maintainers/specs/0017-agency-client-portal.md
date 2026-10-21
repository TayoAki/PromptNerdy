# 0017 — Agency client portal

## Status

Phases 1 (foundation) and 2 (portal data) are built. Phase 3 is partly built: branding and the usage ledger are in, per-client billing waits for Autumn, and email digests wait for an email provider. Product decisions are recorded under Decisions. Builds on multi-user organizations (`specs/0011-multi-user-organizations.md`), which deferred per-project authorization inside an organization; this is that work, shaped for agencies.

## What it does

PromptNerdy serves an SEO agency and the businesses it works for.

- **The agency is an organization.** Its staff are the owner and admins they already are today. They see every client and every project, run research, and pay for usage.
- **A client is a named account inside the agency's organization**, such as "Acme Plumbing". It has one or more projects (websites) and any number of client contacts.
- **Client contacts get their own logins** and land in a portal, not the app. The portal shows only their client's projects and is view-only: a contact can look at everything shared with them but change nothing. It has no research tools, agent chat, MCP, integrations, settings or billing.
- **The agency decides what each client sees.** Reports are private to the agency until a staff member publishes one to the client.
- **Agencies pay per client**, and **white-labelling is a paid tier**.

### Portal (client contacts)

A slim shell branded with the agency's name and logo and the client's name. A small "Powered by PromptNerdy" appears unless the agency is on the white-label tier.

- **Overview.** A row of cards per website:
  - Google search clicks and impressions over the last 28 days, with the change against the 28 days before.
  - Rank-tracking movement: keywords tracked, how many sit in the top 10, how many moved up or down, and the biggest gains.
  - Site health from the latest scan.

  Rankings and site health say when they were last checked.

- **Reports.** The reports the agency published, newest first, in the same sandboxed viewer the app uses. Print stays available.
- **Rankings.** The site's own tracked keywords with their position on each tracked device and the change since the previous check (a day, a week or a month, following the tracker's schedule). Trackers on competitors' domains stay with the agency.
- **Site health.** The latest finished scan of the site's domain: how many critical issues, warnings and notices it found, and each issue with the number of pages it affects. Problems with the crawl itself (blocked or rate-limited pages, content that may need JavaScript) are the agency's to fix and are left out. A scan the site mostly blocked shows as no scan, never as a clean bill of health.

A contact who belongs to two clients, or to two agencies, switches between them with the existing organization switcher plus a client picker.

### Agency side

- **Clients page** (organization level): create, rename and archive clients; assign projects to a client; invite contacts by email; see each contact's last sign-in; remove a contact.
- **"View as client":** on a client project's dashboard and on each client on the Clients page, opening the portal exactly as that client's contacts see it.
- **Report page:** a "Visible to client" toggle beside the existing public-link Share.
- **Organization settings:** agency name and logo for the portal header, on every plan. Owners and admins change them; the logo is a PNG, JPEG or WebP image of up to 512 KB. The white-label tier removes the PromptNerdy badge.
- **Clients page usage:** what each client's research cost over the last 30 days, and what the agency's own projects cost.

## How it works

**Roles.** A new `client` role in `orgRoles` with no statements at all: it cannot create or delete projects, manage integrations, touch billing, invite anyone, or manage teams. Owners and admins already hold the plugin's team permissions, which gate client management. The existing rule that teammates join only as admins stays; `client` is the second invitable role, and only through the Clients page. A role change can neither make nor unmake a client.

**Clients are Better Auth teams.** The organization plugin's teams feature gives a team table, team membership, and invitations that carry a `teamId`. Accepting one makes the user a `client`-role member of the organization and a member of that team in one step. A client is a team, and a contact is a team member. Team endpoints check the plugin's team permissions, so a client cannot create teams or add themselves to another. Default teams are off: an organization starts with no clients. A staff invitation carries no team, and a client invitation names exactly one. Accepting a client invitation whose client was deleted is refused.

**Data.**

- `projects.client_team_id`: a nullable reference to the team. Null means an agency-internal project that no client sees. A project belongs to at most one client.
- `reports.client_visible_at`: nullable. Publishing sets it and unpublishing clears it. Content saves never touch it.
- `organization.logo` already exists and holds the portal logo.

All of it lives in both the SQLite and Postgres schemas.

**One access rule.** A project is accessible to a caller when it belongs to the caller's organization and either the caller's role is not `client` or the project's client team is one of the caller's teams. The rule lives in one repository function that replaces the organization-only lookup at every external boundary:

- the global server-function middleware, which spec 0001 made the project check for the web app
- `withMcpProjectAuth`
- the report viewer routes
- SAM chat authorization
- AI-visibility export
- every other direct caller of the organization-scoped project lookup

Bare organization lookups stay only on internal Workflow and Durable Object paths whose upstream authorization is explicit.

**Deny by default.** Client contacts must not reach the hundreds of existing server functions one audit at a time. `requireAuthenticatedContext` and `requireProjectContext` reject the `client` role outright. Portal server functions use their own `requirePortalContext`, which admits staff (for "View as client") and clients, and scopes every query to the caller's client teams. The same split applies elsewhere:

- Better Auth's organization endpoints answer org-wide reads (members, invitations, teams) to any member, so a `client`-role caller is refused every organization and API-key endpoint except an allowlist. The allowlist covers their own invitations, their own organizations and teams, switching, and leaving. Without this, one client's contacts could list another's.
- MCP refuses the `client` role per request and per project, covering both OAuth tokens and API keys.
- SAM refuses it at connect and on every turn.
- The app's route guard sends a `client`-role session to `/portal` from every app route, and the portal guard sends staff without a client selected back to the app.

**No spend from the portal.** Portal services read rank snapshots, audits and published reports from the database. They never call DataForSEO, OpenRouter or any other paid provider, and never start audits, rank checks or refreshes. Client visits therefore cost the agency nothing, and rankings and site health show the data from the agency's last check.

Search Console is the one live read, because nothing stores its totals and Google doesn't charge for it. The portal asks Google for the two 28-day windows through the agency's own connection and keeps the answer for a day, like the dashboard's Search Console cards. A site with no working connection shows no search data, and a Google fault hides that card instead of the whole overview.

**Membership lifecycle.**

- Removing a contact removes their team membership and their organization membership. Access ends on their next request, as spec 0011 already guarantees for members.
- With billing off, only addresses in `SIGNUP_ALLOWED_EMAILS` can found a workspace. An invited contact who signs up but hasn't accepted gets no workspace of their own, and with it no unmetered research. Until they accept, they're asked to open their invitation link.
- Archiving a client hides it from the portal and the Clients page. Its projects return to agency-internal and their data is kept.
- Deleting a client is a support action, like deleting an organization.

**Branding.** The agency name is the organization's name, renamed through Better Auth so its permission check applies. The logo is one stored image per organization. It is served only to that organization's members (staff and client contacts), its type is read from the file's bytes rather than the browser's claim, and SVG is refused because it can carry script. Erasing an organization deletes its logo.

**Billing.**

- **The billing unit is the active client.** A client counts from creation until it's archived, and the Clients page shows the count.
- **With billing on, the client count is an Autumn usage feature, like seats.** Creating or restoring a client adds one and archiving removes one. Creating a client beyond the plan's allowance is refused with an upgrade prompt.
- **Each client's price includes SEO usage credits.** Usage on a client's projects draws from that client's balance (one billing entity per client under the agency's customer). Agency-internal projects draw from the organization's own credits.
- **Per-client usage is visible.** The Clients page shows each client's usage, so an agency can pass the cost on and charge a heavy client more.
- **Usage comes from a ledger the app keeps itself.** Every paid call writes one row with its project, provider, feature and the provider's price, whether or not billing is on. That covers DataForSEO calls (including failed calls DataForSEO still charged for), LLM research and the SAM agent's model spend. With billing on, the page shows the marked-up price the agency pays; with billing off, it shows the provider's price, which is what the deployment pays. A client's usage follows the projects it has now, so moving a project moves its history with it. Autumn stays the record of what was charged.
- **White-label is a separate Autumn feature on a higher tier.** The portal checks it only to decide whether to show the badge.
- **With billing off (the MVP), clients are unlimited and every portal shows the badge.** No plan exists to grant white-label.

## Alternatives considered

- **An organization per client, with agency staff as members of each.** This gives the strongest isolation, because existing organization scoping does all the work. It lost because the agency's single view across clients is the product: staff would switch organizations constantly, every hire would need N invitations, and billing would split per client unless organizations gained a parent.
- **App-owned `clients` and `client_members` tables instead of teams.** This is explicit and fully under our control, but it re-implements invitation scoping, acceptance and removal that the plugin already does. It stays the fallback if the plugin's team behavior ever stops fitting.
- **Granting a client per project, with no client entity.** This is simpler for one-site clients, but a client with several sites and several contacts becomes an N×M grant list with no name to manage it by.
- **Reusing the defined-but-unused `member` role.** `member` is meant for limited agency staff who still use the app. Clients need a different surface and deny-by-default, and folding the two together would leak app features into the portal.
- **Public share links only.** Spec 0014 already lets an agency send a report link with no login. That covers one-off sends, but it can't revoke a single person, show live rankings, or give a client one place to look. It stays as the lightweight option next to the portal.
- **A single site-health score.** The audit doesn't compute one, and a score invented for the portal would give the client a different measure of the site than the agency sees. Counts by severity say the same thing without a new formula.
- **Storing Search Console totals for the portal.** This would make the portal read only from the database, but it needs a sync job and a table for numbers Google returns for free. A day-long cache gives the same cost and freshness.
- **Showing usage from Autumn only.** Autumn already records every charge, so per-client usage could have waited for per-client billing. It lost because a deployment with billing off, the MVP included, would show no usage at all, and the agency most needs to see costs before it starts charging for them.
- **Letting portal visits refresh data.** Clients would see fresher numbers, but the agency's credits would be spent by people it doesn't control. Stored data with a visible "last updated" fits a first version; scheduled refreshes can come later.

## Not in scope

Anything a contact can change (comments, approvals, uploads, research), a custom portal domain, invoices per client, scheduled email digests (these need an email provider), contact roles inside a client, and a client-facing MCP.

## Delivery

1. **Foundation:**
   - the `client` role
   - teams with access-control lockdown
   - `projects.client_team_id`
   - the single access rule at every boundary
   - deny-by-default middleware
   - the Clients page with invite links
   - a portal shell with Reports and the publish toggle
2. **Portal data:** the Overview, Rankings and Site health screens from stored data, plus "View as client".
3. **Branding, billing and reach:**
   - agency logo and name in the portal (built)
   - the usage ledger and per-client usage on the Clients page (built)
   - per-client billing and the white-label tier, once Autumn is set up
   - email digests, once an email provider is configured

## Decisions

- **View-only for contacts.** Anything a contact can change waits for a later spec.
- **Agencies pay per active client,** not per contact. Contacts are unlimited.
- **Each client's price includes its own SEO usage credits,** so usage is attributed per client and an agency can charge accordingly.
- **White-labelling is a paid tier.** For now it only hides the badge; a custom portal domain can join that tier later.
