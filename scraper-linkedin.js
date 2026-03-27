// LinkedIn Jobs API integration (RapidAPI)
const https = require("https");

const LINKEDIN_HOST = "linkedin-job-search-api.p.rapidapi.com";
const LINKEDIN_KEY = process.env.LINKEDIN_API_KEY || "";

function fetchLinkedInJobs() {
  return new Promise((resolve, reject) => {
    if (!LINKEDIN_KEY) {
      console.log("LinkedIn API not configured - set LINKEDIN_API_KEY");
      resolve([]);
      return;
    }

    const options = {
      hostname: LINKEDIN_HOST,
      port: 443,
      path: "/active-jb-1h?limit=50&offset=0&description_type=text",
      method: "GET",
      headers: {
        "X-RapidAPI-Key": LINKEDIN_KEY,
        "X-RapidAPI-Host": LINKEDIN_HOST
      }
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const jobs = JSON.parse(data);
          if (Array.isArray(jobs)) {
            resolve(jobs.slice(0, 30).map(job => ({
              title: job.job_title || "Remote Job",
              company: job.employer_name || job.company || "Company",
              company_logo: "💼",
              description: job.job_description?.substring(0, 300) || "",
              requirements: "",
              salary_min: 0,
              salary_max: 0,
              location: job.job_location || "Remote",
              apply_url: job.job_link || job.apply_url || "",
              source: "linkedin",
              tags: ["Remote", "Full-time"],
              featured: 0,
              posted_at: new Date().toISOString(),
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
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("LinkedIn timeout"));
    });
    req.end();
  });
}

module.exports = { fetchLinkedInJobs };
