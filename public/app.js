// Shared JavaScript for Remote AI Jobs

function createJobCard(job) {
  const initials = job.company ? job.company.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'CO';
  
  const salaryText = job.salary_min 
    ? `$${(job.salary_min/1000).toFixed(0)}k - $${(job.salary_max/1000).toFixed(0)}k`
    : 'Salary undisclosed';
  
  const postedDate = new Date(job.posted_at).toLocaleDateString();
  
  const tags = Array.isArray(job.tags) 
    ? job.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')
    : '';
  
  return `
    <div class="job-card ${job.featured ? 'featured' : ''}" onclick="window.location.href='/job.html?id=${job.id}'">
      <div class="job-card-header">
        <div class="company-logo">
          ${job.company_logo 
            ? `<img src="${job.company_logo}" alt="${job.company}" onerror="this.parentElement.innerText='${initials}'">`
            : initials
          }
        </div>
        <div class="job-info">
          <div class="job-title">${job.title}</div>
          <div class="company-name">${job.company}</div>
        </div>
      </div>
      <div class="job-meta">
        ${tags}
        <span class="tag salary">${salaryText}</span>
      </div>
      <div class="job-footer">
        <span class="posted-date">${postedDate}</span>
        <span class="salary-range">${job.location || 'Remote'}</span>
      </div>
    </div>
  `;
}

// Format currency
function formatCurrency(amount) {
  if (!amount) return 'Not specified';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}