const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const publicPath = path.join(__dirname, "public");

const demoJobs = [
  { id: 1, title: "Senior ML Engineer", company: "OpenAI", company_logo: "https://logo.clearbit.com/openai.com", description: "Build cutting-edge AI models.", requirements: "Python, TensorFlow, PyTorch", salary_min: 200000, salary_max: 400000, location: "Remote", apply_url: "https://openai.com/careers", source: "manual", tags: ["Python", "TensorFlow", "PyTorch", "ML", "AI"], featured: 1, posted_at: new Date().toISOString() },
  { id: 2, title: "AI Research Scientist", company: "DeepMind", company_logo: "https://logo.clearbit.com/deepmind.com", description: "Conduct groundbreaking AI research.", requirements: "PhD, Deep Learning", salary_min: 180000, salary_max: 350000, location: "Remote", apply_url: "https://deepmind.com/careers", source: "manual", tags: ["Research", "Deep Learning", "NLP"], featured: 1, posted_at: new Date().toISOString() },
  { id: 3, title: "Remote AI Engineer", company: "Anthropic", company_logo: "https://logo.clearbit.com/anthropic.com", description: "Build reliable AI systems.", requirements: "Python, ML frameworks", salary_min: 160000, salary_max: 300000, location: "Remote", apply_url: "https://anthropic.com/careers", source: "manual", tags: ["Python", "AI", "LLM"], featured: 0, posted_at: new Date().toISOString() },
  { id: 4, title: "Computer Vision Engineer", company: "Tesla", company_logo: "https://logo.clearbit.com/tesla.com", description: "Work on autonomous driving.", requirements: "Computer Vision, Deep Learning", salary_min: 150000, salary_max: 280000, location: "Remote", apply_url: "https://tesla.com/careers", source: "manual", tags: ["Computer Vision", "Deep Learning"], featured: 0, posted_at: new Date().toISOString() },
  { id: 5, title: "NLP Engineer", company: "Hugging Face", company_logo: "https://logo.clearbit.com/huggingface.co", description: "Build open-source NLP.", requirements: "NLP, Transformers, Python", salary_min: 140000, salary_max: 250000, location: "Remote", apply_url: "https://huggingface.co/careers", source: "manual", tags: ["NLP", "Transformers", "PyTorch"], featured: 1, posted_at: new Date().toISOString() },
  { id: 6, title: "MLOps Engineer", company: "Scale AI", company_logo: "https://logo.clearbit.com/scale.com", description: "Build ML infrastructure.", requirements: "Kubernetes, Docker, Python", salary_min: 150000, salary_max: 220000, location: "Remote", apply_url: "https://scale.com/careers", source: "manual", tags: ["MLOps", "Kubernetes", "Cloud"], featured: 0, posted_at: new Date().toISOString() },
  { id: 7, title: "ML Engineer", company: "Cohere", company_logo: "https://logo.clearbit.com/cohere.ai", description: "Build language models.", requirements: "Python, PyTorch, NLP", salary_min: 170000, salary_max: 320000, location: "Remote", apply_url: "https://cohere.com/careers", source: "demo", tags: ["Python", "PyTorch", "NLP", "LLM"], featured: 1, posted_at: new Date().toISOString() },
  { id: 8, title: "AI Product Manager", company: "Runway", company_logo: "https://logo.clearbit.com/runwayml.com", description: "Lead AI product strategy.", requirements: "AI/ML experience, Product sense", salary_min: 160000, salary_max: 280000, location: "Remote", apply_url: "https://runwayml.com/careers", source: "demo", tags: ["Product", "AI", "Strategy"], featured: 0, posted_at: new Date().toISOString() }
];

// API routes
app.get("/api/jobs", function(req, res) {
  var jobs = demoJobs.slice();
  var search = req.query.search;
  var tag = req.query.tag;
  var featured = req.query.featured;
  
  if (search) {
    var s = search.toLowerCase();
    jobs = jobs.filter(function(j) {
      return j.title.toLowerCase().indexOf(s) !== -1 || 
             j.company.toLowerCase().indexOf(s) !== -1 ||
             j.tags.some(function(t) { return t.toLowerCase().indexOf(s) !== -1; });
    });
  }
  
  if (tag) {
    var t = tag.toLowerCase();
    jobs = jobs.filter(function(j) {
      return j.tags.some(function(tag) { return tag.toLowerCase().indexOf(t) !== -1; });
    });
  }
  
  if (featured === "true") {
    jobs = jobs.filter(function(j) { return j.featured === 1; });
  }
  
  res.json(jobs.slice(0, 50));
});

app.get("/api/stats", function(req, res) {
  res.json({ totalJobs: demoJobs.length, featuredJobs: demoJobs.filter(function(j) { return j.featured === 1; }).length });
});

// Static files
function serveStatic(file, res) {
  var filePath = path.join(publicPath, file);
  fs.readFile(filePath, function(err, data) {
    if (err) return res.status(404).send("not found");
    res.send(data);
  });
}

app.get("/index.html", function(req, res) { serveStatic("index.html", res); });
app.get("/jobs.html", function(req, res) { serveStatic("jobs.html", res); });
app.get("/job.html", function(req, res) { serveStatic("job.html", res); });
app.get("/post.html", function(req, res) { serveStatic("post.html", res); });
app.get("/styles.css", function(req, res) { serveStatic("styles.css", res); });
app.get("/app.js", function(req, res) { serveStatic("app.js", res); });

app.get("/", function(req, res) {
  res.sendFile(path.join(publicPath, "index.html"));
});

app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});