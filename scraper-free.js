// Free Job APIs Integration
// Fetches from: RemoteOK, Arbeitnow

const https = require("https");
const http = require("http");

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchJSON(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
  });
}

// Normalize RemoteOK job
function normalizeRemoteOK(job) {
  return {
    title: job.position || job.title,
    company: job.company || job.company_name,
    company_logo: "🤖",
    description: job.description ? job.description.replace(/<[^>]*>/g, "").substring(0, 300) : "",
    requirements: job.tags ? job.tags.join(", ") : "",
    salary_min: job.salary || 0,
    salary_max: 0,
    location: job.location || "Remote",
    apply_url: job.url || job.apply_url,
    source: "remoteok",
    tags: job.tags || [],
    featured: 0,
    posted_at: job.published_at || new Date().toISOString(),
    experience_level: "Mid",
    company_size: "Unknown"
  };
}

// Normalize Arbeitnow job
function normalizeArbeitnow(job) {
  return {
    title: job.title,
    company: job.company || job.company_name || "Unknown",
    company_logo: "💼",
    description: job.description ? job.description.replace(/<[^>]*>/g, "").substring(0, 300) : "",
    requirements: job.tags ? job.tags.join(", ") : "",
    salary_min: job.annual_salary_min || 0,
    salary_max: job.annual_salary_max || 0,
    location: job.location || "Remote",
    apply_url: job.url,
    source: "arbeitnow",
    tags: job.tags || [],
    featured: 0,
    posted_at: job.created_at || new Date().toISOString(),
    experience_level: "Mid",
    company_size: "Unknown"
  };
}

// Fetch from RemoteOK
async function fetchRemoteOKJobs() {
  try {
    const data = await fetchJSON("https://remoteok.com/api");
    if (Array.isArray(data)) {
      return data.slice(0, 20).filter(j => j.position).map(normalizeRemoteOK);
    }
    return [];
  } catch (e) {
    console.error("RemoteOK error:", e.message);
    return [];
  }
}

// Fetch from Arbeitnow
async function fetchArbeitnowJobs() {
  try {
    const data = await fetchJSON("https://www.arbeitnow.com/api/job-board-api");
    if (data && data.data) {
      return data.data.slice(0, 20).map(normalizeArbeitnow);
    }
    return [];
  } catch (e) {
    console.error("Arbeitnow error:", e.message);
    return [];
  }
}

// Fetch all jobs from free APIs
async function fetchAllFreeJobs() {
  const [remoteOK, arbeitnow] = await Promise.all([
    fetchRemoteOKJobs(),
    fetchArbeitnowJobs()
  ]);
  
  const allJobs = [...remoteOK, ...arbeitnow];
  
  // Deduplicate by title + company
  const seen = new Set();
  return allJobs.filter(job => {
    const key = (job.title + job.company).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { fetchAllFreeJobs, fetchRemoteOKJobs, fetchArbeitnowJobs };
