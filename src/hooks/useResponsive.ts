import { useWindowDimensions } from "react-native";

export default function useResponsive() {
    const { width } = useWindowDimensions();
    const isMobile = width < 600;
    const maxCardWidth = isMobile
        ? 440
        : 1100;
    const graphWidth = isMobile /* tem que ficar dentro do component que cria o card */
        ? Math.min(maxCardWidth
            - 56 /* = padding subtraído */
            - 5 /* = intialSpacing subtraído*/
            - 20 /* = yAxisLabelWidth subtraído */
            , 379 /* já com as subtrações */
        )
        : Math.min(maxCardWidth
            - 56 /* = padding subtraído */
            - 5 /* = intialSpacing subtraído*/
            - 20 /* = yAxisLabelWidth subtraído */
            , 1041 /* já com as substrações */
        );

    return {
        width,
        isMobile,
        maxCardWidth,
        graphWidth
    };
};