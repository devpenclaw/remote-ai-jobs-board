const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');

// User agent rotation to avoid blocks
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function hashJob(title, company) {
  return crypto.createHash('md5').update(title + company).digest('hex');
}

// ============ INDEED SCRAPER ============
async function scrapeIndeed(keyword, maxJobs = 20) {
  const jobs = [];
  const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}&l=Remote&sort=date`;
  
  console.log(`[Indeed] Scraping: ${keyword}`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    let jobCount = 0;
    
    $('div.job_seen_beacon').each((i, el) => {
      if (jobCount >= maxJobs) return false;
      
      const title = $(el).find('h2.jobTitle a').text().trim() || $(el).find('span').first().text().trim();
      const company = $(el).find('span.companyName').text().trim();
      const location = $(el).find('div.companyLocation').text().trim();
      const snippet = $(el).find('div.job-snippet').text().trim();
      const salary = $(el).find('div.metadata.salarySnippet').text().trim() || $(el).find('span.salaryText').text().trim();
      const link = 'https://www.indeed.com' + ($(el).find('h2.jobTitle a').attr('href') || '');
      
      if (title && company) {
        jobs.push({
          title: title.replace(/^new/g, '').trim(),
          company,
          location: location || 'Remote',
          description: snippet || 'Remote AI/ML position',
          salary: salary || null,
          apply_url: link,
          source: 'indeed',
          job_id: hashJob(title, company),
          scraped_at: new Date().toISOString()
        });
        jobCount++;
      }
    });
    
    console.log(`[Indeed] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[Indeed] Error: ${error.message}`);
  }
  
  return jobs;
}

// ============ LINKEDIN SCRAPER ============
async function scrapeLinkedIn(keyword, maxJobs = 20) {
  const jobs = [];
  // LinkedIn requires authentication, so we'll use a different approach
  // Try to get public job listings
  const url = `https://www.linkedin.com/jobs/search?keywords=${encodeURIComponent(keyword)}&location=Remote&f_TPR=r2592000`;
  
  console.log(`[LinkedIn] Scraping: ${keyword}`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml',
        'Cookie': '', // Would need real cookies for full access
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    let jobCount = 0;
    
    // LinkedIn's class names change often, try multiple selectors
    $('.job-card-container, .occludable-event, .base-card').each((i, el) => {
      if (jobCount >= maxJobs) return false;
      
      const title = $(el).find('.job-card-list__title, .job-title, h3').first().text().trim();
      const company = $(el).find('.job-card-container__company-name, .company-name, .sub-title').first().text().trim();
      const location = $(el).find('.job-card-container__metadata-item, .job-location, .metadata').first().text().trim();
      const link = 'https://linkedin.com' + ($(el).find('a').first().attr('href') || '');
      
      if (title && company) {
        jobs.push({
          title,
          company,
          location: location || 'Remote',
          description: 'Remote position',
          salary: null,
          apply_url: link,
          source: 'linkedin',
          job_id: hashJob(title, company),
          scraped_at: new Date().toISOString()
        });
        jobCount++;
      }
    });
    
    console.log(`[LinkedIn] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[LinkedIn] Error: ${error.message}`);
  }
  
  return jobs;
}

// ============ GLASSDOOR SCRAPER ============
async function scrapeGlassdoor(keyword, maxJobs = 20) {
  const jobs = [];
  const url = `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodeURIComponent(keyword)}&locT=C&locId=1&locKeyword=Remote`;
  
  console.log(`[Glassdoor] Scraping: ${keyword}`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html',
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    let jobCount = 0;
    
    $('.jobListing').each((i, el) => {
      if (jobCount >= maxJobs) return false;
      
      const title = $(el).find('.jobTitle').text().trim();
      const company = $(el).find('.companyName').text().trim();
      const location = $(el).find('.location').text().trim();
      const description = $(el).find('.description').text().trim();
      const salary = $(el).find('.salary').text().trim();
      const link = 'https://glassdoor.com' + ($(el).find('a').attr('href') || '');
      
      if (title && company) {
        jobs.push({
          title,
          company,
          location: location || 'Remote',
          description: description || 'Remote position',
          salary: salary || null,
          apply_url: link,
          source: 'glassdoor',
          job_id: hashJob(title, company),
          scraped_at: new Date().toISOString()
        });
        jobCount++;
      }
    });
    
    console.log(`[Glassdoor] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[Glassdoor] Error: ${error.message}`);
  }
  
  return jobs;
}

