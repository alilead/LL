/**
 * Drag & Drop System - Kanban Boards & File Uploads
 *
 * SALESFORCE: Clunky drag & drop, requires clicks to change stages
 * LEADLAB: Smooth, beautiful drag & drop with visual feedback
 *
 * This is how pipelines should feel!
 */

import { useState, useRef, DragEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical, Upload, X, FileIcon, CheckCircle } from 'lucide-react';

// ============================================================================
// KANBAN BOARD DRAG & DROP
// ============================================================================

export interface KanbanColumn<T = any> {
  id: string;
  title: string;
  items: T[];
  color?: string;
  limit?: number;
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  onMove: (itemId: string, fromColumnId: string, toColumnId: string, newIndex: number) => void;
  renderItem: (item: T, isDragging: boolean) => ReactNode;
  getItemId: (item: T) => string;
  className?: string;
}

export function KanbanBoard<T>({
  columns,
  onMove,
  renderItem,
  getItemId,
  className,
}: KanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<{ item: T; columnId: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (item: T, columnId: string) => (e: DragEvent) => {
    setDraggedItem({ item, columnId });
    e.dataTransfer.effectAllowed = 'move';
    // Add dragging class to body for global styles
    document.body.classList.add('dragging');
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
    document.body.classList.remove('dragging');
  };

  const handleDragOver = (columnId: string) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (toColumnId: string) => (e: DragEvent) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem) return;

    const fromColumnId = draggedItem.columnId;
    const itemId = getItemId(draggedItem.item);

    if (fromColumnId !== toColumnId) {
      // Find the new index (append to end of column)
      const toColumn = columns.find(col => col.id === toColumnId);
      const newIndex = toColumn ? toColumn.items.length : 0;

      onMove(itemId, fromColumnId, toColumnId, newIndex);
    }

    setDraggedItem(null);
  };

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {columns.map(column => {
        const isOver = dragOverColumn === column.id;
        const isDraggingFromThis = draggedItem?.columnId === column.id;

        return (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4 transition-all',
              isOver && 'bg-blue-50 ring-2 ring-blue-300'
            )}
            onDragOver={handleDragOver(column.id)}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop(column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {column.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                )}
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="text-sm text-gray-500">({column.items.length})</span>
              </div>
              {column.limit && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  column.items.length >= column.limit
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {column.items.length}/{column.limit}
                </span>
              )}
            </div>

            {/* Column Items */}
            <div className="space-y-2 min-h-[200px]">
              {column.items.map(item => {
                const itemId = getItemId(item);
                const isDragging = draggedItem?.item === item;

                return (
                  <div
                    key={itemId}
                    draggable
                    onDragStart={handleDragStart(item, column.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'bg-white rounded-lg p-3 shadow-sm border border-gray-200',
                      'cursor-move transition-all hover:shadow-md',
                      isDragging && 'opacity-50 scale-95'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {renderItem(item, isDragging)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Empty state */}
              {column.items.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Drop items here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// FILE UPLOAD DRAG & DROP
// ============================================================================

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  className?: string;
}

export function FileUploadDropzone({
  onFilesSelected,
  accept = '*',
  multiple = true,
  maxSize = 10, // 10MB default
  maxFiles = 10,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const validateFiles = (files: FileList | File[]): File[] | null => {
    const fileArray = Array.from(files);

    // Check file count
    if (fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return null;
    }

    // Check file sizes
    const maxSizeBytes = maxSize * 1024 * 1024;
    const oversizedFiles = fileArray.filter(f => f.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(`Files must be smaller than ${maxSize}MB`);
      return null;
    }

    setError(null);
    return fileArray;
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const validFiles = validateFiles(files);
      if (validFiles) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const validFiles = validateFiles(files);
      if (validFiles) {
        onFilesSelected(validFiles);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer',
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400 bg-gray-50',
        error && 'border-red-300 bg-red-50',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center text-center">
        <Upload
          className={cn(
            'w-12 h-12 mb-4 transition-colors',
            isDragging ? 'text-blue-500' : 'text-gray-400'
          )}
        />
        <p className="text-base font-medium text-gray-700 mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          or click to browse
        </p>
        <p className="text-xs text-gray-400">
          {multiple && `Up to ${maxFiles} files, `}
          Max {maxSize}MB per file
        </p>

        {error && (
          <div className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// File list with progress
interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (index: number) => void;
}

export function FileUploadList({ files, onRemove }: FileListProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {files.map((uploadedFile, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
        >
          <FileIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {uploadedFile.file.name}
              </p>
              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                {formatFileSize(uploadedFile.file.size)}
              </span>
            </div>

            {/* Progress bar */}
            {uploadedFile.status === 'uploading' && (
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadedFile.progress}%` }}
                />
              </div>
            )}

            {/* Success */}
            {uploadedFile.status === 'success' && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <CheckCircle className="w-3 h-3" />
                Uploaded successfully
              </div>
            )}

            {/* Error */}
            {uploadedFile.status === 'error' && (
              <div className="text-red-600 text-xs">
                {uploadedFile.error || 'Upload failed'}
              </div>
            )}
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove(index)}
            className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Complete file upload component
interface FileUploadCompleteProps {
  onUpload: (files: File[]) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
}

export function FileUploadComplete({
  onUpload,
  accept,
  multiple = true,
  maxSize = 10,
  maxFiles = 10,
}: FileUploadCompleteProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    // Add files to list with uploading status
    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simulate upload (replace with actual upload logic)
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = uploadedFiles.length + i;

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadedFiles(prev =>
          prev.map((f, idx) =>
            idx === fileIndex ? { ...f, progress } : f
          )
        );
      }

      // Mark as success
      setUploadedFiles(prev =>
        prev.map((f, idx) =>
          idx === fileIndex ? { ...f, status: 'success' as const } : f
        )
      );
    }

    // Call upload callback
    try {
      await onUpload(files);
    } catch (error) {
      console.error('Upload failed:', error);
      // Mark last files as error
      setUploadedFiles(prev =>
        prev.map((f, idx) =>
          idx >= uploadedFiles.length
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        )
      );
    }
  };

  const handleRemove = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div>
      <FileUploadDropzone
        onFilesSelected={handleFilesSelected}
        accept={accept}
        multiple={multiple}
        maxSize={maxSize}
        maxFiles={maxFiles}
      />
      <FileUploadList files={uploadedFiles} onRemove={handleRemove} />
    </div>
  );
}
