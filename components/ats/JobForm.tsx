"use client";

import { useState, useCallback } from 'react';

interface JobSection {
  id: string;
  title: string;
  content: string;
  sectionType: string;
  order: number;
}

interface JobData {
  id?: string;
  title: string;
  department?: string;
  location?: string;
  locationType?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  status?: string;
  priority?: number;
  closingDate?: string;
  sections?: JobSection[];
}

interface JobFormProps {
  job?: JobData | null;
  onSubmit: (data: Partial<JobData>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

const SECTION_TYPES = [
  { value: 'responsibilities', label: 'Responsibilities' },
  { value: 'requirements', label: 'Requirements' },
  { value: 'qualifications', label: 'Qualifications' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'about', label: 'About the Role' },
  { value: 'custom', label: 'Custom' },
];

export function JobForm({
  job,
  onSubmit,
  onCancel,
  isLoading = false,
}: JobFormProps) {
  const [formData, setFormData] = useState<Partial<JobData>>({
    title: job?.title || '',
    department: job?.department || '',
    location: job?.location || '',
    locationType: job?.locationType || 'onsite',
    employmentType: job?.employmentType || 'full_time',
    salaryMin: job?.salaryMin,
    salaryMax: job?.salaryMax,
    salaryCurrency: job?.salaryCurrency || 'USD',
    description: job?.description || '',
    requirements: job?.requirements || '',
    benefits: job?.benefits || '',
    status: job?.status || 'draft',
    priority: job?.priority || 0,
    closingDate: job?.closingDate || '',
  });
  
  const [sections, setSections] = useState<JobSection[]>(
    job?.sections || []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value, 10) : undefined) : value,
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  // Section management
  const addSection = useCallback(() => {
    const newSection: JobSection = {
      id: `temp-${Date.now()}`,
      title: 'New Section',
      content: '',
      sectionType: 'custom',
      order: sections.length,
    };
    setSections(prev => [...prev, newSection]);
  }, [sections.length]);

  const updateSection = useCallback((id: string, field: keyof JobSection, value: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedSection(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;

    setSections(prev => {
      const draggedIndex = prev.findIndex(s => s.id === draggedSection);
      const targetIndex = prev.findIndex(s => s.id === targetId);
      
      const newSections = [...prev];
      const [removed] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, removed);
      
      return newSections.map((s, i) => ({ ...s, order: i }));
    });
    
    setDraggedSection(null);
  }, [draggedSection]);

  const handleDragEnd = useCallback(() => {
    setDraggedSection(null);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Job title is required';
    }
    
    if (formData.salaryMin && formData.salaryMax && formData.salaryMin > formData.salaryMax) {
      newErrors.salaryMax = 'Max salary must be greater than min salary';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    await onSubmit({
      ...formData,
      sections: sections.map((s, i) => ({ ...s, order: i })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Job Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title}</p>
          )}
        </div>
        
        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Location Type */}
        <div>
          <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-1">
            Location Type
          </label>
          <select
            id="locationType"
            name="locationType"
            value={formData.locationType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="onsite">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        
        {/* Employment Type */}
        <div>
          <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700 mb-1">
            Employment Type
          </label>
          <select
            id="employmentType"
            name="employmentType"
            value={formData.employmentType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>
        </div>
        
        {/* Salary Min */}
        <div>
          <label htmlFor="salaryMin" className="block text-sm font-medium text-gray-700 mb-1">
            Salary Min
          </label>
          <input
            type="number"
            id="salaryMin"
            name="salaryMin"
            value={formData.salaryMin || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Salary Max */}
        <div>
          <label htmlFor="salaryMax" className="block text-sm font-medium text-gray-700 mb-1">
            Salary Max
          </label>
          <input
            type="number"
            id="salaryMax"
            name="salaryMax"
            value={formData.salaryMax || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.salaryMax ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.salaryMax && (
            <p className="mt-1 text-sm text-red-500">{errors.salaryMax}</p>
          )}
        </div>
        
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
        </div>
        
        {/* Closing Date */}
        <div>
          <label htmlFor="closingDate" className="block text-sm font-medium text-gray-700 mb-1">
            Closing Date
          </label>
          <input
            type="date"
            id="closingDate"
            name="closingDate"
            value={formData.closingDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Job Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Sections with DnD */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Job Sections (Drag to reorder)
          </label>
          <button
            type="button"
            onClick={addSection}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            + Add Section
          </button>
        </div>
        
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              draggable
              onDragStart={(e) => handleDragStart(e, section.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, section.id)}
              onDragEnd={handleDragEnd}
              className={`p-4 border rounded-lg bg-white ${
                draggedSection === section.id ? 'opacity-50 border-blue-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="cursor-move text-gray-400 hover:text-gray-600 pt-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                      placeholder="Section Title"
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={section.sectionType}
                      onChange={(e) => updateSection(section.id, 'sectionType', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    >
                      {SECTION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                    placeholder="Section content..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => removeSection(section.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : job?.id ? 'Update Job' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}
