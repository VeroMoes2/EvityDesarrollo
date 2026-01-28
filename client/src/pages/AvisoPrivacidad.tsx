import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AvisoPrivacidad() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 
            className="text-4xl md:text-5xl text-foreground mb-4"
            style={{ fontFamily: "'Lovelace Light', serif" }}
          >
            Aviso de Privacidad
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
              En Evity, reconocemos que la información personal y en especial la relacionada con la salud es altamente sensible. Por ello, nos comprometemos a tratarla de forma responsable, confidencial y transparente, conforme a la legislación aplicable en materia de protección de datos personales.
            </p>

            <p className="text-base leading-relaxed">
              Este Aviso de Privacidad aplica al uso de nuestra landing page y al registro en nuestra lista de espera (waitlist).
            </p>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Responsable del tratamiento de los datos
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity es responsable del uso y protección de sus datos personales.
              </p>
              <p className="text-base leading-relaxed">
                <strong style={{ fontWeight: 500 }}>País de operación:</strong> México
              </p>
              <p className="text-base leading-relaxed">
                <strong style={{ fontWeight: 500 }}>Correo de contacto:</strong> contacto@evity.mx
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Datos personales que recabamos
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Para el registro en la lista de espera, Evity puede recabar los siguientes datos:
              </p>
              <ul className="space-y-2 text-base leading-relaxed mb-4">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Nombre</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Correo electrónico</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Información básica de contacto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Datos de navegación y uso del sitio (de forma agregada o anonimizada)</span>
                </li>
              </ul>
              <p className="text-base leading-relaxed">
                Evity <strong style={{ fontWeight: 500 }}>no solicita datos clínicos ni información médica sensible durante el registro en la lista de espera.</strong>
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Finalidades del tratamiento
              </h2>
              <p className="text-base leading-relaxed mb-2" style={{ fontWeight: 500 }}>
                Finalidades primarias (necesarias)
              </p>
              <p className="text-base leading-relaxed mb-3">
                Los datos personales recabados serán utilizados para:
              </p>
              <ul className="space-y-2 text-base leading-relaxed mb-6">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Gestionar el registro en la lista de espera de Evity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Contactarle para compartir información relacionada con el lanzamiento de nuestros servicios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Enviar comunicaciones operativas relacionadas con su registro</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Mantener comunicación previa al inicio formal de operaciones</span>
                </li>
              </ul>

              <p className="text-base leading-relaxed mb-2" style={{ fontWeight: 500 }}>
                Finalidades secundarias (opcionales)
              </p>
              <p className="text-base leading-relaxed mb-3">
                De manera adicional, Evity podrá utilizar su información para:
              </p>
              <ul className="space-y-2 text-base leading-relaxed mb-4">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Enviar contenido informativo sobre salud, bienestar o innovación en prevención</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Realizar análisis estadísticos internos y generación de métricas agregadas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Mejorar la experiencia y comunicación de la plataforma</span>
                </li>
              </ul>
              <p className="text-base leading-relaxed">
                Si no desea que sus datos personales sean utilizados para estas finalidades secundarias, puede solicitarlo en cualquier momento escribiendo a <strong style={{ fontWeight: 500 }}>contacto@evity.mx.</strong>
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Uso de tecnología y análisis automatizados
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity podrá utilizar herramientas tecnológicas y sistemas automatizados para analizar información de forma agregada con fines estadísticos, de mejora del servicio y comprensión de tendencias generales.
              </p>
              <p className="text-base leading-relaxed">
                Estos análisis <strong style={{ fontWeight: 500 }}>no constituyen diagnósticos médicos,</strong> no sustituyen la valoración de un profesional de la salud y, en esta etapa de lista de espera, se limitan a fines informativos y de planeación.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Proveedores y encargados
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity puede apoyarse en proveedores tecnológicos que actúan como encargados del tratamiento de datos, tales como servicios de:
              </p>
              <ul className="space-y-2 text-base leading-relaxed mb-4">
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Infraestructura tecnológica y alojamiento</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Análisis de uso del sitio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 w-2 h-2 bg-foreground rounded-full flex-shrink-0"></span>
                  <span>Comunicación y mensajería</span>
                </li>
              </ul>
              <p className="text-base leading-relaxed">
                Estos proveedores están obligados a cumplir con medidas de seguridad adecuadas y a tratar la información únicamente conforme a las instrucciones de Evity.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Conservación de los datos
              </h2>
              <p className="text-base leading-relaxed">
                Los datos personales serán conservados únicamente durante el tiempo necesario para cumplir con las finalidades descritas y el establecido con las disposiciones legales aplicables.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Derechos ARCO y revocación del consentimiento
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Usted tiene derecho a <strong style={{ fontWeight: 500 }}>Acceder, Rectificar, Cancelar u Oponerse</strong> al tratamiento de sus datos personales, así como a revocar su consentimiento.
              </p>
              <p className="text-base leading-relaxed">
                Para ejercer estos derechos, puede enviar una solicitud al correo: <strong style={{ fontWeight: 500 }}>contacto@evity.mx.</strong>
              </p>
              <p className="text-base leading-relaxed">
                Evity dará respuesta dentro de los plazos establecidos por la ley.
              </p>
            </div>

            <div className="border-t border-border pt-6">
              <h2 
                className="text-2xl text-foreground mb-3"
                style={{ fontFamily: "'Lovelace Light', serif" }}
              >
                Cambios al aviso de privacidad
              </h2>
              <p className="text-base leading-relaxed mb-3">
                Evity podrá modificar o actualizar el presente Aviso de Privacidad.
              </p>
              <p className="text-base leading-relaxed">
                Cualquier cambio será publicado en este mismo sitio web, con la fecha correspondiente.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
