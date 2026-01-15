-- Create messages table for chat functionality
-- This table stores all messages between clients and providers

-- Drop existing table if needed (uncomment if you want to recreate)
-- DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sender and receiver
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message content
  content TEXT NOT NULL,
  
  -- Optional: Link to a demande or devis
  demande_id UUID REFERENCES public.demandes(id) ON DELETE SET NULL,
  devis_id UUID REFERENCES public.devis_pro(id) ON DELETE SET NULL,
  
  -- Message status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_demande ON public.messages(demande_id);
CREATE INDEX IF NOT EXISTS idx_messages_devis ON public.messages(devis_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;

-- RLS Policies

-- 1. Users can view messages they sent or received
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id 
  OR auth.uid() = receiver_id
  OR EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- 2. Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- 3. Users can mark their received messages as read
CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- 4. Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS messages_updated_at ON public.messages;
CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();

-- Create function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.messages
  SET read = TRUE, read_at = NOW()
  WHERE id = message_id AND receiver_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.messages
    WHERE receiver_id = auth.uid() AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for conversations (list of unique conversations)
CREATE OR REPLACE VIEW conversations AS
SELECT DISTINCT ON (conversation_key)
  CASE 
    WHEN sender_id < receiver_id 
    THEN sender_id || '-' || receiver_id
    ELSE receiver_id || '-' || sender_id
  END as conversation_key,
  CASE 
    WHEN sender_id = auth.uid() THEN receiver_id
    ELSE sender_id
  END as other_user_id,
  (
    SELECT content 
    FROM messages m2 
    WHERE (m2.sender_id = messages.sender_id AND m2.receiver_id = messages.receiver_id)
       OR (m2.sender_id = messages.receiver_id AND m2.receiver_id = messages.sender_id)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message,
  (
    SELECT created_at 
    FROM messages m2 
    WHERE (m2.sender_id = messages.sender_id AND m2.receiver_id = messages.receiver_id)
       OR (m2.sender_id = messages.receiver_id AND m2.receiver_id = messages.sender_id)
    ORDER BY m2.created_at DESC 
    LIMIT 1
  ) as last_message_at,
  (
    SELECT COUNT(*)::INTEGER
    FROM messages m2 
    WHERE m2.receiver_id = auth.uid() 
      AND m2.read = FALSE
      AND (
        (m2.sender_id = messages.sender_id AND m2.receiver_id = messages.receiver_id)
        OR (m2.sender_id = messages.receiver_id AND m2.receiver_id = messages.sender_id)
      )
  ) as unread_count
FROM messages
WHERE sender_id = auth.uid() OR receiver_id = auth.uid()
ORDER BY conversation_key, last_message_at DESC;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT ON conversations TO authenticated;
GRANT EXECUTE ON FUNCTION mark_message_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Messages table created successfully!';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Helper functions and views created';
END $$;
