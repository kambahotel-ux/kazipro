# Phase 5: Admin Pages Implementation Plan

## Overview
Implement 7 admin pages for platform management and moderation.

## Admin Pages to Implement

### 1. UsersPage.tsx - User Management
**Purpose:** Manage all users (clients and providers)

**Features:**
- List all users with:
  - Name
  - Email
  - Type (client/provider)
  - Status (active/inactive)
  - Join date
  - Actions (view, edit, suspend, delete)
- Search and filter by:
  - User type
  - Status
  - Join date range
- Bulk actions (suspend, delete)
- User details modal
- Edit user information
- Suspend/activate user account
- Delete user account

**Database Tables:**
- `auth.users` - User authentication
- `clients` - Client profiles
- `prestataires` - Provider profiles

---

### 2. ProvidersPage.tsx - Provider Verification
**Purpose:** Verify and manage provider accounts

**Features:**
- List all providers with:
  - Name
  - Specialization
  - Verification status
  - Rating
  - Missions completed
  - Join date
  - Actions (verify, reject, suspend)
- Filter by:
  - Verification status (pending, verified, rejected)
  - Specialization
  - Rating range
- Verification queue (pending providers)
- View provider details:
  - Profile information
  - Certifications
  - Portfolio
  - Reviews
  - Missions history
- Approve/reject verification
- Add verification notes
- Suspend provider

**Database Tables:**
- `prestataires` - Provider profiles
- `avis` - Reviews/ratings

---

### 3. RequestsPage.tsx - Request Moderation
**Purpose:** Moderate service requests

**Features:**
- List all requests with:
  - Title
  - Client name
  - Status
  - Created date
  - Actions (view, approve, reject, delete)
- Filter by:
  - Status (pending, approved, rejected)
  - Category
  - Date range
- Request details modal with:
  - Full description
  - Images
  - Budget
  - Timeline
  - Client information
- Approve/reject requests
- Add moderation notes
- Delete inappropriate requests
- Flag for review

**Database Tables:**
- `demandes` - Service requests

---

### 4. DisputesPage.tsx - Dispute Resolution
**Purpose:** Handle disputes between clients and providers

**Features:**
- List all disputes with:
  - ID
  - Client name
  - Provider name
  - Mission title
  - Status
  - Created date
  - Actions (view, resolve, escalate)
- Filter by:
  - Status (open, resolved, escalated)
  - Priority
  - Date range
- Dispute details with:
  - Full description
  - Evidence/attachments
  - Messages between parties
  - Timeline
- Resolution options:
  - Refund client
  - Pay provider
  - Split payment
  - Custom resolution
- Add resolution notes
- Escalate to higher authority

**Database Tables:**
- `litiges` - Disputes (if exists)
- `missions` - Mission information
- `messages` - Communication history

---

### 5. TransactionsPage.tsx - Transaction Tracking
**Purpose:** Monitor all financial transactions

**Features:**
- List all transactions with:
  - ID
  - Type (payment, refund, withdrawal)
  - Amount
  - Status
  - Date
  - Parties involved
  - Actions (view, refund, investigate)
- Filter by:
  - Type
  - Status (completed, pending, failed)
  - Amount range
  - Date range
- Transaction details with:
  - Full information
  - Payment method
  - Reference number
  - Status history
- Refund transaction
- Investigate suspicious transactions
- Export transaction report

**Database Tables:**
- `paiements` - Payment records

---

### 6. ReportsPage.tsx - Analytics & Reports
**Purpose:** View platform analytics and generate reports

**Features:**
- Dashboard with key metrics:
  - Total users
  - Total providers
  - Total requests
  - Total revenue
  - Active missions
  - Disputes count
- Charts and graphs:
  - User growth over time
  - Revenue trend
  - Request volume
  - Provider performance
  - Dispute rate
- Reports:
  - User activity report
  - Provider performance report
  - Financial report
  - Dispute report
  - Custom date range reports
- Export reports (PDF, CSV)
- Schedule automated reports

**Database Tables:**
- All tables (for aggregation)

---

### 7. ConfigPage.tsx - Platform Configuration
**Purpose:** Configure platform settings

**Features:**
- General settings:
  - Platform name
  - Logo
  - Contact information
  - Support email
- Commission settings:
  - Commission percentage
  - Minimum transaction
  - Payment methods
- Verification settings:
  - Required documents
  - Verification process
  - Approval workflow
- Notification settings:
  - Email templates
  - SMS templates
  - Notification rules
- Security settings:
  - Password requirements
  - 2FA settings
  - Rate limiting
- Feature flags:
  - Enable/disable features
  - Beta features
  - Maintenance mode

**Database Tables:**
- `config` - Configuration (if exists)
- Or use environment variables

---

## Implementation Order

1. **UsersPage** - Foundation for user management
2. **ProvidersPage** - Provider verification workflow
3. **RequestsPage** - Request moderation
4. **TransactionsPage** - Financial tracking
5. **DisputesPage** - Dispute resolution
6. **ReportsPage** - Analytics
7. **ConfigPage** - Platform configuration

---

## Code Template for Admin Pages

```typescript
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Item {
  id: string;
  // Add fields
}

export default function AdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("table_name")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Page Title</h1>
          <p className="text-muted-foreground">Description</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </CardHeader>
          <CardContent>
            {/* Content */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

---

## Database Queries Needed

### Users
```sql
SELECT u.id, u.email, c.nom as client_name, p.nom as provider_name, 
       CASE WHEN c.id IS NOT NULL THEN 'client' ELSE 'prestataire' END as type,
       u.created_at
FROM auth.users u
LEFT JOIN clients c ON u.id = c.id
LEFT JOIN prestataires p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### Providers Pending Verification
```sql
SELECT * FROM prestataires 
WHERE verified = false 
ORDER BY created_at ASC;
```

### Transactions
```sql
SELECT * FROM paiements 
ORDER BY created_at DESC;
```

### Disputes
```sql
SELECT * FROM litiges 
ORDER BY created_at DESC;
```

---

## Testing Checklist

- [ ] All admin pages load correctly
- [ ] Data displays accurately
- [ ] Search/filter works
- [ ] Actions (approve, reject, etc.) work
- [ ] Modals display correctly
- [ ] Error handling works
- [ ] Loading states appear
- [ ] Empty states show when no data
- [ ] Permissions are enforced (admin only)

---

## Security Considerations

1. **Admin-Only Access**
   - Verify user is admin in ProtectedRoute
   - Check role in database

2. **Audit Logging**
   - Log all admin actions
   - Track who made changes and when

3. **Rate Limiting**
   - Prevent abuse of admin functions
   - Limit bulk operations

4. **Data Validation**
   - Validate all inputs
   - Sanitize data before display

5. **Permissions**
   - Different admin levels (super admin, moderator, etc.)
   - Restrict sensitive operations

---

## Estimated Timeline

- **UsersPage:** 2-3 hours
- **ProvidersPage:** 2-3 hours
- **RequestsPage:** 2-3 hours
- **TransactionsPage:** 2-3 hours
- **DisputesPage:** 3-4 hours
- **ReportsPage:** 4-5 hours
- **ConfigPage:** 2-3 hours

**Total:** 17-24 hours (2-3 days)

---

## Next Steps After Admin Pages

1. Implement real-time subscriptions
2. Add image upload to Storage
3. Add document verification system
4. Implement payment integration
5. Add notifications system
6. Testing and optimization
7. Deployment

---

**Status:** Ready for implementation  
**Priority:** High  
**Estimated Completion:** 2-3 days

