import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Camera, MapPin, Loader2, Image as ImageIcon, AlertTriangle, Sparkles, Activity, FileText, AlertCircle } from 'lucide-react';

import { ComplaintService } from '@/services/complaint.service';
import LocationPicker from '@/components/map/LocationPicker';
import ImageUploader from '@/components/form/ImageUploader';
import { GlassCard } from '@/components/ui/GlassCard';

const steps = [
  { id: 'Step 1', name: 'Information', icon: FileText },
  { id: 'Step 2', name: 'Evidence', icon: Camera },
  { id: 'Step 3', name: 'Location', icon: MapPin },
  { id: 'Step 4', name: 'Review', icon: Check },
];

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.tuple([
    z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
    z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  ], { required_error: 'Please pinpoint the exact location on the map.' }),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportComplaint() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const duplicateVoicePlayedRef = useRef(false);

  useEffect(() => {
    const isHighDuplicate = aiAnalysis?.duplicateDetected === true && String(aiAnalysis?.duplicateLevel).toUpperCase() === 'HIGH';
    const isReviewStep = currentStep === 3;
    
    if (isHighDuplicate && isReviewStep && !isAnalyzing) {
      if (!duplicateVoicePlayedRef.current) {
        duplicateVoicePlayedRef.current = true;
        console.log('[DUPLICATE VOICE] HIGH duplicate detected');
        
        if (!window.speechSynthesis) {
          console.log('[DUPLICATE VOICE] SpeechSynthesis API unavailable');
          return;
        }

        console.log('[DUPLICATE VOICE] Starting voice announcement');
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance("Attention! A similar complaint has already been reported from your street. Please review the existing complaint before submitting.");
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onend = () => {
          console.log('[DUPLICATE VOICE] Voice announcement completed');
        };

        window.speechSynthesis.speak(utterance);
      }
    } else if (!isHighDuplicate || !isReviewStep || isAnalyzing) {
      if (duplicateVoicePlayedRef.current) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        duplicateVoicePlayedRef.current = false;
      }
    }
    
    return () => {
      if (!isReviewStep && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [aiAnalysis, currentStep, isAnalyzing]);

  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched'
  });

  const next = async () => {
    let isStepValid = true;
    
    if (currentStep === 0) {
      isStepValid = await trigger(['title', 'description']);
    } else if (currentStep === 1) {
      if (images.length > 5) {
        setImageError('Maximum 5 images allowed');
        isStepValid = false;
      } else {
        setImageError('');
        isStepValid = true;
      }
    } else if (currentStep === 2) {
      isStepValid = await trigger(['location']);
      if (isStepValid) {
        setIsAnalyzing(true);
        try {
          const data = getValues();
          const formData = new FormData();
          formData.append('title', data.title);
          formData.append('description', data.description);
          formData.append('latitude', data.location[1].toString());
          formData.append('longitude', data.location[0].toString());
          images.forEach(img => formData.append('images', img));
          
          console.log('\n[PRE-DUPLICATE DEBUG] selected images count:', images.length);
          console.log('[PRE-DUPLICATE DEBUG] FormData keys:', Array.from(formData.keys()));
          console.log('[PRE-DUPLICATE DEBUG] FormData image entries:', formData.getAll('images'));
          
          const analysisResult = await ComplaintService.analyzePreSubmission(formData);
          
          console.log('[PRE-DUPLICATE DEBUG] response from analyzePreSubmission:', analysisResult);
          
          setAiAnalysis(analysisResult);
        } catch (error) {
          console.error("AI Analysis failed:", error);
          setAiAnalysis({ processingStatus: 'FAILED', message: 'AI Analysis temporarily unavailable.' });
        } finally {
          setIsAnalyzing(false);
        }
      }
    }

    if (!isStepValid) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep(step => step + 1);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(step => step - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      setServerError('');
      
      const complaint = await ComplaintService.create({
        title: data.title,
        description: data.description,
        location: {
          type: 'Point',
          coordinates: data.location
        },
        aiAnalysis: aiAnalysis?.processingStatus === 'FAILED' ? undefined : aiAnalysis
      });
      
      if (!complaint || !complaint._id) {
        throw new Error("Complaint was not confirmed as created by the server.");
      }
      
      if (images && images.length > 0) {
        await ComplaintService.uploadImages(complaint._id, images);
      }

      navigate('/dashboard/complaints', { replace: true });
    } catch (error: any) {
      console.error("[FRONTEND] Complaint submission failed:", error);
      setServerError(error.response?.data?.message || error.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Report an Issue</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Provide details about the civic issue you observed.</p>
      </div>

      {/* Premium Stepper */}
      <nav aria-label="Progress" className="mb-12 max-w-2xl mx-auto">
        <ol role="list" className="flex items-center justify-between">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative flex flex-col items-center flex-1 ${stepIdx !== steps.length - 1 ? 'w-full' : ''}`}>
              {stepIdx !== steps.length - 1 && (
                <div className="absolute left-1/2 top-6 w-full -translate-y-1/2 px-4" aria-hidden="true">
                  <div className={`h-1 w-full rounded-full transition-colors duration-500 ${stepIdx < currentStep ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                </div>
              )}
              
              <button
                type="button"
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 shadow-sm z-10 ${
                  stepIdx < currentStep
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                    : stepIdx === currentStep
                    ? 'border-4 border-indigo-600 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 scale-110'
                    : 'border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {stepIdx < currentStep ? (
                  <Check className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <step.icon className={`h-5 w-5 ${stepIdx === currentStep ? 'animate-pulse' : ''}`} aria-hidden="true" />
                )}
              </button>
              <span className={`mt-3 text-sm font-bold tracking-wide transition-colors duration-500 ${stepIdx <= currentStep ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-400'}`}>
                {step.name}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <GlassCard className="overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8 sm:p-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Step 1: Information */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Issue Details</h2>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">Provide clear and descriptive details about the problem.</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                        <input
                          {...register('title')}
                          type="text"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm"
                          placeholder="e.g. Large pothole on Main Street"
                        />
                        {errors.title && <p className="mt-2 text-sm text-red-500 font-medium">{errors.title.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                        <textarea
                          {...register('description')}
                          rows={5}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all shadow-sm resize-none"
                          placeholder="Please describe the issue, exact location details, or any other helpful information..."
                        />
                        {errors.description && <p className="mt-2 text-sm text-red-500 font-medium">{errors.description.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Evidence */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Photographic Evidence</h2>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">Upload photos to help us process your complaint faster. (Optional, up to 5 images)</p>
                    </div>
                    
                    <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                      <ImageUploader 
                        value={images} 
                        onChange={(files) => setImages(files)} 
                      />
                    </div>
                    {imageError && <p className="mt-2 text-sm text-red-500 font-bold bg-red-50 p-3 rounded-lg">{imageError}</p>}
                  </div>
                )}

                {/* Step 3: Location */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Issue Location</h2>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">Pinpoint exactly where the issue is located on the map.</p>
                    </div>
                    
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm h-[400px]">
                      <LocationPicker 
                        value={getValues('location')} 
                        onChange={(loc) => setValue('location', loc, { shouldValidate: true })} 
                      />
                    </div>
                    {errors.location && <p className="mt-2 text-sm text-red-500 text-center font-bold bg-red-50 p-3 rounded-lg">{errors.location.message as string}</p>}
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Review & Submit</h2>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">Double check your information before submitting.</p>
                    </div>
                    
                    <div className="space-y-6">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                            <Loader2 className="relative w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI is analyzing your report...</h3>
                          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Checking for duplicates, estimating severity, and generating summary.</p>
                        </div>
                      ) : (
                        <>
                          {/* HIGH Duplicate Warning */}
                          {aiAnalysis?.duplicateDetected === true && String(aiAnalysis?.duplicateLevel).toUpperCase() === 'HIGH' && (
                            <div className="bg-red-50/90 dark:bg-red-950/40 border-2 border-red-500 dark:border-red-600 rounded-2xl overflow-hidden shadow-sm relative mb-6 backdrop-blur-sm">
                              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-[length:200%_100%] animate-[gradient_2s_linear_infinite]" />
                              <div className="p-6 flex flex-col sm:flex-row items-start gap-5">
                                <div className="bg-red-100 dark:bg-red-900/50 p-4 rounded-full animate-pulse shrink-0 shadow-inner">
                                  <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xl font-black text-red-900 dark:text-red-300 flex items-center gap-2 mb-2 tracking-tight">
                                    🚨 THIS ISSUE HAS ALREADY BEEN REPORTED
                                  </h4>
                                  <p className="text-base text-red-800 dark:text-red-200 font-medium">
                                    We found a highly similar complaint nearby. To avoid duplicate processing, an existing complaint is already being handled.
                                  </p>
                                  {aiAnalysis.confidence && (
                                    <div className="mt-4 flex flex-wrap gap-3">
                                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 shadow-sm">
                                        Match confidence: {aiAnalysis.confidence.toFixed(0)}%
                                      </span>
                                      {aiAnalysis.matchedComplaintId && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800 shadow-sm font-mono tracking-wider">
                                          Case ID: #{aiAnalysis.matchedComplaintId.slice(-6).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-5 bg-red-100/50 dark:bg-red-900/30 p-4 rounded-xl border border-red-200/50 dark:border-red-800/50 flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800 dark:text-red-300 font-semibold leading-relaxed">
                                      You can still submit your complaint, but it will be flagged as a duplicate and may not be assigned as a new separate issue.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* POSSIBLE Duplicate Warning */}
                          {aiAnalysis?.duplicateDetected === true && String(aiAnalysis?.duplicateLevel).toUpperCase() === 'POSSIBLE' && (
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-2xl overflow-hidden shadow-sm p-5 flex items-start gap-4 mb-6">
                                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-500 shrink-0 mt-1" />
                                <div>
                                  <h4 className="text-lg font-bold text-amber-900 dark:text-amber-400">
                                    Possible Duplicate Issue Detected
                                  </h4>
                                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1 font-medium">
                                    A somewhat similar complaint exists nearby. Ensure this is a distinct issue before submitting.
                                  </p>
                                  {aiAnalysis.confidence && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                        Match confidence: {aiAnalysis.confidence.toFixed(0)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                            </div>
                          )}
                          
                          {/* AI Intelligence Block */}
                          {aiAnalysis && aiAnalysis.processingStatus !== 'FAILED' && (
                            <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/50 p-6 rounded-2xl space-y-5 shadow-sm">
                              <h4 className="text-base font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 pb-3 border-b border-indigo-100 dark:border-indigo-800/50">
                                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> AI Pre-Submission Intelligence
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {aiAnalysis.categoryPrediction && (
                                  <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <span className="block text-xs font-bold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-1">Category Routing</span>
                                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{aiAnalysis.categoryPrediction}</span>
                                  </div>
                                )}
                                {aiAnalysis.priority !== undefined && (
                                  <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <span className="block text-xs font-bold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-1 flex items-center gap-1"><Activity className="w-3 h-3"/> Priority Score</span>
                                    <span className="text-sm font-bold text-indigo-900 dark:text-indigo-100">{aiAnalysis.priority >= 75 ? 'High' : aiAnalysis.priority >= 40 ? 'Medium' : 'Low'} ({Math.round(aiAnalysis.priority)}/100)</span>
                                  </div>
                                )}
                              </div>
                              {aiAnalysis.summary && (
                                <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                  <span className="block text-xs font-bold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-2 flex items-center gap-1"><FileText className="w-3 h-3"/> AI Summary</span>
                                  <p className="text-sm text-indigo-900 dark:text-indigo-200 italic font-medium leading-relaxed">"{aiAnalysis.summary}"</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Title</h4>
                                <p className="text-slate-900 dark:text-white font-semibold text-lg leading-snug">{getValues('title')}</p>
                              </div>
                          
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Description</h4>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">{getValues('description')}</p>
                              </div>

                              {images.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                                    <ImageIcon className="w-4 h-4" /> Evidence Attached
                                  </h4>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 inline-block">{images.length} image(s)</p>
                                </div>
                              )}
                            </div>
                            
                            {getValues('location') && (
                              <div className="h-full">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                                  Location Map
                                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                                    {getValues('location')![1].toFixed(6)}, {getValues('location')![0].toFixed(6)}
                                  </span>
                                </h4>
                                <div className="h-64 md:h-[calc(100%-2rem)] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <LocationPicker value={getValues('location')} onChange={() => {}} readOnly={true} />
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form Actions */}
          <div className="px-8 py-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            {serverError && (
              <div className="p-4 text-sm font-bold text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {serverError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prev}
                disabled={currentStep === 0 || isSubmitting}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all hover:-translate-y-0.5"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isAnalyzing}
                    className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none flex items-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
                  >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              )}
            </div>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
