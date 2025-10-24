import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ScheduleAppointment() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: `${(user as any)?.firstName || ""} ${(user as any)?.lastName || ""}`.trim(),
    email: (user as any)?.email || "",
    phone: (user as any)?.phoneNumber || "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    notes: "",
  });

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.preferredDate || !formData.preferredTime || !formData.reason) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call (you can replace this with actual API integration later)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      toast({
        title: "¡Solicitud enviada!",
        description: "Nos pondremos en contacto contigo pronto para confirmar tu cita.",
      });

      // Reset form after 3 seconds and redirect to profile
      setTimeout(() => {
        navigate("/perfil");
      }, 3000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  ¡Solicitud recibida!
                </h2>
                <p className="text-muted-foreground">
                  Nos pondremos en contacto contigo pronto para confirmar tu cita.
                </p>
              </div>
              <Button onClick={() => navigate("/perfil")} className="w-full mt-4" data-testid="button-back-profile">
                Volver al perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/perfil")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Agendar Cita Médica</h1>
          <p className="text-muted-foreground">
            Completa el formulario para solicitar una consulta con nuestros especialistas
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Por favor verifica que tu información sea correcta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre completo *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Tu nombre completo"
                  required
                  data-testid="input-name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo electrónico *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  data-testid="input-email"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+52 123 456 7890"
                  required
                  data-testid="input-phone"
                />
              </div>

              {/* Preferred Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Fecha preferida *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  data-testid="input-date"
                />
              </div>

              {/* Preferred Time */}
              <div className="space-y-2">
                <Label htmlFor="time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horario preferido *
                </Label>
                <Select
                  value={formData.preferredTime}
                  onValueChange={(value) => setFormData({ ...formData, preferredTime: value })}
                  required
                >
                  <SelectTrigger data-testid="select-time">
                    <SelectValue placeholder="Selecciona un horario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Mañana (9:00 AM - 12:00 PM)</SelectItem>
                    <SelectItem value="afternoon">Tarde (12:00 PM - 3:00 PM)</SelectItem>
                    <SelectItem value="evening">Tarde/Noche (3:00 PM - 6:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Motivo de la consulta *
                </Label>
                <Select
                  value={formData.reason}
                  onValueChange={(value) => setFormData({ ...formData, reason: value })}
                  required
                >
                  <SelectTrigger data-testid="select-reason">
                    <SelectValue placeholder="Selecciona el motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="longevity-consultation">Consulta de longevidad</SelectItem>
                    <SelectItem value="questionnaire-results">Revisión de resultados del cuestionario</SelectItem>
                    <SelectItem value="preventive-care">Medicina preventiva</SelectItem>
                    <SelectItem value="chronic-disease">Enfermedades crónicas</SelectItem>
                    <SelectItem value="nutrition">Nutrición y dieta</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notas adicionales (opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Cualquier información adicional que consideres importante..."
                  rows={4}
                  data-testid="textarea-notes"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/perfil")}
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
              data-testid="button-submit"
            >
              {isSubmitting ? "Enviando..." : "Solicitar Cita"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
