---
title: Fix Devis System Errors
status: completed
priority: high
created: 2026-01-04
completed: 2026-01-04
---

# Fix Devis System Errors

## Context
Multiple errors have been identified in the devis system across client, admin, and provider pages. These errors prevent proper functionality and need systematic resolution.

## Identified Issues

### Issue 1: Demandes Table - Missing `user_id` Column
**Error:** `column demandes.user_id does not exist`
**Location:** `src/pages/dashboard/client/DemandeDetailPage.tsx`
**Root Cause:** The query tries to filter by `user_id` but the `demandes` table uses `client_id` instead
**Impact:** Client cannot view their own demande details

### Issue 2: Prestataires Table - Missing `phone` Column  
**Error:** `column prestataires_1.phone does not exist`
**Location:** Unknown (needs investigation)
**Root Cause:** Code is trying to access a `phone` column that doesn't exist in the prestataires table
**Impact:** Cannot display provider phone information

### Issue 3: Devis-Demandes Relationship Ambiguity
**Error:** `Could not embed because more than one relationship was found for 'devis' and 'demandes'`
**Location:** `src/pages/dashboard/admin/DevisPage.tsx`
**Root Cause:** Two foreign keys exist between devis and demandes:
- `demandes_devis_accepte_id_fkey` (demandes → devis)
- `devis_demande_id_fkey` (devis → demandes)
**Impact:** Admin cannot load devis list with demande information

### Issue 4: Missing Devis Items Display
**Error:** Items not showing in devis details
**Location:** Multiple pages (Client, Admin, Provider)
**Root Cause:** Items may not be loading correctly or display logic is broken
**Impact:** Cannot see detailed breakdown of devis items

## Solution Plan

### Phase 1: Database Schema Fixes

#### 1.1 Fix Demandes Query (Client Page)
- **Action:** Update query to use `client_id` instead of `user_id`
- **File:** `src/pages/dashboard/client/DemandeDetailPage.tsx`
- **Change:** Remove the `.eq('user_id', ...)` filter and rely on RLS policies

#### 1.2 Fix Devis-Demandes Relationship (Admin Page)
- **Action:** Specify which relationship to use in the Supabase query
- **File:** `src/pages/dashboard/admin/DevisPage.tsx`
- **Change:** Use `demandes!devis_demande_id_fkey` to explicitly specify the relationship

#### 1.3 Add Phone Column to Prestataires (Optional)
- **Action:** Either add the column or remove references to it
- **Decision:** Need to search codebase for all `phone` references first

### Phase 2: Code Fixes

#### 2.1 Client DemandeDetailPage
```typescript
// BEFORE (BROKEN):
const { data: demandeData, error: demandeError } = await supabase
  .from('demandes')
  .select('*')
  .eq('id', demandeId)
  .eq('user_id', user.id)  // ❌ user_id doesn't exist
  .maybeSingle();

// AFTER (FIXED):
const { data: demandeData, error: demandeError } = await supabase
  .from('demandes')
  .select('*')
  .eq('id', demandeId)
  .maybeSingle();  // ✅ RLS will handle access control
```

#### 2.2 Admin DevisPage
```typescript
// BEFORE (BROKEN):
const { data, error } = await supabase
  .from('devis')
  .select(`
    *,
    prestataire:prestataires(full_name, profession),
    demande:demandes(title, titre)  // ❌ Ambiguous relationship
  `)

// AFTER (FIXED):
const { data, error } = await supabase
  .from('devis')
  .select(`
    *,
    prestataire:prestataires(full_name, profession),
    demande:demandes!devis_demande_id_fkey(title, titre)  // ✅ Explicit relationship
  `)
```

#### 2.3 Verify Items Loading
- Check all three pages load items correctly
- Ensure items are displayed in modals
- Verify items table structure matches database

### Phase 3: Testing

#### 3.1 Client Page Tests
- [ ] Client can view their demande details
- [ ] Client can see all devis for their demande
- [ ] Client can view devis items in modal
- [ ] Client can accept/reject devis

#### 3.2 Admin Page Tests
- [ ] Admin can view all devis
- [ ] Admin can see prestataire and demande info
- [ ] Admin can view devis items in modal
- [ ] Stats display correctly

#### 3.3 Provider Page Tests
- [ ] Provider can view their devis list
- [ ] Provider can create new devis with items
- [ ] Provider can edit devis
- [ ] Items display correctly in all views

## Implementation Order

1. **Fix Client DemandeDetailPage** (Highest priority - blocking client workflow)
2. **Fix Admin DevisPage** (High priority - admin oversight)
3. **Search and fix phone column references** (Medium priority)
4. **Verify items display** (Medium priority - may already work after other fixes)

## Acceptance Criteria

- [ ] No database errors in browser console
- [ ] Client can view demande details and all associated devis
- [ ] Admin can view all devis with provider and demande information
- [ ] All devis items display correctly in detail modals
- [ ] No references to non-existent columns

## Notes

- The database schema uses `client_id` not `user_id` in demandes table
- RLS policies should handle access control, not manual user_id checks
- The `titre` field was added to demandes but queries still reference `title` - both should work
- Devis items are stored in `devis_pro_items` table
