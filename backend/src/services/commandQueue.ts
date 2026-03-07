export type CommandType = 'CLOSE_ALL' | 'OPEN_TRADE' | 'CLOSE_POSITION' | 'SET_SLTP';

export interface Command {
  id: string;
  type: CommandType;
  createdAt: number;
  accountId: string;
  userId: string;
  // OPEN_TRADE fields
  symbol?: string;
  action?: 'BUY' | 'SELL';
  volume?: number;
  price?: number;   // 0 = market order
  sl?: number;
  tp?: number;
  comment?: string;
  // CLOSE_POSITION / SET_SLTP fields
  ticket?: number;
}

// Map<apiKey, Command[]>
const queue = new Map<string, Command[]>();

let cmdCounter = 0;

export const commandQueue = {
  /** Enqueue a command for a specific apiKey. */
  enqueue(apiKey: string, command: Omit<Command, 'id' | 'createdAt'>): Command {
    const cmd: Command = {
      ...command,
      id: `cmd_${Date.now()}_${++cmdCounter}`,
      createdAt: Date.now(),
    };
    const existing = queue.get(apiKey) || [];
    existing.push(cmd);
    queue.set(apiKey, existing);
    console.log(
      `[CmdQueue] Enqueued ${cmd.type} for apiKey ...${apiKey.slice(-6)} (id: ${cmd.id})`,
    );
    return cmd;
  },

  /** Drain (dequeue) all pending commands for an apiKey. */
  drain(apiKey: string): Command[] {
    const commands = queue.get(apiKey) || [];
    if (commands.length > 0) {
      queue.delete(apiKey);
      console.log(
        `[CmdQueue] Drained ${commands.length} commands for apiKey ...${apiKey.slice(-6)}`,
      );
    }
    return commands;
  },

  /** Check if there are pending commands without draining. */
  hasPending(apiKey: string): boolean {
    return (queue.get(apiKey)?.length ?? 0) > 0;
  },

  /** Remove all commands for an apiKey (e.g. if account is deleted). */
  clear(apiKey: string): void {
    queue.delete(apiKey);
  },
};
