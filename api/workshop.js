const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const express = require('express');
const axios = require('axios');
const archiver = new require('archiver');

const tmpFolder = path.resolve(__dirname, 'tmp');

const app = express();
app.use(express.json());

async function getWorkshopItems(wsIds) {
  let ids = [];
  if (Array.isArray(wsIds)) {
    ids = wsIds;
  } else {
    ids = [wsIds];
  }
  const params = new URLSearchParams();
  params.append('itemcount', ids.length + '');
  for (const i in ids) {
    params.append(`publishedfileids[${i}]`, ids[i] + '');
  }
  const response = await axios.post(
      'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
      params,
      {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
      },
  );
  return response.data.response.publishedfiledetails;
}

app.post('/', async (req, res) => {
  const ids = req.body;
  const response = await getWorkshopItems(ids);

  res.send(response);
});

app.post('/downloadmap', async (req, res) => {
  try {
    const url = req.body.file_url;
    console.log(url);
    const dlRes = await axios.get(url, { responseType: 'stream' });
    dlRes.data.pipe(unzipper.ParseOne()).pipe(res);
  } catch (err) {
    console.log(err);
    res.send('error');
  }
});

app.get('/createzip', async (req, res) => {
  try {
    if (fs.existsSync(tmpFolder)) {
      fs.rmSync(tmpFolder, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpFolder);
    const ids = req.query.id;
    const workshopItems = await getWorkshopItems(ids);
    const files = [];
    for (const item of workshopItems) {
      const dlRes = await axios.get(item.file_url, { responseType: 'stream' });
      const filename = item.filename.substring(
        item.filename.lastIndexOf("/") + 1
      );
      const dest = path.resolve(tmpFolder, filename);
      files.push(dest);
      await new Promise(resolve => {
        dlRes.data
          .pipe(unzipper.ParseOne())
          .pipe(fs.createWriteStream(dest))
          .on('finish', resolve);
      })
    }
    const zipName = path.resolve(tmpFolder, 'maps.zip');
    await new Promise(resolve => {
      const archive = archiver('zip', {
        zlib: { level: 6 },
      });

      const outputStream = fs.createWriteStream(zipName);

      archive.on('error', () => resolve(false));
      outputStream.on('close', () => resolve(true));

      archive.pipe(outputStream);

      for (const file of files) {
        archive.file(file, {
          name: path.basename(file)
        });
      }

      archive.finalize();
    });
    res.setHeader('Content-Disposition', 'attachment; filename=maps.zip');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(zipName);
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

export default {
  path: '/api/workshop',
  handler: app
}
