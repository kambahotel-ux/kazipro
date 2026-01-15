# Spec: Professional Devis System

## Overview
Enhance the current devis (quote) system to support professional business profiles, PDF generation with company branding, client-provider negotiation, and devis modifications.

## User Stories

### Epic 1: Provider Company Profile
**As a** service provider  
**I want to** configure my company information and upload my logo  
**So that** my devis appear professional with my business branding

#### Acceptance Criteria
- [ ] Provider can access "Company Information" section in settings
- [ ] Provider can upload company logo (image file)
- [ ] Provider can enter: company name, address, city, phone, professional email
- [ ] Provider can optionally enter: tax ID/RCCM number, general terms & conditions
- [ ] Logo preview is displayed after upload
- [ ] Company info is saved to database
- [ ] Logo is stored in Supabase Storage bucket

### Epic 2: Professional PDF Generation
**As a** service provider  
**I want to** generate professional PDF devis with my company branding  
**So that** clients receive formal, branded quotes

#### Acceptance Criteria
- [ ] PDF template includes provider's company logo in header
- [ ] PDF displays provider company information (name, address, contact)
- [ ] PDF displays client information
- [ ] PDF shows detailed line items table with descriptions, quantities, unit prices
- [ ] PDF calculates and displays subtotal, tax (if applicable), and total
- [ ] PDF includes payment terms and conditions
- [ ] PDF footer includes KaziPro signature/copyright: "Généré via KaziPro - Plateforme de mise en relation professionnelle"
- [ ] Small KaziPro logo appears discreetly in footer
- [ ] PDF can be downloaded by both provider and client
- [ ] PDF generation uses react-pdf or jsPDF library

### Epic 3: Client Negotiation
**As a** client  
**I want to** propose a counter-price for a devis  
**So that** I can negotiate the cost with the provider

#### Acceptance Criteria
- [ ] Client can view detailed devis with all line items
- [ ] Client sees "Propose Counter-Price" button on pending devis
- [ ] Clicking button opens negotiation modal
- [ ] Modal allows client to enter proposed amount
- [ ] Modal allows client to add message explaining counter-proposal
- [ ] Client can submit counter-proposal
- [ ] Devis status changes to "negotiating" after submission
- [ ] Provider receives notification of counter-proposal
- [ ] Client can see negotiation history

### Epic 4: Provider Devis Modification
**As a** service provider  
**I want to** respond to client counter-proposals and modify my devis  
**So that** I can negotiate and finalize the agreement

#### Acceptance Criteria
- [ ] Provider can view list of devis in "negotiating" status
- [ ] Provider can see client's counter-proposal amount and message
- [ ] Provider has options to:
  - Accept client's counter-proposal (updates devis amount)
  - Modify devis items and resend
  - Reject with message
- [ ] When provider modifies devis, client receives notification
- [ ] Negotiation history shows all exchanges
- [ ] After acceptance, devis status changes to "accepted"
- [ ] Mission is auto-created when devis is accepted

## Database Schema Changes

### New Table: `entreprise_info`
```sql
CREATE TABLE entreprise_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestataire_id UUID NOT NULL UNIQUE REFERENCES prestataires(id),
  nom_entreprise TEXT,
  logo_url TEXT,
  adresse TEXT,
  ville TEXT,
  telephone TEXT,
  email_professionnel TEXT,
  numero_fiscal TEXT,
  conditions_generales TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### New Table: `devis_negotiations`
```sql
CREATE TABLE devis_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devis_id UUID NOT NULL REFERENCES devis(id),
  auteur_type TEXT NOT NULL CHECK (auteur_type IN ('client', 'prestataire')),
  auteur_id UUID NOT NULL,
  montant_propose NUMERIC NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modifications to `devis` table
```sql
ALTER TABLE devis ADD COLUMN statut_negociation TEXT DEFAULT 'pending' 
  CHECK (statut_negociation IN ('pending', 'negotiating', 'accepted', 'rejected'));
ALTER TABLE devis ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE devis ADD COLUMN devis_parent_id UUID REFERENCES devis(id);
```

## Technical Implementation

### Phase 1: Company Profile (Priority: High)
**Files to create/modify:**
- `src/pages/dashboard/prestataire/ParametresPage.tsx` - Add company info section
- `sql/create_entreprise_info.sql` - Create table and RLS policies
- Storage bucket: `company-logos` for logo uploads

**Components needed:**
- Company info form with validation
- Logo upload component with preview
- Save/update functionality

### Phase 2: PDF Generation (Priority: High)
**Files to create/modify:**
- `src/components/devis/DevisPDFTemplate.tsx` - PDF template component
- `src/lib/pdf-generator.ts` - PDF generation utility
- Install: `@react-pdf/renderer` or `jspdf`

**Features:**
- Professional layout with company branding
- Line items table
- Calculations (subtotal, tax, total)
- KaziPro footer signature

### Phase 3: Client Negotiation (Priority: Medium)
**Files to create/modify:**
- `src/pages/dashboard/client/DemandeDetailPage.tsx` - Add negotiation UI
- `src/components/devis/NegotiationModal.tsx` - Counter-proposal modal
- `sql/create_devis_negotiations.sql` - Create table and RLS policies

**Features:**
- Counter-price input with validation
- Message textarea
- Submit negotiation
- View negotiation history

### Phase 4: Provider Modifications (Priority: Medium)
**Files to create/modify:**
- `src/pages/dashboard/prestataire/DevisPage.tsx` - Add negotiation management
- `src/components/devis/NegotiationResponseModal.tsx` - Response modal
- Update devis modification logic

**Features:**
- View counter-proposals
- Accept/reject/modify options
- Update devis items
- Send notifications

## Open Questions

### Negotiation Rules
1. **Q:** Can clients negotiate multiple times or just once?  
   **A:** _Awaiting user response_

2. **Q:** Can providers modify line items or only the total price?  
   **A:** _Awaiting user response_

3. **Q:** Should there be a chat system for negotiation or just message exchanges?  
   **A:** _Awaiting user response_

4. **Q:** How many negotiation rounds before it ends?  
   **A:** _Awaiting user response_

### Devis Lifecycle
5. **Q:** Are devis time-limited (expiration date)?  
   **A:** _Awaiting user response_

6. **Q:** Can clients negotiate after accepting a devis?  
   **A:** _Awaiting user response_

### PDF Generation
7. **Q:** Should PDFs be auto-generated or on-demand?  
   **A:** _Awaiting user response_

8. **Q:** Should PDFs be stored or generated on-the-fly?  
   **A:** _Awaiting user response_

9. **Q:** Can clients download PDFs directly?  
   **A:** _Awaiting user response_

### Company Information
10. **Q:** Are company info fields mandatory for creating devis?  
    **A:** _Awaiting user response_

11. **Q:** Should company info be verified (RCCM validation)?  
    **A:** _Awaiting user response_

12. **Q:** Can providers have multiple companies?  
    **A:** _Awaiting user response_

## Success Metrics
- [ ] Providers can configure company profiles
- [ ] Professional PDF devis can be generated and downloaded
- [ ] Clients can propose counter-prices
- [ ] Providers can respond to negotiations
- [ ] Negotiation history is tracked
- [ ] All database changes are applied successfully
- [ ] RLS policies protect data appropriately

## Dependencies
- Supabase Storage for logo uploads
- PDF generation library (@react-pdf/renderer or jspdf)
- Existing devis system
- Existing missions auto-creation trigger

## Notes
- KaziPro branding should be subtle (footer only)
- Provider's logo is the primary branding
- Maintain backward compatibility with existing devis
- Consider mobile responsiveness for all new UI components
