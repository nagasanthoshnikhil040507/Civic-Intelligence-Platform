import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Camera, MapPin, Loader2, Image as ImageIcon, AlertTriangle, Sparkles, Activity, FileText } from 'lucide-react';

import { ComplaintService } from '@/services/complaint.service';
import LocationPicker from '@/components/map/LocationPicker';
import ImageUploader from '@/components/form/ImageUploader';

const steps = [
  { id: 'Step 1', name: 'Information', icon: undefined },
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
  // Remove images from Zod to prevent RHF from destroying File prototypes
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

  const { register, handleSubmit, formState: { errors }, trigger, getValues, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched'
  });

  const next = async () => {
    let isStepValid = true;
    
    if (currentStep === 0) {
      isStepValid = await trigger(['title', 'description']);
    } else if (currentStep === 1) {
      // Custom validation for images
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
          
          const analysisResult = await ComplaintService.analyzePreSubmission(formData);
          
          console.log("[DUPLICATE RAW API RESPONSE]", analysisResult);
          console.log("[DUPLICATE AI ANALYSIS STATE BEFORE SET]", aiAnalysis);
          console.log("[DUPLICATE ANALYSIS RECEIVED]", analysisResult);
          
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
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Report an Issue</h1>
        <p className="text-slate-500">Provide details about the civic issue you observed.</p>
      </div>

      {/* Stepper */}
      <nav aria-label="Progress" className="mb-12">
        <ol role="list" className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className={`h-0.5 w-full ${stepIdx < currentStep ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              </div>
              <button
                type="button"
                className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  stepIdx < currentStep
                    ? 'bg-indigo-600 hover:bg-indigo-900'
                    : stepIdx === currentStep
                    ? 'border-2 border-indigo-600 bg-white'
                    : 'border-2 border-slate-300 bg-white'
                }`}
              >
                {stepIdx < currentStep ? (
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                ) : (
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      stepIdx === currentStep ? 'bg-indigo-600' : 'bg-transparent'
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="sr-only">{step.name}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step 1: Information */}
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium text-slate-900">Report Garbage</h2>
                      <p className="mt-1 text-sm text-slate-500">Provide details about the garbage issue.</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Title</label>
                        <input
                          {...register('title')}
                          type="text"
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. Garbage overflow near bus stop"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                          {...register('description')}
                          rows={4}
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Please describe the garbage pile, exact location details, or any other helpful information..."
                        />
                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Evidence */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium text-slate-900">Photographic Evidence</h2>
                      <p className="mt-1 text-sm text-slate-500">Upload photos to help us process your complaint faster. (Optional, up to 5 images)</p>
                    </div>
                    
                    <ImageUploader 
                      value={images} 
                      onChange={(files) => setImages(files)} 
                    />
                    {imageError && <p className="mt-1 text-sm text-red-500 font-medium">{imageError}</p>}
                  </div>
                )}

                {/* Step 3: Location */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium text-slate-900">Issue Location</h2>
                      <p className="mt-1 text-sm text-slate-500">Pinpoint exactly where the issue is located.</p>
                    </div>
                    
                    <LocationPicker 
                      value={getValues('location')} 
                      onChange={(loc) => setValue('location', loc, { shouldValidate: true })} 
                    />
                    {errors.location && <p className="mt-1 text-sm text-red-500 text-center font-medium bg-red-50 p-2 rounded">{errors.location.message as string}</p>}
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-lg font-medium text-slate-900">Review & Submit</h2>
                      <p className="mt-1 text-sm text-slate-500">Double check your information before submitting.</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-lg p-6 space-y-6 border border-slate-200">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                          <h3 className="text-lg font-medium text-slate-900">AI Intelligence is analyzing your complaint...</h3>
                          <p className="text-sm text-slate-500 mt-2">Checking for duplicates, estimating severity, and generating summary.</p>
                        </div>
                      ) : (
                        <>
                          {aiAnalysis?.duplicateDetected === true && String(aiAnalysis?.duplicateLevel).toUpperCase() === 'HIGH' && (
                            <div className="bg-red-50 border-2 border-red-500 rounded-xl overflow-hidden shadow-sm relative mb-6">
                              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-[length:200%_100%] animate-[gradient_2s_linear_infinite]" />
                              <div className="p-5 flex items-start gap-4">
                                <div className="bg-red-100 p-3 rounded-full animate-pulse">
                                  <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-red-900 flex items-center gap-2">
                                    🚨 THIS ISSUE HAS ALREADY BEEN REPORTED
                                  </h4>
                                  <p className="text-sm text-red-800 mt-2 font-medium">
                                    We found a highly similar complaint nearby. To avoid duplicate processing, an existing complaint is already being processed.
                                  </p>
                                  {aiAnalysis.confidence && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                        Match confidence: {aiAnalysis.confidence.toFixed(0)}%
                                      </span>
                                      {aiAnalysis.matchedComplaintId && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 font-mono">
                                          Existing complaint: #{aiAnalysis.matchedComplaintId.slice(-6).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs text-red-700 mt-3 bg-red-100/50 p-2 rounded border border-red-100 italic">
                                    You can still submit your complaint, but it will be flagged as a duplicate and may not be assigned as a new separate issue.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {aiAnalysis?.duplicateDetected === true && String(aiAnalysis?.duplicateLevel).toUpperCase() === 'POSSIBLE' && (
                            <div className="bg-amber-50 border border-amber-300 rounded-xl overflow-hidden shadow-sm relative mb-6 p-4 flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-md font-bold text-amber-900">
                                    Possible Duplicate Issue Detected
                                  </h4>
                                  <p className="text-sm text-amber-800 mt-1">
                                    A somewhat similar complaint exists nearby. Ensure this is a distinct issue.
                                  </p>
                                  {aiAnalysis.confidence && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                        Match confidence: {aiAnalysis.confidence.toFixed(0)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                            </div>
                          )}
                          
                          {aiAnalysis && aiAnalysis.processingStatus !== 'FAILED' && (
                            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg space-y-3">
                              <h4 className="text-sm font-medium text-indigo-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" /> AI Suggestions
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {aiAnalysis.categoryPrediction && (
                                  <div>
                                    <span className="block text-xs font-medium text-indigo-500">Suggested Category</span>
                                    <span className="text-sm font-semibold text-indigo-900">{aiAnalysis.categoryPrediction}</span>
                                  </div>
                                )}
                                {aiAnalysis.priority !== undefined && (
                                  <div>
                                    <span className="block text-xs font-medium text-indigo-500 flex items-center gap-1"><Activity className="w-3 h-3"/> Priority</span>
                                    <span className="text-sm font-semibold text-indigo-900">{aiAnalysis.priority >= 75 ? 'High' : aiAnalysis.priority >= 40 ? 'Medium' : 'Low'} ({Math.round(aiAnalysis.priority)}/100)</span>
                                  </div>
                                )}
                              </div>
                              {aiAnalysis.summary && (
                                <div className="mt-2 border-t border-indigo-100 pt-3">
                                  <span className="block text-xs font-medium text-indigo-500 flex items-center gap-1 mb-1"><FileText className="w-3 h-3"/> AI Summary</span>
                                  <p className="text-sm text-indigo-800 italic">{aiAnalysis.summary}</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <h4 className="text-sm font-medium text-slate-500 mb-1">Title</h4>
                            <p className="text-slate-900 font-medium">{getValues('title')}</p>
                          </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                        <p className="text-slate-900 whitespace-pre-wrap text-sm">{getValues('description')}</p>
                      </div>

                      {images.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" /> Evidence
                          </h4>
                          <p className="text-sm text-slate-700">{images.length} image(s) attached.</p>
                        </div>
                      )}
                      
                      {getValues('location') && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center justify-between">
                            Location
                            <span className="font-mono text-xs bg-white px-2 py-0.5 border border-slate-200 rounded">
                              {getValues('location')![1].toFixed(6)}, {getValues('location')![0].toFixed(6)}
                            </span>
                          </h4>
                          <div className="h-40 w-full rounded-lg overflow-hidden border border-slate-200">
                            <LocationPicker value={getValues('location')} onChange={() => {}} readOnly={true} />
                          </div>
                        </div>
                      )}
                      </>
                    )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Form Actions */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-4">
            {serverError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {serverError}
              </div>
            )}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prev}
                disabled={currentStep === 0 || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || isAnalyzing}
                    className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                  >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
