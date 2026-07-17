import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Trash2, Archive, Pin, Loader2, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { messagesApi } from "@/lib/api";
import { getClientDisplayName, mapMessageToUi, unwrapPaginated } from "@/lib/client-helpers";
import { toast } from "sonner";
import { readMessagingSearchParams } from "@/lib/messaging";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  mission: string;
  userId: string;
}

function partnerName(partenaire: Record<string, unknown> | null | undefined): string {
  if (!partenaire) return "Utilisateur";
  const client = partenaire.client as { prenom?: string; nom?: string } | undefined;
  const prestataire = partenaire.prestataire as { prenom?: string; nom?: string; raison_sociale?: string } | undefined;
  if (client?.prenom || client?.nom) return `${client.prenom ?? ""} ${client.nom ?? ""}`.trim();
  if (prestataire?.raison_sociale) return prestataire.raison_sociale;
  if (prestataire?.prenom || prestataire?.nom) return `${prestataire.prenom ?? ""} ${prestataire.nom ?? ""}`.trim();
  return String(partenaire.name ?? "Utilisateur");
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { partnerId, demandeId, name: partnerName, mission: missionTitle } =
    readMessagingSearchParams(searchParams);
  const pendingDemandeId = useRef<string | null>(demandeId);
  if (demandeId) pendingDemandeId.current = demandeId;
  const clientName = getClientDisplayName(user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async (userId: string) => {
    if (!user) return;
    try {
      const res = await messagesApi.getMessages(userId);
      const rows = unwrapPaginated(res as never).length
        ? unwrapPaginated(res as never)
        : unwrapPaginated((res as { data?: unknown[] }) ?? []);
      setMessages(
        rows.map((m) => mapMessageToUi(m as Record<string, unknown>) as Message),
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [user]);

  const fetchConversations = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await messagesApi.getConversations();
      const list = Array.isArray(data) ? data : [];

      const newConversations: Conversation[] = list.map((conv: any) => {
        const partner = conv.partenaire as Record<string, unknown> | undefined;
        const partnerId = String(partner?.id ?? "");
        const last = conv.dernier_message as Record<string, unknown> | undefined;
        const createdAt = last?.created_at
          ? new Date(String(last.created_at)).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return {
          id: partnerId,
          userId: partnerId,
          name: partnerName(partner),
          avatar: (partner?.avatar as string | undefined) ?? undefined,
          lastMessage: String(last?.contenu ?? last?.content ?? ""),
          time: createdAt,
          unread: Number(conv.non_lus ?? 0),
          mission: String((last?.demande as { titre?: string })?.titre ?? ""),
        };
      });

      if (signal?.aborted) return;
      setConversations(newConversations);
      if (newConversations.length > 0) {
        const first = newConversations[0];
        setSelectedConversation((prev) => prev ?? first);
        void fetchMessages(first.userId);
      }
    } catch (error: unknown) {
      if (!signal?.aborted) {
        toast.error("Erreur lors du chargement des messages");
        console.error(error);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [user, fetchMessages]);

  useAbortableFetch(Boolean(user), [user], async (signal) => {
    if (!user || signal.aborted) return;
    await fetchConversations(signal);
  });

  useEffect(() => {
    if (!partnerId || loading) return;
    setConversations((prev) => {
      const existing = prev.find((c) => c.userId === partnerId);
      if (existing) {
        setSelectedConversation(existing);
        setMobileThreadOpen(true);
        return prev;
      }
      const draft: Conversation = {
        id: partnerId,
        userId: partnerId,
        name: partnerName ?? "Prestataire",
        lastMessage: "",
        time: "",
        unread: 0,
        mission: missionTitle ?? "",
      };
      setSelectedConversation(draft);
      setMessages([]);
      setMobileThreadOpen(true);
      return [draft, ...prev];
    });
  }, [partnerId, partnerName, missionTitle, loading]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileThreadOpen(true);
    fetchMessages(conv.userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    try {
      setSending(true);
      await messagesApi.send(selectedConversation.userId, {
        contenu: newMessage.trim(),
        ...(pendingDemandeId.current
          ? { demande_id: pendingDemandeId.current }
          : {}),
      });
      setNewMessage("");
      await fetchMessages(selectedConversation.userId);
      await fetchConversations();
    } catch (error: unknown) {
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
      <div className="h-[calc(100vh-180px)]">
        <Card className="h-full">
          <div className="flex h-full">
            <div className={`${mobileThreadOpen ? "hidden md:flex" : "flex"} w-full md:w-80 border-r border-border flex-col`}>
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher..." className="pl-10" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="divide-y divide-border">
                  {loading ? (
                    <div className="p-3">
                      <AdminListSkeleton items={3} />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="space-y-3 p-4 text-center text-sm text-muted-foreground">
                      <p>Aucun échange pour le moment.</p>
                      <p>
                        Les conversations apparaissent après un premier message avec un prestataire lié à
                        une de vos demandes ou missions.
                      </p>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to="/dashboard/client/demandes">Mes demandes</Link>
                      </Button>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={conv.avatar} />
                            <AvatarFallback>{conv.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{conv.name}</h4>
                              <span className="text-xs text-muted-foreground">{conv.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conv.mission}</p>
                            <p className="text-sm text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                          </div>
                          {conv.unread > 0 && <Badge className="ml-2">{conv.unread}</Badge>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className={`${mobileThreadOpen ? "flex" : "hidden md:flex"} flex-col flex-1`}>
              {selectedConversation ? (
                <>
                  <div className="md:hidden px-4 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => setMobileThreadOpen(false)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour aux conversations
                    </Button>
                  </div>
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarImage src={selectedConversation.avatar} />
                        <AvatarFallback>
                          {selectedConversation.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{selectedConversation.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedConversation.mission}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative">
                      <Button variant="ghost" size="icon" title="Appel">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Vidéo">
                        <Video className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setShowOptions(!showOptions)} title="Options">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        {showOptions && (
                          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10">
                            <Button variant="ghost" size="sm" className="w-full justify-start rounded-none">
                              <Pin className="w-4 h-4 mr-2" />
                              Épingler
                            </Button>
                            <Button variant="ghost" size="sm" className="w-full justify-start rounded-none">
                              <Archive className="w-4 h-4 mr-2" />
                              Archiver
                            </Button>
                            <Button variant="ghost" size="sm" className="w-full justify-start rounded-none text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${String(msg.sender_id) === String(user?.id) ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              String(msg.sender_id) === String(user?.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                String(msg.sender_id) === String(user?.id)
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button size="icon" onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 px-6 text-center text-muted-foreground">
                  <p>Choisissez un contact dans la liste</p>
                  <p className="text-xs">
                    Vous pouvez aussi contacter un prestataire depuis le détail d&apos;une{" "}
                    <Link to="/dashboard/client/demandes" className="text-primary underline">
                      demande
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
