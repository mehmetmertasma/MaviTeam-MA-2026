import { useWindowDimensions } from "react-native";

import { Breakpoints } from "@/constants/theme";

// Single source of truth for "what size screen is this" across the app.
// Anything that needs to change layout between phone / tablet / web-desktop
// widths should read from this instead of hardcoding its own width checks.
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= Breakpoints.desktop;
  const isTablet = width >= Breakpoints.tablet && width < Breakpoints.desktop;
  const isMobile = width < Breakpoints.tablet;

  return { width, height, isMobile, isTablet, isDesktop };
}

export default useResponsive;