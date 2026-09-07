import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { BlogCard } from "@/components/blogs/blog-card";
import { AppText } from "@/components/ui/app-text";
import useThemeManager from "@/hooks/use-theme-manager";
import { useBlogs } from "@/hooks/use-blogs";
import { useLanguage } from "@/providers/language-provider";

export default function BlogsScreen() {
  const { colors } = useThemeManager();
  const { articles, isRefreshing, refresh, status } = useBlogs();
  const { t } = useLanguage();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          colors={[colors.primaryDark]}
          onRefresh={() => void refresh()}
          refreshing={isRefreshing}
          tintColor={colors.primaryDark}
        />
      }
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: colors.background }}
    >
      <AppText style={[styles.intro, { color: colors.mutedForeground }]}>
        {t("blogsIntro")}
      </AppText>

      {articles.length > 0 ? (
        <View style={styles.list}>
          {articles.map((article, index) => (
            <BlogCard
              article={article}
              featured={index === 0}
              index={index}
              key={article.slug}
            />
          ))}
        </View>
      ) : (
        <View style={[styles.state, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AppText style={styles.stateIcon}>{status === "loading" ? "🌱" : "📡"}</AppText>
          <AppText style={[styles.stateTitle, { color: colors.foreground }]} variant="label">
            {t(status === "loading" ? "blogsLoadingTitle" : "blogsErrorTitle")}
          </AppText>
          <AppText style={[styles.stateBody, { color: colors.mutedForeground }]}>
            {t(status === "loading" ? "blogsLoadingBody" : "blogsErrorBody")}
          </AppText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingBottom: 36, paddingHorizontal: 20, paddingTop: 16 },
  intro: { fontSize: 14, lineHeight: 25 },
  list: { gap: 12 },
  state: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 22,
    borderWidth: 1,
    padding: 28,
  },
  stateIcon: { fontSize: 38, lineHeight: 50 },
  stateTitle: { fontSize: 17, lineHeight: 28, paddingTop: 6 },
  stateBody: { fontSize: 14, lineHeight: 25, paddingTop: 4, textAlign: "center" },
});
