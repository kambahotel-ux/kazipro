import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface ProofUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  maxSizeMB?: number;
  label?: string;
  className?: string;
}

/**
 * Composant d'upload de preuves de paiement
 * Permet de sélectionner une image ou un PDF et gère la prévisualisation
 */
export const ProofUploader: React.FC<ProofUploaderProps> = ({
  onUpload,
  isUploading = false,
  maxSizeMB = 5,
  label = "Preuve de paiement",
  className,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validation de la taille
    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille maximale autorisée est de ${maxSizeMB} Mo.`,
        variant: "destructive",
      });
      return;
    }

    // Validation du type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Format non supporté",
        description: "Veuillez uploader une image (JPG, PNG) ou un document PDF.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Créer un aperçu si c'est une image
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      await onUpload(file);
      // Réinitialiser après succès si nécessaire, ou laisser le parent gérer
    } catch (error) {
      // L'erreur est généralement gérée par le parent ou via toast
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      <div
        onClick={() => !file && fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer",
          !file ? "hover:border-primary hover:bg-primary/5 border-gray-200" : "border-primary bg-primary/5 cursor-default",
          isUploading && "opacity-60 pointer-events-none"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
        />

        {!file ? (
          <>
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-center">Cliquez pour ajouter un fichier</p>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              PNG, JPG ou PDF (Max {maxSizeMB} Mo)
            </p>
          </>
        ) : (
          <div className="w-full space-y-4">
            <div className="flex items-center gap-4 bg-white p-3 rounded-lg border shadow-sm">
              <div className="shrink-0">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-12 h-12 rounded object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} Mo
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-gray-400 hover:text-destructive"
                onClick={handleRemoveFile}
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Button
              className="w-full"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Envoyer la preuve
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-xs leading-relaxed">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p>
          Votre preuve sera vérifiée manuellement par nos équipes ou par le prestataire pour valider votre paiement.
          Assurez-vous que les informations (référence, montant, date) sont bien lisibles.
        </p>
      </div>
    </div>
  );
};

export default ProofUploader;
