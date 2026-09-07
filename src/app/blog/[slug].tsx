import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Pressable } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Fonts } from "@/constants/theme";
import useThemeManager from "@/hooks/use-theme-manager";
import { useBlogs } from "@/hooks/use-blogs";
import { useLanguage } from "@/providers/language-provider";
import type { BlogBlock, BlogLanguage } from "@/services/blogs/types";

function formatDate(value: string, language: BlogLanguage) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(language === "ur" ? "ur-PK" : "en-PK", {
    dateStyle: "long",
  });
}

export default function BlogDetailsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useThemeManager();
  const { articles, status } = useBlogs();
  const appLanguage = useLanguage();
  const [language, setLanguage] = useState<BlogLanguage>(appLanguage.language);
  const article = useMemo(
    () => articles.find((item) => item.slug === slug),
    [articles, slug],
  );

  if (!article) {
    return (
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.missingContent}
        style={{ backgroundColor: colors.background }}
      >
        <View style={[styles.missing, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText style={styles.missingIcon}>{status === "loading" ? "🌱" : "ℹ️"}</AppText>
          <AppText style={[styles.missingTitle, { color: colors.foreground }]} variant="label">
            {appLanguage.t(status === "loading" ? "blogsLoadingTitle" : "blogMissingTitle")}
          </AppText>
          <AppText style={[styles.missingBody, { color: colors.mutedForeground }]}>
            {appLanguage.t(status === "loading" ? "blogsLoadingBody" : "blogMissingBody")}
          </AppText>
        </View>
      </ScrollView>
    );
  }

  const visibleLanguage =
    article.content[language].length > 0
      ? language
      : language === "en"
        ? "ur"
        : "en";
  const isUrdu = visibleLanguage === "ur";
  const fontFamily = isUrdu ? Fonts.notoNaskhArabic : Fonts.interRegular;
  const titleFont = isUrdu ? Fonts.notoNastaliqUrdu : Fonts.interSemiBold;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background }}
    >
      {article.imageUrl ? (
        <Image
          accessibilityLabel={article.titles[visibleLanguage]}
          cachePolicy="memory-disk"
          contentFit="cover"
          source={article.imageUrl}
          style={[styles.banner, { backgroundColor: colors.muted }]}
          transition={200}
        />
      ) : null}

      <View style={styles.header}>
        <AppText
          selectable
          style={[
            styles.title,
            {
              color: colors.foreground,
              fontFamily: titleFont,
              textAlign: isUrdu ? "right" : "left",
              writingDirection: isUrdu ? "rtl" : "ltr",
            },
          ]}
          variant="title"
        >
          {article.titles[visibleLanguage]}
        </AppText>
        <AppText
          style={[
            styles.meta,
            {
              color: colors.mutedForeground,
              fontFamily,
              textAlign: isUrdu ? "right" : "left",
              writingDirection: isUrdu ? "rtl" : "ltr",
            },
          ]}
        >
          {[formatDate(article.publishedAt, visibleLanguage), article.author].filter(Boolean).join(" · ")}
        </AppText>

        <View
          accessibilityRole="tablist"
          style={[styles.languageSwitch, { backgroundColor: colors.muted }]}
        >
          {(["en", "ur"] as const).map((option) => {
            const selected = visibleLanguage === option;
            const disabled = article.content[option].length === 0;

            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ disabled, selected }}
                disabled={disabled}
                key={option}
                onPress={() => setLanguage(option)}
                style={[
                  styles.languageButton,
                  selected && { backgroundColor: colors.card },
                  disabled && { opacity: 0.4 },
                ]}
              >
                <AppText
                  style={[
                    styles.languageLabel,
                    {
                      color: selected ? colors.foreground : colors.mutedForeground,
                      fontFamily: option === "ur" ? Fonts.notoSansArabic : Fonts.interSemiBold,
                      textAlign: "center",
                      writingDirection: option === "ur" ? "rtl" : "ltr",
                    },
                  ]}
                  variant="label"
                >
                  {option === "en" ? "English" : "اردو"}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.article}>
        {article.content[visibleLanguage].map((block) => (
          <ArticleBlock block={block} key={block.id} language={visibleLanguage} />
        ))}
      </View>
    </ScrollView>
  );
}

function ArticleBlock({ block, language }: { block: BlogBlock; language: BlogLanguage }) {
  const { colors } = useThemeManager();
  const isUrdu = language === "ur";
  const sharedStyle = {
    color: colors.foreground,
    fontFamily: isUrdu ? Fonts.notoNaskhArabic : Fonts.interRegular,
    textAlign: isUrdu ? ("right" as const) : ("left" as const),
    writingDirection: isUrdu ? ("rtl" as const) : ("ltr" as const),
  };

  if (block.type === "heading") {
    const major = (block.level ?? 3) <= 2;
    return (
      <AppText
        selectable
        style={[
          major ? styles.headingMajor : styles.headingMinor,
          sharedStyle,
          { fontFamily: isUrdu ? Fonts.notoNastaliqUrdu : Fonts.interSemiBold },
        ]}
        variant="title"
      >
        {block.text}
      </AppText>
    );
  }

  if (block.type === "list-item") {
    return (
      <View style={[styles.listRow, { flexDirection: isUrdu ? "row-reverse" : "row" }]}>
        <AppText style={[styles.bullet, sharedStyle]}>•</AppText>
        <AppText selectable style={[styles.paragraph, styles.listText, sharedStyle]}>
          {block.text}
        </AppText>
      </View>
    );
  }

  if (block.type === "quote") {
    return (
      <View
        style={[
          styles.quote,
          {
            backgroundColor: colors.muted,
            borderLeftColor: colors.primaryDark,
            borderLeftWidth: isUrdu ? 0 : 3,
            borderRightColor: colors.primaryDark,
            borderRightWidth: isUrdu ? 3 : 0,
          },
        ]}
      >
        <AppText selectable style={[styles.paragraph, sharedStyle]}>{block.text}</AppText>
      </View>
    );
  }

  return <AppText selectable style={[styles.paragraph, sharedStyle]}>{block.text}</AppText>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  banner: { aspectRatio: 1.5, width: "100%" },
  header: { gap: 10, paddingHorizontal: 20, paddingTop: 22 },
  title: { fontSize: 25, lineHeight: 40 },
  meta: { fontSize: 13, lineHeight: 22 },
  languageSwitch: {
    alignSelf: "stretch",
    borderCurve: "continuous",
    borderRadius: 14,
    flexDirection: "row",
    padding: 3,
  },
  languageButton: {
    borderCurve: "continuous",
    borderRadius: 11,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageLabel: { fontSize: 13, lineHeight: 22 },
  article: { gap: 12, paddingHorizontal: 20, paddingTop: 24 },
  headingMajor: { fontSize: 21, lineHeight: 36, paddingTop: 12 },
  headingMinor: { fontSize: 18, lineHeight: 31, paddingTop: 8 },
  paragraph: { fontSize: 15, lineHeight: 28 },
  listRow: { alignItems: "flex-start", gap: 9 },
  bullet: { fontSize: 18, lineHeight: 28 },
  listText: { flex: 1 },
  quote: { borderRadius: 12, padding: 14 },
  missingContent: { flexGrow: 1, justifyContent: "center", padding: 20 },
  missing: { alignItems: "center", borderRadius: 22, borderWidth: 1, padding: 26 },
  missingIcon: { fontSize: 38, lineHeight: 50 },
  missingTitle: { fontSize: 17, lineHeight: 28, paddingTop: 6 },
  missingBody: { fontSize: 14, lineHeight: 25, paddingTop: 4, textAlign: "center" },
});
