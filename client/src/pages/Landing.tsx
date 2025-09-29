import { useConfluenceData } from "@/hooks/useConfluenceData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, Dna, Shield, Microscope, Activity, Users, BookOpen, Target, TrendingUp, Award, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/image_1758350191302.png";
import CalculatorSection from "@/components/CalculatorSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import BlogSection from "@/components/BlogSection";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Landing() {
  const { data, isLoading } = useConfluenceData();
  const { t } = useLanguage();

  const features = [
    {
      icon: Heart,
      title: t('landing.cardiovascularHealth'),
      description: t('landing.cardiovascularDesc')
    },
    {
      icon: Brain,
      title: t('landing.cognitiveFunction'),
      description: t('landing.cognitiveDesc')
    },
    {
      icon: Dna,
      title: t('landing.personalizedGenetics'),
      description: t('landing.geneticsDesc')
    },
    {
      icon: Shield,
      title: t('landing.advancedPrevention'),
      description: t('landing.preventionDesc')
    },
    {
      icon: Microscope,
      title: t('landing.specializedLabs'),
      description: t('landing.labsDesc')
    },
    {
      icon: Activity,
      title: t('landing.continuousMonitoring'),
      description: t('landing.monitoringDesc')
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center relative" 
           style={{
             backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`
           }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${heroImage})`
          }}
        />
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold text-white mb-6" data-testid="text-hero-title">
            {data?.companyName || 'Evity'}
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto" data-testid="text-hero-mission">
            {t('landing.heroMission')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button 
                size="lg" 
                className="bg-primary text-primary-foreground px-8 py-3 text-lg"
                data-testid="button-login"
              >
                {t('landing.accessProfile')}
              </Button>
            </Link>
            <Link href="/register">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-3 text-lg bg-white/10 border-white/30 text-white backdrop-blur-sm"
                data-testid="button-register"
              >
                {t('landing.createAccount')}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/70">
            {t('landing.heroCaption')}
          </p>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            {t('landing.whyChoose')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate bg-card" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <feature.icon className="h-8 w-8 text-primary" />
                    <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator Section - Available for all users */}
      <CalculatorSection />

      {/* Blog Section - LS-140: Show blog posts before login */}
      <BlogSection />

      {/* Vision Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">{t('landing.ourVision')}</h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto" data-testid="text-vision">
            {t('landing.visionFallback')}
          </p>
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="text-community-title">
              {t('community.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-community-subtitle">
              {t('community.subtitle')}
            </p>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground" data-testid="text-member-count">
                {t('community.memberCount')}
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-active-discussions">
                {t('community.activeDiscussions')}
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-expert-content">
                {t('community.expertContent')}
              </div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-personalized-plan">
                {t('community.personalizedPlan')}
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-foreground mb-12" data-testid="text-value-props-title">
              {t('community.valueProps.title')}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center hover-elevate bg-card" data-testid="card-value-science">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Microscope className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{t('community.valueProps.science')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {t('community.valueProps.scienceDesc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover-elevate bg-card" data-testid="card-value-personalized">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Target className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{t('community.valueProps.personalized')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {t('community.valueProps.personalizedDesc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover-elevate bg-card" data-testid="card-value-support">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Users className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{t('community.valueProps.support')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {t('community.valueProps.supportDesc')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center hover-elevate bg-card" data-testid="card-value-experts">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <Award className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{t('community.valueProps.experts')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {t('community.valueProps.expertsDesc')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="bg-muted/30 rounded-lg p-8 mb-12">
            <h3 className="text-2xl font-bold text-center text-foreground mb-8" data-testid="text-benefits-title">
              {t('community.benefits.title')}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3" data-testid="benefit-resources">
                <BookOpen className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-foreground">{t('community.benefits.resources')}</span>
              </div>
              <div className="flex items-center space-x-3" data-testid="benefit-tools">
                <TrendingUp className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-foreground">{t('community.benefits.tools')}</span>
              </div>
              <div className="flex items-center space-x-3" data-testid="benefit-events">
                <Activity className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-foreground">{t('community.benefits.events')}</span>
              </div>
              <div className="flex items-center space-x-3" data-testid="benefit-community">
                <MessageCircle className="h-6 w-6 text-primary flex-shrink-0" />
                <span className="text-foreground">{t('community.benefits.community')}</span>
              </div>
            </div>
          </div>

          {/* Community CTA */}
          <div className="text-center bg-primary/10 rounded-lg p-8">
            <h3 className="text-3xl font-bold text-foreground mb-4" data-testid="text-community-cta-title">
              {t('community.cta.title')}
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-community-cta-subtitle">
              {t('community.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-primary text-primary-foreground px-8 py-3 text-lg"
                  data-testid="button-join-community"
                >
                  {t('community.cta.joinButton')}
                </Button>
              </Link>
              <Link href="/about">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-3 text-lg"
                  data-testid="button-learn-more"
                >
                  {t('community.cta.learnMore')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

    </div>
  );
}