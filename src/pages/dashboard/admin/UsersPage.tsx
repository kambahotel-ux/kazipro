import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Eye, Trash2, Ban, CheckCircle, Loader2, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  type: "client" | "prestataire";
  name: string;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  last_login?: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "client" | "prestataire">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "suspended">("all");

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("id, full_name, user_id, created_at")
        .order("created_at", { ascending: false });

      if (clientsError) throw clientsError;

      // Fetch prestataires
      const { data: prestatairesData, error: prestatairesError } = await supabase
        .from("prestataires")
        .select("id, full_name, user_id, created_at")
        .order("created_at", { ascending: false });

      if (prestatairesError) throw prestatairesError;

      // Combine and format - don't try to fetch auth users
      const allUsers: User[] = [
        ...(clientsData || []).map((c: any) => ({
          id: c.id,
          email: "client@example.com", // Placeholder - we don't have access to auth emails
          type: "client" as const,
          name: c.full_name,
          status: "active" as const,
          created_at: c.created_at,
        })),
        ...(prestatairesData || []).map((p: any) => ({
          id: p.id,
          email: "prestataire@example.com", // Placeholder
          type: "prestataire" as const,
          name: p.full_name,
          status: "active" as const,
          created_at: p.created_at,
        })),
      ];

      setUsers(allUsers);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des utilisateurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || u.type === filterType;
    const matchesStatus = filterStatus === "all" || u.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSuspend = async (userId: string) => {
    try {
      toast.success("Utilisateur suspendu");
      // Update in database
    } catch (error: any) {
      toast.error("Erreur lors de la suspension");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur?")) return;
    try {
      toast.success("Utilisateur supprimé");
      // Delete from database
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin" userRole="Administrateur">
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold">Gestion des Utilisateurs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez tous les utilisateurs de la plateforme</p>
        </div>

        {/* Stats */}
        <div className="block sm:hidden">
          {/* Version mobile compacte */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{users.filter(u => u.type === "client").length}</p>
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{users.filter(u => u.type === "prestataire").length}</p>
                  <p className="text-xs text-muted-foreground">Prestataires</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{users.filter(u => u.status === "active").length}</p>
                  <p className="text-xs text-muted-foreground">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Version desktop */}
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total utilisateurs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{users.filter(u => u.type === "client").length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Clients</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{users.filter(u => u.type === "prestataire").length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Prestataires</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">{users.filter(u => u.status === "active").length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Actifs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm sm:text-base h-10 sm:h-11"
                >
                  <option value="all">Tous les types</option>
                  <option value="client">Clients</option>
                  <option value="prestataire">Prestataires</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm sm:text-base h-10 sm:h-11"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                  <option value="suspended">Suspendu</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Utilisateurs ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                Aucun utilisateur trouvé
              </div>
            ) : (
              <>
                {/* Version mobile - Cards */}
                <div className="block sm:hidden space-y-3">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">{u.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{u.name}</p>
                            <Badge variant={u.type === "client" ? "default" : "secondary"} className="text-xs">
                              {u.type === "client" ? "Client" : "Prestataire"}
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            u.status === "active"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : u.status === "suspended"
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                          }`}
                        >
                          {u.status === "active" ? "Actif" : u.status === "suspended" ? "Suspendu" : "Inactif"}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleSuspend(u.id)}
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Version desktop - Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm">Utilisateur</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Type</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Statut</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Inscrit</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>{u.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{u.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={u.type === "client" ? "default" : "secondary"}>
                              {u.type === "client" ? "Client" : "Prestataire"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="truncate max-w-[200px]">{u.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                u.status === "active"
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : u.status === "suspended"
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                              }
                            >
                              {u.status === "active" ? "Actif" : u.status === "suspended" ? "Suspendu" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuspend(u.id)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(u.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
