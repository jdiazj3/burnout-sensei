import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Message } from "@/hooks/useExerciseBot";
import ReactMarkdown from "react-markdown";

interface ExerciseBotChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  sessionType: "bienestar" | "fisico";
}

export function ExerciseBotChat({
  messages,
  isLoading,
  onSendMessage,
  sessionType,
}: ExerciseBotChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const getSessionColor = () => {
    return sessionType === "bienestar" 
      ? "from-purple-500 to-indigo-600" 
      : "from-orange-500 to-red-500";
  };

  const getSessionIcon = () => {
    return sessionType === "bienestar" ? "🧘" : "💪";
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className={`bg-gradient-to-r ${getSessionColor()} text-white rounded-t-lg`}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{getSessionIcon()}</span>
          {sessionType === "bienestar" ? "Sensei - Coach de Bienestar" : "Sensei Fit - Entrenador de Pausas Activas"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getSessionColor()} flex items-center justify-center text-white flex-shrink-0`}>
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getSessionColor()} flex items-center justify-center text-white flex-shrink-0`}>
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu respuesta..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
