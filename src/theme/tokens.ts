/** Shared visual foundations for the operational workspace. */
export const Theme = {
  color: {
    canvas: "#F4F5F7", surface: "#FFFFFF", subtle: "#F8F9FB",
    ink: "#17212F", muted: "#596575", border: "#DEE3E9",
    primary: "#244F80", primaryHover: "#193D65", selected: "#EAF0F7",
    navigation: "#172331",
  },
  font: { regular: "WorksansRegular", medium: "WorksansMedium", semibold: "WorksansSemiBold", bold: "WorksansBold" },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { control: 6, panel: 8 },
} as const;
