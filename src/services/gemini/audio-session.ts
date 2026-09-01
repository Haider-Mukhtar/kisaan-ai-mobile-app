import { AudioManager } from "react-native-audio-api";

/** Configures one full-duplex session shared by Gemini recording and playback. */
export async function configureGeminiAudioSession(): Promise<void> {
  AudioManager.setAudioSessionOptions({
    iosCategory: "playAndRecord",
    iosMode: "voiceChat",
    iosOptions: ["defaultToSpeaker", "allowBluetoothHFP"],
  });
  AudioManager.observeAudioInterruptions("gain");
  await AudioManager.setAudioSessionActivity(true);
}
