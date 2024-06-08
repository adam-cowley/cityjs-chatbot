import { ChatMessage } from "@/hooks/chat";
import {
  FormEvent,
  KeyboardEventHandler,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

export default function Form({
  onSubmit,
  messages,
  thinking,
  container,
}: {
  onSubmit: (message: string) => void;
  messages: ChatMessage[];
  thinking: boolean;
  container: RefObject<HTMLDivElement>;
}) {
  const input = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState<string>("");

  const handleSubmit = (event?: FormEvent<HTMLFormElement> | SubmitEvent) => {
    event?.preventDefault();

    if (message.trim().length > 0) {
      onSubmit(message);
      setTimeout(() => setMessage(""), 100);

      container.current?.scrollBy(0, 100);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (thinking) {
      return;
    }
    if (e.key === "ArrowUp") {
      const lastHuman = messages.reverse().find((m) => m.role === "human");

      if (lastHuman) {
        setMessage(lastHuman.content as string);
      }
      setTimeout(() => {
        if (input.current) {
          input.current.selectionStart = input.current.value.length;
          input.current.selectionEnd = input.current.value.length;
        }
      }, 20);
    } else if (!e.shiftKey && e.key === "Enter") {
      handleSubmit();
    }
  };

  useEffect(() => {
    typeof window !== "undefined" &&
      window.addEventListener("keydown", (event) => {
        const messages: Record<
          string,
          string
        > = require("../../shortcuts.json");

        if (input.current && event.altKey) {
          event.preventDefault();
          if (messages[event.key]) {
            input.current.value = messages[event.key];
            input.current.focus();
          }
        }
      });
  }, []);

  return (
    <form
      className="border-t b-slate-200 p-4 bg-slate-100"
      onSubmit={(e) => handleSubmit(e)}
    >
      <div className="flex flex-row bg-white border border-slate-600 rounded-md w-full">
        <div className="flex-grow">
          <textarea
            ref={input}
            value={message}
            rows={1}
            className="p-4 border-blue-600 rounded-md w-full outline-none focus:outline-none"
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="px-4">
          <button className="px-4 py-4 border-primary-800 text-blue-700 font-bold rounded-md h-full bg-white">
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
