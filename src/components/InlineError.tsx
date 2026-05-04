// Soft-red banner used inline for form errors.
import { AlertCircle } from "lucide-react";

export function InlineError({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 p-3 rounded-md text-sm"
      style={{ backgroundColor: "#FBEAEA", color: "#7A2020" }}
    >
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
