/**
 * Syncing the website from the spreadsheet itself.
 *
 * Google Apps Script, bound to the events spreadsheet - paste this into
 * Extensions -> Apps Script. See the README beside this file for the two
 * settings it needs and how to switch it on.
 *
 * Why this exists: Vercel Cron on a Hobby account runs once a day, so an event
 * typed in at four o'clock reaches the site the next morning. This gives the
 * sheet its own trigger, so an edit is on the site within five minutes, and a
 * menu item for when someone wants it on the site *now*. Nothing here replaces
 * the daily cron - that stays as the backstop for when this script is broken,
 * disabled, or nobody has opened the sheet in a week.
 *
 * It calls the same endpoint the cron does, with the same secret, and that
 * endpoint only ever *reads* this spreadsheet. The worst a bad run can do is
 * nothing: the sync never deletes an event, and a row it cannot read is
 * reported and skipped.
 *
 * Written for committee members rather than developers, which is why every
 * failure here is phrased as something a person can act on.
 */

/** Script Properties, not constants: a secret does not belong in source. */
const SETTING_KEYS = {
  siteUrl: "SITE_URL",
  secret: "CRON_SECRET",
};

/** Where the sheet records what it is waiting to do, and what happened last. */
const STATE_KEYS = {
  pendingSince: "PENDING_SINCE",
  lastResult: "LAST_RESULT",
};

/** How often the background trigger looks for unsynced edits. */
const CHECK_EVERY_MINUTES = 5;

/* -------------------------------------------------------------------------- */
/* The menu                                                                    */
/* -------------------------------------------------------------------------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Website")
    .addItem("Sync website now", "syncNow")
    .addSeparator()
    .addItem("Turn on auto-sync", "enableAutoSync")
    .addItem("Turn off auto-sync", "disableAutoSync")
    .addItem("Show last sync", "showLastSync")
    .addToUi();
}

/**
 * The menu item. Reports back in an alert, because someone pressed a button and
 * is waiting to be told what happened.
 */
function syncNow() {
  const ui = SpreadsheetApp.getUi();
  const lock = LockService.getScriptLock();

  // A background run may be in flight; 30 seconds is longer than the sync takes.
  if (!lock.tryLock(30 * 1000)) {
    ui.alert("A sync is already running. Give it a moment and try again.");
    return;
  }

  try {
    clearPending_();
    const result = runSync_();
    ui.alert(result.ok ? "Website updated" : "The sync did not finish", result.message, ui.ButtonSet.OK);
  } finally {
    lock.releaseLock();
  }
}

function showLastSync() {
  const stored = PropertiesService.getScriptProperties().getProperty(STATE_KEYS.lastResult);
  const ui = SpreadsheetApp.getUi();

  if (!stored) {
    ui.alert("This sheet has not synced the website yet.");
    return;
  }

  const last = JSON.parse(stored);
  ui.alert(
    last.ok ? "Last sync succeeded" : "Last sync failed",
    new Date(last.at).toLocaleString("en-GB") + "\n\n" + last.message,
    ui.ButtonSet.OK,
  );
}

/* -------------------------------------------------------------------------- */
/* The triggers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Installs both triggers: one to notice edits, one to act on them.
 *
 * Split in two on purpose. An edit trigger that called the website directly
 * would fire on every cell of a row being typed in - thirty calls to publish
 * one event, several of them against a half-finished row. Instead an edit only
 * leaves a note, and a timer picks the note up once the typing has stopped.
 */
function enableAutoSync() {
  removeOurTriggers_();

  ScriptApp.newTrigger("markPending")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onChange()
    .create();

  ScriptApp.newTrigger("syncIfPending")
    .timeBased()
    .everyMinutes(CHECK_EVERY_MINUTES)
    .create();

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    "Auto-sync is on",
    "Edits to this sheet reach the website within about " +
      CHECK_EVERY_MINUTES +
      " minutes. Use “Sync website now” if you cannot wait.",
    ui.ButtonSet.OK,
  );
}

function disableAutoSync() {
  removeOurTriggers_();

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    "Auto-sync is off",
    "The website still picks the sheet up once a day on its own, and " +
      "“Sync website now” still works.",
    ui.ButtonSet.OK,
  );
}

function removeOurTriggers_() {
  const ours = ["markPending", "syncIfPending"];
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (ours.indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

/** The edit trigger. Deliberately does nothing but leave a note. */
function markPending() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty(STATE_KEYS.pendingSince)) {
    properties.setProperty(STATE_KEYS.pendingSince, new Date().toISOString());
  }
}

