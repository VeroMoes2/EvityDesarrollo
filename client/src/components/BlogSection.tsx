import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, User } from "lucide-react";
import yogaImage from "@assets/generated_images/Seniors_yoga_outdoors_983aaba4.png";
import dietImage from "@assets/generated_images/Healthy_diet_spread_92eea712.png";

const blogPosts = [
  {
    title: "Los Nuevos Descubrimientos en Investigación de Telómeros",
    excerpt: "Cómo los últimos estudios revelan formas naturales de mantener la longitud de los telómeros y sus implicaciones para la longevidad.",
    image: yogaImage,
    category: "Investigación",
    readTime: "5 min",
    author: "Dr. María González",
    date: "15 Dic 2024",
    featured: true
  },
  {
    title: "Ayuno Intermitente: Guía Científica Completa",
    excerpt: "Todo lo que necesitas saber sobre el ayuno intermitente basado en evidencia científica reciente.",
    image: dietImage,
    category: "Nutrición",
    readTime: "8 min",
    author: "Dr. Carlos Ruiz",
    date: "12 Dic 2024",
    featured: false
  },
  {
    title: "Ejercicios de Resistencia para Adultos Mayores",
    excerpt: "Protocolo específico de entrenamiento para mantener la masa muscular y la fuerza después de los 50 años.",
    image: yogaImage,
    category: "Ejercicio",
    readTime: "6 min",
    author: "Lic. Ana Martín",
    date: "10 Dic 2024",
    featured: false
  }
];

export default function BlogSection() {
  const handlePostClick = (postTitle: string) => {
    console.log(`Clicked on blog post: ${postTitle}`); // todo: remove mock functionality
  };

  return (
    <section id="blog" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Blog de Longevidad
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Las últimas noticias, investigaciones y consejos prácticos del mundo de la longevidad y la salud.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Featured Post */}
          <Card 
            className="lg:col-span-2 overflow-hidden hover-elevate cursor-pointer transition-all duration-300"
            onClick={() => handlePostClick(blogPosts[0].title)}
            data-testid="featured-post"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="aspect-video md:aspect-square relative overflow-hidden">
                <img 
                  src={blogPosts[0].image} 
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-primary text-primary-foreground">Destacado</Badge>
                </div>
              </div>
              
              <div className="p-8 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{blogPosts[0].category}</Badge>
                  <span className="text-muted-foreground text-sm">•</span>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {blogPosts[0].readTime}
                  </div>
                </div>
                
                <CardTitle className="text-2xl mb-4 leading-tight">
                  {blogPosts[0].title}
                </CardTitle>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {blogPosts[0].excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{blogPosts[0].author}</span>
                    <span>•</span>
                    <span>{blogPosts[0].date}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                    data-testid="button-read-featured"
                  >
                    Leer más
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Regular Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.slice(1).map((post, index) => (
            <Card 
              key={index + 1} 
              className="overflow-hidden hover-elevate cursor-pointer transition-all duration-300"
              onClick={() => handlePostClick(post.title)}
              data-testid={`blog-post-${index + 1}`}
            >
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {post.readTime}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium text-primary hover:text-primary/80"
                    data-testid={`button-read-more-${index + 1}`}
                  >
                    Leer más
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => console.log("View all blog posts clicked")} // todo: remove mock functionality
            data-testid="button-view-all-blog"
          >
            Ver Todos los Artículos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}