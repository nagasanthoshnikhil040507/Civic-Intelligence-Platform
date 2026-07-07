import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Camera, X, UploadCloud, FileWarning } from 'lucide-react';

interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function ImageUploader({ value, onChange, maxFiles = 5, maxSizeMB = 5 }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const validateFiles = (files: File[]): File[] => {
    setError('');
    const validFiles: File[] = [];
    let currentTotal = value.length;

    for (const file of files) {
      if (currentTotal >= maxFiles) {
        setError(`Maximum of ${maxFiles} images allowed.`);
        break;
      }

      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid format: ${file.name}. Only JPEG, PNG, WEBP are allowed.`);
        continue;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File too large: ${file.name}. Maximum size is ${maxSizeMB}MB.`);
        continue;
      }

      // Check for exact duplicates by name and size
      if (value.some(v => v.name === file.name && v.size === file.size) || 
          validFiles.some(v => v.name === file.name && v.size === file.size)) {
        setError(`Duplicate file: ${file.name}.`);
        continue;
      }

      validFiles.push(file);
      currentTotal++;
    }

    return validFiles;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newFiles = validateFiles(Array.from(files));
    if (newFiles.length > 0) {
      onChange([...value, ...newFiles]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleFiles(e.target.files);
    // Reset input so the same file can be selected again if removed
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeFile = (indexToRemove: number) => {
    const newFiles = value.filter((_, index) => index !== indexToRemove);
    onChange(newFiles);
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg, image/png, image/webp"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-white rounded-full shadow-sm">
            <UploadCloud className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <p className="text-slate-700 font-medium">
              Drag & drop images here or <button type="button" onClick={onButtonClick} className="text-indigo-600 hover:underline focus:outline-none">browse files</button>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPEG, PNG, WEBP (Max {maxSizeMB}MB each)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
          <FileWarning className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {value.map((file, index) => {
            const objectUrl = URL.createObjectURL(file);
            return (
              <div key={`${file.name}-${index}`} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                <img 
                  src={objectUrl} 
                  alt={`Preview ${index}`} 
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(objectUrl)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1.5 bg-white text-red-500 rounded-full hover:bg-red-50 hover:scale-110 transition-transform focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {value.length > 0 && (
        <p className="text-xs text-slate-500 text-right">
          {value.length} of {maxFiles} images selected
        </p>
      )}
    </div>
  );
}
