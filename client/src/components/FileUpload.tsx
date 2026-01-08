import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Upload, FileText, X, CheckCircle, AlertCircle, FlaskConical, ClipboardList } from "lucide-react";
import { createNotifications } from "@/lib/notifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { uploadWithCsrf } from "@/lib/queryClient";
import { MemoryGame } from "./MemoryGame";
import { MatchingGame } from "./MatchingGame";

interface FileUploadProps {
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
  documentType: "study" | "lab"; // Store document type per file
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

export default function FileUpload({ onUploadSuccess, disabled }: FileUploadProps) {
  const { t } = useLanguage();
  const notifications = createNotifications(t);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<"study" | "lab" | null>(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState<"memory" | "matching">("memory");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isTypeSelected = selectedDocumentType !== null;
  
  const isFileProcessing = useMemo(() => {
    return files.some(f => f.uploading);
  }, [files]);

  useEffect(() => {
    if (isFileProcessing) {
      setGameDialogOpen(true);
    } else {
      setGameDialogOpen(false);
    }
  }, [isFileProcessing]);

  const handleGameComplete = useCallback(() => {
    setCurrentGame(prev => prev === "memory" ? "matching" : "memory");
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      notifications.error.validationError(t('fileUpload.fileSizeValidation').replace('{size}', Math.round(file.size / 1024 / 1024).toString()));
      return t('fileUpload.fileTooLarge');
    }
    
    if (!ACCEPTED_TYPES.includes(file.type)) {
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
      
      // Store the currently selected document type with each file
      newFiles.push({
        file,
        preview: file.name,
        uploading: false,
        progress: 0,
        error: error || undefined,
        success: false,
        documentType: selectedDocumentType!, // Capture at time of file selection (! because we check isTypeSelected before allowing upload)
      });
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (fileIndex: number) => {
    const uploadFile = files[fileIndex];
    if (!uploadFile || uploadFile.error) return;

    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, uploading: true, progress: 0 } : f
    ));

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('fileType', uploadFile.documentType); // Use file's stored document type
      formData.append('originalName', uploadFile.file.name);

      progressInterval = setInterval(() => {
        setFiles(prev => prev.map((f, i) => 
          i === fileIndex ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
        ));
      }, 200);

      // Route based on the file's stored document type - labs go through OCR
      const uploadUrl = uploadFile.documentType === "lab"
        ? "/api/labs/upload"
        : "/api/profile/medical-documents/upload";

      const response = await uploadWithCsrf(uploadUrl, formData);

      if (response.ok) {
        notifications.success.documentUploaded(uploadFile.file.name);
        setFiles(prev => prev.filter((_, i) => i !== fileIndex));
        onUploadSuccess();
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
      {/* Document Type Selection - Radio Buttons */}
      <div className="p-4 bg-muted/30 rounded-lg border">
        <Label className="text-sm font-medium mb-3 block">
          Primero selecciona el tipo de documento
        </Label>
        <RadioGroup
          value={selectedDocumentType || ""}
          onValueChange={(value) => setSelectedDocumentType(value as "study" | "lab")}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div 
            className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDocumentType === "study" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedDocumentType("study")}
          >
            <RadioGroupItem value="study" id="study" data-testid="radio-study" />
            <Label 
              htmlFor="study" 
              className="flex items-center gap-2 cursor-pointer font-medium"
            >
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <div>
                <span className="block">Estudio Medico</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Radiografias, resonancias, estudios generales
                </span>
              </div>
            </Label>
          </div>
          
          <div 
            className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
              selectedDocumentType === "lab" 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => setSelectedDocumentType("lab")}
          >
            <RadioGroupItem value="lab" id="lab" data-testid="radio-lab" />
            <Label 
              htmlFor="lab" 
              className="flex items-center gap-2 cursor-pointer font-medium"
            >
              <FlaskConical className="h-5 w-5 text-green-600" />
              <div>
                <span className="block">Laboratorio</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Resultados de sangre, orina, biometrias
                </span>
              </div>
            </Label>
          </div>
        </RadioGroup>
        
        {selectedDocumentType === "lab" && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-3 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Los resultados de laboratorio seran procesados automaticamente para extraer tus analitos
          </p>
        )}
      </div>

      {/* Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          !isTypeSelected 
            ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600' 
            : dragActive 
              ? 'border-primary bg-primary/5 cursor-pointer hover-elevate' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 cursor-pointer hover-elevate'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={!disabled && isTypeSelected ? openFileDialog : undefined}
        onDragEnter={isTypeSelected ? handleDrag : undefined}
        onDragLeave={isTypeSelected ? handleDrag : undefined}
        onDragOver={isTypeSelected ? handleDrag : undefined}
        onDrop={isTypeSelected ? handleDrop : undefined}
        data-testid="upload-zone-unified"
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className={`h-12 w-12 mb-4 ${isTypeSelected ? 'text-gray-400' : 'text-gray-300'}`} />
          {!isTypeSelected ? (
            <>
              <p className="text-lg font-medium text-gray-400 dark:text-gray-500 mb-2">
                Selecciona el tipo de documento arriba
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                para habilitar la carga de archivos
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subir {selectedDocumentType === "study" ? "estudio médico" : "resultados de laboratorio"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {t('fileUpload.dragHere')}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                PDF, imágenes, Word - Máximo 10MB
              </p>
            </>
          )}
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
        disabled={disabled || !isTypeSelected}
        data-testid="input-file-upload"
      />

      {/* File List - Each file shows its assigned document type */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((uploadFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className={`h-5 w-5 ${uploadFile.documentType === "lab" ? "text-green-600" : "text-blue-600"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{uploadFile.preview}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        uploadFile.documentType === "lab" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {uploadFile.documentType === "lab" ? "Laboratorio" : "Estudio"}
                      </span>
                    </div>
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
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
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

      {/* Game Dialog - appears automatically when processing files */}
      <Dialog open={gameDialogOpen} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Procesando tu laboratorio...
            </DialogTitle>
            <DialogDescription className="text-center">
              ¡Diviértete mientras analizamos tus resultados!
            </DialogDescription>
          </DialogHeader>
          {currentGame === "memory" ? <MemoryGame onComplete={handleGameComplete} /> : <MatchingGame onComplete={handleGameComplete} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
