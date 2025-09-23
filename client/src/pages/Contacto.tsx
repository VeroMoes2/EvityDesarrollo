import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import Header from "@/components/Header";

// Validation schema for contact form
const contactSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Introduce un email válido"),
  asunto: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres")
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contacto() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      nombre: "",
      email: "",
      asunto: "",
      mensaje: ""
    }
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest('POST', '/api/contacto', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "Tu mensaje ha sido enviado correctamente. Te responderemos pronto.",
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      console.error('Error sending contact form:', error);
      toast({
        title: "Error al enviar",
        description: error.message || "No se pudo enviar el mensaje. Intenta nuevamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    contactMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            
            {/* Header Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Contacta con Evity
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                ¿Tienes preguntas sobre longevidad y bienestar? Nuestro equipo está aquí para ayudarte
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Contact Form */}
              <Card data-testid="contact-form-card">
                <CardHeader>
                  <CardTitle>Envíanos un mensaje</CardTitle>
                  <CardDescription>
                    Completa el formulario y te responderemos en menos de 24 horas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tu nombre completo" 
                                {...field}
                                data-testid="input-nombre"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="tu@email.com" 
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="asunto"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asunto</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="¿Sobre qué quieres consultar?" 
                                {...field}
                                data-testid="input-asunto"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mensaje"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mensaje</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Escribe tu mensaje aquí..."
                                className="min-h-32"
                                {...field}
                                data-testid="textarea-mensaje"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting || contactMutation.isPending}
                        data-testid="button-submit-contact"
                      >
                        {isSubmitting || contactMutation.isPending ? "Enviando..." : "Enviar mensaje"}
                      </Button>
                      
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                
                <Card>
                  <CardHeader>
                    <CardTitle>Información de contacto</CardTitle>
                    <CardDescription>
                      Otras formas de comunicarte con nosotros
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <p className="text-muted-foreground">contacto@evity.mx</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Teléfono</h3>
                        <p className="text-muted-foreground">+52 55 1234 5678</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Oficina</h3>
                        <p className="text-muted-foreground">
                          Ciudad de México, México
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Horario de atención</h3>
                        <p className="text-muted-foreground">
                          Lunes a Viernes: 9:00 - 18:00 hrs (GMT-6)
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>¿Necesitas ayuda inmediata?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Si tienes una consulta urgente sobre tu salud, te recomendamos contactar a tu médico de cabecera.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Para consultas sobre la plataforma, respondemos en menos de 24 horas.
                    </p>
                  </CardContent>
                </Card>

              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}