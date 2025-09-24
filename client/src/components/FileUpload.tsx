import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { createNotifications } from "@/lib/notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadWithCsrf } from "@/lib/queryClient";

interface FileUploadProps {
  fileType: "study" | "lab";
  onUploadSuccess: () => void;
  disabled?: boolean;
}

interface UploadFile {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
  success?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg", 
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

export default function FileUpload({ fileType, onUploadSuccess, disabled }: FileUploadProps) {
  const { t } = useLanguage();
  const notifications = createNotifications(t);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileTypeLabel = () => {
    return fileType === "study" ? t('fileUpload.medicalStudies') : t('fileUpload.labResults');
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      // LS-107: Show validation error notification
      notifications.error.validationError(t('fileUpload.fileSizeValidation').replace('{size}', Math.round(file.size / 1024 / 1024).toString()));
      return t('fileUpload.fileTooLarge');
    }
    
    if (!ACCEPTED_TYPES.includes(file.type)) {
      // LS-107: Show validation error notification
      notifications.error.validationError(t('fileUpload.fileTypeValidation'));
      return t('fileUpload.invalidFileType');
    }
    
    return null;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      newFiles.push({
        file,
        preview: file.name,
        uploading: false,
        progress: 0,
        error: error || undefined,
        success: false,
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleUpload = async (fileIndex: number) => {
    const uploadFile = files[fileIndex];
    if (!uploadFile || uploadFile.error) return;

    // Update file status to uploading
    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, uploading: true, progress: 0 } : f
    ));

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('fileType', fileType);
      formData.append('originalName', uploadFile.file.name);

      // Simulate upload progress (real implementation would track actual progress)
      progressInterval = setInterval(() => {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
        ));
      }, 200);

      // LS-108: Use uploadWithCsrf helper that automatically handles CSRF tokens
      const response = await uploadWithCsrf('/api/profile/medical-documents/upload', formData);

      if (response.ok) {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, uploading: false, progress: 100, success: true } : f
        ));
        onUploadSuccess();
        
        // LS-107: Show success notification with filename
        notifications.success.documentUploaded(uploadFile.file.name);
        
        // Remove successful uploads after 2 seconds using stable file properties
        setTimeout(() => {
          setFiles(prev => prev.filter(f => 
            !(f.file.name === uploadFile.file.name && 
              f.file.size === uploadFile.file.size && 
              f.file.lastModified === uploadFile.file.lastModified && 
              f.success)
          ));
        }, 2000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || t('fileUpload.uploadError'));
      }
    } catch (error) {
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          uploading: false, 
          error: error instanceof Error ? error.message : t('fileUpload.unknownError')
        } : f
      ));
      
      // LS-107: Show error notification with filename
      notifications.error.uploadFailed(uploadFile.file.name);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer hover-elevate ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={!disabled ? openFileDialog : undefined}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        data-testid={`upload-zone-${fileType}`}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {t('fileUpload.upload')} {getFileTypeLabel()}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {t('fileUpload.dragHere')}
          </p>
          <p className="text-xs text-gray-400">
            {t('fileUpload.formats')}
          </p>
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((uploadFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadFile.preview}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploadFile.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : uploadFile.error ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : uploadFile.uploading ? (
                    <div className="w-16">
                      <Progress value={uploadFile.progress} className="h-2" />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleUpload(index)}
                      disabled={disabled || !!uploadFile.error}
                      data-testid={`button-upload-file-${index}`}
                    >
                      {t('fileUpload.upload')}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploadFile.uploading}
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {uploadFile.error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadFile.error}</AlertDescription>
                </Alert>
              )}

              {uploadFile.uploading && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{t('fileUpload.uploading')}</span>
                    <span>{uploadFile.progress}%</span>
                  </div>
                  <Progress value={uploadFile.progress} className="mt-1" />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}