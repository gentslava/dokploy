import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { useTranslation } from "next-i18next";

export type TimeFilter = "all" | "1h" | "6h" | "24h" | "168h" | "720h";

const createTimeRanges = (
	t: any,
): Array<{ label: string; value: TimeFilter }> =>
	[
		{
			label: t("dashboard.docker.logs.timeRanges.allTime"),
			value: "all",
		},
		{
			label: t("dashboard.docker.logs.timeRanges.lastHour"),
			value: "1h",
		},
		{
			label: t("dashboard.docker.logs.timeRanges.last6Hours"),
			value: "6h",
		},
		{
			label: t("dashboard.docker.logs.timeRanges.last24Hours"),
			value: "24h",
		},
		{
			label: t("dashboard.docker.logs.timeRanges.last7Days"),
			value: "168h",
		},
		{
			label: t("dashboard.docker.logs.timeRanges.last30Days"),
			value: "720h",
		},
	] as const;

interface SinceLogsFilterProps {
	value: TimeFilter;
	onValueChange: (value: TimeFilter) => void;
	showTimestamp: boolean;
	onTimestampChange: (show: boolean) => void;
	title?: string;
}

export function SinceLogsFilter({
	value,
	onValueChange,
	showTimestamp,
	onTimestampChange,
	title,
}: SinceLogsFilterProps) {
	const { t } = useTranslation("dashboard");
	const timeRanges = createTimeRanges(t);
	const defaultTitle = t("dashboard.docker.logs.timeRange");
	const selectedLabel =
		timeRanges.find((range) => range.value === value)?.label ??
		t("dashboard.docker.logs.selectTimeRange");

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="h-9 bg-input text-sm placeholder-gray-400 w-full sm:w-auto"
				>
					{title || defaultTitle}
					<Separator orientation="vertical" className="mx-2 h-4" />
					<div className="space-x-1 flex">
						<Badge variant="blank" className="rounded-sm px-1 font-normal">
							{selectedLabel}
						</Badge>
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandList>
						<CommandGroup>
							{timeRanges.map((range) => {
								const isSelected = value === range.value;
								return (
									<CommandItem
										key={range.value}
										onSelect={() => {
											if (!isSelected) {
												onValueChange(range.value);
											}
										}}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible",
											)}
										>
											<CheckIcon className={cn("h-4 w-4")} />
										</div>
										<span className="text-sm">{range.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
					</CommandList>
				</Command>
				<Separator className="my-2" />
				<div className="p-2 flex items-center justify-between">
					<span className="text-sm">
						{t("dashboard.docker.logs.showTimestamps")}
					</span>
					<Switch checked={showTimestamp} onCheckedChange={onTimestampChange} />
				</div>
			</PopoverContent>
		</Popover>
	);
}
