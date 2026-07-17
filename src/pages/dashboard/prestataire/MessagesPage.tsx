import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAbortableFetch } from "@/hooks/useAbortableFetch";
import { AdminListSkeleton } from "@/components/dashboard/AdminLoadingSkeleton";
import { PrestataireEmptyState } from "@/components/prestataire/PrestataireEmptyState";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Trash2, Archive, Pin, Loader2, ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { messagesApi } from "@/lib/api";
import { unwrapPaginated } from "@/lib/api-utils";
import { displayNameFromProfil, getProfil } from "@/lib/kazipro-profile";
import { toast } from "sonner";
import { readMessagingSearchParams } from "@/lib/messaging";

interface Conversation {
  id: string;
  client_id: string;
  prestataire_id: string;
  client_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  mission_title: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_type: "client" | "prestataire";
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { partnerId, demandeId, name: partnerName, mission: missionTitle } =
    readMessagingSearchParams(searchParams);
  const pendingDemandeId = useRef<string | null>(demandeId);
  if (demandeId) pendingDemandeId.current = demandeId;
  const providerDisplayName = user
    ? displayNameFromProfil(getProfil(user) ?? {}, user.name || "Prestataire")
    : "Prestataire";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useAbortableFetch(Boolean(user), [user], async (signal) => {
    if (!user || signal.aborted) return;
    await fetchConversations(signal);
  });

  useEffect(() => {
    if (selectedConversation) {
      void fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!partnerId || loading) return;
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === partnerId);
      if (existing) {
        setSelectedConversation(existing);
        setMobileThreadOpen(true);
        return prev;
      }
      const draft: Conversation = {
        id: partnerId,
        client_id: partnerId,
        prestataire_id: String(user?.id ?? ""),
        client_name: partnerName ?? "Client",
        last_message: "",
        last_message_time: "",
        unread_count: 0,
        mission_title: missionTitle ?? "",
      };
      setSelectedConversation(draft);
      setMessages([]);
      setMobileThreadOpen(true);
      return [draft, ...prev];
    });
  }, [partnerId, partnerName, missionTitle, loading, user?.id]);

  const fetchConversations = async (signal?: AbortSignal) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await messagesApi.getConversations();
      const rows = Array.isArray(res) ? res : [];
      const convs: Conversation[] = rows.map((item: Record<string, unknown>) => {
        const partner = item.partenaire as Record<string, unknown> | undefined;
        const last = item.dernier_message as Record<string, unknown> | undefined;
        const partnerId = String(partner?.id ?? '');
        return {
          id: partnerId,
          client_id: partnerId,
          prestataire_id: String(user.id),
          client_name: displayNameFromProfil(partner?.client as Record<string, unknown> ?? partner ?? {}, partner?.name as string ?? 'Client'),
          last_message: String(last?.contenu ?? last?.content ?? ''),
          last_message_time: String(last?.created_at ?? new Date().toISOString()),
          unread_count: Number(item.non_lus ?? 0),
          mission_title: String((last?.demande as { titre?: string })?.titre ?? 'Mission'),
        };
      });
      if (signal?.aborted) return;
      setConversations(convs);
      if (convs.length > 0) setSelectedConversation((prev) => prev ?? convs[0]);
    } catch (error: unknown) {
      if (!signal?.aborted) {
        toast.error("Erreur lors du chargement des conversations");
        console.error(error);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    try {
      const res = await messagesApi.getMessages(conversationId);
      const rows = unwrapPaginated<Record<string, unknown>>(res);
      setMessages(rows.map((m) => ({
        id: String(m.id),
        sender_id: String(m.expediteur_id ?? m.sender_id ?? ''),
        content: String(m.contenu ?? m.content ?? ''),
        created_at: String(m.created_at ?? ''),
        sender_type: String(m.expediteur_id) === String(user.id) ? 'prestataire' as const : 'client' as const,
      })));
    } catch (error: unknown) {
      toast.error("Erreur lors du chargement des messages");
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      setSendingMessage(true);
      await messagesApi.send(selectedConversation.client_id, {
        contenu: newMessage.trim(),
        ...(pendingDemandeId.current
          ? { demande_id: pendingDemandeId.current }
          : {}),
      });
      setNewMessage("");
      await fetchMessages(selectedConversation.id);
      await fetchConversations();
      toast.success("Message envoyé");
    } catch (error: unknown) {
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <DashboardLayout role="prestataire" userName={providerDisplayName} userRole="Prestataire">
      <div className="h-[calc(100vh-180px)]">
        <Card className="h-full">
          <div className="flex h-full">
            {/* Conversations list */}
            <div className={`${mobileThreadOpen ? "hidden md:flex" : "flex"} w-full md:w-80 border-r border-border flex-col`}>
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher..." className="pl-10" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="p-3">
                    <AdminListSkeleton items={3} />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-3">
                    <PrestataireEmptyState context="messages" hasActiveFilters={false} />
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setMobileThreadOpen(true);
                        }}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-muted" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>{conv.client_name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{conv.client_name}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conv.last_message_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conv.mission_title}</p>
                            <p className="text-sm text-muted-foreground truncate mt-1">{conv.last_message}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge className="ml-2">{conv.unread_count}</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat area */}
            <div className={`${mobileThreadOpen ? "flex" : "hidden md:flex"} flex-col flex-1`}>
              {selectedConversation ? (
                <>
                  <div className="md:hidden px-4 pt-3">
                    <Button variant="ghost" size="sm" onClick={() => setMobileThreadOpen(false)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour aux conversations
                    </Button>
                  </div>
                  {/* Chat header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar>
                        <AvatarFallback>
                          {selectedConversation.client_name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{selectedConversation.client_name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedConversation.mission_title}</p>
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setShowOptions(!showOptions)}
                          title="Options"
                        >
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

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          Aucun message
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender_type === "prestataire" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.sender_type === "prestataire"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${
                                msg.sender_type === "prestataire" ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}>
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {/* Message input */}
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Input
                        placeholder="Tapez votre message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button 
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center text-muted-foreground">
                  <p>Choisissez un contact dans la liste</p>
                  <p className="text-xs">
                    Ou ouvrez une demande depuis{" "}
                    <Link to="/dashboard/prestataire/marche/opportunites" className="text-primary underline">
                      Opportunités
                    </Link>{" "}
                    puis « Contacter ».
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
