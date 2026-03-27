const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const publicPath = path.join(__dirname, "public");

// Enhanced job data with more fields
const demoJobs = [
  { id: 1, title: "Senior ML Engineer", company: "OpenAI", company_logo: "🤖", description: "Build cutting-edge AI models.", requirements: "Python, TensorFlow, PyTorch, 5+ years exp", salary_min: 200000, salary_max: 400000, location: "Remote", apply_url: "https://openai.com/careers", source: "manual", tags: ["Python", "TensorFlow", "PyTorch", "ML", "AI"], featured: 1, posted_at: new Date().toISOString(), experience_level: "Senior", company_size: "1000+" },
  { id: 2, title: "AI Research Scientist", company: "DeepMind", company_logo: "🧠", description: "Conduct groundbreaking AI research.", requirements: "PhD, Deep Learning", salary_min: 180000, salary_max: 350000, location: "Remote", apply_url: "https://deepmind.com/careers", source: "manual", tags: ["Research", "Deep Learning", "NLP", "AI"], featured: 1, posted_at: new Date().toISOString(), experience_level: "Senior", company_size: "1000+" },
  { id: 3, title: "Junior AI Engineer", company: "Anthropic", company_logo: "🧩", description: "Build reliable AI systems.", requirements: "Python, ML frameworks, 1+ years exp", salary_min: 120000, salary_max: 180000, location: "Remote", apply_url: "https://anthropic.com/careers", source: "manual", tags: ["Python", "AI", "LLM"], featured: 0, posted_at: new Date().toISOString(), experience_level: "Junior", company_size: "100-500" },
  { id: 4, title: "Computer Vision Engineer", company: "Tesla", company_logo: "🚗", description: "Work on autonomous driving.", requirements: "Computer Vision, Deep Learning, 3+ years", salary_min: 150000, salary_max: 280000, location: "Remote", apply_url: "https://tesla.com/careers", source: "manual", tags: ["Computer Vision", "Deep Learning", "ML"], featured: 0, posted_at: new Date().toISOString(), experience_level: "Mid", company_size: "1000+" },
  { id: 5, title: "NLP Engineer", company: "Hugging Face", company_logo: "💬", description: "Build open-source NLP.", requirements: "NLP, Transformers, Python", salary_min: 140000, salary_max: 250000, location: "Remote", apply_url: "https://huggingface.co/careers", source: "manual", tags: ["NLP", "Transformers", "PyTorch"], featured: 1, posted_at: new Date().toISOString(), experience_level: "Mid", company_size: "50-100" },
  { id: 6, title: "MLOps Engineer", company: "Scale AI", company_logo: "⚙️", description: "Build ML infrastructure.", requirements: "Kubernetes, Docker, Python", salary_min: 150000, salary_max: 220000, location: "Remote", apply_url: "https://scale.com/careers", source: "manual", tags: ["MLOps", "Kubernetes", "Cloud", "DevOps"], featured: 0, posted_at: new Date().toISOString(), experience_level: "Mid", company_size: "500-1000" },
  { id: 7, title: "Mid-Level ML Engineer", company: "Cohere", company_logo: "🌊", description: "Build language models.", requirements: "Python, PyTorch, NLP, 3+ years", salary_min: 170000, salary_max: 320000, location: "Remote", apply_url: "https://cohere.com/careers", source: "manual", tags: ["Python", "PyTorch", "NLP", "LLM"], featured: 1, posted_at: new Date().toISOString(), experience_level: "Mid", company_size: "100-500" },
  { id: 8, title: "AI Product Manager", company: "Runway", company_logo: "🎬", description: "Lead AI product strategy.", requirements: "AI/ML experience, Product sense", salary_min: 160000, salary_max: 280000, location: "Remote", apply_url: "https://runwayml.com/careers", source: "demo", tags: ["Product", "AI", "Strategy", "Management"], featured: 0, posted_at: new Date().toISOString(), experience_level: "Senior", company_size: "50-100" },
  { id: 9, title: "Junior Data Scientist", company: "DataRobot", company_logo: "🤖", description: "Build ML models for enterprise.", requirements: "Python, SQL, Statistics", salary_min: 90000, salary_max: 140000, location: "Remote", apply_url: "https://datarobot.com/careers", source: "manual", tags: ["Data Science", "Python", "ML", "SQL"], featured: 0, posted_at: new Date().toISOString(), experience_level: "Junior", company_size: "500-1000" },
  { id: 10, title: "Senior MLOps Engineer", company: "Weights & Biases", company_logo: "📊", description: "Build ML platform infrastructure.", requirements: "Kubernetes, Python, AWS", salary_min: 180000, salary_max: 280000, location: "Remote", apply_url: "https://wandb.com/careers", source: "manual", tags: ["MLOps", "Kubernetes", "AWS", "Python"], featured: 0, posted_at: new Date().toISOString(), experience_level: "Senior", company_size: "50-100" }
];

