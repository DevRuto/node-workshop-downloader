const fs = require('fs');
const path = require('path');
const express = require('express');
const axios = require('axios');
const JSZip = require('jszip');
const nanoid = require('nanoid/async').nanoid;

const app = express();
app.use(express.json());

app.post('/', async (req, res) => {
  const ids = req.body;
  const params = new URLSearchParams();
  params.append('itemcount', ids.length + '');
  ids.forEach((id, i) => {
      params.append(`publishedfileids[${i}]`, id + '');
  });
  const apiResult = await axios.post(
      'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
      params,
      {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
      },
  );

  res.send(apiResult.data.response.publishedfiledetails);
});

app.post('/downloadmap', async (req, res) => {
  try {
    const url = req.body.file_url;
    console.log(url);
    const data = await axios.get(url, { responseType: 'arraybuffer' });
    const zip = await JSZip.loadAsync(data.data);
    const filename = req.body.filename.substring(
      req.body.filename.lastIndexOf('/') + 1,
    );
    const stream = zip.file(filename).nodeStream();
    res.type('application/octet-stream');
    stream.pipe(res);
  } catch (err) {
    console.log(err);
    res.send('error');
  }
})

export default {
  path: '/api/workshop',
  handler: app
}
