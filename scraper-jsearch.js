// JSearch API integration (RapidAPI)
// Requires: RapidAPI key (free tier available at rapidapi.com)

const https = require("https");

// JSearch API config
const JSEARCH_HOST = "jsearch.p.rapidapi.com";
// Set via JSEARCH_API_KEY env var or hardcode below
const JSEARCH_KEY = process.env.JSEARCH_API_KEY || "";

function fetchJSearchJobs(query, numResults = 10) {
  return new Promise((resolve, reject) => {
    if (!JSEARCH_KEY) {
      console.log("JSearch API not configured - set JSEARCH_API_KEY");
      resolve([]);
      return;
    }

    const options = {
      hostname: JSEARCH_HOST,
      port: 443,
      path: `/search?query=${encodeURIComponent(query)}&num_pages=1`,
      method: "GET",
      headers: {
        "X-RapidAPI-Key": JSEARCH_KEY,
        "X-RapidAPI-Host": JSEARCH_HOST
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === "OK" && parsed.data) {
            resolve(parsed.data.slice(0, numResults).map(job => ({
              title: job.job_title,
              company: job.employer_name,
              company_logo: "🔍",
              description: job.job_description?.replace(/<[^>]*>/g, "").substring(0, 300) || "",
              requirements: "",
              salary_min: job.job_salary && job.job_salary.length > 1 ? parseInt(job.job_salary.replace(/[^0-9]/g, "")) : 0,
              salary_max: 0,
              location: job.job_city || job.job_country || "Remote",
              apply_url: job.job_google_link || job.job_link,
              source: "jsearch",
              tags: [query, "API"],
              featured: 0,
              posted_at: job.job_posted_at_datetime || new Date().toISOString(),
              experience_level: "Mid",
              company_size: "Unknown"
            })));
          } else {
            resolve([]);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("JSearch timeout"));
    });
    req.end();
  });
}

// Search JSearch for AI jobs
async function fetchJSearchAIJobs() {
  const queries = ["AI ML Engineer remote", "Machine Learning remote jobs", "Data Scientist remote"];
  const results = [];
  
  for (const query of queries) {
    try {
      const jobs = await fetchJSearchJobs(query, 5);
      results.push(...jobs);
      await new Promise(r => setTimeout(r, 1000)); // Rate limit
    } catch (e) {
      console.error("JSearch error:", e.message);
    }
  }
  
  // Dedupe
  const seen = new Set();
  return results.filter(j => {
    const key = (j.title + j.company).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = { fetchJSearchJobs, fetchJSearchAIJobs };
