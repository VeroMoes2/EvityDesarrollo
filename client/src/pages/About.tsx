import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Users, ArrowRight, Mail, AlertCircle, Home } from "lucide-react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";


export default function About() {
  // Fetch real company information from Confluence
  const { data: companyInfo, isLoading, error } = useConfluenceData();
  const { t } = useLanguage();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-muted-foreground">
              {t('about.loadingInfo')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('about.errorLoading')}</h3>
                <p className="text-muted-foreground">
                  {t('about.errorDescription')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!companyInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">
              {t('about.noInfo')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4" data-testid="page-badge">
            {t('about.pageTitle')}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-card-foreground mb-6" data-testid="page-title">
            {t('about.meetCompany')} {companyInfo.companyName}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed" data-testid="page-subtitle">
            {companyInfo.valueProposition}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Mission */}
          <Card className="hover-elevate" data-testid="mission-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                {t('about.mission')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed text-center" data-testid="mission-text">
                {companyInfo.mission}
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="hover-elevate" data-testid="vision-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-card-foreground">
                {t('about.vision')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-lg leading-relaxed text-center" data-testid="vision-text">
                {companyInfo.vision}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary mr-3" />
              <h2 className="text-3xl font-bold text-card-foreground" data-testid="team-title">
                {t('about.team')}
              </h2>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="team-subtitle">
              {t('about.teamSubtitle')}
            </p>
          </div>

          <Card className="max-w-md mx-auto hover-elevate" data-testid="contact-card">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-semibold text-card-foreground">
                {t('about.contactEmail')}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <a 
                href="mailto:contacto@evity.mx"
                className="text-primary hover:underline text-lg font-medium"
                data-testid="link-contact-email"
              >
                contacto@evity.mx
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mb-12">
          <Card className="bg-primary text-primary-foreground hover-elevate max-w-2xl mx-auto" data-testid="cta-card">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4" data-testid="cta-title">
                {t('about.ctaTitle')}
              </h3>
              <p className="text-primary-foreground/80 mb-6 text-lg" data-testid="cta-description">
                {t('about.ctaDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => window.location.href = '/register'}
                  data-testid="cta-register"
                >
                  {t('about.registerNow')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  onClick={() => window.location.href = '/contacto'}
                  data-testid="cta-contact"
                >
                  {t('about.contactUs')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back to Home Button */}
        <div className="text-center">
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
  );
}