import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, MapPin, Search, BarChart3, 
  AlertTriangle, CheckCircle2, Bot, Layers, Bell, Star
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const STAGGER = {
  visible: { transition: { staggerChildren: 0.1 } }
};

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden pt-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-transparent to-transparent dark:from-indigo-900/20"></div>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          <motion.div initial="hidden" animate="visible" variants={STAGGER} className="space-y-8">
            <motion.h1 variants={FADE_UP} className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Smarter Cities. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Faster Resolution.</span>
            </motion.h1>
            <motion.p variants={FADE_UP} className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              An AI-powered civic intelligence platform that transforms citizen complaints into actionable insights for authorities.
            </motion.p>
            <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/login" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:shadow-xl hover:-translate-y-1">
                Report an Issue
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all">
                Explore Platform
              </a>
            </motion.div>
          </motion.div>

          {/* Hero Visual Mockup */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative h-[500px] w-full hidden md:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
              <GlassCard className="p-6 relative z-10 shadow-2xl shadow-indigo-100/50 dark:shadow-indigo-900/20">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Analysis Complete</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Just now</p>
                    </div>
                  </div>
                  <StatusBadge type="status" value="PENDING" />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Detected Category</p>
                    <p className="text-base font-medium text-slate-900 dark:text-white">Illegal Dumping</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Severity</p>
                      <StatusBadge type="severity" value="HIGH" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                      <StatusBadge type="priority" value="85" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
            {/* Floating Elements */}
            <GlassCard className="absolute top-20 right-0 p-4 w-48 animate-bounce-slow shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">Routed to</p>
                  <p className="text-xs text-slate-500">Sanitation Dept</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="absolute bottom-20 left-0 p-4 w-56 animate-pulse-slow shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-900 dark:text-white">Duplicate Detected</p>
                  <p className="text-xs text-slate-500">Match: 98%</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

        </div>
      </section>

      {/* 1.5 ROLE ACCESS SECTION */}
      <section id="explore" className="py-24 bg-white dark:bg-slate-950 relative border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Choose Your Role</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Experience the platform from different operational perspectives.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="p-8 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all border-indigo-100 dark:border-indigo-900/50">
              <div>
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                  <UserCircle className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Citizen</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Report civic issues</li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Track submitted complaints</li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> View complaint status</li>
                </ul>
              </div>
              <Link to="/login" className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors">
                Continue as Citizen
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </GlassCard>

            <GlassCard className="p-8 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all border-blue-100 dark:border-blue-900/50">
              <div>
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Officer</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-blue-500" /> View assigned complaints</li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Manage and resolve issues</li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-blue-500" /> Monitor workload</li>
                </ul>
              </div>
              <Link to="/officer/login" className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-xl transition-colors">
                Officer Login
              </Link>
            </GlassCard>

            <GlassCard className="p-8 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all border-emerald-100 dark:border-emerald-900/50">
              <div>
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Administrator</h3>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Monitor entire platform</li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> AI insights & analytics</li>
                  <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Manage roles & access</li>
                </ul>
              </div>
              <Link to="/admin/login" className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors">
                Admin Login
              </Link>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* 2. TRUST / STATISTICS */}
      <section className="bg-slate-50 dark:bg-slate-900 py-16 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-sm font-semibold tracking-widest text-slate-400 dark:text-slate-500 uppercase">Trusted by Citizens. Powered by Intelligence.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <StatCard title="Citizen Reports" value="10K+" icon={<MapPin className="w-5 h-5"/>} />
            <StatCard title="AI Confidence" value="95%+" icon={<Bot className="w-5 h-5"/>} />
            <StatCard title="Issues Resolved" value="500+" icon={<CheckCircle2 className="w-5 h-5"/>} />
            <StatCard title="Civic Areas" value="50+" icon={<Layers className="w-5 h-5"/>} />
          </div>
        </div>
      </section>

      {/* 3. WORKFLOW */}
      <section id="workflow" className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">From Complaint to Resolution</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">See how our platform streamlines the civic management lifecycle.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Citizen Reports', desc: 'Submit a civic issue with description, images, and precise location.' },
              { step: '02', title: 'AI Understands', desc: 'Our AI analyzes the complaint and extracts critical insights.' },
              { step: '03', title: 'Duplicate Detection', desc: 'Compares location, text, and images against existing open issues.' },
              { step: '04', title: 'Priority Intelligence', desc: 'Severity and priority are calculated dynamically based on context.' },
              { step: '05', title: 'Smart Routing', desc: 'The issue is automatically recommended to the appropriate department.' },
              { step: '06', title: 'Resolution', desc: 'Authorities manage, assign, and resolve the complaint efficiently.' }
            ].map((item, i) => (
              <GlassCard key={i} className="p-8 relative border-slate-100 dark:border-slate-800" hoverEffect>
                <span className="absolute -top-4 -left-4 text-6xl font-black text-slate-100 dark:text-slate-800/50 select-none -z-10">{item.step}</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Intelligence Built Into Every Complaint</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Explore the powerful features driving the platform.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Bot/>, title: 'AI-Powered Classification', desc: 'Automatically understand the specific type of civic issue.' },
              { icon: <Layers/>, title: 'Duplicate Detection', desc: 'Detect repeated complaints using location, text, and image similarity.' },
              { icon: <AlertTriangle/>, title: 'Dynamic Severity', desc: 'Determine how serious the reported issue is dynamically.' },
              { icon: <BarChart3/>, title: 'Smart Priority', desc: 'Calculate complaint priority using AI-derived signals.' },
              { icon: <ShieldCheck/>, title: 'Department Routing', desc: 'Recommend the appropriate government department.' },
              { icon: <MapPin/>, title: 'Location Intelligence', desc: 'Use geographic information to track where issues occur.' },
              { icon: <Bell/>, title: 'Citizen Alerts', desc: 'Warn citizens when a similar complaint already exists.' },
              { icon: <Search/>, title: 'AI Summaries', desc: 'Convert long descriptions into concise actionable summaries.' },
              { icon: <CheckCircle2/>, title: 'Evidence Analysis', desc: 'Analyze uploaded images as supporting evidence.' },
            ].map((feat, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. DUPLICATE SHOWCASE */}
      <section className="py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                Stop Duplicate Complaints Before They Become Duplicate Work.
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Our advanced similarity engine instantly compares new submissions against the entire database using geographic, textual, and visual matching to prevent redundant assignments.
              </p>
              <ul className="space-y-4 pt-4">
                {['Location Similarity Analysis', 'Natural Language Text Matching', 'Computer Vision Image Comparison'].map((li, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <GlassCard className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-lg dark:text-white">Similarity Analysis</h3>
                  <StatusBadge type="duplicate" value="HIGH" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500 dark:text-slate-400">Location Match</span>
                     <span className="font-semibold text-slate-900 dark:text-white">100%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500 dark:text-slate-400">Text Similarity</span>
                     <span className="font-semibold text-slate-900 dark:text-white">98%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-500 dark:text-slate-400">Image Similarity</span>
                     <span className="font-semibold text-slate-900 dark:text-white">100%</span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                     <span className="font-medium text-slate-700 dark:text-slate-300">Overall Confidence</span>
                     <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">99%</span>
                  </div>
                </div>
              </GlassCard>
              
              <div className="absolute -bottom-6 -right-6 lg:-right-12">
                <GlassCard variant="alert" className="p-4 flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="text-sm font-bold text-red-900 dark:text-red-200">Similar issue reported</p>
                    <p className="text-xs text-red-700 dark:text-red-400">Please review before submitting.</p>
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">What People Say</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">See how Civic Intel is making a real difference in municipalities everywhere.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { role: 'Citizen User', quote: 'The platform makes it so easy to report issues. I was instantly notified that someone else had already reported the pothole on my street.' },
              { role: 'Municipal Officer', quote: 'The AI summaries and department routing have completely transformed our workflow. We no longer spend hours triaging complaints.' },
              { role: 'Community Member', quote: 'Seeing issues actually get resolved and being able to track them gives me confidence that our local government is taking action.' },
            ].map((t, i) => (
              <GlassCard key={i} className="p-8">
                <div className="flex gap-1 mb-4 text-amber-400">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-slate-700 dark:text-slate-300 italic mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.role}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-900 -z-20"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 -z-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">Have an Issue? Make It Visible.</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
            Report civic problems and help your community become cleaner, safer and smarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link to="/login" className="px-8 py-4 text-base font-bold text-indigo-600 bg-white rounded-xl shadow-lg hover:bg-indigo-50 transition-colors">
              Report an Issue
            </Link>
            <Link to="/login" className="px-8 py-4 text-base font-bold text-white bg-indigo-700 rounded-xl hover:bg-indigo-800 transition-colors border border-indigo-500">
              Explore Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Just importing UserCircle at the bottom to avoid messy top imports
import { UserCircle } from 'lucide-react';
