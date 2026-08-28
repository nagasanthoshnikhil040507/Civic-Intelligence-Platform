const fs = require('fs');

const content = fs.readFileSync('C:/Users/chinn/Downloads/Civic Intelligence Platform/client/src/pages/admin/AdminDashboard.tsx', 'utf8');

let newContent = content.replace(
  "const [complaints, setComplaints] = useState<any[]>([]);",
  "const [complaints, setComplaints] = useState<any[]>([]);\n  const [mapComplaints, setMapComplaints] = useState<any[]>([]);"
);

// Update map fetching inside fetchInsightsData or create a separate effect
newContent = newContent.replace(
  "const insightsData = await AdminService.getAiInsights(period);",
  "const insightsData = await AdminService.getAiInsights(period);\n        const mapData = await AdminService.getComplaints({ limit: 500, period });\n        setMapComplaints(mapData.complaints || []);"
);

newContent = newContent.replace(
  "<Heatmap complaints={complaints} isLoading={loading} />",
  "<Heatmap complaints={mapComplaints} isLoading={loading || insightsLoading} />"
);

newContent = newContent.replace(
  "{pagination.total} Points",
  "{mapComplaints.length} Points"
);

fs.writeFileSync('C:/Users/chinn/Downloads/Civic Intelligence Platform/client/src/pages/admin/AdminDashboard.tsx', newContent);
console.log('Map issues fixed.');
