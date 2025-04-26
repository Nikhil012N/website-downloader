require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');
const downloader = require('./utils/downloader');
const { generateSEO } = require('./utils/seo');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan('combined'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  const seo = generateSEO({
    title: 'Website Downloader - Download Entire Websites for Offline Use',
    description: 'Free online tool to download complete websites including HTML, CSS, JavaScript and images. Save websites for offline browsing.',
    keywords: 'website downloader, save website offline, webpage saver, site mirroring tool',
    canonicalUrl: 'https://yourdomain.com',
    imageUrl: 'https://yourdomain.com/images/logo.png'
  });
  res.render('index', { seo });
});

app.post('/download', async (req, res) => {
  try {
    const { url, depth } = req.body;
    
    // Validate URL
    if (!url || !url.match(/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)) {
      return res.status(400).json({ error: 'Please enter a valid URL starting with http:// or https://' });
    }

    const result = await downloader.downloadWebsite(url, parseInt(depth) || 1);
    
    const seo = generateSEO({
      title: `Download Results for ${url} | Website Downloader`,
      description: `Download results for ${url} including ${result.downloaded} resources.`,
      canonicalUrl: `https://yourdomain.com/result?url=${encodeURIComponent(url)}`,
      imageUrl: 'https://yourdomain.com/images/logo.png'
    });
    
    res.render('result', { 
      seo,
      url,
      result,
      downloadLink: `/downloads/${result.jobId}.zip`
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).render('error', { 
      seo: generateSEO({
        title: 'Error | Website Downloader',
        description: 'An error occurred while processing your request'
      }),
      error: error.message 
    });
  }
});

app.get('/downloads/:file', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', req.params.file);
  res.download(filePath, err => {
    if (err) {
      res.status(404).send('File not found or expired');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    seo: generateSEO({
      title: 'Error | Website Downloader',
      description: 'An unexpected error occurred'
    }),
    error: 'An unexpected error occurred. Please try again later.' 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});