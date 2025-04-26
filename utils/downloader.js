const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

module.exports.downloadWebsite = async (url, depth = 1) => {
  const jobId = uuidv4();
  const downloadDir = path.join(__dirname, '../downloads', jobId);
  await fs.ensureDir(downloadDir);

  const downloadedUrls = new Set();
  const queue = [{ url, depth: 0 }];
  const errors = [];
  let downloadedCount = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth > depth) continue;

    try {
      if (downloadedUrls.has(current.url)) continue;
      downloadedUrls.add(current.url);

      const response = await axios.get(current.url, {
        responseType: 'text',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebsiteDownloader/1.0'
        }
      });

      const $ = cheerio.load(response.data);
      const urlObj = new URL(current.url);
      
      let savePath = path.join(downloadDir, urlObj.pathname === '/' ? 'index.html' : urlObj.pathname);
      if (savePath.endsWith('/')) savePath += 'index.html';
      
      await fs.ensureDir(path.dirname(savePath));
      await fs.writeFile(savePath, response.data);
      downloadedCount++;

      // Process assets
      const assetSelectors = [
        'link[href]', 
        'script[src]', 
        'img[src]', 
        'source[src]', 
        'video[src]', 
        'audio[src]',
        'meta[content]',
        'object[data]'
      ];

      const assets = [];
      $(assetSelectors.join(',')).each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('href') || $(el).attr('content') || $(el).attr('data');
        if (src && !src.startsWith('data:')) {
          try {
            const assetUrl = new URL(src, current.url).toString();
            assets.push(assetUrl);
          } catch (e) {
            console.error(`Invalid URL: ${src}`);
          }
        }
      });

      for (const assetUrl of assets) {
        if (!downloadedUrls.has(assetUrl)) {
          queue.push({ url: assetUrl, depth: current.depth + 1 });
        }
      }

      // Process internal links
      if (current.depth < depth) {
        $('a[href]').each((i, el) => {
          const href = $(el).attr('href');
          try {
            const linkUrl = new URL(href, current.url).toString();
            if (linkUrl.startsWith(urlObj.origin)) {
              queue.push({ url: linkUrl, depth: current.depth + 1 });
            }
          } catch (e) {
            console.error(`Invalid URL: ${href}`);
          }
        });
      }

    } catch (error) {
      errors.push({
        url: current.url,
        error: error.message
      });
    }
  }

  // Create zip file
  const zipPath = path.join(__dirname, '../downloads', `${jobId}.zip`);
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', err => reject(err));

    archive.pipe(output);
    archive.directory(downloadDir, false);
    archive.finalize();
  });

  // Cleanup temp files
  await fs.remove(downloadDir);

  return {
    jobId,
    downloaded: downloadedCount,
    errors,
    originalUrl: url
  };
};