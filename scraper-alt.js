const axios = require('axios');

// Try Arbeitnow - free job board with public API
async function scrapeArbeitnow(keyword, maxJobs = 20) {
  const jobs = [];
  
  try {
    console.log(`[Arbeitnow] Scraping: ${keyword}`);
    
    // Arbeitnow has a public job board
    const { data } = await axios.get('https://www.arbeitnow.com/api/job-board-api', {
      timeout: 15000,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (data.data) {
      data.data.forEach(job => {
        // Filter for remote and AI-related
        const isRemote = job.location === 'Remote' || job.tags?.some(t => 
          t.toLowerCase().includes('remote') || t.toLowerCase().includes('ai')
        );
        const isAI = job.title.toLowerCase().includes('ai') || 
                    job.title.toLowerCase().includes('machine learning') ||
                    job.title.toLowerCase().includes('data') ||
                    job.tags?.some(t => 
                      t.toLowerCase().includes('ai') || 
                      t.toLowerCase().includes('machine learning') ||
                      t.toLowerCase().includes('python')
                    );
        
        if (isRemote && (isAI || keyword.toLowerCase().includes('ai'))) {
          jobs.push({
            title: job.title,
            company: job.company_name || job.company,
            location: job.location || 'Remote',
            description: job.description?.substring(0, 500) || 'Remote position',
            salary: job.salary_range || null,
            apply_url: job.url || job.apply_url,
            source: 'arbeitnow',
            job_id: job.slug || `${job.title}-${job.company}`,
            tags: job.tags?.join(', ') || '',
            posted_at: job.created_at || new Date().toISOString()
          });
        }
      });
    }
    
    console.log(`[Arbeitnow] Found ${jobs.length} AI/remote jobs`);
  } catch (error) {
    console.log(`[Arbeitnow] Error: ${error.message}`);
  }
  
  return jobs;
}

// Try Jooble as alternative
async function scrapeJooble(keyword, maxJobs = 20) {
  const jobs = [];
  
  try {
    console.log(`[Jooble] Scraping: ${keyword}`);
    
    // Jooble has a simple search API
    const { data } = await axios.post('https://www.jooble.org/api/', {
      keywords: keyword + ' remote',
      location: '',
      page: 1
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (data.jobs) {
      data.jobs.slice(0, maxJobs).forEach(job => {
        jobs.push({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.snippet || '',
          salary: job.salary || null,
          apply_url: job.link,
          source: 'jooble',
          job_id: `${job.title}-${job.company}`.replace(/\s+/g, '-'),
          posted_at: job.postdate || new Date().toISOString()
        });
      });
    }
    
    console.log(`[Jooble] Found ${jobs.length} jobs`);
  } catch (error) {
    console.log(`[Jooble] Error: ${error.message}`);
  }
  
  return jobs;
}

// Try JSearch (RapidAPI free tier)
async function scrapeJSearch(keyword, maxJobs = 20) {
  const jobs = [];
  
  // This would require a RapidAPI key
  // For now, return empty - user can add their own key
  console.log(`[JSearch] Requires RapidAPI key - skipping`);
  
  return jobs;
}

// Generate fake AI jobs for demo purposes
function generateDemoJobs(count = 10) {
  const companies = [
    { name: 'Anthropic', logo: 'https://logo.clearbit.com/anthropic.com' },
    { name: 'Cohere', logo: 'https://logo.clearbit.com/cohere.ai' },
    { name: 'Scale AI', logo: 'https://logo.clearbit.com/scale.com' },
    { name: 'Runway', logo: 'https://logo.clearbit.com/runwayml.com' },
    { name: 'Stability AI', logo: 'https://logo.clearbit.com/stability.ai' },
    { name: 'Midjourney', logo: 'https://logo.clearbit.com/midjourney.com' },
    { name: 'Hugging Face', logo: 'https://logo.clearbit.com/huggingface.co' },
    { name: 'Replicate', logo: 'https://logo.clearbit.com/replicate.com' },
    { name: 'LangChain', logo: 'https://logo.clearbit.com/langchain.com' },
    { name: 'Vercel', logo: 'https://logo.clearbit.com/vercel.com' },
    { name: 'Paperspace', logo: 'https://logo.clearbit.com/paperspace.com' },
    { name: 'Weights & Biases', logo: 'https://logo.clearbit.com/wandb.com' }
  ];
  
  const titles = [
    'Senior ML Engineer',
    'AI Research Scientist',
    'NLP Engineer',
    'Computer Vision Engineer',
    'MLOps Engineer',
    'Deep Learning Engineer',
    'AI Product Manager',
    'Data Scientist',
    'AI Developer',
    'Machine Learning Scientist'
  ];
  
  const tags = [
    ['Python', 'PyTorch', 'ML', 'Remote'],
    ['TensorFlow', 'Deep Learning', 'AI', 'Remote'],
    ['NLP', 'Transformers', 'Python', 'Remote'],
    ['Computer Vision', 'ML', 'Python', 'Remote'],
    ['Kubernetes', 'MLOps', 'AWS', 'Remote'],
    ['PyTorch', 'Research', 'AI', 'Remote'],
    ['LLM', 'LangChain', 'Python', 'Remote'],
    ['Data Science', 'ML', 'Python', 'Remote'],
    ['AI/ML', 'Python', 'Research', 'Remote'],
    ['ML', 'Statistics', 'Python', 'Remote']
  ];
  
  const jobs = [];
  
  for (let i = 0; i < count; i++) {
    const company = companies[i % companies.length];
    const title = titles[i % titles.length];
    const tagList = tags[i % tags.length];
    
    jobs.push({
      title,
      company: company.name,
      company_logo: company.logo,
      location: 'Remote',
      description: `Join ${company.name} as a ${title} and work on cutting-edge AI technology.`,
      requirements: tagList.join(', '),
      salary_min: 120000 + Math.floor(Math.random() * 150000),
      salary_max: 200000 + Math.floor(Math.random() * 200000),
      apply_url: `https://${company.name.toLowerCase().replace(/\s+/g, '')}.com/careers`,
      source: 'demo',
      tags: tagList.join(','),
      featured: Math.random() > 0.7 ? 1 : 0,
      job_id: `demo-${i}-${Date.now()}`
    });
  }
  
  return jobs;
}

module.exports = { scrapeArbeitnow, scrapeJooble, scrapeJSearch, generateDemoJobs };