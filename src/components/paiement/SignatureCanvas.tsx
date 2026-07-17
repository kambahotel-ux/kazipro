import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateCcw, Check, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureCanvasProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Composant de signature électronique utilisant un canvas HTML5.
 * Optimisé pour le tactile (mobile) et la souris.
 */
export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSave,
  onClear,
  label = "Votre signature électronique",
  className,
  placeholder = "Signez ici avec votre doigt ou votre souris"
}) => {
  // Référence vers l'instance du pad de signature
  const sigPad = useRef<SignaturePad>(null);

  // État local pour suivre si le canvas est vide
  const [isEmpty, setIsEmpty] = useState(true);

  /**
   * Efface le contenu du canvas
   */
  const clear = () => {
    sigPad.current?.clear();
    setIsEmpty(true);
    if (onClear) onClear();
  };

  /**
   * Appelé à la fin de chaque trait (quand l'utilisateur lève le doigt/souris)
   */
  const handleEnd = () => {
    if (sigPad.current) {
      setIsEmpty(sigPad.current.isEmpty());
    }
  };

  /**
   * Prépare et exporte la signature au format base64 PNG
   */
  const handleSave = () => {
    if (sigPad.current && !sigPad.current.isEmpty()) {
      // getTrimmedCanvas() permet de rogner les espaces blancs autour de la signature
      const dataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        {!isEmpty && (
          <button
            type="button"
            onClick={clear}
            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Effacer
          </button>
        )}
      </div>

      <Card className="relative overflow-hidden border-2 border-dashed bg-white ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <SignaturePad
          ref={sigPad}
          onEnd={handleEnd}
          penColor="black"
          canvasProps={{
            className: "signature-canvas w-full h-48 cursor-crosshair touch-none"
          }}
        />

        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground/30 px-4 text-center">
            <PenTool className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-sm italic">{placeholder}</p>
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11"
          onClick={clear}
          disabled={isEmpty}
        >
          Réinitialiser
        </Button>
        <Button
          type="button"
          className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSave}
          disabled={isEmpty}
        >
          <Check className="w-4 h-4 mr-2" />
          Valider la signature
        </Button>
      </div>

      <p className="text-[10px] text-center text-muted-foreground leading-tight italic">
        En validant, vous reconnaissez que cette signature numérique a la même valeur juridique qu'une signature manuscrite sur ce contrat.
      </p>
    </div>
  );
};

export default SignatureCanvas;
