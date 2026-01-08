import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Loader2, CheckCircle, Clock } from "lucide-react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw { status: response.status, ...data };
      }
      return data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      setEmail("");
    },
    onError: (error: any) => {
      if (error.alreadyRegistered) {
        toast({
          title: "Correo ya registrado",
          description: "Este correo ya está en nuestra lista de espera. Te notificaremos pronto.",
        });
      } else {
        const message = typeof error === 'object' && error.error 
          ? error.error 
          : "No se pudo registrar. Intenta de nuevo.";
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    mutation.mutate(email);
  };

  return (
    <section className="py-20 bg-[#f5f5f0] dark:bg-[#1a1a1a]">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 
              className="text-5xl sm:text-6xl lg:text-7xl font-light text-foreground mb-6 leading-[1.1] tracking-tight"
              style={{ fontFamily: "'Lovelace Light', serif" }}
            >
              ¡Gracias por unirte a Evity!
            </h3>
            <p className="text-lg text-[#3D4F3E]/90 mb-6 max-w-sm leading-relaxed">
              Tu registro en nuestra lista de espera ha sido confirmado exitosamente.
            </p>
            <div className="bg-card rounded-xl p-5 space-y-4 max-w-sm w-full">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#3D4F3E] text-lg">Registro completado</p>
                  <p className="text-lg text-[#3D4F3E]/90">Has asegurado tu lugar en la fila</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-[#3D4F3E] text-lg">Cuentas con acceso anticipado</p>
                  <p className="text-lg text-[#3D4F3E]/90">Te notificaremos por email cuando puedas acceder</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>

            <h2 
              className="text-4xl md:text-5xl font-light text-foreground mb-4"
              style={{ fontFamily: "'Lovelace Light', serif" }}
            >
              Únete a la Lista de Espera
            </h2>

            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              ¡La espera casi termina! Únete para recibir acceso prioritario a{" "}
              <span className="text-primary font-medium">Evity</span> tan pronto como esté disponible.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
            <Input
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white dark:bg-background border-border"
              required
              data-testid="input-waitlist-email-inline"
            />
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="whitespace-nowrap"
              data-testid="button-waitlist-submit-inline"
            >
              {mutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Unirme ahora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            Respetamos tu privacidad. Sin spam, solo actualizaciones importantes.
          </p>
          </>
        )}
      </div>
    </section>
  );
}
