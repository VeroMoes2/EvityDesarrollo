import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TerminosCondiciones() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 
            className="text-4xl md:text-5xl text-foreground mb-2"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Términos y Condiciones
          </h1>
          
          <p 
            className="text-xl text-primary mb-2"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Evity
          </p>
          
          <p 
            className="text-sm text-muted-foreground mb-8"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            Última actualización: 27/04/2026
          </p>

          <div 
            className="space-y-8 text-foreground"
            style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 300 }}
          >
            <p className="text-base leading-relaxed">
              El acceso y uso de este sitio web implica la aceptación de los presentes Términos y Condiciones.
            </p>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Naturaleza del sitio y del waitlist
              </h2>
              <p className="text-base leading-relaxed">
                Evity es una plataforma de salud, tecnología e innovación en desarrollo.
              </p>
              <p className="text-base leading-relaxed">
                El propósito del sitio web es, por ahora, facilitar a las personas interesadas registrarse en una lista de espera (waitlist) para recibir información sobre el lanzamiento de nuestros servicios.
              </p>
              <p className="text-base leading-relaxed">
                El registro en el waitlist no constituye una suscripción, ni garantiza acceso inmediato a productos o servicios.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Alcance del servicio
              </h2>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed pl-4">
                <li>Evity no presta servicios médicos, diagnósticos, ni asesoría de salud mediante este sitio web.</li>
                <li>Evity no recopila información de salud a través del formulario y no constituye un portal de pacientes.</li>
                <li>Este sitio es exclusivamente informativo y promocional.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                No atención de urgencias
              </h2>
              <p className="text-base leading-relaxed">
                Este sitio web no brinda atención de urgencias o emergencias.
              </p>
              <p className="text-base leading-relaxed">
                Ante cualquier emergencia médica, acude al servicio de urgencias de tu localidad.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Elegibilidad
              </h2>
              <p className="text-base leading-relaxed">
                Este sitio está dirigido a personas mayores de 18 años.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Uso adecuado del sitio
              </h2>
              <p className="text-base leading-relaxed">
                El usuario se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed pl-4">
                <li>No usar el sitio con fines ilícitos o fraudulentos.</li>
                <li>Proporcionar información veraz al registrarse en el waitlist.</li>
                <li>No intentar vulnerar la seguridad o integridad del sitio.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Limitación de responsabilidad
              </h2>
              <p className="text-base leading-relaxed">
                Evity no será responsable por:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed pl-4">
                <li>Interrupciones o errores técnicos del sitio.</li>
                <li>Uso indebido de la información por terceros.</li>
                <li>Decisiones tomadas con base en información de este sitio.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Modificaciones
              </h2>
              <p className="text-base leading-relaxed">
                Evity puede modificar los Términos y Condiciones en cualquier momento. Las versiones actualizadas se publicarán en esta página.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Legislación aplicable
              </h2>
              <p className="text-base leading-relaxed">
                Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos, específicamente, las aplicables en la Ciudad de México.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
