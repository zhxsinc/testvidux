import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UgcWorkflow from './components/UgcWorkflow';

// Scenario Data Mock
const SCENARIOS = [
  {
    id: 'ugc-ads',
    title: 'Multilingual UGC Ads',
    description: 'Input a script, automatically generate multilingual spoken ads with avatars. Great for TikTok/Reels.',
    icon: 'fa-bullhorn',
    tags: ['Marketing', 'Ads'],
    gradient: 'from-purple-500 to-indigo-600'
  },
  {
    id: 'ecommerce',
    title: 'E-commerce Product Showcase',
    description: 'Upload static product images, generate dynamic showcase videos instantly.',
    icon: 'fa-shopping-bag',
    tags: ['E-commerce', 'Automation'],
    gradient: 'from-blue-400 to-blue-600'
  },
  {
    id: 'podcast',
    title: 'Podcast/Live Clips',
    description: 'Intelligent cutting of long videos to extract highlights for short video platforms.',
    icon: 'fa-microphone-lines',
    tags: ['Content', 'Clips'],
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'course',
    title: 'Course Training',
    description: 'Turn documents into videos with virtual instructors for lower production costs.',
    icon: 'fa-chalkboard-user',
    tags: ['Education', 'Corporate'],
    gradient: 'from-emerald-400 to-teal-600'
  }
];

function App() {
  // Simple state-based routing
  const [currentRoute, setCurrentRoute] = useState<'HOME' | 'WORKFLOW_UGC'>('HOME');

  const navigateToWorkflow = (id: string) => {
    if (id === 'ugc-ads') {
      setCurrentRoute('WORKFLOW_UGC');
    } else {
      alert('Demo currently only supports "Multilingual UGC Ads" scenario.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900">
      <Navbar onNavigateHome={() => setCurrentRoute('HOME')} />

      {currentRoute === 'HOME' && (
        <main>
          {/* Hero Section */}
          <div className="bg-white pb-16 pt-20 lg:pt-32 border-b border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full z-0 pointer-events-none opacity-30">
               <div className="absolute top-10 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
               <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
               <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl mb-6">
                <span className="block">What video do you</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">
                  want to create?
                </span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
                Stop juggling multiple tools. Input your assets, and Vidux runs the complete workflow for you.
              </p>
              <div className="mt-10 flex justify-center gap-4">
                <button 
                  onClick={() => document.getElementById('scenarios')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-brand-600 hover:bg-brand-700 md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transition-all"
                >
                  Start from Scenario
                </button>
                <button className="px-8 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 shadow-sm transition-all">
                  Use Single Tool
                </button>
              </div>
            </div>
          </div>

          {/* Scenarios Section */}
          <div id="scenarios" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Popular Scenarios</h2>
              <a href="#" className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                View All <i className="fas fa-arrow-right ml-1"></i>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
              {SCENARIOS.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden cursor-pointer flex flex-col sm:flex-row"
                  onClick={() => navigateToWorkflow(scenario.id)}
                >
                  {/* Card Visual */}
                  <div className={`sm:w-2/5 h-48 sm:h-auto bg-gradient-to-br ${scenario.gradient} flex items-center justify-center p-6 relative overflow-hidden`}>
                     <i className={`fas ${scenario.icon} text-6xl text-white opacity-20 absolute -bottom-4 -right-4 transform rotate-12 group-hover:scale-110 transition-transform`}></i>
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                        <i className={`fas ${scenario.icon} text-3xl text-white`}></i>
                     </div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6 sm:w-3/5 flex flex-col justify-between">
                    <div>
                      <div className="flex gap-2 mb-3">
                        {scenario.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{scenario.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-4">
                        {scenario.description}
                      </p>
                    </div>
                    <div className="flex items-center text-brand-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                      Start Workflow <i className="fas fa-arrow-right ml-2"></i>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Template Market Teaser */}
          <div className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Industry Templates</h2>
                <p className="text-gray-400">Explore 500+ curated templates for Real Estate, Finance, Fashion, and more.</p>
              </div>
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                Browse Marketplace
              </button>
            </div>
          </div>

          <footer className="bg-white border-t border-gray-100 py-12 mt-12">
             <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
                <div className="flex justify-center space-x-6 mb-4">
                  <a href="#" className="hover:text-gray-600">Tools</a>
                  <a href="#" className="hover:text-gray-600">Help Center</a>
                  <a href="#" className="hover:text-gray-600">Blog</a>
                  <a href="#" className="hover:text-gray-600">About</a>
                </div>
                <p>&copy; 2024 Vidux.ai. All rights reserved.</p>
             </div>
          </footer>
        </main>
      )}

      {currentRoute === 'WORKFLOW_UGC' && (
        <UgcWorkflow onBack={() => setCurrentRoute('HOME')} />
      )}
    </div>
  );
}

export default App;