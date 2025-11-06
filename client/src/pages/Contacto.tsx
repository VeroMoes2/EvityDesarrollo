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
import { Mail, MapPin, Phone, Clock, Home } from "lucide-react";
import Header from "@/components/Header";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

// Validation schema for contact form - will be created inside component to access t()

type ContactFormData = {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
};

export default function Contacto() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  
  // Create schema inside component to access t() for translations
  const contactSchema = z.object({
    nombre: z.string().min(2, t('contact.nameMinLength')),
    email: z.string().email(t('contact.emailInvalid')),
    asunto: z.string().min(5, t('contact.subjectMinLength')),
    mensaje: z.string().min(10, t('contact.messageMinLength'))
  });

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
        title: t('contact.successToastTitle'),
        description: t('contact.successToastDescription'),
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      console.error('Error sending contact form:', error);
      toast({
        title: t('contact.errorToastTitle'),
        description: error.message || t('contact.errorToastDescription'),
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
                {t('contact.title')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              
              {/* Contact Form */}
              <Card data-testid="contact-form-card">
                <CardHeader>
                  <CardTitle>{t('contact.formTitle')}</CardTitle>
                  <CardDescription>
                    {t('contact.formDescription')}
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
                            <FormLabel>{t('contact.nameLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('contact.nameLabel')} 
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
                            <FormLabel>{t('contact.emailLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder={t('login.email')} 
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
                            <FormLabel>{t('contact.subjectLabel')}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t('contact.subjectPlaceholder')} 
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
                            <FormLabel>{t('contact.messageLabel')}</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder={t('contact.messagePlaceholder')}
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
                        {isSubmitting || contactMutation.isPending ? t('contact.sendingButton') : t('contact.sendButton')}
                      </Button>
                      
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-8">
                
                <Card>
                  <CardHeader>
                    <CardTitle>{t('contact.contactInfoTitle')}</CardTitle>
                    <CardDescription>
                      {t('contact.contactInfoDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('contact.emailAddress')}</h3>
                        <p className="text-muted-foreground">contacto@evity.mx</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('contact.phone')}</h3>
                        <p className="text-muted-foreground">Por definir</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('contact.office')}</h3>
                        <p className="text-muted-foreground">
                          Monterrey, México
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{t('contact.hours')}</h3>
                        <p className="text-muted-foreground">
                          {t('contact.hoursTime')}
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>

              </div>

            </div>

            {/* Back to Home Button */}
            <div className="mt-12 text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate("/")}
                data-testid="button-back-home"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Volver al Inicio
              </Button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}