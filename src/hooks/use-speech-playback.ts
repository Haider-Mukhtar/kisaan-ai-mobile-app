import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";

import { useLanguage } from "@/providers/language-provider";
import {
  detectSpeechLanguage,
  pickSpeechVoice,
  prepareSpokenText,
  SPEECH_LANGUAGE,
} from "@/services/speech";
import { showErrorToast } from "@/utils/toast";

export function useSpeechPlayback() {
  const { language, t } = useLanguage();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState(language);
  const requestIdRef = useRef(0);
  const busyRef = useRef(false);

  if (voiceLanguage !== language) {
    setVoiceLanguage(language);
    setSpeakingId(null);
  }

  const stop = useCallback(async () => {
    requestIdRef.current += 1;
    await Speech.stop();
    setSpeakingId(null);
  }, []);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      void Speech.stop();
    };
  }, []);

  useEffect(() => {
    requestIdRef.current += 1;
    void Speech.stop();
  }, [language]);

  const toggle = useCallback(
    async (id: string, text: string) => {
      if (busyRef.current) {
        return;
      }

      busyRef.current = true;

      try {
        if (speakingId === id) {
          await stop();
          return;
        }

        const spoken = prepareSpokenText(text);
        if (!spoken) {
          return;
        }

        const speechLanguage = detectSpeechLanguage(spoken, language);

        requestIdRef.current += 1;
        await Speech.stop();

        const voice = await pickSpeechVoice(speechLanguage);
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;
        setSpeakingId(id);

        Speech.speak(spoken, {
          language: SPEECH_LANGUAGE[speechLanguage],
          onDone: () => {
            if (requestIdRef.current === requestId) {
              setSpeakingId(null);
            }
          },
          onError: () => {
            if (requestIdRef.current === requestId) {
              setSpeakingId(null);
              showErrorToast(
                t("offlineSpeakErrorTitle"),
                t("offlineSpeakErrorDescription"),
              );
            }
          },
          onStart: () => {
            if (requestIdRef.current === requestId) {
              setSpeakingId(id);
            }
          },
          onStopped: () => {
            if (requestIdRef.current === requestId) {
              setSpeakingId(null);
            }
          },
          pitch: 1,
          rate: speechLanguage === "ur" ? 0.88 : 0.94,
          useApplicationAudioSession: false,
          voice: voice?.identifier,
          volume: 1,
        });
      } catch {
        setSpeakingId(null);
        showErrorToast(
          t("offlineSpeakErrorTitle"),
          t("offlineSpeakErrorDescription"),
        );
      } finally {
        busyRef.current = false;
      }
    },
    [language, speakingId, stop, t],
  );

  return { speakingId, stop, toggle };
}
