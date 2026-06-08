import { Check, Copy, Share2 } from "lucide-react";
import { buildShareUrl } from "../lib/urlState";

interface ShareSearchButtonProps {
  query: string;
  copied: boolean;
  onCopied: () => void;
}

export function ShareSearchButton({ query, copied, onCopied }: ShareSearchButtonProps) {
  const copyLink = async () => {
    const url = buildShareUrl(query);

    await navigator.clipboard.writeText(url);
    onCopied();
  };

  return (
    <button className="secondary-button" type="button" disabled={!query.trim()} onClick={copyLink}>
      {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
      {copied ? "Copied" : "Copy search link"}
      <Share2 size={16} aria-hidden="true" />
    </button>
  );
}
