import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink } from 'lucide-react';


interface Props {
  gameId: string;
}

export function QRCodePanel({ gameId }: Props) {
  const [copied, setCopied] = useState(false);

  const playerUrl = `${window.location.origin}/play/${gameId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="space-y-4">
      {/* Game ID badge */}
      <div className="text-center">
        <div className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider">Game ID</div>
        <div className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">
          {gameId}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="p-3 bg-white rounded-xl shadow-lg">
          <QRCodeSVG
            value={playerUrl}
            size={160}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* URL + copy */}
      <div className="flex gap-2">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] font-mono truncate">
          {playerUrl}
        </div>
        <button
          onClick={copyLink}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] border border-white/10'
          }`}
        >
          {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
        </button>
        <a
          href={playerUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] border border-white/10 transition-colors flex-shrink-0"
          title="Open player link in new tab"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      <p className="text-xs text-center text-[var(--text-muted)]">
        Share this QR code or link with players
      </p>
    </div>
  );
}
