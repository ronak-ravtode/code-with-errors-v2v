const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const pages = [
    { name: 'Login.jsx', icon: 'Lock' },
    { name: 'Register.jsx', icon: 'UserPlus' },
    { name: 'Dashboard.jsx', icon: 'LayoutDashboard' },
    { name: 'SafeJourney.jsx', icon: 'Navigation' },
    { name: 'LiveJourneyTracking.jsx', icon: 'Map' },
    { name: 'EvidenceVault.jsx', icon: 'ShieldCheck' },
    { name: 'EmergencyCommandCenter.jsx', icon: 'AlertTriangle' },
    { name: 'NearbySafeHavens.jsx', icon: 'Building' },
    { name: 'CommunitySafetyMap.jsx', icon: 'Users' },
    { name: 'HarassmentReporting.jsx', icon: 'FileText' },
    { name: 'SafetyResources.jsx', icon: 'BookOpen' },
    { name: 'Profile.jsx', icon: 'User' },
    { name: 'Settings.jsx', icon: 'Settings' },
    { name: 'Notifications.jsx', icon: 'Bell' },
];

const template = (name, icon) => `import React from 'react';
import { motion } from 'framer-motion';
import { ${icon}, ChevronRight } from 'lucide-react';

export default function ${name.replace('.jsx', '')}() {
  return (
    <div className="min-h-screen pt-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10 w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 md:p-12"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-royal/20 text-electric rounded-2xl border border-royal/30 shadow-[0_0_15px_rgba(109,40,217,0.5)]">
            <${icon} className="w-8 h-8 md:w-12 md:h-12" />
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold font-sora text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              ${name.replace('.jsx', '').replace(/([A-Z])/g, ' $1').trim()}
            </h1>
            <p className="text-gray-400 mt-2">Premium AI Guardian Experience</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {/* Dummy skeleton cards */}
          {[1,2,3,4,5,6].map((i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass-button p-6 rounded-2xl flex flex-col justify-between group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                <${icon} className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Module 0{i}</h3>
              <p className="text-sm text-gray-500 mb-6">AI-driven insights and interactive features for ultimate safety.</p>
              <div className="flex items-center text-electric group-hover:text-white transition-colors mt-auto">
                <span className="text-sm font-medium mr-2">Explore</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
`;

pages.forEach(p => {
    const filePath = path.join(pagesDir, p.name);
    fs.writeFileSync(filePath, template(p.name, p.icon));
});

console.log('Pages generated.');
