const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle SPA routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Page not found');
    }
  });
});

// Demo jobs data
const demoJobs = [
  { id: 1, title: 'Senior ML Engineer', company: 'OpenAI', company_logo: 'https://logo.clearbit.com/openai.com', description: 'Build cutting-edge AI models that will shape the future of humanity.', requirements: 'Python, TensorFlow, PyTorch, 5+ years experience', salary_min: 200000, salary_max: 400000, location: 'Remote', apply_url: 'https://openai.com/careers', source: 'manual', tags: ['Python', 'TensorFlow', 'PyTorch', 'ML', 'AI'], featured: 1, posted_at: new Date().toISOString() },
  { id: 2, title: 'AI Research Scientist', company: 'DeepMind', company_logo: 'https://logo.clearbit.com/deepmind.com', description: 'Conduct groundbreaking research in artificial intelligence.', requirements: 'PhD in CS/Math, Publications, Deep Learning', salary_min: 180000, salary_max: 350000, location: 'Remote', apply_url: 'https://deepmind.com/careers', source: 'manual', tags: ['Research', 'Deep Learning', 'NLP', 'Computer Vision'], featured: 1, posted_at: new Date().toISOString() },
  { id: 3, title: 'Remote AI Engineer', company: 'Anthropic', company_logo: 'https://logo.clearbit.com/anthropic.com', description: 'Help us build reliable AI systems.', requirements: 'Python, ML frameworks, strong fundamentals', salary_min: 160000, salary_max: 300000, location: 'Remote', apply_url: 'https://anthropic.com/careers', source: 'manual', tags: ['Python', 'AI', 'LLM', 'Safety'], featured: 0, posted_at: new Date().toISOString() },
  { id: 4, title: 'Computer Vision Engineer', company: 'Tesla', company_logo: 'https://logo.clearbit.com/tesla.com', description: 'Work on autonomous driving computer vision systems.', requirements: 'Computer Vision, Deep Learning, C++, Python', salary_min: 150000, salary_max: 280000, location: 'Remote', apply_url: 'https://tesla.com/careers', source: 'manual', tags: ['Computer Vision', 'Deep Learning', 'Autonomous', 'Python'], featured: 0, posted_at: new Date().toISOString() },
  { id: 5, title: 'NLP Engineer', company: 'Hugging Face', company_logo: 'https://logo.clearbit.com/huggingface.co', description: 'Build and open-source the future of NLP.', requirements: 'NLP, Transformers, Python, PyTorch', salary_min: 140000, salary_max: 250000, location: 'Remote', apply_url: 'https://huggingface.co/careers', source: 'manual', tags: ['NLP', 'Transformers', 'PyTorch', 'Open Source'], featured: 1, posted_at: new Date().toISOString() },
  { id: 6, title: 'MLOps Engineer', company: 'Scale AI', company_logo: 'https://logo.clearbit.com/scale.com', description: 'Build infrastructure for ML pipelines at scale.', requirements: 'Kubernetes, Docker, Python, AWS/GCP', salary_min: 150000, salary_max: 220000, location: 'Remote', apply_url: 'https://scale.com/careers', source: 'manual', tags: ['MLOps', 'Kubernetes', 'Python', 'Cloud'], featured: 0, posted_at: new Date().toISOString() },
  { id: 7, title: 'ML Engineer', company: 'Cohere', company_logo: 'https://logo.clearbit.com/cohere.ai', description: 'Build language models and AI APIs.', requirements: 'Python, PyTorch, NLP experience', salary_min: 170000, salary_max: 320000, location: 'Remote', apply_url: 'https://cohere.com/careers', source: 'demo', tags: ['Python', 'PyTorch', 'NLP', 'LLM'], featured: 1, posted_at: new Date().toISOString() },
  { id: 8, title: 'AI Product Manager', company: 'Runway', company_logo: 'https://logo.clearbit.com/runwayml.com', description: 'Lead AI product strategy and development.', requirements: 'AI/ML experience, Product sense, Communication', salary_min: 160000, salary_max: 280000, location: 'Remote', apply_url: 'https://runwayml.com/careers', source: 'demo', tags: ['Product', 'AI', 'Strategy'], featured: 0, posted_at: new Date().toISOString() }
];

// API Routes
app.get('/api/jobs', (req, res) => {
  const { search, tag, featured, limit = 50 } = req.query;
  let jobs = [...demoJobs];
  
  if (search) {
    const s = search.toLowerCase();
    jobs = jobs.filter(j => j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s) || j.tags.some(t => t.toLowerCase().includes(s)));
  }
  if (tag) {
    jobs = jobs.filter(j => j.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
  }
  if (featured === 'true') {
    jobs = jobs.filter(j => j.featured === 1);
  }
  res.json(jobs.slice(0, parseInt(limit)));
});

app.get('/api/jobs/:id', (req, res) => {
  const job = demoJobs.find(j => j.id === parseInt(req.params.id));
  job ? res.json(job) : res.status(404).json({ error: 'Job not found' });
});

app.post('/api/jobs', (req, res) => {
  const { title, company, apply_url } = req.body;
  if (!title || !company || !apply_url) {
    return res.status(400).json({ error: 'Title, company, and apply_url are required' });
  }
  const newJob = { id: demoJobs.length + 1, title, company, description: '', requirements: '', salary_min: 0, salary_max: 0, location: 'Remote', apply_url, source: 'manual', tags: [], featured: 0, posted_at: new Date().toISOString() };
  demoJobs.push(newJob);
  res.json({ success: true, id: newJob.id });
});

app.get('/api/stats', (req, res) => {
  res.json({ totalJobs: demoJobs.length, featuredJobs: demoJobs.filter(j => j.featured === 1).length });
});

app.get('/api/scrape', (req, res) => {
  res.json({ success: true, message: 'Demo mode', totalJobs: demoJobs.length });
});

app.listen(PORT, () => {
  console.log(`🚀 Remote AI Jobs running`);
});