// Scraped jobs (fetched from free APIs)
let scrapedJobs = [];
let jobsLastUpdated = null;

// Fetch jobs from free APIs
async function fetchScrapedJobs() {
  try {
    const scraper = require("./scraper-free.js");
    scrapedJobs = await scraper.fetchAllFreeJobs();
    jobsLastUpdated = new Date().toISOString();
    console.log("Scraped " + scrapedJobs.length + " jobs from free APIs");
  } catch (e) {
    console.error("Scraping failed:", e.message);
  }
}

// Combine all jobs
function getAllJobs() {
  return [...demoJobs, ...scrapedJobs];
}

// Fetch scraped jobs on startup (async, don't wait)
fetchScrapedJobs();

// In-memory user store (would be database in production)
const users = [];
const emailSubscriptions = [];

// Analytics store
const analytics = {
  pageViews: 0,
  jobViews: {},
  clicks: {},
  searches: {}
};

// API routes

// Get all jobs with filters
app.get("/api/jobs", function(req, res) {
  var result = getAllJobs().slice();
  var search = req.query.search;
  var tag = req.query.tag;
  var featured = req.query.featured;
  var experience = req.query.experience;
  var salaryMin = parseInt(req.query.salary_min) || 0;
  var companySize = req.query.company_size;
  
  // Track search
  if (search) {
    analytics.searches[search] = (analytics.searches[search] || 0) + 1;
    var s = search.toLowerCase();
    result = result.filter(function(j) {
      return j.title.toLowerCase().indexOf(s) !== -1 || 
             j.company.toLowerCase().indexOf(s) !== -1 ||
             j.tags.some(function(t) { return t.toLowerCase().indexOf(s) !== -1; });
    });
  }
  
  if (tag) {
    var t = tag.toLowerCase();
    result = result.filter(function(j) {
      return j.tags.some(function(tag) { return tag.toLowerCase().indexOf(t) !== -1; });
    });
  }
  
  if (featured === "true") {
    result = result.filter(function(j) { return j.featured === 1; });
  }
  
  if (experience) {
    result = result.filter(function(j) { return j.experience_level === experience; });
  }
  
  if (salaryMin > 0) {
    result = result.filter(function(j) { return j.salary_min >= salaryMin; });
  }
  
  if (companySize) {
    result = result.filter(function(j) { return j.company_size === companySize; });
  }
  
  res.json(result.slice(0, 50));
});

// Get single job
app.get("/api/jobs/:id", function(req, res) {
  var id = parseInt(req.params.id);
  var job = jobs.find(function(j) { return j.id === id; });
  if (!job) return res.status(404).json({ error: "Job not found" });
  
  // Track job view
  analytics.jobViews[id] = (analytics.jobViews[id] || 0) + 1;
  
  res.json(job);
});

// Get stats
app.get("/api/stats", function(req, res) {
  var allJobs = getAllJobs();
  res.json({ 
    totalJobs: allJobs.length, 
    featuredJobs: allJobs.filter(function(j) { return j.featured === 1; }).length,
    scrapedJobs: scrapedJobs.length,
    lastUpdated: jobsLastUpdated,
    pageViews: analytics.pageViews
  });
});

// Refresh scraped jobs
app.post("/api/jobs/refresh", function(req, res) {
  fetchScrapedJobs().then(function() {
    res.json({ ok: true, scrapedJobs: scrapedJobs.length });
  });
});

