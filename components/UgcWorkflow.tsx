import React, { useState } from 'react';
import { checkAndRequestApiKey, generateVideoScript, generateVideoWithVeo, generateSceneImage } from '../services/geminiService';
import { WorkflowStep, GeneratedScript, ScriptScene } from '../types';

interface UgcWorkflowProps {
  onBack: () => void;
}

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];

const UgcWorkflow: React.FC<UgcWorkflowProps> = ({ onBack }) => {
  const [step, setStep] = useState<WorkflowStep>(WorkflowStep.INPUT);
  const [productUrl, setProductUrl] = useState('');
  const [userScript, setUserScript] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedScript | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Track generation status for individual scenes
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingVideos, setGeneratingVideos] = useState(false);

  // 1. Generate Script Plan
  const handleGeneratePlan = async () => {
    if (!userScript) return;
    setLoading(true);
    setLoadingMessage('Gemini is analyzing your request and planning scenes...');
    setError(null);
    try {
      const plan = await generateVideoScript(productUrl, userScript, targetLanguage);
      setGeneratedPlan(plan);
      setStep(WorkflowStep.PLANNING);
    } catch (err: any) {
      setError('Failed to generate script. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Images for each scene
  const handleGenerateImages = async () => {
    if (!generatedPlan) return;
    setLoading(true);
    setGeneratingImages(true);
    setLoadingMessage('Generating storyboards for each scene...');
    setError(null);
    
    try {
      const updatedScenes = [...generatedPlan.scenes];
      
      // We generate images sequentially to avoid hitting rate limits too hard, 
      // though parallel is possible depending on quota.
      for (let i = 0; i < updatedScenes.length; i++) {
        setLoadingMessage(`Generating storyboard for Scene ${i + 1} of ${updatedScenes.length}...`);
        const scene = updatedScenes[i];
        // Enhance prompt with avatar info
        const visualPrompt = `${scene.visual}. Character: ${generatedPlan.suggestedAvatar}.`;
        const imageUrl = await generateSceneImage(visualPrompt);
        updatedScenes[i] = { ...scene, imageUrl };
        // Update state progressively so user sees progress if we were to render it (though currently covered by loading overlay)
        setGeneratedPlan({ ...generatedPlan, scenes: updatedScenes });
      }
      
      setStep(WorkflowStep.IMAGES);
    } catch (err: any) {
      setError('Failed to generate images. ' + err.message);
    } finally {
      setLoading(false);
      setGeneratingImages(false);
    }
  };

  // 3. Generate Videos for each scene
  const handleGenerateVideos = async () => {
    if (!generatedPlan) return;
    setLoading(true);
    setGeneratingVideos(true);
    setLoadingMessage('Veo is transforming your storyboards into video (this takes time)...');
    setError(null);

    try {
      const hasKey = await checkAndRequestApiKey();
      if(!hasKey) {
        setError("API Key is required to use the Veo model.");
        setLoading(false);
        setGeneratingVideos(false);
        return;
      }

      const updatedScenes = [...generatedPlan.scenes];
      
      for (let i = 0; i < updatedScenes.length; i++) {
        const scene = updatedScenes[i];
        if (!scene.imageUrl) continue;

        setLoadingMessage(`Generating video for Scene ${i + 1} of ${updatedScenes.length}...`);
        
        const prompt = `
          Cinematic, high quality.
          Subject: ${scene.visual}
          Action: Subtle movement, realistic UGC style.
        `;
        
        // Pass the generated image to Veo
        const videoUrl = await generateVideoWithVeo(prompt, scene.imageUrl);
        updatedScenes[i] = { ...scene, videoUrl };
        setGeneratedPlan({ ...generatedPlan, scenes: updatedScenes });
      }

      setStep(WorkflowStep.RESULT);
    } catch (err: any) {
      console.error(err);
      setError('Video generation failed. ' + err.message);
    } finally {
      setLoading(false);
      setGeneratingVideos(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb / Back */}
      <div className="mb-6 flex items-center text-sm text-gray-500">
        <button onClick={onBack} className="hover:text-brand-600 flex items-center">
          <i className="fas fa-arrow-left mr-2"></i> Back to Scenarios
        </button>
        <span className="mx-2">/</span>
        <span className="font-semibold text-gray-900">Multilingual UGC Ad</span>
      </div>

      {/* Progress Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative max-w-3xl mx-auto">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
          {[
            { id: WorkflowStep.INPUT, label: 'Input' },
            { id: WorkflowStep.PLANNING, label: 'Plan' },
            { id: WorkflowStep.IMAGES, label: 'Storyboard' },
            { id: WorkflowStep.GENERATING_VIDEOS, label: 'Generating' }, // Intermediate visual state
            { id: WorkflowStep.RESULT, label: 'Result' },
          ].map((s, idx) => {
            // Adjust active/completed logic for new steps
            const stepsOrder = [WorkflowStep.INPUT, WorkflowStep.PLANNING, WorkflowStep.IMAGES, WorkflowStep.GENERATING_VIDEOS, WorkflowStep.RESULT];
            const currentIndex = stepsOrder.indexOf(step);
            const thisIndex = stepsOrder.indexOf(s.id);
            
            const isActive = s.id === step;
            const isCompleted = thisIndex < currentIndex;
            
            // Hide GENERATING_VIDEOS from stepper if we are not strictly in it or past it, 
            // basically merging it visually or keeping it. Let's keep it for clarity.
            if (s.id === WorkflowStep.GENERATING_VIDEOS && step !== WorkflowStep.GENERATING_VIDEOS && step !== WorkflowStep.RESULT) {
               // Optional: could hide intermediate processing steps
            }

            return (
              <div key={s.id} className="flex flex-col items-center bg-white px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                  ${isActive ? 'border-brand-600 bg-brand-600 text-white' : 
                    isCompleted ? 'border-brand-600 bg-white text-brand-600' : 'border-gray-300 text-gray-400 bg-white'}`}>
                  {isCompleted ? <i className="fas fa-check"></i> : idx + 1}
                </div>
                <span className={`text-xs mt-2 font-medium ${isActive || isCompleted ? 'text-brand-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 min-h-[500px] relative">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center rounded-2xl p-4 text-center">
            <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-900 font-bold text-lg mb-2">{loadingMessage}</p>
            <p className="text-gray-500 text-sm">Please do not close this window.</p>
          </div>
        )}

        {/* Step 1: Input */}
        {step === WorkflowStep.INPUT && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Multilingual UGC Ad</h2>
            <p className="text-gray-500 mb-8">Enter your product details, and our AI will select the perfect avatar, voice, and script for you.</p>
            
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product URL (Optional)</label>
                <input 
                  type="text" 
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://myshop.com/product/cool-gadget"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                <select 
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border bg-white"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video Idea / Script <span className="text-red-500">*</span></label>
                <textarea 
                  value={userScript}
                  onChange={(e) => setUserScript(e.target.value)}
                  placeholder="E.g., An ad for a new coffee machine. A busy professional making coffee in 30 seconds."
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 p-3 border"
                ></textarea>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i> {error}
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button 
                  onClick={handleGeneratePlan}
                  disabled={!userScript}
                  className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <i className="fas fa-magic mr-2"></i> Generate Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Planning (Review Script) */}
        {step === WorkflowStep.PLANNING && generatedPlan && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Review Plan</h2>
                <p className="text-gray-500 text-sm">Review the AI-generated script before creating visual assets.</p>
              </div>
            </div>

            {/* AI Selections */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-4">AI Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                      <i className="fas fa-user-circle text-xl"></i>
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Avatar</p>
                      <p className="text-gray-900 font-medium">{generatedPlan.suggestedAvatar}</p>
                   </div>
                </div>
                <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                      <i className="fas fa-microphone-lines text-xl"></i>
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Voice</p>
                      <p className="text-gray-900 font-medium">{generatedPlan.suggestedVoice}</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {generatedPlan.scenes.map((scene, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row gap-5 hover:border-brand-300 transition-colors">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-lg mb-2">
                      {idx + 1}
                    </div>
                    <span className="text-xs font-medium text-gray-400">{scene.duration}s</span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-3">
                        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded uppercase tracking-wide">Visual</span>
                        <p className="mt-1 text-gray-800">{scene.visual}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded uppercase tracking-wide">Audio</span>
                        <p className="mt-1 text-gray-600 italic">"{scene.audio}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
               <button 
                  onClick={() => setStep(WorkflowStep.INPUT)}
                  className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                >
                  Edit Inputs
                </button>
              <button 
                onClick={handleGenerateImages}
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center"
              >
                Next: Generate Storyboard Images <i className="fas fa-arrow-right ml-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Images (Review Generated Storyboard) */}
        {step === WorkflowStep.IMAGES && generatedPlan && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Storyboard Ready</h2>
              <button 
                onClick={handleGenerateImages} 
                className="text-sm text-brand-600 hover:text-brand-800 font-medium"
              >
                <i className="fas fa-sync-alt mr-1"></i> Regenerate Images
              </button>
            </div>

            <p className="text-gray-500 mb-8">
                These images will be used as the starting frame for your videos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {generatedPlan.scenes.map((scene, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                  <div className="relative aspect-[9/16] bg-gray-200">
                    {scene.imageUrl ? (
                       <img src={scene.imageUrl} alt={`Scene ${idx+1}`} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-bold">
                        Scene {idx + 1}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500 line-clamp-3" title={scene.visual}>{scene.visual}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-gray-100">
               <button 
                  onClick={() => setStep(WorkflowStep.PLANNING)}
                  className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                >
                  Back to Script
                </button>
              <button 
                onClick={handleGenerateVideos}
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center"
              >
                <i className="fas fa-film mr-2"></i> Generate Videos from Images
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generating Videos (Visual State) */}
        {step === WorkflowStep.GENERATING_VIDEOS && (
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <i className="fas fa-video text-3xl text-brand-600"></i>
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating Videos...</h3>
             <p className="text-gray-500 max-w-md">
                We are converting your storyboard images into video clips using Veo. 
                This ensures consistency with your selected style.
             </p>
             {/* Progress bar could go here */}
           </div>
        )}

        {/* Step 5: Result (Final Videos) */}
        {step === WorkflowStep.RESULT && generatedPlan && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 text-green-600 mb-4">
                <i className="fas fa-check text-2xl"></i>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Your Ad is Ready!</h2>
              <p className="text-gray-500 mt-2">Here are the generated clips for each scene.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              {generatedPlan.scenes.map((scene, idx) => (
                <div key={idx} className="flex flex-col">
                    <div className="bg-black rounded-xl overflow-hidden shadow-lg border border-gray-800 relative aspect-[9/16] mb-3 group">
                        {scene.videoUrl ? (
                            <video 
                                src={scene.videoUrl} 
                                controls 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50 bg-gray-900">
                                <span className="text-sm">Generation Failed</span>
                            </div>
                        )}
                        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/30 text-white px-2 py-1 rounded text-xs font-bold">
                            Scene {idx + 1}
                        </div>
                    </div>
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-medium text-gray-700">Clip {idx + 1}</span>
                        {scene.videoUrl && (
                            <a href={scene.videoUrl} download className="text-brand-600 hover:text-brand-700 text-sm font-medium">
                                <i className="fas fa-download"></i>
                            </a>
                        )}
                    </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setStep(WorkflowStep.INPUT)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Create Another Ad
              </button>
              {/* In a real app, we might stitch these videos here */}
              <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium cursor-not-allowed opacity-50" disabled>
                 <i className="fas fa-layer-group mr-2"></i> Stitch & Edit (Coming Soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UgcWorkflow;