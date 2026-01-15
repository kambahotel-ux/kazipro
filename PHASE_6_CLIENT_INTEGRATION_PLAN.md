# Phase 6 - Client Pages Real Data Integration

## Status: In Progress 🔄

---

## Pages to Fix

### ✅ Already Fixed
- `ClientDashboard.tsx` - Uses real data from Supabase
- `DemandesPage.tsx` - Uses real data from Supabase

### ❌ Need Fixing (Hardcoded Names)
- `MessagesPage.tsx` - Has "Marie Dupont" hardcoded
- `PaiementsPage.tsx` - Has "Marie Dupont" hardcoded
- `AvisPage.tsx` - Has "Marie Dupont" hardcoded
- `ParametresPage.tsx` - Has "Marie Dupont" hardcoded
- `NouvelleDemandePages.tsx` - Has "Marie Dupont" hardcoded

---

## Quick Fix Pattern

For each page, add at the top:
```typescript
const [clientName, setClientName] = useState("Client");

useEffect(() => {
  if (user) {
    fetchClientName();
  }
}, [user]);

const fetchClientName = async () => {
  const { data } = await supabase
    .from("clients")
    .select("full_name")
    .eq("user_id", user.id)
    .single();
  
  if (data?.full_name) {
    setClientName(data.full_name);
  }
};
```

Then replace:
```typescript
userName="Marie Dupont"
```

With:
```typescript
userName={clientName}
```

---

## Pages Details

### MessagesPage.tsx
- **Current**: Shows hardcoded messages
- **Need**: Fetch real messages from `messages` table
- **Filter**: WHERE sender_id = user.id OR receiver_id = user.id

### PaiementsPage.tsx
- **Current**: Shows hardcoded payments
- **Need**: Fetch real payments from `paiements` table
- **Filter**: WHERE client_id = user.id (or via missions)

### AvisPage.tsx
- **Current**: Shows hardcoded reviews
- **Need**: Fetch real reviews from `avis` table
- **Filter**: WHERE mission_id IN (SELECT id FROM missions WHERE client_id = user.id)

### ParametresPage.tsx
- **Current**: Shows hardcoded settings
- **Need**: Fetch client profile and allow updates
- **Action**: Save changes to `clients` table

### NouvelleDemandePages.tsx
- **Current**: Shows form only
- **Need**: Create new demande in `demandes` table
- **Action**: INSERT into demandes with client_id, title, description, etc.

---

## Implementation Order

1. **Priority 1**: Fix hardcoded names (5 min each)
2. **Priority 2**: MessagesPage - fetch real messages (15 min)
3. **Priority 3**: PaiementsPage - fetch real payments (15 min)
4. **Priority 4**: AvisPage - fetch real reviews (15 min)
5. **Priority 5**: ParametresPage - fetch and save profile (20 min)
6. **Priority 6**: NouvelleDemandePages - create demande (20 min)

**Total Estimated Time**: ~2 hours

---

## Database Queries Needed

### Messages
```sql
SELECT * FROM messages 
WHERE sender_id = user.id OR receiver_id = user.id
ORDER BY created_at DESC
```

### Payments
```sql
SELECT p.* FROM paiements p
JOIN missions m ON p.mission_id = m.id
JOIN demandes d ON m.demande_id = d.id
WHERE d.client_id = user.id
ORDER BY p.created_at DESC
```

### Reviews
```sql
SELECT a.* FROM avis a
JOIN missions m ON a.mission_id = m.id
JOIN demandes d ON m.demande_id = d.id
WHERE d.client_id = user.id
ORDER BY a.created_at DESC
```

### Create Demande
```sql
INSERT INTO demandes (client_id, title, description, service, location, budget_min, budget_max, status)
VALUES (client_id, title, description, service, location, budget_min, budget_max, 'active')
```

---

## Next Steps

1. Fix all hardcoded names
2. Implement real data fetching for each page
3. Test all pages with real data
4. Move to Provider pages integration

---

**Last Updated:** 22 December 2025  
**Status:** Ready for Implementation
