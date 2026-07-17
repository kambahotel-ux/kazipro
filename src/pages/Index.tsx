import { PublicLayout } from "@/components/layout/PublicLayout";
import { HomePrestatairesProvider } from "@/contexts/HomePrestatairesContext";
import HeroSection from "@/components/home/HeroSection";
import LocationSection from "@/components/home/LocationSection";
import ServicesSection from "@/components/home/ServicesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TrustSection from "@/components/home/TrustSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <PublicLayout>
      <HomePrestatairesProvider>
        <HeroSection />
        <LocationSection />
        <ServicesSection />
        <HowItWorksSection />
        <TrustSection />
        <CTASection />
      </HomePrestatairesProvider>
    </PublicLayout>
  );
};

export default Index;
