import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { SiInstagram, SiTiktok } from "react-icons/si";

const waitlistSchema = z.object({
  email: z.string().email("Por favor ingresa un correo electrónico válido"),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WaitlistModal({ open, onOpenChange }: WaitlistModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: WaitlistFormData) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        return { success: false, ...result };
      }
      return { success: true, ...result };
    },
    onSuccess: (data) => {
      if (data.success) {
        setIsSuccess(true);
        setErrorMessage(null);
        form.reset();
      } else if (data.alreadyRegistered) {
        setErrorMessage("Este correo ya está registrado en nuestra lista de espera. Te notificaremos pronto.");
      } else {
        setErrorMessage(data.error || "No se pudo registrar. Intenta de nuevo.");
      }
    },
    onError: () => {
      setErrorMessage("No se pudo registrar. Intenta de nuevo.");
    },
  });

  const onSubmit = (data: WaitlistFormData) => {
    mutation.mutate(data);
  };

  const handleClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {isSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-3xl text-center" style={{ fontFamily: "'Lovelace Light', serif" }}>
                ¡Gracias por unirte a Evity!
              </DialogTitle>
              <DialogDescription className="text-base mt-3 text-center max-w-sm mx-auto">
                Tu registro en nuestra lista de espera ha sido confirmado exitosamente.
              </DialogDescription>
            </DialogHeader>

            <div className="w-full bg-muted/50 rounded-xl p-5 mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Registro completado</p>
                  <p className="text-sm text-muted-foreground">Has asegurado tu lugar en la fila</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">Próximamente: Acceso anticipado</p>
                  <p className="text-sm text-muted-foreground">Te notificaremos por Email cuando sea momento de dar el siguiente paso</p>
                </div>
              </div>
            </div>

            <Button onClick={handleClose} className="mt-6" data-testid="button-waitlist-close">
              Volver al inicio
            </Button>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-3">Mientras esperas, síguenos para tips diarios</p>
              <div className="flex justify-center gap-4">
                <a 
                  href="https://www.instagram.com/evity.mx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover-elevate"
                  aria-label="Instagram"
                >
                  <SiInstagram className="w-5 h-5 text-muted-foreground" />
                </a>
                <a 
                  href="https://www.tiktok.com/@evity.mx" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-muted rounded-full flex items-center justify-center hover-elevate"
                  aria-label="TikTok"
                >
                  <SiTiktok className="w-5 h-5 text-muted-foreground" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl" style={{ fontFamily: "'Lovelace Light', serif" }}>
                Únete a Evity
              </DialogTitle>
              <DialogDescription className="text-base">
                Sé de los primeros en acceder a nuestra plataforma de longevidad.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="tu@email.com" 
                          {...field} 
                          data-testid="input-waitlist-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {errorMessage && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                )}
                {errorMessage ? (
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={handleClose}
                    data-testid="button-waitlist-close-error"
                  >
                    Volver al inicio
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={mutation.isPending}
                    data-testid="button-waitlist-submit"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Unirme a la lista"
                    )}
                  </Button>
                )}
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
