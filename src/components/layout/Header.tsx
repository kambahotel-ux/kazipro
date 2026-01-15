import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Wrench, User, Building2 } from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Accueil" },
    { path: "/services", label: "Services" },
    { path: "/comment-ca-marche", label: "Comment ça marche" },
    { path: "/a-propos", label: "À propos" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Wrench className="w-5 h-5 text-secondary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Kazi<span className="text-secondary">Pro</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-secondary ${
                  isActive(link.path) ? "text-secondary" : "text-muted-foreground"
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
