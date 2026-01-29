import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2 } from "lucide-react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [alreadyRegisteredMessage, setAlreadyRegisteredMessage] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      setAlreadyRegisteredMessage(null);
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, ...data };
      }
      return { success: true, ...data };
    },
    onSuccess: (data) => {
      if (data.success) {
        setEmail("");
        navigate("/confirmacion");
      } else if (data.alreadyRegistered) {
        setAlreadyRegisteredMessage("Este correo ya está registrado en nuestra lista de espera. Te notificaremos pronto.");
      } else {
        toast({
          title: "Error",
          description: data.error || "No se pudo registrar. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo registrar. Intenta de nuevo.",
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
    <section 
      className="flex-1 flex items-center justify-center relative"
    >
      <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
        <h2 
          className="text-4xl md:text-5xl font-light text-foreground mb-4"
          style={{ fontFamily: "'Lovelace Light', serif" }}
        >Join the waitlist</h2>

        <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
          Únete a la lista de espera y recibe acceso prioritario a la plataforma.
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
                Acceso anticipado
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        {alreadyRegisteredMessage && (
          <p className="text-sm font-bold text-primary mb-4">
            {alreadyRegisteredMessage}
          </p>
        )}
      </div>
    </section>
  );
}
