import { DialogAction } from "@/components/shared/dialog-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import {
	ClipboardList,
	Clock,
	Loader2,
	Play,
	Terminal,
	Trash2,
} from "lucide-react";
import { useTranslation } from "next-i18next";
import { toast } from "sonner";
import { ShowDeploymentsModal } from "../deployments/show-deployments-modal";
import { HandleSchedules } from "./handle-schedules";

interface Props {
	id: string;
	scheduleType?: "application" | "compose" | "server" | "dokploy-server";
}

export const ShowSchedules = ({ id, scheduleType = "application" }: Props) => {
	const { t } = useTranslation("dashboard");
	const {
		data: schedules,
		isLoading: isLoadingSchedules,
		refetch: refetchSchedules,
	} = api.schedule.list.useQuery(
		{
			id: id || "",
			scheduleType,
		},
		{
			enabled: !!id,
		},
	);

	const utils = api.useUtils();

	const { mutateAsync: deleteSchedule, isLoading: isDeleting } =
		api.schedule.delete.useMutation();

	const { mutateAsync: runManually, isLoading } =
		api.schedule.runManually.useMutation();

	return (
		<Card className="border px-6 shadow-none bg-transparent h-full min-h-[50vh]">
			<CardHeader className="px-0">
				<div className="flex justify-between items-center">
					<div className="flex flex-col gap-2">
						<CardTitle className="text-xl font-bold flex items-center gap-2">
							{t("dashboard.schedule.scheduledTasks")}
						</CardTitle>
						<CardDescription>
							{t("dashboard.schedule.scheduleTasksDescription")}
						</CardDescription>
					</div>

					{schedules && schedules.length > 0 && (
						<HandleSchedules id={id} scheduleType={scheduleType} />
					)}
				</div>
			</CardHeader>
			<CardContent className="px-0">
				{isLoadingSchedules ? (
					<div className="flex gap-4   w-full items-center justify-center text-center mx-auto min-h-[45vh]">
						<Loader2 className="size-4 text-muted-foreground/70 transition-colors animate-spin self-center" />
						<span className="text-sm text-muted-foreground/70">
							{t("dashboard.schedule.loadingScheduledTasks")}
						</span>
					</div>
				) : schedules && schedules.length > 0 ? (
					<div className="grid xl:grid-cols-2 gap-4 grid-cols-1 h-full">
						{schedules.map((schedule) => {
							const serverId =
								schedule.serverId ||
								schedule.application?.serverId ||
								schedule.compose?.serverId;
							return (
								<div
									key={schedule.scheduleId}
									className="flex items-center justify-between rounded-lg border p-3 transition-colors bg-muted/50"
								>
									<div className="flex items-start gap-3">
										<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5">
											<Clock className="size-4 text-primary/70" />
										</div>
										<div className="space-y-1.5">
											<div className="flex items-center gap-2">
												<h3 className="text-sm font-medium leading-none">
													{schedule.name}
												</h3>
												<Badge
													variant={schedule.enabled ? "default" : "secondary"}
													className="text-[10px] px-1 py-0"
												>
													{schedule.enabled
														? t("dashboard.schedule.enabled")
														: t("dashboard.schedule.disabled")}
												</Badge>
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<Badge
													variant="outline"
													className="font-mono text-[10px] bg-transparent"
												>
													{t("dashboard.schedule.cron")}:{" "}
													{schedule.cronExpression}
												</Badge>
												{schedule.scheduleType !== "server" &&
													schedule.scheduleType !== "dokploy-server" && (
														<>
															<span className="text-xs text-muted-foreground/50">
																•
															</span>
															<Badge
																variant="outline"
																className="font-mono text-[10px] bg-transparent"
															>
																{schedule.shellType}
															</Badge>
														</>
													)}
											</div>
											{schedule.command && (
												<div className="flex items-center gap-2">
													<Terminal className="size-3.5 text-muted-foreground/70" />
													<code className="font-mono text-[10px] text-muted-foreground/70">
														{schedule.command}
													</code>
												</div>
											)}
										</div>
									</div>

									<div className="flex items-center gap-1.5">
										<ShowDeploymentsModal
											id={schedule.scheduleId}
											type="schedule"
											serverId={serverId || undefined}
										>
											<Button variant="ghost" size="icon">
												<ClipboardList className="size-4  transition-colors " />
											</Button>
										</ShowDeploymentsModal>

										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														isLoading={isLoading}
														onClick={async () => {
															toast.success(
																t("dashboard.schedule.scheduleRunSuccessfully"),
															);

															await runManually({
																scheduleId: schedule.scheduleId,
															})
																.then(async () => {
																	await new Promise((resolve) =>
																		setTimeout(resolve, 1500),
																	);
																	refetchSchedules();
																})
																.catch(() => {
																	toast.error(
																		t(
																			"dashboard.schedule.errorRunningSchedule",
																		),
																	);
																});
														}}
													>
														<Play className="size-4  transition-colors" />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{t("dashboard.schedule.runManualSchedule")}
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>

										<HandleSchedules
											scheduleId={schedule.scheduleId}
											id={id}
											scheduleType={scheduleType}
										/>

										<DialogAction
											title={t("dashboard.schedule.deleteSchedule")}
											description={t(
												"dashboard.schedule.deleteScheduleDescription",
											)}
											type="destructive"
											onClick={async () => {
												await deleteSchedule({
													scheduleId: schedule.scheduleId,
												})
													.then(async () => {
														await utils.schedule.list.invalidate({
															id,
															scheduleType,
														});
														toast.success(
															t(
																"dashboard.schedule.scheduleDeletedSuccessfully",
															),
														);
													})
													.catch(() => {
														toast.error(
															t("dashboard.schedule.errorDeletingSchedule"),
														);
													});
											}}
										>
											<Button
												variant="ghost"
												size="icon"
												className="group hover:bg-red-500/10 "
												isLoading={isDeleting}
											>
												<Trash2 className="size-4 text-primary group-hover:text-red-500" />
											</Button>
										</DialogAction>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center gap-3 min-h-[45vh]">
						<Clock className="size-8 text-muted-foreground" />
						<span className="text-base text-muted-foreground">
							{t("dashboard.schedule.noScheduledTasks")}
						</span>
						<HandleSchedules id={id} scheduleType={scheduleType} />
					</div>
				)}
			</CardContent>
		</Card>
	);
};
