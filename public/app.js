// Create job card HTML
function createJobCard(job) {
  const logo = job.company_logo || '🤖';
  const salary = job.salary_min ? '$' + (job.salary_min / 1000).toFixed(0) + 'k' : 'Competitive';
  const experience = job.experience_level || '';
  
  return '<div class="job-card">' +
    '<div class="job-header">' +
      '<span class="company-logo">' + logo + '</span>' +
      '<div class="job-info">' +
        '<h3><a href="/job.html?id=' + job.id + '">' + job.title + '</a></h3>' +
        '<p class="company">' + job.company + '</p>' +
      '</div>' +
      (job.featured ? '<span class="featured-badge">Featured</span>' : '') +
    '</div>' +
    '<p class="job-description">' + job.description + '</p>' +
    '<div class="job-meta">' +
      '<span class="meta-item">💰 ' + salary + '+</span>' +
      (experience ? '<span class="meta-item">📊 ' + experience + '</span>' : '') +
      '<span class="meta-item">📍 ' + job.location + '</span>' +
    '</div>' +
    '<div class="job-tags">' +
      job.tags.slice(0, 4).map(tag => '<span class="tag">' + tag + '</span>').join('') +
    '</div>' +
    '<div class="job-actions">' +
      '<a href="/job.html?id=' + job.id + '" class="btn btn-primary btn-sm">View Details</a>' +
      '<button class="btn btn-secondary btn-sm" onclick="saveJob(' + job.id + ')">Save</button>' +
    '</div>' +
  '</div>';
}

// Save job
function saveJob(jobId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please sign in to save jobs');
    return;
  }
  // In production, this would save to the user profile
  console.log('Saving job:', jobId);
}

// Format salary
function formatSalary(amount) {
  if (!amount) return 'Competitive';
  return '$' + amount.toLocaleString();
}

// Track job view
function trackJobView(jobId) {
  fetch('/api/track/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId })
  });
}

// Search jobs
function searchJobs(query) {
  window.location.href = '/jobs.html?q=' + encodeURIComponent(query);
}

// Check auth status
function checkAuth() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    return JSON.parse(user);
  }
  return null;
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
}