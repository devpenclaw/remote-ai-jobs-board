const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');
const cors = require('cors');

const app = express();
const db = new Database('jobs.db');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Initialize database
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      company_logo TEXT,
      description TEXT,
      requirements TEXT,
      salary_min INTEGER,
      salary_max INTEGER,
      currency TEXT DEFAULT 'USD',
      location TEXT DEFAULT 'Remote',
      apply_url TEXT NOT NULL,
      source TEXT DEFAULT 'manual',
      source_url TEXT,
      tags TEXT,
      posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      featured INTEGER DEFAULT 0,
      approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      website TEXT,
      logo TEXT,
      subscription_tier TEXT DEFAULT 'free',
      subscription_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Database initialized');
}

// Seed sample jobs
function seedJobs() {
  const count = db.prepare('SELECT COUNT(*) as c FROM jobs').get();
  if (count.c === 0) {
    const sampleJobs = [
      {
        title: 'Senior ML Engineer',
        company: 'OpenAI',
        company_logo: 'https://logo.clearbit.com/openai.com',
        description: 'Build cutting-edge AI models that will shape the future of humanity.',
        requirements: 'Python, TensorFlow, PyTorch, 5+ years experience',
        salary_min: 200000,
        salary_max: 400000,
        apply_url: 'https://openai.com/careers',
        source: 'manual',
        tags: 'Python,TensorFlow,PyTorch,ML,AI',
        featured: 1
      },
      {
        title: 'AI Research Scientist',
        company: 'DeepMind',
        company_logo: 'https://logo.clearbit.com/deepmind.com',
        description: 'Conduct groundbreaking research in artificial intelligence.',
        requirements: 'PhD in CS/Math, Publications, Deep Learning',
        salary_min: 180000,
        salary_max: 350000,
        apply_url: 'https://deepmind.com/careers',
        source: 'manual',
        tags: 'Research,Deep Learning,NLP,Computer Vision',
        featured: 1
      },
      {
        title: 'Remote AI Engineer',
        company: 'Anthropic',
        company_logo: 'https://logo.clearbit.com/anthropic.com',
        description: 'Help us build reliable, interpretable, and steerable AI systems.',
        requirements: 'Python, ML frameworks, strong fundamentals',
        salary_min: 160000,
        salary_max: 300000,
        apply_url: 'https://anthropic.com/careers',
        source: 'manual',
        tags: 'Python,AI,LLM,Safety',
        featured: 0
      },
      {
        title: 'Computer Vision Engineer',
        company: 'Tesla',
        company_logo: 'https://logo.clearbit.com/tesla.com',
        description: 'Work on autonomous driving computer vision systems.',
        requirements: 'Computer Vision, Deep Learning, C++, Python',
        salary_min: 150000,
        salary_max: 280000,
        apply_url: 'https://tesla.com/careers',
        source: 'manual',
        tags: 'Computer Vision,Deep Learning,Autonomous,Python',
        featured: 0
      },
      {
        title: 'NLP Engineer',
        company: 'Hugging Face',
        company_logo: 'https://logo.clearbit.com/huggingface.co',
        description: 'Build and open-source the future of NLP.',
        requirements: 'NLP, Transformers, Python, PyTorch',
        salary_min: 140000,
        salary_max: 250000,
        apply_url: 'https://huggingface.co/careers',
        source: 'manual',
        tags: 'NLP,Transformers,PyTorch,Open Source',
        featured: 1
      },
      {
        title: 'MLOps Engineer',
        company: 'Scale AI',
        company_logo: 'https://logo.clearbit.com/scale.com',
        description: 'Build infrastructure for ML pipelines at scale.',
        requirements: 'Kubernetes, Docker, Python, AWS/GCP',
        salary_min: 150000,
        salary_max: 220000,
        apply_url: 'https://scale.com/careers',
        source: 'manual',
        tags: 'MLOps,Kubernetes,Python,Cloud',
        featured: 0
      }
    ];

    const stmt = db.prepare(`
      INSERT INTO jobs (title, company, company_logo, description, requirements, salary_min, salary_max, apply_url, source, tags, featured)
      VALUES (@title, @company, @company_logo, @description, @requirements, @salary_min, @salary_max, @apply_url, @source, @tags, @featured)
    `);

    for (const job of sampleJobs) {
      stmt.run(job);
    }
    console.log('Seeded sample jobs');
  }
}

// API Routes

