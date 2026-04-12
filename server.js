import 'dotenv/config';
import express from 'express';
import { google } from 'googleapis';

const app = express();
app.use(express.json());

// --- Google Sheets Auth ---
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// --- Ensure sheets exist ---
async function ensureSheets() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const names = meta.data.sheets.map(s => s.properties.title);

  const requests = [];
  if (!names.includes('Users')) {
    requests.push({ addSheet: { properties: { title: 'Users' } } });
  }
  if (!names.includes('Interactions')) {
    requests.push({ addSheet: { properties: { title: 'Interactions' } } });
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests } });

    if (!names.includes('Users')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID, range: 'Users!A1:E1',
        valueInputOption: 'RAW',
        requestBody: { values: [['userId', 'name', 'animal', 'data', 'lastSync']] },
      });
    }
    if (!names.includes('Interactions')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID, range: 'Interactions!A1:H1',
        valueInputOption: 'RAW',
        requestBody: { values: [['id', 'fromId', 'fromName', 'fromAnimal', 'toId', 'type', 'timestamp', 'seen']] },
      });
    }
  }
}

// --- Routes ---

app.get('/api/ping', (req, res) => {
  res.json({ ok: true, msg: 'Deez backend is running!' });
});

app.post('/api/sync', async (req, res) => {
  try {
    const { userId, name, animal, data } = req.body;
    if (!userId || !name) return res.json({ ok: false, error: 'Missing userId or name' });

    await ensureSheets();
    const now = new Date().toISOString();

    // Read existing users
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: 'Users!A:E',
    });
    const rows = usersRes.data.values || [['userId', 'name', 'animal', 'data', 'lastSync']];

    // Find or update user
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === userId) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Users!A${i + 1}:E${i + 1}`,
          valueInputOption: 'RAW',
          requestBody: { values: [[userId, name, animal, JSON.stringify(data || {}), now]] },
        });
        found = true;
        break;
      }
    }

    if (!found) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: 'Users!A:E',
        valueInputOption: 'RAW',
        requestBody: { values: [[userId, name, animal, JSON.stringify(data || {}), now]] },
      });
    }

    // Re-read all users
    const allRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: 'Users!A:E',
    });
    const allRows = allRes.data.values || [];
    const users = [];
    for (let i = 1; i < allRows.length; i++) {
      let udata = {};
      try { udata = JSON.parse(allRows[i][3] || '{}'); } catch (e) {}
      users.push({
        userId: allRows[i][0],
        name: allRows[i][1],
        animal: parseInt(allRows[i][2]) || 0,
        data: udata,
        lastSync: allRows[i][4],
        isMe: allRows[i][0] === userId,
      });
    }

    // Get unseen interactions for this user
    const interRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID, range: 'Interactions!A:H',
    });
    const interRows = interRes.data.values || [];
    const notifications = [];
    const seenUpdates = [];

    for (let i = 1; i < interRows.length; i++) {
      if (interRows[i][4] === userId && interRows[i][7] !== 'TRUE' && interRows[i][7] !== 'true') {
        notifications.push({
          id: interRows[i][0],
          fromId: interRows[i][1],
          fromName: interRows[i][2],
          fromAnimal: parseInt(interRows[i][3]) || 0,
          type: interRows[i][5],
          timestamp: interRows[i][6],
        });
        seenUpdates.push({
          range: `Interactions!H${i + 1}`,
          values: [['TRUE']],
        });
      }
    }

    // Mark as seen
    if (seenUpdates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: seenUpdates },
      });
    }

    // Clean up old interactions (>24h)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const deleteRows = [];
    for (let i = interRows.length - 1; i >= 1; i--) {
      try {
        if (new Date(interRows[i][6]).getTime() < cutoff) deleteRows.push(i);
      } catch (e) {}
    }
    if (deleteRows.length > 0) {
      const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
      const interSheet = sheetMeta.data.sheets.find(s => s.properties.title === 'Interactions');
      if (interSheet) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_ID,
          requestBody: {
            requests: deleteRows.map(i => ({
              deleteDimension: {
                range: {
                  sheetId: interSheet.properties.sheetId,
                  dimension: 'ROWS',
                  startIndex: i,
                  endIndex: i + 1,
                },
              },
            })),
          },
        });
      }
    }

    res.json({ ok: true, users, notifications });
  } catch (err) {
    console.error('Sync error:', err);
    res.json({ ok: false, error: err.message });
  }
});

app.post('/api/interact', async (req, res) => {
  try {
    const { fromId, fromName, fromAnimal, toId, type } = req.body;
    if (!fromId || !toId || !type) return res.json({ ok: false, error: 'Missing fields' });

    await ensureSheets();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'Interactions!A:H',
      valueInputOption: 'RAW',
      requestBody: { values: [[id, fromId, fromName, fromAnimal, toId, type, now, 'FALSE']] },
    });

    res.json({ ok: true, id });
  } catch (err) {
    console.error('Interact error:', err);
    res.json({ ok: false, error: err.message });
  }
});

// --- Start ---
const PORT = 3001;
app.listen(PORT, () => console.log(`Deez backend running on http://localhost:${PORT}`));
