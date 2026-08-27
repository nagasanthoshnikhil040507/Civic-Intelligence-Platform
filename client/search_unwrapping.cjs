const fs = require('fs');
const path = require('path');
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('.data.users') || c.includes('.data.complaint') || c.match(/setComplaint\(.*?\.data\)/) || c.match(/setOfficers\(.*?\.data\.users\)/) || c.match(/setComplaints\(.*?\.data\.complaints\)/)) {
        console.log('Found in:', p);
      }
    }
  });
}
walk('src/pages/admin');
walk('src/pages/officer');
walk('src/pages/dashboard');
