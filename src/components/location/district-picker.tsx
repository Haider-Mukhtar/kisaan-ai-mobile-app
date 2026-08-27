import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { AppTextInput } from "@/components/ui/app-text-input";
import {
  getDistrictName,
  PROVINCE_LABEL_KEYS,
  searchDistricts,
  type District,
  type ProvinceId,
} from "@/constants/districts";
import useThemeManager from "@/hooks/use-theme-manager";
import { useLanguage } from "@/providers/language-provider";

type DistrictPickerProps = {
  selectedId: string | null;
  onSelect: (district: District) => void;
};

type ProvinceGroup = {
  province: ProvinceId;
  districts: District[];
};

function groupByProvince(districts: District[]): ProvinceGroup[] {
  const groups: ProvinceGroup[] = [];

  for (const district of districts) {
    const current = groups.at(-1);

    if (current?.province === district.province) {
      current.districts.push(district);
      continue;
    }

    groups.push({ province: district.province, districts: [district] });
  }

  return groups;
}

/**
 * Rendered as a plain list rather than a FlatList: it lives inside the scroll
 * view of the screen that hosts it, and the district set is small and fixed.
 */
export function DistrictPicker({ selectedId, onSelect }: DistrictPickerProps) {
  const { colors } = useThemeManager();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");

  const groups = useMemo(
    () => groupByProvince(searchDistricts(query)),
    [query],
  );

  return (
    <View>
      <AppTextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setQuery}
        placeholder={t("locationSearchPlaceholder")}
        returnKeyType="search"
        value={query}
      />

      {groups.length === 0 ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <AppText style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t("locationSearchEmpty")}
          </AppText>
        </View>
      ) : null}

      {groups.map((group) => (
        <View key={group.province} style={styles.group}>
          <AppText
            variant="label"
            style={[styles.groupTitle, { color: colors.mutedForeground }]}
          >
            {t(PROVINCE_LABEL_KEYS[group.province])}
          </AppText>

          {group.districts.map((district) => {
            const isSelected = district.id === selectedId;

            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                key={district.id}
                onPress={() => onSelect(district)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.card,
                    borderColor: isSelected ? colors.primaryDark : colors.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <AppText
                  variant="label"
                  style={[styles.rowLabel, { color: colors.foreground }]}
                >
                  {getDistrictName(district, language)}
                </AppText>

                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : "transparent",
                      borderColor: isSelected ? colors.primaryDark : colors.border,
                    },
                  ]}
                >
                  {isSelected ? (
                    <AppText
                      style={[styles.checkMark, { color: colors.primaryForeground }]}
                    >
                      ✓
                    </AppText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
    padding: 16,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 24,
  },
  group: {
    marginTop: 20,
  },
  groupTitle: {
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 8,
  },
  row: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 8,
    minHeight: 58,
    paddingHorizontal: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 28,
  },
  check: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    marginStart: 12,
    width: 24,
  },
  checkMark: {
    fontSize: 13,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
});
