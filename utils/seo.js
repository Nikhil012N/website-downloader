module.exports.generateSEO = (options = {}) => {
    const defaultOptions = {
      title: 'Website Downloader - Download Entire Websites for Offline Use',
      description: 'Free online tool to download complete websites including HTML, CSS, JavaScript and images.',
      keywords: 'website downloader, save website offline, webpage saver, site mirroring tool',
      canonicalUrl: '',
      imageUrl: '',
      twitterHandle: '@yourhandle',
      author: 'Your Name',
      themeColor: '#3182ce',
      ogType: 'website',
      fbAppId: '',
      locale: 'en_US'
    };
  
    const seo = { ...defaultOptions, ...options };
  
    // Structured data for rich snippets
    seo.structuredData = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": seo.title,
      "description": seo.description,
      "url": seo.canonicalUrl,
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    });
  
    return seo;
  };