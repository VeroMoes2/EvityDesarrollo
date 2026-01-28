import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AvisoPrivacidad() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 
            className="text-4xl md:text-5xl text-foreground mb-2"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Aviso de Privacidad
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
              En Evity, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Este aviso describe cómo recopilamos, usamos y resguardamos tu información, de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
            </p>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Responsable del tratamiento de los datos
              </h2>
              <p className="text-base leading-relaxed">
                Evity S.A.P.I. de C.V.
              </p>
              <p className="text-base leading-relaxed">
                Correo de contacto: <a href="mailto:contacto@evity.mx" className="text-primary hover:underline">contacto@evity.mx</a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Datos personales que recabamos
              </h2>
              <p className="text-base leading-relaxed">
                Para inscribirte en nuestra lista de espera, únicamente solicitamos los siguientes datos:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed pl-4">
                <li>Nombre</li>
                <li>Correo electrónico</li>
              </ul>
              <p className="text-base leading-relaxed font-medium mt-4">
                No recabamos datos de salud, información médica sensible durante el registro en la lista de espera.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Finalidades del tratamiento
              </h2>
              <p className="text-base leading-relaxed font-medium">
                Finalidades primarias (necesarias):
              </p>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed pl-4">
                <li>Gestionar tu registro en la lista de espera de Evity.</li>
                <li>Enviarte comunicaciones relacionadas con el lanzamiento de nuestros servicios.</li>
              </ul>
              <p className="text-base leading-relaxed font-medium mt-4">
                Finalidades secundarias (opcionales):
              </p>
              <ul className="list-disc list-inside space-y-2 text-base leading-relaxed pl-4">
                <li>Enviarte información sobre novedades, promociones o contenido relacionado con Evity.</li>
                <li>Realizar análisis estadísticos internos para mejorar nuestros servicios.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Uso de tecnología y análisis automatizados
              </h2>
              <p className="text-base leading-relaxed">
                Este sitio puede usar herramientas de análisis y cookies para mejorar la experiencia de usuario.
              </p>
              <p className="text-base leading-relaxed">
                Evity no toma decisiones automatizadas que afecten tu situación jurídica o derechos sin intervención humana.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Proveedores y encargados
              </h2>
              <p className="text-base leading-relaxed">
                Evity puede compartir tus datos con terceros encargados para el envío de correos o servicios de infraestructura digital. Dichos terceros están obligados a mantener la confidencialidad de los datos.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Conservación de los datos
              </h2>
              <p className="text-base leading-relaxed">
                Tus datos serán conservados únicamente durante el tiempo necesario para cumplir con las finalidades descritas, o hasta que ejerzas tu derecho de cancelación.
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Derechos ARCO y revocación del consentimiento
              </h2>
              <p className="text-base leading-relaxed">
                Como titular de los datos, puedes ejercer los derechos de Acceso, Rectificación, Cancelación u Oposición (ARCO) enviando una solicitud a: <a href="mailto:contacto@evity.mx" className="text-primary hover:underline">contacto@evity.mx</a>
              </p>
            </section>

            <section className="space-y-3">
              <h2 
                className="text-2xl text-foreground"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Cambios al aviso de privacidad
              </h2>
              <p className="text-base leading-relaxed">
                Cualquier cambio en este aviso será publicado en esta página.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
