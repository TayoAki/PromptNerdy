# 0017 — Agency client portal

## Status

Proposed. Builds on multi-user organizations (`specs/0011-multi-user-organizations.md`), which deferred per-project authorization inside an organization; this is that work, shaped for agencies.

## What it does

PromptNerdy serves an SEO agency and the businesses it works for.

- **The agency is an organization.** Its staff are the owner and admins they already are today. They see every client and every project, run research, and pay for usage.
- **A client is a named account inside the agency's organization**, such as "Acme Plumbing". It has one or more projects (websites) and any number of client contacts.
- **Client contacts get their own logins** and land in a portal, not the app. The portal shows only their client's projects, read-only. It has no research tools, agent chat, MCP, integrations, settings or billing.
- **The agency decides what each client sees.** Reports are private to the agency until a staff member publishes one to the client.

### Portal (client contacts)

A slim shell branded with the agency's name and logo, the client's name, and a small "Powered by PromptNerdy".

- **Overview.** One card per website: Search Console clicks and impressions over 28 days with the change against the prior period, rank-tracking movers (up, down, new in the top 10), and site health from the latest audit. Every number shows when it was last updated.
- **Reports.** The reports the agency published, newest first, in the same sandboxed viewer the app uses. Print stays available.
- **Rankings.** The tracked keywords and their history, read-only.
- **Site health.** The latest audit's score and top issues, read-only.

A contact who belongs to two clients, or to two agencies, switches between them with the existing organization switcher plus a client picker.

### Agency side

- **Clients page** (organization level): create, rename and archive clients; assign projects to a client; invite contacts by email; see each contact's last sign-in; remove a contact.
- **Project header:** shows which client the project belongs to, with a "View as client" preview that renders the portal for that client.
- **Report page:** a "Visible to client" toggle beside the existing public-link Share.
- **Organization settings:** agency name and logo for the portal header.

## How it works

**Roles.** A new `client` role in `orgRoles` with no app statements: it cannot create or delete projects, manage integrations, touch billing, or invite anyone. Owners and admins gain `client: ["manage"]`. The existing rule that teammates join only as admins stays; `client` is the second invitable role, and only through the Clients page.

**Clients are Better Auth teams.** The organization plugin's teams feature gives a team table, team membership, and invitations that carry a `teamId`. Accepting one makes the user a `client`-role member of the organization and a member of that team in one step. A client is a team, and a contact is a team member. Team endpoints are restricted to `client:manage` in access control, so a client cannot create teams or add themselves to another.

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

- MCP OAuth consent and API-key creation refuse the `client` role.
- SAM refuses it at connect and on every turn.
- The app's route guard sends a `client`-role session to `/portal` from every app route, and the portal guard sends staff without a client selected back to the app.

**No spend from the portal.** Portal services read saved tables only: stored Search Console results, rank snapshots, audits and published reports. They never call DataForSEO, OpenRouter or Google, and never start audits or refreshes. Client visits therefore cost the agency nothing, and the portal shows the data from the agency's last refresh. The agency's own visits and scheduled jobs keep that data current.

**Membership lifecycle.**

- Removing a contact removes their team membership and their organization membership. Access ends on their next request, as spec 0011 already guarantees for members.
- Archiving a client hides it from the portal and the Clients page. Its projects return to agency-internal and their data is kept.
- Deleting a client is a support action, like deleting an organization.

**Billing.** Usage stays per organization: the agency pays for everything, including work done on a client's projects. Per-client usage reporting can read the existing metering events by project later.

## Alternatives considered

- **An organization per client, with agency staff as members of each.** This gives the strongest isolation, because existing organization scoping does all the work. It lost because the agency's single view across clients is the product: staff would switch organizations constantly, every hire would need N invitations, and billing would split per client unless organizations gained a parent.
- **App-owned `clients` and `client_members` tables instead of teams.** This is explicit and fully under our control, but it re-implements invitation scoping, acceptance and removal that the plugin already does. It is the fallback if the spike shows team endpoints cannot be locked down to `client:manage`.
- **Granting a client per project, with no client entity.** This is simpler for one-site clients, but a client with several sites and several contacts becomes an N×M grant list with no name to manage it by.
- **Reusing the defined-but-unused `member` role.** `member` is meant for limited agency staff who still use the app. Clients need a different surface and deny-by-default, and folding the two together would leak app features into the portal.
- **Public share links only.** Spec 0014 already lets an agency send a report link with no login. That covers one-off sends, but it can't revoke a single person, show live rankings, or give a client one place to look. It stays as the lightweight option next to the portal.
- **Letting portal visits refresh data.** Clients would see fresher numbers, but the agency's credits would be spent by people it doesn't control. Stored data with a visible "last updated" fits a first version; scheduled refreshes can come later.

## Not in scope

Client-side research tools, comments or approvals, client uploads, white-labelling beyond name and logo, a custom portal domain, per-client billing or invoices, scheduled email digests (these need an email provider), contact roles inside a client, and a client-facing MCP.

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
3. **Branding and reach:** agency logo and name in the portal, email digests once an email provider is configured, and per-client usage reporting.

## Open questions

- Should a contact ever do more than view, for example approve content or leave comments? This design assumes view-only.
- Should the portal hide "Powered by PromptNerdy" (white-label), and is that a paid tier?
- Should agencies pay per client or per contact once billing is on? The data model supports either.
