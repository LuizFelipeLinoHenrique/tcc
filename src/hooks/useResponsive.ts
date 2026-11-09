import { useWindowDimensions } from "react-native";

/** Available workspace width excludes the persistent desktop navigation. */
export default function useResponsive() {
    const { width: windowWidth } = useWindowDimensions();
    const width = windowWidth >= 1000 ? windowWidth - 236 : windowWidth;
    const isMobile = width < 760;
    const maxCardWidth = Math.min(width - 40, 1280);
    const graphWidth = Math.max(100, maxCardWidth - 81);
    return { width, isMobile, maxCardWidth, graphWidth };
}
