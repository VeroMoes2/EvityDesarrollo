import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Diccionario de traducciones
const translations = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.about': 'Nosotros',
    'nav.features': 'Características',
    'nav.calculator': 'Calculadora',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.logout': 'Cerrar Sesión',
    'nav.profile': 'Mi Perfil',
    'nav.myFiles': 'Mis Archivos',
    
    // Hero Section
    'hero.welcome': 'Bienvenido a',
    'hero.valueProposition': 'Descubre los secretos científicos de la longevidad. Herramientas personalizadas, recursos basados en evidencia y una comunidad dedicada a vivir más y mejor.',
    'hero.discoverMore': 'Descubre Más',
    
    // Features Section
    'features.title': '¿Por Qué Elegir',
    'features.subtitle': 'Nuestra plataforma combina ciencia de vanguardia con herramientas prácticas para ayudarte a vivir una vida más larga, saludable y plena.',
    'features.cognitiveHealth': 'Salud Cognitiva',
    'features.cognitiveDesc': 'Ejercicios y estrategias respaldadas por la ciencia para mantener tu mente aguda y prevenir el deterioro cognitivo.',
    'features.cardiovascularHealth': 'Salud Cardiovascular',
    'features.cardiovascularDesc': 'Protocolos personalizados para fortalecer tu corazón y sistema circulatorio, basados en tu perfil único.',
    'features.metabolicOptimization': 'Optimización Metabólica',
    'features.metabolicDesc': 'Herramientas para mejorar tu metabolismo, aumentar la energía y mantener un peso saludable.',
    'features.advancedPrevention': 'Prevención Avanzada',
    'features.preventionDesc': 'Estrategias proactivas de salud para prevenir enfermedades antes de que aparezcan.',
    'features.activeCommunity': 'Comunidad Activa',
    'features.communityDesc': 'Únete a miles de personas comprometidas con la longevidad y comparte tu viaje hacia una vida más plena.',
    'features.continuousResearch': 'Investigación Continua',
    'features.researchDesc': 'Acceso a los últimos descubrimientos en ciencia de la longevidad y medicina antienvejecimiento.',
    
    // Calculator Section
    'calculator.title': 'Calculadora',
    'calculator.subtitle': 'Descubre tu expectativa de vida basada en tu estilo de vida actual y obtén recomendaciones personalizadas para mejorarla.',
    'calculator.age': 'Edad',
    'calculator.gender': 'Sexo',
    'calculator.male': 'Masculino',
    'calculator.female': 'Femenino',
    'calculator.exercise': 'Frecuencia de Ejercicio',
    'calculator.exerciseDaily': 'Diariamente',
    'calculator.exerciseWeekly': '3-4 veces por semana',
    'calculator.exerciseOccasional': 'Ocasionalmente',
    'calculator.exerciseNever': 'Nunca',
    'calculator.smoking': 'Hábito de Fumar',
    'calculator.smokingNever': 'Nunca he fumado',
    'calculator.smokingFormer': 'Ex fumador',
    'calculator.smokingCurrent': 'Fumador actual',
    'calculator.diet': 'Tipo de Dieta',
    'calculator.dietMediterranean': 'Mediterránea',
    'calculator.dietBalanced': 'Balanceada',
    'calculator.dietProcessed': 'Alta en procesados',
    'calculator.calculate': 'Calcular Expectativa',
    'calculator.result': 'Tu expectativa de vida estimada es de',
    'calculator.years': 'años',
    'calculator.joinUs': 'Únete para Mejorar',
    
    // Login Page
    'login.title': 'Iniciar Sesión',
    'login.subtitle': 'Ingresa a tu cuenta de Evity',
    'login.email': 'Email',
    'login.password': 'Contraseña',
    'login.forgotPassword': '¿Olvidaste tu contraseña?',
    'login.loginButton': 'Iniciar Sesión',
    'login.loggingIn': 'Iniciando sesión...',
    'login.noAccount': '¿No tienes cuenta?',
    'login.signUpHere': 'Regístrate aquí',
    'login.back': 'Volver',
    
    // Register Page
    'register.title': 'Crear Cuenta',
    'register.subtitle': 'Completa tus datos para crear tu cuenta en Evity',
    'register.firstName': 'Nombre',
    'register.lastName': 'Apellido',
    'register.email': 'Email',
    'register.password': 'Contraseña',
    'register.confirmPassword': 'Confirmar Contraseña',
    'register.gender': 'Sexo',
    'register.genderMale': 'Masculino',
    'register.genderFemale': 'Femenino',
    'register.genderOther': 'Otro',
    'register.phoneNumber': 'Teléfono',
    'register.registerButton': 'Crear Cuenta',
    'register.registering': 'Creando cuenta...',
    'register.haveAccount': '¿Ya tienes cuenta?',
    'register.loginHere': 'Inicia sesión aquí',
    
    // Footer
    'footer.company': 'Empresa',
    'footer.aboutUs': 'Sobre Nosotros',
    'footer.research': 'Investigación',
    'footer.team': 'Equipo',
    'footer.services': 'Servicios',
    'footer.healthAssessment': 'Evaluación de Salud',
    'footer.personalizedPlans': 'Planes Personalizados',
    'footer.community': 'Comunidad',
    'footer.resources': 'Recursos',
    'footer.blog': 'Blog',
    'footer.guides': 'Guías',
    'footer.calculator': 'Calculadora',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',
    'footer.cookies': 'Cookies',
    'footer.madeWithLove': 'Hecho con amor para tu bienestar',
    'footer.allRightsReserved': 'Todos los derechos reservados.',
    
    // About Page
    'about.pageTitle': 'Conoce a',
    'about.mission': 'Nuestra Misión',
    'about.vision': 'Nuestra Visión',
    'about.team': 'Nuestro Equipo',
    'about.teamSubtitle': 'Conoce a los expertos que están revolucionando el futuro de la longevidad y el bienestar',
    'about.contactUs': 'Contáctanos',
    'about.loadingInfo': 'Cargando información de la empresa...',
    'about.errorLoading': 'Error al cargar información',
    'about.errorDescription': 'No se pudo cargar la información de la empresa. Por favor, inténtalo más tarde.',
    'about.noInfo': 'No hay información disponible.',
    
    // My Files Page
    'files.title': 'Mis Archivos Médicos',
    'files.subtitle': 'Gestiona tus estudios y resultados de laboratorio',
    'files.search': 'Buscar archivos...',
    'files.fileName': 'Nombre del Archivo',
    'files.type': 'Tipo',
    'files.size': 'Tamaño',
    'files.uploadDate': 'Fecha de Subida',
    'files.actions': 'Acciones',
    'files.preview': 'Vista Previa',
    'files.download': 'Descargar',
    'files.delete': 'Eliminar',
    'files.study': 'Estudio',
    'files.lab': 'Laboratorio',
    'files.noFiles': 'No se encontraron archivos',
    'files.upload': 'Subir Archivo',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.close': 'Cerrar',
    'common.confirm': 'Confirmar',
    'common.or': 'o',
    'common.and': 'y',
    'common.required': 'requerido',
    'common.optional': 'opcional',
  },
  
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.features': 'Features',
    'nav.calculator': 'Calculator',
    'nav.login': 'Login',
    'nav.register': 'Sign Up',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',
    'nav.myFiles': 'My Files',
    
    // Hero Section
    'hero.welcome': 'Welcome to',
    'hero.valueProposition': 'Discover the scientific secrets of longevity. Personalized tools, evidence-based resources and a community dedicated to living longer and better.',
    'hero.discoverMore': 'Discover More',
    
    // Features Section
    'features.title': 'Why Choose',
    'features.subtitle': 'Our platform combines cutting-edge science with practical tools to help you live a longer, healthier and more fulfilling life.',
    'features.cognitiveHealth': 'Cognitive Health',
    'features.cognitiveDesc': 'Science-backed exercises and strategies to keep your mind sharp and prevent cognitive decline.',
    'features.cardiovascularHealth': 'Cardiovascular Health',
    'features.cardiovascularDesc': 'Personalized protocols to strengthen your heart and circulatory system, based on your unique profile.',
    'features.metabolicOptimization': 'Metabolic Optimization',
    'features.metabolicDesc': 'Tools to improve your metabolism, increase energy and maintain a healthy weight.',
    'features.advancedPrevention': 'Advanced Prevention',
    'features.preventionDesc': 'Proactive health strategies to prevent diseases before they appear.',
    'features.activeCommunity': 'Active Community',
    'features.communityDesc': 'Join thousands of people committed to longevity and share your journey to a fuller life.',
    'features.continuousResearch': 'Continuous Research',
    'features.researchDesc': 'Access to the latest discoveries in longevity science and anti-aging medicine.',
    
    // Calculator Section
    'calculator.title': 'Calculator',
    'calculator.subtitle': 'Discover your life expectancy based on your current lifestyle and get personalized recommendations to improve it.',
    'calculator.age': 'Age',
    'calculator.gender': 'Gender',
    'calculator.male': 'Male',
    'calculator.female': 'Female',
    'calculator.exercise': 'Exercise Frequency',
    'calculator.exerciseDaily': 'Daily',
    'calculator.exerciseWeekly': '3-4 times per week',
    'calculator.exerciseOccasional': 'Occasionally',
    'calculator.exerciseNever': 'Never',
    'calculator.smoking': 'Smoking Habit',
    'calculator.smokingNever': 'Never smoked',
    'calculator.smokingFormer': 'Former smoker',
    'calculator.smokingCurrent': 'Current smoker',
    'calculator.diet': 'Diet Type',
    'calculator.dietMediterranean': 'Mediterranean',
    'calculator.dietBalanced': 'Balanced',
    'calculator.dietProcessed': 'High in processed foods',
    'calculator.calculate': 'Calculate Expectancy',
    'calculator.result': 'Your estimated life expectancy is',
    'calculator.years': 'years',
    'calculator.joinUs': 'Join Us to Improve',
    
    // Login Page
    'login.title': 'Login',
    'login.subtitle': 'Sign in to your Evity account',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.forgotPassword': 'Forgot your password?',
    'login.loginButton': 'Login',
    'login.loggingIn': 'Logging in...',
    'login.noAccount': "Don't have an account?",
    'login.signUpHere': 'Sign up here',
    'login.back': 'Back',
    
    // Register Page
    'register.title': 'Create Account',
    'register.subtitle': 'Complete your details to create your Evity account',
    'register.firstName': 'First Name',
    'register.lastName': 'Last Name',
    'register.email': 'Email',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.gender': 'Gender',
    'register.genderMale': 'Male',
    'register.genderFemale': 'Female',
    'register.genderOther': 'Other',
    'register.phoneNumber': 'Phone',
    'register.registerButton': 'Create Account',
    'register.registering': 'Creating account...',
    'register.haveAccount': 'Already have an account?',
    'register.loginHere': 'Sign in here',
    
    // Footer
    'footer.company': 'Company',
    'footer.aboutUs': 'About Us',
    'footer.research': 'Research',
    'footer.team': 'Team',
    'footer.services': 'Services',
    'footer.healthAssessment': 'Health Assessment',
    'footer.personalizedPlans': 'Personalized Plans',
    'footer.community': 'Community',
    'footer.resources': 'Resources',
    'footer.blog': 'Blog',
    'footer.guides': 'Guides',
    'footer.calculator': 'Calculator',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.cookies': 'Cookies',
    'footer.madeWithLove': 'Made with love for your wellbeing',
    'footer.allRightsReserved': 'All rights reserved.',
    
    // About Page
    'about.pageTitle': 'Meet',
    'about.mission': 'Our Mission',
    'about.vision': 'Our Vision',
    'about.team': 'Our Team',
    'about.teamSubtitle': 'Meet the experts who are revolutionizing the future of longevity and wellness',
    'about.contactUs': 'Contact Us',
    'about.loadingInfo': 'Loading company information...',
    'about.errorLoading': 'Error loading information',
    'about.errorDescription': 'Could not load company information. Please try again later.',
    'about.noInfo': 'No information available.',
    
    // My Files Page
    'files.title': 'My Medical Files',
    'files.subtitle': 'Manage your studies and lab results',
    'files.search': 'Search files...',
    'files.fileName': 'File Name',
    'files.type': 'Type',
    'files.size': 'Size',
    'files.uploadDate': 'Upload Date',
    'files.actions': 'Actions',
    'files.preview': 'Preview',
    'files.download': 'Download',
    'files.delete': 'Delete',
    'files.study': 'Study',
    'files.lab': 'Lab',
    'files.noFiles': 'No files found',
    'files.upload': 'Upload File',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.or': 'or',
    'common.and': 'and',
    'common.required': 'required',
    'common.optional': 'optional',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Obtener idioma guardado del localStorage
    const saved = localStorage.getItem('evity-language') as Language;
    return saved || 'es'; // Español por defecto
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('evity-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}