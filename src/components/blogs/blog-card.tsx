import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";
import type { BlogArticle } from "@/services/blogs/types";

function formatDate(value: string, language: "en" | "ur") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(language === "ur" ? "ur-PK" : "en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type BlogCardProps = {
  article: BlogArticle;
  featured?: boolean;
  index: number;
};

export function BlogCard({ article, featured = false, index }: BlogCardProps) {
  const { colors } = useThemeManager();
  const { isRTL, language, t } = useLanguage();
  const router = useRouter();

  const image = article.imageUrl ? (
    <Image
      accessibilityLabel={article.titles[language]}
      cachePolicy="memory-disk"
      contentFit="cover"
      recyclingKey={article.slug}
      source={article.imageUrl}
      style={[
        featured ? styles.featuredImage : styles.compactImage,
        { backgroundColor: colors.muted },
      ]}
      transition={180}
    />
  ) : (
    <View
      style={[
        featured ? styles.featuredImage : styles.compactImage,
        styles.placeholder,
        { backgroundColor: colors.muted },
      ]}
    >
      <AppText style={featured ? styles.featuredPlaceholderIcon : styles.placeholderIcon}>
        🌾
      </AppText>
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).duration(360)}>
      <Pressable
        accessibilityHint={t("blogOpenHint")}
        accessibilityRole="button"
        android_ripple={{ color: colors.muted }}
        onPress={() =>
          router.push({ pathname: "/blog/[slug]", params: { slug: article.slug } })
        }
        style={({ pressed }) => [
          styles.card,
          featured ? styles.featuredCard : styles.compactCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.86 : 1,
          },
        ]}
      >
          {featured ? (
            <View style={styles.featuredMedia}>
              {image}
              <View style={styles.latestBadge}>
                <AppText style={styles.latestBadgeText} variant="label">
                  {t("blogLatestBadge")}
                </AppText>
              </View>
            </View>
          ) : (
            image
          )}

          <View style={featured ? styles.featuredBody : styles.compactBody}>
            <View style={styles.metaRow}>
              <AppText style={[styles.meta, { color: colors.primaryDark }]} variant="label">
                {formatDate(article.publishedAt, language)}
              </AppText>
              {article.author ? (
                <>
                  <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
                  <AppText
                    numberOfLines={1}
                    style={[styles.author, { color: colors.mutedForeground }]}
                  >
                    {article.author}
                  </AppText>
                </>
              ) : null}
            </View>

            <AppText
              numberOfLines={featured ? 3 : 4}
              style={[
                featured ? styles.featuredTitle : styles.compactTitle,
                { color: colors.foreground },
              ]}
              variant="title"
            >
              {article.titles[language]}
            </AppText>

            <View style={styles.actionRow}>
              <AppText style={[styles.read, { color: colors.primaryDark }]} variant="label">
                {t("blogReadArticle")}
              </AppText>
              <View style={[styles.arrowCircle, { backgroundColor: colors.primary }]}> 
                <AppText style={[styles.arrow, { color: colors.primaryForeground }]}> 
                  {isRTL ? "‹" : "›"}
                </AppText>
              </View>
            </View>
          </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.055)",
    overflow: "hidden",
  },
  featuredCard: {},
  compactCard: { flexDirection: "row", minHeight: 154, padding: 8 },
  featuredMedia: { position: "relative" },
  featuredImage: { aspectRatio: 1.65, width: "100%" },
  compactImage: {
    borderCurve: "continuous",
    borderRadius: 14,
    height: 138,
    width: 116,
  },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderIcon: { fontSize: 30, lineHeight: 40 },
  featuredPlaceholderIcon: { fontSize: 44, lineHeight: 56 },
  latestBadge: {
    backgroundColor: "rgba(13, 92, 57, 0.92)",
    borderRadius: 99,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: 12,
  },
  latestBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    letterSpacing: 0.6,
    lineHeight: 15,
    textAlign: "center",
    textTransform: "uppercase",
  },
  featuredBody: { gap: 9, padding: 16 },
  compactBody: { flex: 1, gap: 7, justifyContent: "center", paddingHorizontal: 13, paddingVertical: 6 },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  meta: { fontSize: 10, lineHeight: 17 },
  metaDot: { borderRadius: 2, height: 3, width: 3 },
  author: { flexShrink: 1, fontSize: 10, lineHeight: 17 },
  featuredTitle: { fontSize: 19, lineHeight: 31 },
  compactTitle: { fontSize: 15, lineHeight: 24 },
  actionRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  read: { fontSize: 11, lineHeight: 18 },
  arrowCircle: {
    alignItems: "center",
    borderRadius: 11,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  arrow: { fontSize: 17, lineHeight: 19, textAlign: "center" },
});