// Get all jobs
app.get('/api/jobs', (req, res) => {
  const { search, tags, featured, limit = 50 } = req.query;
  
  let query = 'SELECT * FROM jobs WHERE approved = 1';
  const params = [];
  
  if (search) {
    query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (featured === 'true') {
    query += ' AND featured = 1';
  }
  
  query += ' ORDER BY featured DESC, posted_at DESC LIMIT ?';
  params.push(parseInt(limit));
  
  const jobs = db.prepare(query).all(...params);
  
  // Parse tags JSON
  const formatted = jobs.map(j => ({
    ...j,
    tags: j.tags ? j.tags.split(',') : []
  }));
  
  res.json(formatted);
});

// Get single job
app.get('/api/jobs/:id', (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (job) {
    job.tags = job.tags ? job.tags.split(',') : [];
  }
  res.json(job || { error: 'Job not found' });
});

// Search jobs (external scraper simulation)
app.get('/api/search', async (req, res) => {
  const { q = 'AI ML engineer remote' } = req.query;
  
  // In production, this would scrape multiple job boards
  // For now, return existing jobs
  const jobs = db.prepare(`
    SELECT * FROM jobs 
    WHERE approved = 1 
    AND (title LIKE ? OR company LIKE ? OR tags LIKE ?)
    ORDER BY featured DESC, posted_at DESC
  `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  
  res.json(jobs.map(j => ({ ...j, tags: j.tags ? j.tags.split(',') : [] })));
});

// Post a job (manual submission)
app.post('/api/jobs', (req, res) => {
  const { title, company, description, requirements, salary_min, salary_max, apply_url, tags, email } = req.body;
  
  if (!title || !company || !apply_url) {
    return res.status(400).json({ error: 'Title, company, and apply_url are required' });
  }
  
  // Create company if not exists
  let companyRow = db.prepare('SELECT * FROM companies WHERE email = ?').get(email);
  if (!companyRow && email) {
    db.prepare('INSERT INTO companies (name, email) VALUES (?, ?)').run(company, email);
    companyRow = db.prepare('SELECT * FROM companies WHERE email = ?').get(email);
  }
  
  const result = db.prepare(`
    INSERT INTO jobs (title, company, description, requirements, salary_min, salary_max, apply_url, tags, approved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(title, company, description, requirements, salary_min || null, salary_max || null, apply_url, tags || '');
  
  res.json({ success: true, id: result.lastInsertRowid, message: 'Job submitted for review' });
});

// Get stats
app.get('/api/stats', (req, res) => {
  const totalJobs = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE approved = 1').get().c;
  const featuredJobs = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE featured = 1 AND approved = 1').get().c;
  
  res.json({ totalJobs, featuredJobs });
});

// Admin: Get pending jobs
app.get('/api/admin/pending', (req, res) => {
  const jobs = db.prepare('SELECT * FROM jobs WHERE approved = 0 ORDER BY created_at DESC').all();
  res.json(jobs);
});

// Admin: Approve job
app.post('/api/admin/approve/:id', (req, res) => {
  db.prepare('UPDATE jobs SET approved = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Admin: Delete job
app.delete('/api/admin/jobs/:id', (req, res) => {
  db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Import scrapers
const { scrapeArbeitnow, generateDemoJobs } = require('./scraper-alt');

// Scrape jobs from Arbeitnow + add demo jobs
app.get('/api/scrape', async (req, res) => {
  const { refresh = 'false' } = req.query;
  
  console.log(`[Scraper] Starting scrape...`);
  
  try {
    // Get real jobs from Arbeitnow
    const realJobs = await scrapeArbeitnow('AI ML');
    
    // Get existing count
    const beforeCount = db.prepare('SELECT COUNT(*) as c FROM jobs').get().c;
    
    let inserted = 0;
    
    // Insert real jobs
    const checkStmt = db.prepare('SELECT id FROM jobs WHERE title = ? AND company = ?');
    const insertStmt = db.prepare(`
      INSERT INTO jobs (title, company, company_logo, description, apply_url, source, tags, approved)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    for (const job of realJobs) {
      const existing = checkStmt.get(job.title, job.company);
      if (!existing) {
        insertStmt.run(
          job.title,
          job.company,
          job.company_logo || null,
          job.description || '',
          job.apply_url,
          job.source,
          job.tags || ''
        );
        inserted++;
      }
    }
    
    // If no jobs or refresh=true, add demo jobs
    if (realJobs.length === 0 || refresh === 'true') {
      const demoJobs = generateDemoJobs(12);
      for (const job of demoJobs) {
        const existing = checkStmt.get(job.title, job.company);
        if (!existing) {
          insertStmt.run(
            job.title,
            job.company,
            job.company_logo || null,
            job.description || '',
            job.apply_url,
            'demo',
            job.tags || '',
          );
          inserted++;
        }
      }
    }
    
    const afterCount = db.prepare('SELECT COUNT(*) as c FROM jobs').get().c;
    
    console.log(`[Scraper] Done. Inserted: ${inserted}, Total: ${afterCount}`);
    
    res.json({ 
      success: true, 
      inserted,
      totalJobs: afterCount,
      realJobs: realJobs.length,
      demoJobs: inserted - realJobs.length
    });
  } catch (error) {
    console.error('[Scraper] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Auto-scrape on schedule
app.get('/api/scrape/auto', async (req, res) => {
  const keywords = ['AI ML', 'machine learning', 'data scientist', 'NLP', 'deep learning'];
  
  let totalInserted = 0;
  
  for (const keyword of keywords) {
    const jobs = await scrapeArbeitnow(keyword);
    
    const checkStmt = db.prepare('SELECT id FROM jobs WHERE title = ? AND company = ?');
    const insertStmt = db.prepare(`
      INSERT INTO jobs (title, company, description, apply_url, source, tags, approved)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    
    for (const job of jobs) {
      const existing = checkStmt.get(job.title, job.company);
      if (!existing) {
        insertStmt.run(
          job.title,
          job.company,
          job.description || '',
          job.apply_url,
          job.source,
          job.tags || ''
        );
        totalInserted++;
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
  }
  
  res.json({ success: true, totalInserted });
});

// Start server
const PORT = process.env.PORT || 3000;

initDB();
seedJobs();

app.listen(PORT, () => {
  console.log(`🚀 Remote AI Jobs running at http://localhost:${PORT}`);
  console.log(`📊 Admin stats: http://localhost:${PORT}/api/stats`);
});