// ============ REMOTEOK SCRAPER ============
async function scrapeRemoteOk(keyword, maxJobs = 20) {
  const jobs = [];
  const url = `https://remoteok.com/remote-${keyword.toLowerCase().replace(/\s+/g, '-')}-jobs`;
  
  console.log(`[RemoteOK] Scraping: ${keyword}`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html',
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    let jobCount = 0;
    
    $('tr.job').each((i, el) => {
      if (jobCount >= maxJobs) return false;
      
      const title = $(el).find('h2').text().trim() || $(el).attr('data-job-title') || '';
      const company = $(el).find('.company h3, .company_link').text().trim();
      const tags = $(el).find('.tags .tag').map((i, t) => $(t).text().trim()).get().join(', ');
      const salary = $(el).find('.salary').text().trim();
      const link = 'https://remoteok.com' + ($(el).find('a').attr('href') || '');
      
      if (title && company) {
        jobs.push({
          title,
          company,
          location: 'Remote',
          description: tags || 'Remote position',
          salary: salary || null,
          apply_url: link,
          source: 'remoteok',
          job_id: hashJob(title, company),
          scraped_at: new Date().toISOString()
        });
        jobCount++;
      }
    });
    
    console.log(`[RemoteOK] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[RemoteOK] Error: ${error.message}`);
  }
  
  return jobs;
}

// ============ WEWORKREMOTELY SCRAPER ============
async function scrapeWeWorkRemotely(keyword, maxJobs = 20) {
  const jobs = [];
  const url = `https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(keyword)}`;
  
  console.log(`[WeWorkRemotely] Scraping: ${keyword}`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html',
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    let jobCount = 0;
    
    $('li.job').each((i, el) => {
      if (jobCount >= maxJobs) return false;
      
      const title = $(el).find('.title').text().trim();
      const company = $(el).find('.company').text().trim();
      const location = $(el).find('.region, .location').text().trim();
      const tags = $(el).find('.tags .tag').map((i, t) => $(t).text().trim()).get().join(', ');
      const link = 'https://weworkremotely.com' + ($(el).find('a').attr('href') || '');
      
      if (title && company) {
        jobs.push({
          title,
          company,
          location: location || 'Remote',
          description: tags || 'Remote position',
          salary: null,
          apply_url: link,
          source: 'weworkremotely',
          job_id: hashJob(title, company),
          scraped_at: new Date().toISOString()
        });
        jobCount++;
      }
    });
    
    console.log(`[WeWorkRemotely] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[WeWorkRemotely] Error: ${error.message}`);
  }
  
  return jobs;
}

// ============ REMOTIVE SCRAPER ============
async function scrapeRemotive(keyword, maxJobs = 20) {
  const jobs = [];
  const url = `https://remotive.com/remote-jobs/software/${keyword.toLowerCase().replace(/\s+/g, '-')}`;
  
  console.log(`[Remotive] Scraping: ${keyword}`);
  
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html',
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(data);
    let jobCount = 0;
    
    $('.job').each((i, el) => {
      if (jobCount >= maxJobs) return false;
      
      const title = $(el).find('.position h2').text().trim() || $(el).find('.title').text().trim();
      const company = $(el).find('.company-name').text().trim();
      const tags = $(el).find('.tags .tag').map((i, t) => $(t).text().trim()).get().join(', ');
      const link = $(el).find('a').attr('href') || '';
      
      if (title && company) {
        jobs.push({
          title,
          company,
          location: 'Remote',
          description: tags || 'Remote position',
          salary: null,
          apply_url: link.startsWith('http') ? link : 'https://remotive.com' + link,
          source: 'remotive',
          job_id: hashJob(title, company),
          scraped_at: new Date().toISOString()
        });
        jobCount++;
      }
    });
    
    console.log(`[Remotive] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[Remotive] Error: ${error.message}`);
  }
  
  return jobs;
}

// ============ AI JOBS AGGREGATOR ============
async function scrapeAll(keyword = 'AI ML Engineer', maxPerSource = 15) {
  console.log(`\n🚀 Starting job scrape for: "${keyword}"\n`);
  
  const allJobs = [];
  const sources = [
    () => scrapeIndeed(keyword, maxPerSource),
    () => scrapeRemoteOk(keyword, maxPerSource),
    () => scrapeWeWorkRemotely(keyword, maxPerSource),
    () => scrapeRemotive(keyword, maxPerSource),
  ];
  
  // Run scrapers with delays to avoid rate limits
  for (const scraper of sources) {
    const jobs = await scraper();
    allJobs.push(...jobs);
    await delay(1000 + Math.random() * 2000); // 1-3 second delay between sources
  }
  
  // Deduplicate by job_id
  const seen = new Set();
  const uniqueJobs = allJobs.filter(job => {
    if (seen.has(job.job_id)) return false;
    seen.add(job.job_id);
    return true;
  });
  
  console.log(`\n📊 Total: ${allJobs.length} jobs found, ${uniqueJobs.length} unique after dedup\n`);
  
  return uniqueJobs;
}

module.exports = { scrapeAll, scrapeIndeed, scrapeRemoteOk, scrapeWeWorkRemotely, scrapeRemotive };