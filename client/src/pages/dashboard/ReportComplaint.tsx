import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Camera, MapPin, Loader2, Image as ImageIcon } from 'lucide-react';

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
  category: z.string().min(1, 'Category is required'),
  department: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.tuple([
    z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
    z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  ], { required_error: 'Please pinpoint the exact location on the map.' }),
  images: z.array(z.any()).max(5, 'Maximum 5 images allowed').default([]),
});

type FormData = z.infer<typeof formSchema>;

export default function ReportComplaint() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const { register, handleSubmit, formState: { errors, isValid }, trigger, getValues, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onTouched',
    defaultValues: {
      images: []
    }
  });

  const next = async () => {
    let isStepValid = true;
    
    if (currentStep === 0) {
      isStepValid = await trigger(['title', 'category', 'description']);
    } else if (currentStep === 1) {
      isStepValid = await trigger(['images']);
    } else if (currentStep === 2) {
      isStepValid = await trigger(['location']);
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
        category: data.category,
        location: {
          type: 'Point',
          coordinates: data.location
        }
      });
      
      if (data.images && data.images.length > 0) {
        await ComplaintService.uploadImages(complaint._id, data.images);
      }

      navigate('/dashboard/complaints', { replace: true });
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentImages = watch('images') || [];

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
                      <h2 className="text-lg font-medium text-slate-900">Complaint Details</h2>
                      <p className="mt-1 text-sm text-slate-500">What is the issue about?</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Title</label>
                        <input
                          {...register('title')}
                          type="text"
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. Large pothole on Main St"
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Category</label>
                          <select
                            {...register('category')}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">Select a category</option>
                            <option value="infrastructure">Infrastructure & Roads</option>
                            <option value="sanitation">Waste & Sanitation</option>
                            <option value="utilities">Water & Utilities</option>
                            <option value="environment">Parks & Environment</option>
                            <option value="other">Other</option>
                          </select>
                          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Department (Optional)</label>
                          <select
                            {...register('department')}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">Auto-assign via AI</option>
                            <option value="public_works">Public Works</option>
                            <option value="sanitation">Sanitation</option>
                            <option value="water_board">Water Board</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                          {...register('description')}
                          rows={4}
                          className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Please describe the issue in detail..."
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
                      value={currentImages} 
                      onChange={(files) => setValue('images', files, { shouldValidate: true })} 
                    />
                    {errors.images && <p className="mt-1 text-sm text-red-500 font-medium">{errors.images.message as string}</p>}
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
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">Title</h4>
                        <p className="text-slate-900 font-medium">{getValues('title')}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1">Category</h4>
                          <p className="text-slate-900 capitalize">{getValues('category')}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1">Department</h4>
                          <p className="text-slate-900 capitalize">{getValues('department') || 'Auto-assign'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-1">Description</h4>
                        <p className="text-slate-900 whitespace-pre-wrap text-sm">{getValues('description')}</p>
                      </div>

                      {currentImages.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-500 mb-1 flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" /> Evidence
                          </h4>
                          <p className="text-sm text-slate-700">{currentImages.length} image(s) attached.</p>
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
                  disabled={isSubmitting}
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
