import { Search } from "lucide-react-native";
import { forwardRef, type ReactNode } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
  type StyleProp,
  View,
  type ViewStyle
} from "react-native";

import { colors, fontSizes, fontWeights, radii, spacing } from "@/theme";

import { AppText } from "./AppText";

type TextFieldProps = Omit<TextInputProps, "placeholderTextColor" | "style"> & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  error?: boolean;
  inputStyle?: StyleProp<TextStyle>;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, containerStyle, error = false, inputStyle, multiline, ...props },
  ref
) {
  return (
    <View style={[styles.field, containerStyle]}>
      {label ? <AppText variant="fieldLabel">{label}</AppText> : null}
      <TextInput
        ref={ref}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : null, multiline ? styles.multiline : null, inputStyle]}
        {...props}
      />
    </View>
  );
});

export function SearchField({
  value,
  onChangeText,
  placeholder,
  style,
  icon
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  style?: ViewStyle;
  icon?: ReactNode;
}) {
  return (
    <View style={[styles.searchBox, style]}>
      {icon ?? <Search color={colors.muted} size={18} />}
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.searchInput}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing[6]
  },
  input: {
    backgroundColor: colors.surfaceInput,
    borderColor: colors.sage,
    borderRadius: radii.lg,
    borderWidth: 2,
    color: colors.text,
    fontSize: fontSizes[16],
    minHeight: spacing[56],
    paddingHorizontal: spacing[16]
  },
  inputError: {
    borderColor: colors.danger
  },
  multiline: {
    minHeight: 92,
    paddingTop: spacing[12],
    textAlignVertical: "top"
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.surfaceInput,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[8],
    minHeight: 46,
    paddingHorizontal: spacing[14]
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: fontSizes[15],
    fontWeight: fontWeights.bold,
    minWidth: 0
  }
});
