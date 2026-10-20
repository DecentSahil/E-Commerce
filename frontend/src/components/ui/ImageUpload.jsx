import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { productsApi } from '../../api/products';

export const ImageUpload = ({
  value = '',
  onChange,
  label = 'Product Image',
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState(value ? (value.startsWith('http') || value.startsWith('/') ? 'url' : 'file') : 'file');
  const [urlInput, setUrlInput] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPEG, PNG, WebP, SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit. Please compress the file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const res = await productsApi.uploadImage(file);
      const uploadedUrl = res.data?.imageUrl || res.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
        setUrlInput(uploadedUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result);
          setUrlInput(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result);
        setUrlInput(reader.result);
      };
      reader.readAsDataURL(file);
      setUploadError(
        err.response?.data?.message || 'Server upload failed, using local image data preview.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUploadError(null);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 text-xs block">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeTab === 'file'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-md transition ${
              activeTab === 'url'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="flex-1">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-amber-800 hover:text-amber-950 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {value ? (
        <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-3 flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Image Attached</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500 truncate">{value}</p>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition text-xs font-bold flex items-center gap-1 shrink-0"
            title="Remove image"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      ) : activeTab === 'file' ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={disabled || uploading}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {uploading ? 'Uploading image to server...' : 'Click to upload or drag & drop'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PNG, JPG, WebP or SVG (max 10MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or CDN link"
              value={urlInput}
              disabled={disabled}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={disabled || !urlInput.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0"
          >
            Apply URL
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
