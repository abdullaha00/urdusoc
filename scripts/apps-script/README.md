# The spreadsheet's own sync button

`sync-website.gs` is Google Apps Script, not part of the Next.js app. It lives
here so it is version-controlled and reviewable; it runs inside the events
spreadsheet, on Google's servers.

It adds a **Website** menu to the sheet - *Sync website now*, *Turn on
auto-sync*, *Turn off auto-sync*, *Show last sync* - and, once auto-sync is on,
pushes any edit to the site within about five minutes.

It exists because Vercel Cron on a Hobby account runs once a day
(`vercel.json`), so an event typed in at four o'clock otherwise waits until the
next morning. It is an addition to that cron, not a replacement: the daily run
stays as the backstop for when this script is switched off, broken, or the sheet
has been left alone for a week. On a Pro account you may not want this at all -
change the cron to `*/15 * * * *` instead.

## Installing it

1. Open the events spreadsheet → **Extensions → Apps Script**.
2. Delete the stub `myFunction` and paste in all of `sync-website.gs`. Save.
3. **Project Settings → Script properties → Add script property**, twice:
   - `SITE_URL` → the live site, e.g. `https://cuurdusociety.co.uk`, with
     nothing after the domain. Use the production address: previews have their
     own `CRON_SECRET`, and environment variables a preview may not have.
   - `CRON_SECRET` → the same value as `CRON_SECRET` in the project's
     **Production** environment on Vercel (`vercel env pull` if you need to read
     it, or copy it from the dashboard).
4. Reload the spreadsheet. The **Website** menu appears.
5. Press **Website → Sync website now**. Google asks for authorisation the first
   time - it is your own script, so approve it. The alert that follows says how
   many rows were read and names any that were rejected.
6. Press **Website → Turn on auto-sync** once. That installs the two triggers
   below, and survives until someone turns it off.

## How it works

Two triggers, because one would be worse:

- an `onChange` trigger that does nothing but record *the sheet has changed*;
- a timer, every five minutes, that syncs only if that note is there.

A trigger that called the site on every edit would fire thirty times while one
event is being typed in, several of those against a half-finished row. The note
collapses all of that into one call once the typing has stopped. If the call
fails the note is put back, so the next timer retries rather than waiting for
someone to touch a cell again.

The call is `GET /api/cron/sync-events` with
`Authorization: Bearer <CRON_SECRET>` - exactly what Vercel Cron sends, so there
is nothing extra to maintain on the site. That endpoint only ever *reads* the
spreadsheet, and the sync never deletes an event, so the worst a stray run does
is nothing.

## When it misbehaves

The alerts are written to be read by whoever pressed the button: a refused
secret, a wrong `SITE_URL`, and an unconfigured site each say so in as many
words. For background runs, **Website → Show last sync** reports the most recent
result, and Apps Script's own **Executions** page has the full log.

`/admin/events` on the site remains the authoritative record - every sync, from
whatever source, is written to `event_sync_runs` and displayed there with its
rejected rows.

## Keeping this file and the sheet in step

Nothing checks that the script pasted into the spreadsheet matches this file.
If you change one, change the other, and say so in the commit message - the next
committee will have no other way to know.
