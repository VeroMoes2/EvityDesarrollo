import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Mail, Check } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // todo: remove mock functionality - replace with real subscription logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Newsletter subscription:", email);
    setIsSubscribed(true);
    setEmail("");
    setIsLoading(false);
  };

  if (isSubscribed) {
    return (
      <section id="contacto" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  ¡Gracias por suscribirte!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Pronto recibirás nuestro primer boletín con consejos personalizados de longevidad.
                </p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsSubscribed(false);
                    console.log("Subscribe another email clicked"); // todo: remove mock functionality
                  }}
                  data-testid="button-subscribe-another"
                >
                  Suscribir otro email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contacto" className="py-20 bg-primary/5">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/5">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="w-16 h-16 mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-4">
                    Únete a Nuestra Comunidad
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Recibe los últimos descubrimientos en longevidad, consejos personalizados 
                    y contenido exclusivo directamente en tu bandeja de entrada.
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Investigaciones semanales resumidas</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Consejos prácticos personalizados</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span>Acceso temprano a nuevas herramientas</span>
                    </div>
                  </div>
                </div>

                <div>
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-lg"
                        required
                        data-testid="input-newsletter-email"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg"
                      disabled={isLoading}
                      data-testid="button-subscribe-newsletter"
                    >
                      {isLoading ? "Suscribiendo..." : "Suscribirse Gratis"}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Sin spam. Cancela en cualquier momento. 
                    <br />
                    Al suscribirte, aceptas nuestros términos de privacidad.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}