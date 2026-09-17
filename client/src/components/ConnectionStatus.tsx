import type { ConnectionStatus } from '../hooks/useSocket';

import { Wifi, WifiOff, Loader2 } from 'lucide-react';

interface Props {
  status: ConnectionStatus;
}

export function ConnectionStatus({ status }: Props) {
  const configs = {
    connected: {
      icon: <Wifi size={14} />,
      text: 'Live',
      cls: 'text-emerald-400',
      dot: 'bg-emerald-400 pulse-dot',
    },
    disconnected: {
      icon: <WifiOff size={14} />,
      text: 'Offline',
      cls: 'text-red-400',
      dot: 'bg-red-400',
    },
    connecting: {
      icon: <Loader2 size={14} className="animate-spin" />,
      text: 'Connecting…',
      cls: 'text-yellow-400',
      dot: 'bg-yellow-400',
    },
  };

  const c = configs[status];

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${c.cls}`}>
      <span className={`w-2 h-2 rounded-full inline-block ${c.dot}`} />
      {c.icon}
      <span>{c.text}</span>
    </div>
  );
}
