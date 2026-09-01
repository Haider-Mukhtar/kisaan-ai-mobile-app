export type GeminiConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "closed";

export type GeminiErrorCode =
  | "missing-key"
  | "connection"
  | "connection-lost"
  | "session-restarted"
  | "send"
  | "invalid-response"
  | "audio-playback"
  | "microphone-permission"
  | "microphone-start"
  | "image-permission"
  | "image-unavailable"
  | "image-too-large"
  | "image-unsupported";

export type ChatRole = "user" | "model";

export type GeminiChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  imageUri?: string;
  isStreaming?: boolean;
  timestamp: number;
};

export type PendingImage = {
  uri: string;
  base64: string;
  mimeType: string;
  fileSize: number | null;
};

export type GeminiLiveCallbacks = {
  onStatusChange: (status: GeminiConnectionStatus) => void;
  onAudioChunk: (base64Pcm24k: string) => void;
  onTranscript: (text: string, role: ChatRole) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onSessionRestarted: () => void;
  onError: (code: GeminiErrorCode) => void;
};

export type GeminiTurnInput = {
  text?: string;
  image?: Pick<PendingImage, "base64" | "mimeType">;
};

export type GeminiServerMessage = {
  setupComplete?: Record<string, never>;
  serverContent?: {
    modelTurn?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
    interrupted?: boolean;
    turnComplete?: boolean;
    generationComplete?: boolean;
  };
  sessionResumptionUpdate?: {
    newHandle?: string;
    resumable?: boolean;
  };
  goAway?: {
    timeLeft?: string;
  };
};
