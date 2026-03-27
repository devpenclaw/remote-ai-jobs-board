const express = require('express');
const { createClient } = require('@libsql/client');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Turso database connection
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://remote-ai-jobs-devpenclaw.aws-eu-west-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || ''
});

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Initialize database tables
async function initDB() {
  await db.execute(`
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
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      website TEXT,
      logo TEXT,
      subscription_tier TEXT DEFAULT 'free',
      subscription_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log('Database tables initialized');
}

// Seed sample jobs
async function seedJobs() {
  const result = await db.execute('SELECT COUNT(*) as c FROM jobs');
  const count = result.rows[0].c;
  
  if (count === 0) {
    const sampleJobs = [
      { title: 'Senior ML Engineer', company: 'OpenAI', logo: 'https://logo.clearbit.com/openai.com', desc: 'Build cutting-edge AI models that will shape the future of humanity.', req: 'Python, TensorFlow, PyTorch, 5+ years experience', salary_min: 200000, salary_max: 400000, url: 'https://openai.com/careers', tags: 'Python,TensorFlow,PyTorch,ML,AI', featured: 1 },
      { title: 'AI Research Scientist', company: 'DeepMind', logo: 'https://logo.clearbit.com/deepmind.com', desc: 'Conduct groundbreaking research in artificial intelligence.', req: 'PhD in CS/Math, Publications, Deep Learning', salary_min: 180000, salary_max: 350000, url: 'https://deepmind.com/careers', tags: 'Research,Deep Learning,NLP,Computer Vision', featured: 1 },
      { title: 'Remote AI Engineer', company: 'Anthropic', logo: 'https://logo.clearbit.com/anthropic.com', desc: 'Help us build reliable, interpretable, and steerable AI systems.', req: 'Python, ML frameworks, strong fundamentals', salary_min: 160000, salary_max: 300000, url: 'https://anthropic.com/careers', tags: 'Python,AI,LLM,Safety', featured: 0 },
      { title: 'Computer Vision Engineer', company: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com', desc: 'Work on autonomous driving computer vision systems.', req: 'Computer Vision, Deep Learning, C++, Python', salary_min: 150000, salary_max: 280000, url: 'https://tesla.com/careers', tags: 'Computer Vision,Deep Learning,Autonomous,Python', featured: 0 },
      { title: 'NLP Engineer', company: 'Hugging Face', logo: 'https://logo.clearbit.com/huggingface.co', desc: 'Build and open-source the future of NLP.', req: 'NLP, Transformers, Python, PyTorch', salary_min: 140000, salary_max: 250000, url: 'https://huggingface.co/careers', tags: 'NLP,Transformers,PyTorch,Open Source', featured: 1 },
      { title: 'MLOps Engineer', company: 'Scale AI', logo: 'https://logo.clearbit.com/scale.com', desc: 'Build infrastructure for ML pipelines at scale.', req: 'Kubernetes, Docker, Python, AWS/GCP', salary_min: 150000, salary_max: 220000, url: 'https://scale.com/careers', tags: 'MLOps,Kubernetes,Python,Cloud', featured: 0 }
    ];
    
    for (const job of sampleJobs) {
      await db.execute({
        sql: `INSERT INTO jobs (title, company, company_logo, description, requirements, salary_min, salary_max, apply_url, source, tags, featured, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, 1)`,
        args: [job.title, job.company, job.logo, job.desc, job.req, job.salary_min, job.salary_max, job.url, job.tags, job.featured]
      });
    }
    console.log('Seeded sample jobs');
  }
}

// API Routes

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  const { search, tag, featured, limit = 50 } = req.query;
  
  let sql = 'SELECT * FROM jobs WHERE approved = 1';
  const args = [];
  
  if (search) {
    sql += ' AND (title LIKE ? OR company LIKE ? OR tags LIKE ?)';
    args.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (tag) {
    sql += ' AND tags LIKE ?';
    args.push(`%${tag}%`);
  }
  
  if (featured === 'true') {
    sql += ' AND featured = 1';
  }
  
  sql += ' ORDER BY featured DESC, posted_at DESC LIMIT ?';
  args.push(parseInt(limit));
  
  const result = await db.execute({ sql, args });
  const jobs = result.rows.map(j => ({
    ...j,
    tags: j.tags ? j.tags.split(',') : []
  }));
  
  res.json(jobs);
});

// Get single job
app.get('/api/jobs/:id', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM jobs WHERE id = ?',
    args: [req.params.id]
  });
  
  if (result.rows.length > 0) {
    const job = result.rows[0];
    job.tags = job.tags ? job.tags.split(',') : [];
    res.json(job);
  } else {
    res.status(404).json({ error: 'Job not found' });
  }
});

// Post a job
app.post('/api/jobs', async (req, res) => {
  const { title, company, description, requirements, salary_min, salary_max, apply_url, tags, email } = req.body;
  
  if (!title || !company || !apply_url) {
    return res.status(400).json({ error: 'Title, company, and apply_url are required' });
  }
  
  const result = await db.execute({
    sql: `INSERT INTO jobs (title, company, description, requirements, salary_min, salary_max, apply_url, tags, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [title, company, description, requirements, salary_min || null, salary_max || null, apply_url, tags || '']
  });
  
  res.json({ success: true, id: result.lastInsertRowid, message: 'Job submitted for review' });
});

