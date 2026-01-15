import { Link } from "react-router-dom";
import { Wrench, Phone, Mail, MapPin, Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Wrench className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">
                Kazi<span className="text-secondary">Pro</span>
              </span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              La plateforme de confiance pour trouver des prestataires qualifiés en RDC. Électriciens, plombiers, mécaniciens et plus.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-secondary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold mb-4">Services</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link to="/services/electricite" className="hover:text-secondary transition-colors">Électricité</Link></li>
              <li><Link to="/services/plomberie" className="hover:text-secondary transition-colors">Plomberie</Link></li>
              <li><Link to="/services/menuiserie" className="hover:text-secondary transition-colors">Menuiserie</Link></li>
              <li><Link to="/services/peinture" className="hover:text-secondary transition-colors">Peinture</Link></li>
              <li><Link to="/services/climatisation" className="hover:text-secondary transition-colors">Climatisation</Link></li>
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h4 className="font-display font-semibold mb-4">Liens utiles</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link to="/comment-ca-marche" className="hover:text-secondary transition-colors">Comment ça marche</Link></li>
              <li><Link to="/inscription/prestataire" className="hover:text-secondary transition-colors">Devenir prestataire</Link></li>
              <li><Link to="/a-propos" className="hover:text-secondary transition-colors">À propos</Link></li>
              <li><Link to="/faq" className="hover:text-secondary transition-colors">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-secondary" />
                Kinshasa, RDC
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-secondary" />
                +243 XXX XXX XXX
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-secondary" />
                contact@kazipro.cd
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/50">
          <p>© 2024 KaziPro. Tous droits réservés.</p>
          <div className="flex gap-6">
            <Link to="/mentions-legales" className="hover:text-secondary transition-colors">Mentions légales</Link>
            <Link to="/confidentialite" className="hover:text-secondary transition-colors">Confidentialité</Link>
            <Link to="/cgu" className="hover:text-secondary transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
