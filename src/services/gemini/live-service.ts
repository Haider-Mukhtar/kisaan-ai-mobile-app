import {
  buildGeminiLiveUrl,
  buildSystemInstruction,
  GEMINI_LIVE_CONFIG,
  getGeminiApiKey,
  lockTurnToResponseLanguage,
} from "@/services/gemini/config";
import type {
  GeminiConnectionStatus,
  GeminiLiveCallbacks,
  GeminiServerMessage,
  GeminiTurnInput,
} from "@/services/gemini/types";
import { loadMandiSnapshotForGemini } from "@/services/mandi/gemini-snapshot";
import type { MandiSnapshot } from "@/services/mandi/types";

type LiveServiceOptions = {
  callbacks: GeminiLiveCallbacks;
  language: "en" | "ur";
  /** Preformatted farm profile block from `describeFarmerForGemini`. */
  farmerContext?: string;
};

export class GeminiLiveService {
  private readonly callbacks: GeminiLiveCallbacks;
  private readonly language: "en" | "ur";
  private readonly farmerContext: string;
  private websocket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private generation = 0;
  private intentionalClose = false;
  private setupComplete = false;
  private resumptionHandle: string | null = null;
  private connectionStatus: GeminiConnectionStatus = "idle";
  private mandiSnapshot: MandiSnapshot | null = null;
  private mandiSnapshotPrepared = false;
  private mandiSnapshotPreparation: Promise<void> | null = null;

  constructor({ callbacks, language, farmerContext = "" }: LiveServiceOptions) {
    this.callbacks = callbacks;
    this.language = language;
    this.farmerContext = farmerContext;
  }

  connect(isReconnect = false): void {
    if (
      this.websocket?.readyState === WebSocket.CONNECTING ||
      this.websocket?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      this.setStatus("error");
      this.callbacks.onError("missing-key");
      return;
    }

    if (!this.mandiSnapshotPrepared) {
      this.intentionalClose = false;
      this.setStatus(isReconnect ? "reconnecting" : "connecting");

      if (!this.mandiSnapshotPreparation) {
        this.mandiSnapshotPreparation = loadMandiSnapshotForGemini()
          .then((snapshot) => {
            this.mandiSnapshot = snapshot;
          })
          .finally(() => {
            this.mandiSnapshotPrepared = true;
            this.mandiSnapshotPreparation = null;
            if (!this.intentionalClose) {
              this.openSocket(apiKey, isReconnect);
            }
          });
      }
      return;
    }

    this.openSocket(apiKey, isReconnect);
  }

  private openSocket(apiKey: string, isReconnect: boolean): void {
    if (
      this.websocket?.readyState === WebSocket.CONNECTING ||
      this.websocket?.readyState === WebSocket.OPEN
    ) {
      return;
    }

    this.clearReconnectTimer();
    this.intentionalClose = false;
    this.setupComplete = false;
    const generation = ++this.generation;
    this.setStatus(isReconnect ? "reconnecting" : "connecting");

    let socket: WebSocket;
    try {
      socket = new WebSocket(buildGeminiLiveUrl(apiKey));
    } catch {
      this.setStatus("error");
      this.callbacks.onError("connection");
      return;
    }

    this.websocket = socket;

    socket.onopen = () => {
      if (!this.isCurrent(socket, generation)) {
        socket.close();
        return;
      }
      this.sendSetup();
    };

    socket.onmessage = (event) => {
      if (this.isCurrent(socket, generation)) {
        void this.handleMessage(event.data);
      }
    };

    socket.onerror = () => {
      if (this.isCurrent(socket, generation) && !this.intentionalClose) {
        this.callbacks.onError("connection");
        socket.close();
      }
    };

    socket.onclose = () => {
      if (!this.isCurrent(socket, generation)) {
        return;
      }

      this.websocket = null;
      if (this.intentionalClose) {
        this.setStatus("closed");
        return;
      }

      this.scheduleReconnect();
    };
  }

  reconnect(newSession = false): void {
    if (newSession) {
      this.resumptionHandle = null;
    }
    this.reconnectAttempts = 0;
    this.closeSocket(false);
    this.intentionalClose = false;
    this.connect();
  }

  disconnect(): void {
    this.closeSocket(true);
  }

  sendTurn({ text, image }: GeminiTurnInput): boolean {
    const trimmed = text?.trim();
    if (!trimmed && !image) {
      return false;
    }

    const realtimeInput: Record<string, unknown> = {};
    if (image) {
      realtimeInput.video = {
        data: image.base64,
        mimeType: image.mimeType,
      };
    }
    if (trimmed) {
      realtimeInput.text = lockTurnToResponseLanguage(trimmed, this.language);
    }

    return this.send({ realtimeInput });
  }

