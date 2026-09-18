import { Text } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { pagesStyles } from "./ScreensLayout";

export type LineGraphProps = {
    title: string;
    data: any[];
    width: number;
    maxValue: number;
    spacing: number;
    noOfSections: number;
}

export function LineGraph({ title, data, width, maxValue, spacing, noOfSections }: LineGraphProps) {
    return (
        <>
            <Text style={pagesStyles.graphTitle}>
                {title}
            </Text>
            <LineChart
                isAnimated
                curved
                areaChart
                rotateLabel
                width={width}
                data={data}
                maxValue={maxValue}
                color="#65442F"
                startFillColor={"#65442F"}
                endFillColor={"#79553D"}
                startOpacity={0.9}
                endOpacity={0.0}
                noOfSections={noOfSections}
                animateOnDataChange
                animationDuration={1500}
                onDataChangeAnimationDuration={500}
                yAxisTextStyle={{ color: "lightgray" }}
                hideDataPoints
                spacing={spacing}
                rulesColor="transparent"
                rulesType="solid"
                initialSpacing={5}
                yAxisThickness={0}
                yAxisLabelWidth={20}
                xAxisThickness={0}
                xAxisLabelTextStyle={pagesStyles.label}
                xAxisLabelsHeight={25}
            />
        </>
    );
};