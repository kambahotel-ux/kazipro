import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Wrench, User, Building2, Package } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Accueil" },
    { path: "/services", label: "Services" },
    { path: "/location", label: "Location" },
    { path: "/comment-ca-marche", label: "Comment ça marche" },
    { path: "/a-propos", label: "À propos" },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-50 glass">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-[0_14px_28px_-20px_hsl(var(--primary)/0.9)] transition-shadow group-hover:shadow-[0_18px_34px_-20px_hsl(var(--primary)/0.9)] sm:h-10 sm:w-10">
              <Wrench className="w-[1.125rem] h-[1.125rem] sm:w-5 sm:h-5 text-secondary-foreground" />
            </div>
            <span className="font-display font-bold text-base sm:text-lg md:text-xl text-foreground tracking-tight">
              Kazi<span className="text-secondary">Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 p-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:text-primary ${
                  isActive(link.path) ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/connexion">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            </Link>
            <Link to="/inscription/prestataire">
              <Button variant="outline" size="sm">
                <Building2 className="w-4 h-4 mr-2" />
                Devenir prestataire
              </Button>
            </Link>
            <Link to="/location">
              <Button variant="outline" size="sm">
                <Package className="w-4 h-4 mr-2" />
                Louer du matériel
              </Button>
            </Link>
            <Link to="/inscription/client">
              <Button variant="secondary" size="sm">
                Trouver un pro
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-foreground hover:text-secondary transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                <Link to="/connexion" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Connexion
                  </Button>
                </Link>
                <Link to="/inscription/prestataire" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    Devenir prestataire
                  </Button>
                </Link>
                <Link to="/location" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    Louer du matériel
                  </Button>
                </Link>
                <Link to="/inscription/client" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Trouver un pro
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
