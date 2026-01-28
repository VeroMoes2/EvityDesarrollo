import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 
            className="text-4xl md:text-5xl text-foreground mb-4"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Términos y Condiciones
          </h1>
          
          <p 
            className="text-xl text-foreground mb-1"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Evity
          </p>
          
          <p 
            className="text-sm text-muted-foreground mb-6"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Última actualización: 27/01/2026
          </p>

          <div 
            className="space-y-8 text-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            <p className="text-base leading-relaxed">
              El acceso y uso de este sitio web implica la aceptación de los presentes Términos y Condiciones.
            </p>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Naturaleza del sitio y del waitlist
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity es una plataforma de salud, tecnología y bienestar en desarrollo.
              </p>
              <p className="text-base leading-relaxed mb-3">
                El presente sitio web tiene como finalidad permitir a las personas interesadas <strong>registrarse en una lista de espera (waitlist)</strong> para recibir información sobre el futuro lanzamiento de nuestros servicios.
              </p>
              <p className="text-base leading-relaxed">
                El registro en el waitlist <strong>no constituye una contratación, ni garantiza acceso inmediato a productos o servicios.</strong>
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Alcance del servicio
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Durante esta etapa:
              </p>
              <ul className="space-y-2 text-base leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Evity <strong>no presta servicios médicos,</strong> diagnósticos, análisis de laboratorio, estudios médicos, ni tratamientos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>La información compartida tiene fines informativos y de comunicación.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Evity se reserva el derecho de modificar, pausar o cancelar el proyecto o sus características antes de su lanzamiento.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                No atención de urgencias
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity <strong>no brinda atención médica de urgencia ni emergencia.</strong>
              </p>
              <p className="text-base leading-relaxed">
                Ante cualquier situación médica urgente, el usuario deberá acudir a servicios médicos presenciales o de emergencia.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Elegibilidad
              </h2>
              <p className="text-base leading-relaxed">
                El registro en el sitio está dirigido a personas mayores de 18 años.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Uso adecuado del sitio
              </h2>
              <p className="text-base leading-relaxed mb-3">
                El usuario se compromete a:
              </p>
              <ul className="space-y-2 text-base leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Proporcionar información veraz.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>No utilizar el sitio con fines ilícitos o fraudulentos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>No intentar vulnerar la seguridad, funcionamiento o integridad del sitio.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Limitación de responsabilidad
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity no será responsable por:
              </p>
              <ul className="space-y-2 text-base leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Decisiones tomadas por el usuario con base en información preliminar o informativa</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Fallas técnicas temporales del sitio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Cambios, modificaciones y actualizaciones en el proyecto antes de su lanzamiento</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Modificaciones
              </h2>
              <p className="text-base leading-relaxed">
                Evity podrá modificar estos Términos y Condiciones en cualquier momento. Las versiones actualizadas estarán disponibles en este sitio con la fecha correspondiente a la última.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Legislación aplicable
              </h2>
              <p className="text-base leading-relaxed">
                Estos Términos y Condiciones se rigen por las leyes aplicables mexicanas.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
