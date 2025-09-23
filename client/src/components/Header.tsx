import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useConfluenceData } from "@/hooks/useConfluenceData";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Helper function to check if user is admin (case-insensitive)
const isUserAdmin = (user: any): boolean => {
  return user?.email?.toLowerCase() === 'veromoes@evity.mx';
};

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: confluenceData } = useConfluenceData();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const userIsAdmin = isUserAdmin(user);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDarkMode = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const companyName = confluenceData?.companyName || "Evity";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">{companyName}</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection("inicio")} 
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-inicio"
            >
              Inicio
            </button>
            <button 
              onClick={() => scrollToSection("recursos")} 
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-recursos"
            >
              Recursos
            </button>
            <button 
              onClick={() => scrollToSection("calculadora")} 
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-calculadora"
            >
              Calculadora
            </button>
            <button 
              onClick={() => scrollToSection("blog")} 
              className="text-foreground hover:text-primary transition-colors"
              data-testid="nav-blog"
            >
              Blog
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button 
              onClick={() => navigate('/contacto')}
              className="hidden md:inline-flex"
              data-testid="button-contacto"
            >
              Contacto
            </Button>

            {/* LS-96-8: User Profile Menu - Desktop */}
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden md:flex items-center space-x-2 p-2" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={(user as any)?.profileImageUrl} alt="Perfil" />
                      <AvatarFallback>
                        {(user as any)?.firstName?.[0] || 'U'}{(user as any)?.lastName?.[0] || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{(user as any)?.firstName || 'Usuario'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onSelect={() => navigate('/perfil')}
                    className="cursor-pointer"
                    data-testid="menu-item-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Perfil</span>
                  </DropdownMenuItem>
                  {userIsAdmin && (
                    <DropdownMenuItem 
                      onSelect={() => navigate('/admin')}
                      className="cursor-pointer"
                      data-testid="menu-item-admin"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Panel Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = '/api/logout'}
                    className="cursor-pointer text-red-600 hover:text-red-700"
                    data-testid="menu-item-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              data-testid="button-menu-toggle"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <nav className="px-4 py-4 space-y-4">
              <button 
                onClick={() => scrollToSection("inicio")} 
                className="block w-full text-left text-foreground hover:text-primary transition-colors"
                data-testid="nav-mobile-inicio"
              >
                Inicio
              </button>
              <button 
                onClick={() => scrollToSection("recursos")} 
                className="block w-full text-left text-foreground hover:text-primary transition-colors"
                data-testid="nav-mobile-recursos"
              >
                Recursos
              </button>
              <button 
                onClick={() => scrollToSection("calculadora")} 
                className="block w-full text-left text-foreground hover:text-primary transition-colors"
                data-testid="nav-mobile-calculadora"
              >
                Calculadora
              </button>
              <button 
                onClick={() => scrollToSection("blog")} 
                className="block w-full text-left text-foreground hover:text-primary transition-colors"
                data-testid="nav-mobile-blog"
              >
                Blog
              </button>
              <Button 
                onClick={() => navigate('/contacto')}
                className="w-full"
                data-testid="button-mobile-contacto"
              >
                Contacto
              </Button>
              
              {/* LS-96-8: User Profile Navigation - Mobile */}
              {isAuthenticated && user && (
                <>
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center space-x-3 mb-3 px-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={(user as any)?.profileImageUrl} alt="Perfil" />
                        <AvatarFallback>
                          {(user as any)?.firstName?.[0]}{(user as any)?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{((user as any)?.firstName || 'Usuario') + ' ' + ((user as any)?.lastName || '')}</p>
                        <p className="text-xs text-gray-500">{(user as any)?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start mb-2"
                      data-testid="button-mobile-profile"
                      onClick={() => {
                        navigate('/perfil');
                        setIsMenuOpen(false);
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Button>
                    {userIsAdmin && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start mb-2"
                        data-testid="button-mobile-admin"
                        onClick={() => {
                          navigate('/admin');
                          setIsMenuOpen(false);
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                      onClick={() => window.location.href = '/api/logout'}
                      data-testid="button-mobile-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </Button>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}