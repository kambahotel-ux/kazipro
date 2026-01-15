import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Trash2, Archive, Pin, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  const [providerName, setProviderName] = useState("Prestataire");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProviderName();
      fetchConversations();
    }
  }, [user]);

  const fetchProviderName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("prestataires")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.full_name) {
        setProviderName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching provider name:", error);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch conversations where user is the prestataire
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("prestataire_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const convMap = new Map<string, Conversation>();
      data?.forEach((msg: any) => {
        const key = msg.client_id;
        if (!convMap.has(key)) {
          convMap.set(key, {
            id: key,
            client_id: msg.client_id,
            prestataire_id: msg.prestataire_id,
            client_name: msg.client_name || "Client",
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
            mission_title: msg.mission_title || "Mission",
          });
        }
      });

      setConversations(Array.from(convMap.values()));
      if (convMap.size > 0) {
        setSelectedConversation(Array.from(convMap.values())[0]);
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des conversations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("client_id", conversationId)
        .eq("prestataire_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des messages");
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      setSendingMessage(true);
      const { error } = await supabase.from("messages").insert([
        {
          client_id: selectedConversation.client_id,
          prestataire_id: user.id,
          content: newMessage,
          sender_id: user.id,
          sender_type: "prestataire",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      setNewMessage("");
      await fetchMessages(selectedConversation.id);
      toast.success("Message envoyé");
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi du message");
      console.error(error);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <DashboardLayout role="prestataire" userName={providerName} userRole="Prestataire">
      <div className="h-[calc(100vh-180px)]">
        <Card className="h-full">
          <div className="flex h-full">
            {/* Conversations list */}
            <div className="w-full md:w-80 border-r border-border flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold mb-3">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input placeholder="Rechercher..." className="pl-10" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Aucune conversation
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
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
            <div className="hidden md:flex flex-col flex-1">
              {selectedConversation ? (
                <>
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
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sélectionnez une conversation
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
