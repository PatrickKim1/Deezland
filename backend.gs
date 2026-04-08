/**
 * =============================================
 *  DEEZ - Google Sheets Backend
 * =============================================
 *
 *  SETUP (takes 2 minutes):
 *
 *  1. Create a new Google Sheet (sheets.new)
 *  2. Click Extensions → Apps Script
 *  3. Delete the default code, paste this ENTIRE file
 *  4. Click the 💾 Save button
 *  5. Click Deploy → New deployment
 *  6. Click the ⚙️ gear next to "Select type" → choose "Web app"
 *  7. Set "Who has access" to "Anyone"
 *  8. Click "Deploy"
 *  9. Click "Authorize access" and allow permissions
 * 10. Copy the Web App URL — that's your group link!
 *
 *  Share that URL with friends. Everyone pastes it
 *  into Deez settings and you're connected!
 *
 * =============================================
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  ensureSheets();

  var params = e.parameter || {};
  var action = params.action;
  var body = {};

  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
      action = action || body.action;
    } catch (err) {}
  }

  var result = { ok: false, error: 'Unknown action' };

  try {
    switch (action) {
      case 'sync':
        result = handleSync(body);
        break;
      case 'interact':
        result = handleInteract(body);
        break;
      case 'ping':
        result = { ok: true, msg: 'Deez backend is running!' };
        break;
      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { ok: false, error: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/* --- Sheet Setup --- */

function ensureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (!ss.getSheetByName('Users')) {
    var s = ss.insertSheet('Users');
    s.appendRow(['userId', 'name', 'animal', 'data', 'lastSync']);
    s.setFrozenRows(1);
  }

  if (!ss.getSheetByName('Interactions')) {
    var s = ss.insertSheet('Interactions');
    s.appendRow(['id', 'fromId', 'fromName', 'fromAnimal', 'toId', 'type', 'timestamp', 'seen']);
    s.setFrozenRows(1);
  }
}

/* --- Sync ---
 * Client sends its full state, server stores it and returns everyone's state.
 */

function handleSync(body) {
  var userId = body.userId;
  var name = body.name;
  var animal = body.animal;
  var data = body.data || {};

  if (!userId || !name) {
    return { ok: false, error: 'Missing userId or name' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  var rows = sheet.getDataRange().getValues();
  var now = new Date().toISOString();

  // Find or create user row
  var found = false;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === userId) {
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(animal);
      sheet.getRange(i + 1, 4).setValue(JSON.stringify(data));
      sheet.getRange(i + 1, 5).setValue(now);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([userId, name, animal, JSON.stringify(data), now]);
  }

  // Read all users
  var allRows = sheet.getDataRange().getValues();
  var users = [];
  for (var i = 1; i < allRows.length; i++) {
    var uid = allRows[i][0];
    var uname = allRows[i][1];
    var uanimal = allRows[i][2];
    var udata = {};
    try { udata = JSON.parse(allRows[i][3] || '{}'); } catch (e) {}
    var lastSync = allRows[i][4];

    users.push({
      userId: uid,
      name: uname,
      animal: parseInt(uanimal) || 0,
      data: udata,
      lastSync: lastSync,
      isMe: uid === userId
    });
  }

  // Get unseen interactions for this user
  var interSheet = ss.getSheetByName('Interactions');
  var interRows = interSheet.getDataRange().getValues();
  var notifications = [];

  for (var i = 1; i < interRows.length; i++) {
    if (interRows[i][4] === userId && interRows[i][7] !== true && interRows[i][7] !== 'TRUE') {
      notifications.push({
        id: interRows[i][0],
        fromId: interRows[i][1],
        fromName: interRows[i][2],
        fromAnimal: parseInt(interRows[i][3]) || 0,
        type: interRows[i][5],
        timestamp: interRows[i][6]
      });
      // Mark as seen
      interSheet.getRange(i + 1, 8).setValue(true);
    }
  }

  // Clean up old interactions (older than 24h)
  var cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);
  for (var i = interRows.length - 1; i >= 1; i--) {
    try {
      var ts = new Date(interRows[i][6]);
      if (ts < cutoff) {
        interSheet.deleteRow(i + 1);
      }
    } catch (e) {}
  }

  return {
    ok: true,
    users: users,
    notifications: notifications
  };
}

/* --- Interactions (hi-fives & pokes) --- */

function handleInteract(body) {
  var fromId = body.fromId;
  var fromName = body.fromName;
  var fromAnimal = body.fromAnimal;
  var toId = body.toId;
  var type = body.type; // 'hifive' or 'poke'

  if (!fromId || !toId || !type) {
    return { ok: false, error: 'Missing fields' };
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Interactions');
  var id = Utilities.getUuid();
  var now = new Date().toISOString();

  sheet.appendRow([id, fromId, fromName, fromAnimal, toId, type, now, false]);

  return { ok: true, id: id };
}
