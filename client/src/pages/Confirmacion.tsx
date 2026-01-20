import { CheckCircle, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import fondoEvity from "@assets/Fondo_Evity_1768605844451.jpg";

export default function Confirmacion() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-16"
        style={{
          backgroundImage: `url(${fondoEvity})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 
              className="text-5xl sm:text-6xl lg:text-7xl font-light text-foreground mb-6 leading-[1.1] tracking-tight"
              style={{ fontFamily: "'Lovelace Light', serif" }}
            >
              ¡Gracias por unirte a Evity!
            </h1>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
