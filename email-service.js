// Resend email service
const { Resend } = require("resend");

// Initialize Resend (will use RESEND_API_KEY env var)
let resend = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (e) {
  console.log("Resend not configured - set RESEND_API_KEY to enable emails");
}

// Email templates
const emailTemplates = {
  welcome: (email) => ({
    to: email,
    subject: "Welcome to RemoteAIJobs! 🎉",
    html: `
      <h1>Welcome to RemoteAIJobs!</h1>
      <p>You're now subscribed to AI job alerts.</p>
      <p>We'll send you the latest remote AI jobs matching your interests.</p>
      <p>
        <a href="https://remoteai-jobs.vercel.app/jobs.html">Browse Jobs →</a>
      </p>
    `
  }),
  
  alertNewJobs: (email, jobs, tag) => ({
    to: email,
    subject: `New AI Jobs${tag ? ` - ${tag}` : ""} 🚀`,
    html: `
      <h1>New Remote AI Jobs${tag ? ` in ${tag}` : ""}</h1>
      <p>Here are the latest opportunities:</p>
      ${jobs.slice(0, 5).map(job => `
        <div style="border: 1px solid #ddd; padding: 16px; margin: 8px 0; border-radius: 8px;">
          <h3>${job.title}</h3>
          <p><strong>${job.company}</strong> • ${job.location}</p>
          <p>${job.description?.substring(0, 100)}...</p>
          <a href="${job.apply_url}">Apply →</a>
        </div>
      `).join("")}
      <p>
        <a href="https://remoteai-jobs.vercel.app/jobs.html">View All Jobs →</a>
      </p>
    `
  }),
  
  jobPosted: (email, job) => ({
    to: email,
    subject: `Your job "${job.title}" is now live! ✅`,
    html: `
      <h1>Job Posted Successfully!</h1>
      <p>Your job listing is now live:</p>
      <div style="border: 1px solid #ddd; padding: 16px; margin: 16px 0; border-radius: 8px;">
        <h3>${job.title}</h3>
        <p><strong>${job.company}</strong></p>
        <p>${job.location}</p>
      </div>
      <p>
        <a href="https://remoteai-jobs.vercel.app/jobs.html">View All Listings →</a>
      </p>
    `
  })
};

// Send email
async function sendEmail(template) {
  if (!resend) {
    console.log("Email not sent - Resend not configured");
    return { success: false, error: "Email service not configured" };
  }
  
  try {
    const result = await resend.emails.send({
      from: "RemoteAIJobs <noreply@remoteaijobs.com>",
      to: template.to,
      subject: template.subject,
      html: template.html
    });
    console.log("Email sent to:", template.to);
    return { success: true, id: result.id };
  } catch (e) {
    console.error("Email error:", e.message);
    return { success: false, error: e.message };
  }
}

// Send welcome email
async function sendWelcomeEmail(email) {
  return sendEmail(emailTemplates.welcome(email));
}

// Send job alert
async function sendJobAlert(email, jobs, tag) {
  return sendEmail(emailTemplates.alertNewJobs(email, jobs, tag));
}

// Send job posted confirmation
async function sendJobPostedEmail(email, job) {
  return sendEmail(emailTemplates.jobPosted(email, job));
}

module.exports = { sendWelcomeEmail, sendJobAlert, sendJobPostedEmail };
