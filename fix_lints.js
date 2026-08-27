const fs = require('fs');
const path = require('path');

const clientDir = 'C:\\Users\\chinn\\Downloads\\Civic Intelligence Platform\\client';

const fixes = [
  {
    file: 'src/components/map/Heatmap.tsx',
    replacements: [
      [/import \{ useState, useEffect, useRef \} from 'react';/, "import { useEffect, useRef } from 'react';"],
      [/import \{ Loader2, AlertTriangle, MapPin \} from 'lucide-react';/, "import { Loader2, AlertTriangle } from 'lucide-react';"],
      [/import \{ StatusBadge \} from '\.\.\/ui\/StatusBadge';\r?\n/, ""]
    ]
  },
  {
    file: 'src/components/navigation/Footer.tsx',
    replacements: [
      [/import \{ Facebook, Twitter, Instagram, Mail, MapPin, Phone \} from 'lucide-react';/, "import { Facebook, Twitter, Instagram, Phone } from 'lucide-react';"]
    ]
  },
  {
    file: 'src/components/navigation/Navbar.tsx',
    replacements: [
      [/const location = useLocation\(\);/, ""]
    ]
  },
  {
    file: 'src/layouts/OfficerLayout.tsx',
    replacements: [
      [/import \{ LayoutDashboard, ClipboardList, Map, Briefcase, Settings, LogOut, Menu, X, User \} from 'lucide-react';/, "import { LayoutDashboard, ClipboardList, Map, Settings, LogOut, Menu, X, User } from 'lucide-react';"]
    ]
  },
  {
    file: 'src/pages/admin/AdminDashboard.tsx',
    replacements: [
      [/import \{ api \} from '@\/services\/api';\r?\n/, ""]
    ]
  },
  {
    file: 'src/pages/admin/AdminInsights.tsx',
    replacements: [
      [/Sparkles, /, ""]
    ]
  },
  {
    file: 'src/pages/dashboard/ComplaintDetails.tsx',
    replacements: [
      [/import \{ useParams, useNavigate, Link \} from 'react-router-dom';/, "import { useParams, useNavigate } from 'react-router-dom';"],
      [/Trash2, /, ""]
    ]
  },
  {
    file: 'src/pages/dashboard/Dashboard.tsx',
    replacements: [
      [/Map, /, ""]
    ]
  },
  {
    file: 'src/routes/index.tsx',
    replacements: [
      [/import OfficerRegister from '\.\.\/pages\/auth\/OfficerRegister';\r?\n/, ""],
      [/import AdminRegister from '\.\.\/pages\/auth\/AdminRegister';\r?\n/, ""]
    ]
  }
];

fixes.forEach(fix => {
  const filePath = path.join(clientDir, fix.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    fix.replacements.forEach(([regex, replacement]) => {
      content = content.replace(regex, replacement);
    });
    fs.writeFileSync(filePath, content);
    console.log('Fixed', fix.file);
  }
});
