import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Trash2, Archive, Pin, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string };
  receiver?: { full_name: string };
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  mission: string;
  userId: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "Jean Mukeba",
    avatar: "",
    lastMessage: "Merci pour la confiance, je commence demain à 9h.",
    time: "Il y a 5 min",
    unread: 2,
    online: true,
    mission: "Rénovation salle de bain",
    userId: "user1",
  },
  {
    id: "2",
    name: "Anne Mbuyi",
    avatar: "",
    lastMessage: "L'installation est terminée, tout fonctionne parfaitement !",
    time: "Il y a 1h",
    unread: 0,
    online: false,
    mission: "Installation climatisation",
    userId: "user2",
  },
  {
    id: "3",
    name: "Marc Tshisekedi",
    avatar: "",
    lastMessage: "Pouvez-vous confirmer la date de début ?",
    time: "Il y a 3h",
    unread: 1,
    online: true,
    mission: "Peinture extérieure",
    userId: "user3",
  },
];

export default function MessagesPage() {
  const { user } = useAuth();
  const [clientName, setClientName] = useState("Client");
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClientName();
      fetchConversations();
    }
  }, [user]);

  const fetchClientName = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("clients")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      if (data?.full_name) {
        setClientName(data.full_name);
      }
    } catch (error) {
      console.error("Error fetching client name:", error);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch messages for this user
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const convMap = new Map<string, Message[]>();
      (data || []).forEach((msg: Message) => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, []);
        }
        convMap.get(otherId)!.push(msg);
      });

      // Convert to conversations (using mock data as fallback)
      const newConversations = mockConversations.map(conv => ({
        ...conv,
        lastMessage: convMap.get(conv.userId)?.[0]?.content || conv.lastMessage,
      }));

      setConversations(newConversations);
      if (newConversations.length > 0) {
        setSelectedConversation(newConversations[0]);
        fetchMessages(newConversations[0].userId);
      }
    } catch (error: any) {
      toast.error("Erreur lors du chargement des messages");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.userId);
  };

  return (
    <DashboardLayout role="client" userName={clientName} userRole="Client">
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
                <div className="divide-y divide-border">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={conv.avatar} />
                              <AvatarFallback>{conv.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                            {conv.online && (
                              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{conv.name}</h4>
                              <span className="text-xs text-muted-foreground">{conv.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{conv.mission}</p>
                            <p className="text-sm text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                          </div>
                          {conv.unread > 0 && (
                            <Badge className="ml-2">{conv.unread}</Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Chat area */}
            <div className="hidden md:flex flex-col flex-1">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={selectedConversation.avatar} />
                          <AvatarFallback>
                            {selectedConversation.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConversation.online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{selectedConversation.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {selectedConversation.online ? "En ligne" : "Hors ligne"} • {selectedConversation.mission}
                        </p>
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
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                              msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
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
                        className="flex-1"
                      />
                      <Button size="icon">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <p className="text-muted-foreground">Sélectionnez une conversation</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
