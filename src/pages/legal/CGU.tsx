import { PublicLayout } from "@/components/layout/PublicLayout";

export default function CGU() {
  return (
    <PublicLayout>
      <section className="py-10 sm:py-14 lg:py-20 gradient-hero">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <h1 className="text-[1.55rem] sm:text-4xl md:text-5xl font-display font-bold text-primary-foreground text-center">
            Conditions générales d&apos;utilisation
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 max-w-3xl space-y-6 text-sm sm:text-base text-muted-foreground">
          <p>
            Cette page doit formaliser les droits et obligations des utilisateurs,
            prestataires et administrateurs sur la plateforme KaziPro.
          </p>
          <p>
            Contenu juridique à compléter avant mise en production.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
