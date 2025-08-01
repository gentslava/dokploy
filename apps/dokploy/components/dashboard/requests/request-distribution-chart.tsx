import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { api } from "@/utils/api";
import { useTranslation } from "next-i18next";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	XAxis,
	YAxis,
} from "recharts";

export interface RequestDistributionChartProps {
	dateRange?: {
		from: Date | undefined;
		to: Date | undefined;
	};
}

export const RequestDistributionChart = ({
	dateRange,
}: RequestDistributionChartProps) => {
	const { t } = useTranslation("dashboard");
	const chartConfig = {
		views: {
			label: t("dashboard.requests.pageViews"),
		},
		count: {
			label: t("dashboard.requests.count"),
			color: "hsl(var(--chart-1))",
		},
	} satisfies ChartConfig;

	const { data: stats } = api.settings.readStats.useQuery(
		{
			dateRange: dateRange
				? {
						start: dateRange.from?.toISOString(),
						end: dateRange.to?.toISOString(),
					}
				: undefined,
		},
		{
			refetchInterval: 1333,
		},
	);

	return (
		<ResponsiveContainer width="100%" height={200}>
			<ChartContainer config={chartConfig}>
				<AreaChart
					accessibilityLayer
					data={stats || []}
					margin={{
						left: 12,
						right: 12,
					}}
				>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="hour"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tickFormatter={(value) =>
							new Date(value).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							})
						}
					/>
					<YAxis tickLine={false} axisLine={false} tickMargin={8} />
					<ChartTooltip
						cursor={false}
						content={<ChartTooltipContent indicator="line" />}
						labelFormatter={(value) =>
							new Date(value).toLocaleString([], {
								month: "short",
								day: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})
						}
					/>
					<Area
						dataKey="count"
						type="natural"
						fill="hsl(var(--chart-1))"
						fillOpacity={0.4}
						stroke="hsl(var(--chart-1))"
					/>
				</AreaChart>
			</ChartContainer>
		</ResponsiveContainer>
	);
};
