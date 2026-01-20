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
            <h1 
              className="text-4xl md:text-5xl font-light text-foreground mb-4"
              style={{ fontFamily: "'Lovelace Light', serif" }}
            >
              ¡Gracias por unirte a Evity!
            </h1>
            <p className="text-muted-foreground mb-8 whitespace-nowrap">
              Tu registro en nuestra lista de espera ha sido confirmado exitosamente.
            </p>
            <div className="flex flex-col gap-4 max-w-sm w-full">
              <div className="bg-card rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#3D4F3E]">Registro completado</p>
                    <p className="text-muted-foreground">Has asegurado tu lugar en la fila</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-[#3D4F3E]">Cuentas con acceso anticipado</p>
                    <p className="text-muted-foreground">Te notificaremos por email cuando puedas acceder</p>
                  </div>
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
