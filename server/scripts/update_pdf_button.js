const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'chinn', 'Downloads', 'Civic Intelligence Platform', 'client', 'src', 'pages', 'admin', 'AdminComplaintDetails.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import generator
if (!content.includes('generateOfficialReport')) {
  content = content.replace(
    "import { format } from 'date-fns';",
    "import { format } from 'date-fns';\nimport { generateOfficialReport } from '@/utils/pdfReportGenerator';"
  );
}

// 2. Add isGeneratingPDF state
if (!content.includes('isGeneratingPDF')) {
  content = content.replace(
    "const [isAssigning, setIsAssigning] = useState(false);",
    "const [isAssigning, setIsAssigning] = useState(false);\n  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);"
  );
}

// 3. Replace handlePrintPDF logic
const oldHandlePrint = `  const handlePrintPDF = () => {
    // Hide standard elements via print CSS (in index.css) and trigger print
    window.print();
  };`;
  
const newHandlePrint = `  const handlePrintPDF = async () => {
    if (!complaint || complaint.status.toUpperCase() !== 'RESOLVED') return;
    setIsGeneratingPDF(true);
    try {
      await generateOfficialReport(complaint);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setError('Unable to generate report. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };`;

content = content.replace(oldHandlePrint, newHandlePrint);

// 4. Update the button UX
const oldButton = `<button
            onClick={handlePrintPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Printer className="w-4 h-4" />
            Download Official Record (PDF)
          </button>`;

const newButton = `<button
            onClick={handlePrintPDF}
            disabled={isGeneratingPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {isGeneratingPDF ? 'Generating Report...' : 'Download Official Report (PDF)'}
          </button>`;

content = content.replace(oldButton, newButton);

fs.writeFileSync(filePath, content);
console.log('Updated AdminComplaintDetails.tsx successfully');