  sendAudioChunk(base64Pcm16k: string): boolean {
    if (!base64Pcm16k) {
      return false;
    }

    return this.send({
      realtimeInput: {
        audio: {
          data: base64Pcm16k,
          mimeType: `audio/pcm;rate=${GEMINI_LIVE_CONFIG.inputSampleRate}`,
        },
      },
    });
  }

  sendAudioStreamEnd(): boolean {
    return this.send({
      realtimeInput: {
        audioStreamEnd: true,
      },
    });
  }

  get isConnected(): boolean {
    return (
      this.setupComplete && this.websocket?.readyState === WebSocket.OPEN
    );
  }

  private sendSetup(): void {
    const sessionResumption = this.resumptionHandle
      ? { handle: this.resumptionHandle }
      : {};

    this.sendRaw({
      setup: {
        model: `models/${GEMINI_LIVE_CONFIG.model}`,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Aoede" },
            },
          },
          thinkingConfig: { thinkingLevel: "minimal" },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
          },
        },
        contextWindowCompression: {
          slidingWindow: {},
        },
        sessionResumption,
        systemInstruction: {
          parts: [
            {
              text: buildSystemInstruction(
                this.language,
                this.farmerContext,
                this.mandiSnapshot,
              ),
            },
          ],
        },
      },
    });
  }

  private async handleMessage(data: unknown): Promise<void> {
    const raw = await this.readMessageData(data);
    if (!raw) {
      return;
    }

    let message: GeminiServerMessage;
    try {
      message = JSON.parse(raw) as GeminiServerMessage;
    } catch {
      this.callbacks.onError("invalid-response");
      return;
    }

    if (message.setupComplete !== undefined) {
      const wasReconnect = this.connectionStatus === "reconnecting";
      this.setupComplete = true;
      this.reconnectAttempts = 0;
      this.setStatus("connected");
      if (wasReconnect && !this.resumptionHandle) {
        this.callbacks.onSessionRestarted();
      }
    }

    const update = message.sessionResumptionUpdate;
    if (update?.resumable && update.newHandle) {
      this.resumptionHandle = update.newHandle;
    }

    if (message.goAway) {
      this.websocket?.close(1000, "Gemini requested reconnection");
    }

    const content = message.serverContent;
    if (!content) {
      return;
    }

    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) {
        this.callbacks.onAudioChunk(part.inlineData.data);
      }
      if (part.text) {
        this.callbacks.onTranscript(part.text, "model");
      }
    }

    if (content.inputTranscription?.text) {
      this.callbacks.onTranscript(content.inputTranscription.text, "user");
    }
    if (content.outputTranscription?.text) {
      this.callbacks.onTranscript(content.outputTranscription.text, "model");
    }
    if (content.interrupted) {
      this.callbacks.onInterrupted();
    }
    if (content.turnComplete) {
      this.callbacks.onTurnComplete();
    }
  }

  private async readMessageData(data: unknown): Promise<string | null> {
    if (typeof data === "string") {
      return data;
    }
    if (data instanceof ArrayBuffer) {
      return new TextDecoder().decode(data);
    }
    if (typeof Blob !== "undefined" && data instanceof Blob) {
      return data.text();
    }

    this.callbacks.onError("invalid-response");
    return null;
  }

  private send(payload: object): boolean {
    if (!this.isConnected) {
      this.callbacks.onError("send");
      return false;
    }

    return this.sendRaw(payload);
  }

  private sendRaw(payload: object): boolean {
    if (this.websocket?.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.websocket.send(JSON.stringify(payload));
      return true;
    } catch {
      this.callbacks.onError("send");
      return false;
    }
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || this.reconnectTimer) {
      return;
    }

    if (this.reconnectAttempts >= GEMINI_LIVE_CONFIG.maxReconnectAttempts) {
      this.setStatus("error");
      this.callbacks.onError("connection-lost");
      return;
    }

    this.reconnectAttempts += 1;
    this.setStatus("reconnecting");
    const delay =
      GEMINI_LIVE_CONFIG.reconnectBaseDelayMs * this.reconnectAttempts;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(true);
    }, delay);
  }

  private closeSocket(emitClosed: boolean): void {
    this.intentionalClose = true;
    this.clearReconnectTimer();
    this.setupComplete = false;
    this.generation += 1;

    const socket = this.websocket;
    this.websocket = null;
    if (
      socket?.readyState === WebSocket.CONNECTING ||
      socket?.readyState === WebSocket.OPEN
    ) {
      socket.close(1000, "Client closed session");
    }

    if (emitClosed) {
      this.setStatus("closed");
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private isCurrent(socket: WebSocket, generation: number): boolean {
    return this.websocket === socket && this.generation === generation;
  }

  private setStatus(status: GeminiConnectionStatus): void {
    if (this.connectionStatus === status) {
      return;
    }
    this.connectionStatus = status;
    this.callbacks.onStatusChange(status);
  }
}