/**
 * The timer. Syncs only when the sheet has changed since the last run, so a
 * spreadsheet nobody has touched costs one property read every five minutes
 * rather than a request to the website.
 */
function syncIfPending() {
  const properties = PropertiesService.getScriptProperties();
  const pendingSince = properties.getProperty(STATE_KEYS.pendingSince);
  if (!pendingSince) return;

  const lock = LockService.getScriptLock();
  // Not worth queueing behind another run: whatever it is doing reads the same
  // sheet, and this timer comes round again in five minutes.
  if (!lock.tryLock(0)) return;

  try {
    // Cleared *before* the call, so an edit made while the website is reading
    // the sheet leaves a fresh note rather than being swallowed by this run.
    clearPending_();

    const result = runSync_();
    if (!result.ok) {
      // Put the note back, so the next timer retries instead of waiting for
      // someone to edit a cell again.
      properties.setProperty(STATE_KEYS.pendingSince, pendingSince);
    }
  } finally {
    lock.releaseLock();
  }
}

function clearPending_() {
  PropertiesService.getScriptProperties().deleteProperty(STATE_KEYS.pendingSince);
}

/* -------------------------------------------------------------------------- */
/* The call itself                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Calls the website's sync endpoint and records what came back.
 *
 * Never throws: both callers want a message to show or store, and an exception
 * from a background trigger would only reach the Apps Script execution log.
 */
function runSync_() {
  let result;

  try {
    const settings = readSettings_();
    const response = UrlFetchApp.fetch(settings.url, {
      method: "get",
      headers: { Authorization: "Bearer " + settings.secret },
      // The endpoint answers a failed sync with 500 and the report in the body,
      // which is exactly what we want to read, so exceptions are off.
      muteHttpExceptions: true,
    });

    result = interpret_(response.getResponseCode(), response.getContentText());
  } catch (error) {
    result = { ok: false, message: String((error && error.message) || error) };
  }

  PropertiesService.getScriptProperties().setProperty(
    STATE_KEYS.lastResult,
    JSON.stringify({ at: new Date().toISOString(), ok: result.ok, message: result.message }),
  );

  if (!result.ok) console.error("Website sync failed: " + result.message);
  return result;
}

function readSettings_() {
  const properties = PropertiesService.getScriptProperties();
  const siteUrl = (properties.getProperty(SETTING_KEYS.siteUrl) || "").trim();
  const secret = (properties.getProperty(SETTING_KEYS.secret) || "").trim();

  if (!siteUrl || !secret) {
    throw new Error(
      "This script has not been set up yet. In Apps Script, open Project " +
        "Settings and add script properties " +
        SETTING_KEYS.siteUrl +
        " (the site's address) and " +
        SETTING_KEYS.secret +
        " (its CRON_SECRET).",
    );
  }

  return {
    url: siteUrl.replace(/\/+$/, "") + "/api/cron/sync-events",
    secret: secret,
  };
}

/** Turns an HTTP status and a sync report into a sentence for a person. */
function interpret_(status, body) {
  if (status === 401) {
    return {
      ok: false,
      message:
        "The website refused the secret. Check the " +
        SETTING_KEYS.secret +
        " script property here matches the one in the site's Production " +
        "environment on Vercel.",
    };
  }

  if (status === 503) {
    return {
      ok: false,
      message: "The website has no CRON_SECRET set, so it will not sync. Ask whoever deploys it.",
    };
  }

  if (status === 404) {
    return {
      ok: false,
      message:
        "No sync endpoint at that address. Check " +
        SETTING_KEYS.siteUrl +
        " is the live site, with no path after the domain.",
    };
  }

  let report;
  try {
    report = JSON.parse(body);
  } catch (error) {
    return {
      ok: false,
      message: "The website replied with something we could not read (status " + status + ").",
    };
  }

  if (!report.ok) {
    return {
      ok: false,
      message: report.errorMessage || "The sync did not finish. See /admin/events on the site.",
    };
  }

  const changes = [];
  if (report.created) changes.push(report.created + " added");
  if (report.updated) changes.push(report.updated + " updated");
  if (report.unpublished) changes.push(report.unpublished + " taken off the site");

  let message =
    "Read " +
    report.rowsRead +
    " rows: " +
    (changes.length ? changes.join(", ") + "." : "nothing needed changing.");

  // Rejected rows are the whole reason a committee member would read this.
  if (report.problems && report.problems.length) {
    message +=
      "\n\n" +
      report.skipped +
      " row(s) were skipped:\n" +
      report.problems.slice(0, 10).join("\n");
    if (report.problems.length > 10) {
      message += "\n…and " + (report.problems.length - 10) + " more.";
    }
  }

  return { ok: true, message: message };
}
