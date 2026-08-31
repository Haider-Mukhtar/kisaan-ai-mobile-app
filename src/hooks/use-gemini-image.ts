import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import { GEMINI_LIVE_CONFIG } from "@/services/gemini/config";
import type {
  GeminiErrorCode,
  PendingImage,
} from "@/services/gemini/types";

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type Options = {
  onError: (code: GeminiErrorCode) => void;
};

export function useGeminiImage({ onError }: Options) {
  const [image, setImage] = useState<PendingImage | null>(null);

  const acceptResult = useCallback(
    (result: ImagePicker.ImagePickerResult | ImagePicker.ImagePickerErrorResult | null) => {
      if (!result || "code" in result || result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri || !asset.base64) {
        onError("image-unavailable");
        return;
      }

      const mimeType = asset.mimeType?.toLowerCase() || "image/jpeg";
      if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) {
        onError("image-unsupported");
        return;
      }

      const estimatedBytes =
        asset.fileSize ?? Math.ceil((asset.base64.length * 3) / 4);
      if (estimatedBytes > GEMINI_LIVE_CONFIG.maxImageBytes) {
        onError("image-too-large");
        return;
      }

      setImage({
        base64: asset.base64,
        fileSize: asset.fileSize ?? null,
        mimeType,
        uri: asset.uri,
      });
    },
    [onError],
  );

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void ImagePicker.getPendingResultAsync()
      .then(acceptResult)
      .catch(() => undefined);
  }, [acceptResult]);

  const chooseFromLibrary = useCallback(async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        onError("image-permission");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: false,
        base64: true,
        mediaTypes: ["images"],
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.65,
        selectionLimit: 1,
      });
      acceptResult(result);
    } catch {
      onError("image-unavailable");
    }
  }, [acceptResult, onError]);

  const takePhoto = useCallback(async () => {
    if (Platform.OS === "web") {
      onError("image-unavailable");
      return;
    }

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        onError("image-permission");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        base64: true,
        cameraType: ImagePicker.CameraType.back,
        mediaTypes: ["images"],
        quality: 0.65,
      });
      acceptResult(result);
    } catch {
      onError("image-unavailable");
    }
  }, [acceptResult, onError]);

  return {
    chooseFromLibrary,
    clearImage: useCallback(() => setImage(null), []),
    image,
    takePhoto,
  };
}