// Get analytics (admin)
app.get("/api/analytics", function(req, res) {
  res.json({
    pageViews: analytics.pageViews,
    topJobs: Object.entries(analytics.jobViews).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5),
    topSearches: Object.entries(analytics.searches).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5)
  });
});

// Track page view
app.post("/api/track/pageview", function(req, res) {
  analytics.pageViews++;
  res.json({ ok: true });
});

// Track job click
app.post("/api/track/click", function(req, res) {
  var jobId = req.body.jobId;
  if (jobId) {
    analytics.clicks[jobId] = (analytics.clicks[jobId] || 0) + 1;
  }
  res.json({ ok: true });
});

// User registration
app.post("/api/auth/register", function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  var userType = req.body.userType || "jobseeker"; // jobseeker or employer
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  
  if (users.find(function(u) { return u.email === email; })) {
    return res.status(400).json({ error: "User already exists" });
  }
  
  var user = {
    id: users.length + 1,
    email: email,
    password: password, // In production, hash this!
    userType: userType,
    createdAt: new Date().toISOString(),
    savedJobs: [],
    alerts: []
  };
  users.push(user);
  
  res.json({ id: user.id, email: user.email, userType: user.userType });
});

// User login
app.post("/api/auth/login", function(req, res) {
  var email = req.body.email;
  var password = req.body.password;
  
  var user = users.find(function(u) { return u.email === email && u.password === password; });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  // Generate simple token (in production, use JWT)
  var token = crypto.randomBytes(16).toString("hex");
  user.token = token;
  
  res.json({ token: token, user: { id: user.id, email: user.email, userType: user.userType } });
});

// Get user profile
app.get("/api/user/profile", function(req, res) {
  var token = req.headers.authorization;
  var user = users.find(function(u) { return u.token === token; });
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({ id: user.id, email: user.email, userType: user.userType, savedJobs: user.savedJobs, alerts: user.alerts });
});

// Subscribe to email alerts
app.post("/api/alerts/subscribe", function(req, res) {
  var token = req.headers.authorization;
  var tag = req.body.tag;
  var email = req.body.email;
  
  var user = users.find(function(u) { return u.token === token; });
  
  if (tag) {
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (user.alerts.indexOf(tag) === -1) {
      user.alerts.push(tag);
    }
    emailSubscriptions.push({ email: user.email, tag: tag, createdAt: new Date().toISOString() });
  } else if (email) {
    emailSubscriptions.push({ email: email, tag: "all", createdAt: new Date().toISOString() });
  } else {
    return res.status(400).json({ error: "Tag or email required" });
  }
  
  res.json({ ok: true, message: "Subscribed to alerts" });
});

// Get email subscriptions (admin)
app.get("/api/alerts/subscriptions", function(req, res) {
  res.json(emailSubscriptions);
});

// Static files
function serveStatic(file, res) {
  var filePath = path.join(publicPath, file);
  var ext = file.split(".").pop();
  var contentType = "text/plain";
  if (ext === "css") contentType = "text/css";
  else if (ext === "js") contentType = "application/javascript";
  else if (ext === "html") contentType = "text/html";
  else if (ext === "svg") contentType = "image/svg+xml";
  fs.readFile(filePath, function(err, data) {
    if (err) return res.status(404).send("not found");
    res.type(contentType).send(data);
  });
}

app.get("/index.html", function(req, res) { serveStatic("index.html", res); });
app.get("/jobs.html", function(req, res) { serveStatic("jobs.html", res); });
app.get("/job.html", function(req, res) { serveStatic("job.html", res); });
app.get("/post.html", function(req, res) { serveStatic("post.html", res); });
app.get("/styles.css", function(req, res) { serveStatic("styles.css", res); });
app.get("/app.js", function(req, res) { serveStatic("app.js", res); });
app.get("/favicon.svg", function(req, res) { serveStatic("favicon.svg", res); });

app.get("/", function(req, res) {
  analytics.pageViews++;
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, function() {
  console.log("Remote AI Jobs running on port " + PORT);
});