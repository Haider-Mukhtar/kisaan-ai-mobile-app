import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";

type MandiCropImageProps = {
  name: string;
  size: number;
  uri: string | null;
};

export function MandiCropImage({ name, size, uri }: MandiCropImageProps) {
  const { colors } = useThemeManager();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View
      style={[
        styles.frame,
        {
          backgroundColor: colors.muted,
          borderRadius: Math.round(size * 0.27),
          height: size,
          width: size,
        },
      ]}
    >
      {showImage ? (
        <Image
          accessibilityLabel={name}
          contentFit="cover"
          onError={() => setFailed(true)}
          source={{ uri: uri as string }}
          style={styles.image}
          transition={150}
        />
      ) : (
        <AppText style={{ fontSize: Math.round(size * 0.42) }}>🌾</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
});