// Get stats
app.get('/api/stats', async (req, res) => {
  const jobsResult = await db.execute('SELECT COUNT(*) as c FROM jobs WHERE approved = 1');
  const featuredResult = await db.execute('SELECT COUNT(*) as c FROM jobs WHERE featured = 1 AND approved = 1');
  
  res.json({ 
    totalJobs: jobsResult.rows[0].c, 
    featuredJobs: featuredResult.rows[0].c 
  });
});

// Admin: Get pending jobs
app.get('/api/admin/pending', async (req, res) => {
  const result = await db.execute('SELECT * FROM jobs WHERE approved = 0 ORDER BY created_at DESC');
  res.json(result.rows);
});

// Admin: Approve job
app.post('/api/admin/approve/:id', async (req, res) => {
  await db.execute({ sql: 'UPDATE jobs SET approved = 1 WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

// Admin: Delete job
app.delete('/api/admin/jobs/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM jobs WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

// Import scrapers
const { scrapeArbeitnow, generateDemoJobs } = require('./scraper-alt');

// Scrape jobs from Arbeitnow
app.get('/api/scrape', async (req, res) => {
  const { refresh = 'false' } = req.query;
  
  console.log('[Scraper] Starting scrape...');
  
  try {
    const realJobs = await scrapeArbeitnow('AI ML');
    
    let inserted = 0;
    
    for (const job of realJobs) {
      const existing = await db.execute({
        sql: 'SELECT id FROM jobs WHERE title = ? AND company = ?',
        args: [job.title, job.company]
      });
      
      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO jobs (title, company, company_logo, description, apply_url, source, tags, approved) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          args: [job.title, job.company, job.company_logo || null, job.description || '', job.apply_url, job.source, job.tags || '']
        });
        inserted++;
      }
    }
    
    if (realJobs.length === 0 || refresh === 'true') {
      const demoJobs = generateDemoJobs(12);
      for (const job of demoJobs) {
        const existing = await db.execute({
          sql: 'SELECT id FROM jobs WHERE title = ? AND company = ?',
          args: [job.title, job.company]
        });
        
        if (existing.rows.length === 0) {
          await db.execute({
            sql: `INSERT INTO jobs (title, company, company_logo, description, requirements, salary_min, salary_max, apply_url, source, tags, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'demo', ?, 1)`,
            args: [job.title, job.company, job.company_logo || null, job.description || '', job.requirements || '', job.salary_min, job.salary_max, job.apply_url, job.tags]
          });
          inserted++;
        }
      }
    }
    
    const statsResult = await db.execute('SELECT COUNT(*) as c FROM jobs WHERE approved = 1');
    
    console.log(`[Scraper] Done. Inserted: ${inserted}, Total: ${statsResult.rows[0].c}`);
    
    res.json({ 
      success: true, 
      inserted,
      totalJobs: statsResult.rows[0].c
    });
  } catch (error) {
    console.error('[Scraper] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function start() {
  await initDB();
  await seedJobs();
  
  app.listen(PORT, () => {
    console.log(`🚀 Remote AI Jobs running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);