import React, { useState } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../useTheme';

// Brand-consistent text field: grey idle (from style), blue focus border
// + blue cursor on iOS/Android/web. Single place so profile, search,
// chat, and auth all match — never black.
export function Field(props: TextInputProps) {
  const { p } = useTheme();
  const [focused, setFocused] = useState(false);
  const { style, placeholderTextColor, selectionColor, onFocus, onBlur, ...rest } = props;
  return (
    <TextInput
      {...rest}
      placeholderTextColor={placeholderTextColor ?? p.bodyText}
      selectionColor={selectionColor ?? p.primary}
      {...({ cursorColor: p.primary } as object)}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      style={[
        style,
        focused
          ? ({ borderColor: p.primary, borderWidth: 2, outlineColor: p.primary } as object)
          : null,
      ]}
    />
  );
}
