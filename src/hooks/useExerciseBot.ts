import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type SessionType = "bienestar" | "fisico";

export function useExerciseBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const { toast } = useToast();

  const startSession = useCallback(async (type: SessionType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para usar el bot",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from("exercise_sessions")
      .insert({
        user_id: user.id,
        session_type: type,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo iniciar la sesión",
        variant: "destructive",
      });
      return null;
    }

    setSessionId(data.id);
    setSessionType(type);
    setMessages([]);

    // Send initial greeting
    await sendMessage("Hola, estoy listo para comenzar", data.id, type);
    return data.id;
  }, [toast]);

  const sendMessage = useCallback(async (
    content: string,
    currentSessionId?: string,
    currentSessionType?: SessionType
  ) => {
    const activeSessionId = currentSessionId || sessionId;
    const activeSessionType = currentSessionType || sessionType;
    
    if (!activeSessionId || !activeSessionType) {
      toast({
        title: "Error",
        description: "No hay sesión activa",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    // Don't show the initial greeting from user
    if (content !== "Hola, estoy listo para comenzar") {
      setMessages((prev) => [...prev, userMessage]);
    }

    // Save user message to database
    await supabase.from("exercise_messages").insert({
      session_id: activeSessionId,
      user_id: user.id,
      role: "user",
      content,
      message_type: "text",
    });

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const chatMessages = content === "Hola, estoy listo para comenzar" 
        ? [{ role: "user" as const, content: "Hola, quiero comenzar una sesión de ejercicios. Preséntate y proponme el primer ejercicio." }]
        : [...messages, userMessage].map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exercise-bot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            messages: chatMessages,
            sessionType: activeSessionType,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error en la respuesta");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No se pudo leer la respuesta");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save assistant message to database
      await supabase.from("exercise_messages").insert({
        session_id: activeSessionId,
        user_id: user.id,
        role: "assistant",
        content: assistantContent,
        message_type: "text",
      });

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar mensaje",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, sessionId, sessionType, toast]);

  const endSession = useCallback(async () => {
    if (!sessionId) return;

    await supabase
      .from("exercise_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        completed_exercises: messages.filter((m) => m.role === "assistant").length,
      })
      .eq("id", sessionId);

    setSessionId(null);
    setSessionType(null);
    setMessages([]);
  }, [sessionId, messages]);

  return {
    messages,
    isLoading,
    sessionId,
    sessionType,
    startSession,
    sendMessage,
    endSession,
  };
}
