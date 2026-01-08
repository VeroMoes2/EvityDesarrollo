import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/waitlist", { email });
      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      setEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar. Intenta de nuevo.",
        variant: "destructive",
      });
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
            <p className="text-lg text-[#3D4F3E]/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Tu registro en nuestra lista de espera ha sido confirmado exitosamente. Has asegurado tu lugar en la fila. Cuentas con acceso anticipado. Te notificaremos por email cuando puedas acceder.
            </p>
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
