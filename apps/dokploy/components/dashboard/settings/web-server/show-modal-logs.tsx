import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";
import { Loader2 } from "lucide-react";
import { useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import type React from "react";
import { useEffect, useState } from "react";
import { badgeStateColor } from "../../application/logs/show";

export const DockerLogsId = dynamic(
	() =>
		import("@/components/dashboard/docker/logs/docker-logs-id").then(
			(e) => e.DockerLogsId,
		),
	{
		ssr: false,
	},
);

interface Props {
	appName: string;
	children?: React.ReactNode;
	serverId?: string;
	type?: "standalone" | "swarm";
}

export const ShowModalLogs = ({
	appName,
	children,
	serverId,
	type = "swarm",
}: Props) => {
	const { t } = useTranslation("settings");
	const { data, isLoading } = api.docker.getContainersByAppLabel.useQuery(
		{
			appName,
			serverId,
			type,
		},
		{
			enabled: !!appName,
		},
	);
	const [containerId, setContainerId] = useState<string | undefined>();

	useEffect(() => {
		if (data && data?.length > 0) {
			setContainerId(data[0]?.containerId);
		}
	}, [data]);
	return (
		<Dialog>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="max-h-[85vh]  sm:max-w-7xl">
				<DialogHeader>
					<DialogTitle>
						{t("settings.webServer.showModalLogs.title")}
					</DialogTitle>
					<DialogDescription>
						{t("settings.webServer.showModalLogs.description")} {appName}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 pt-2.5">
					<Label>{t("settings.webServer.showModalLogs.selectContainer")}</Label>
					<Select onValueChange={setContainerId} value={containerId}>
						<SelectTrigger>
							{isLoading ? (
								<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground">
									<span>{t("settings.webServer.showModalLogs.loading")}</span>
									<Loader2 className="animate-spin size-4" />
								</div>
							) : (
								<SelectValue
									placeholder={t(
										"settings.webServer.showModalLogs.selectContainer",
									)}
								/>
							)}
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{data?.map((container) => (
									<SelectItem
										key={container.containerId}
										value={container.containerId}
									>
										{container.name} ({container.containerId}){" "}
										<Badge variant={badgeStateColor(container.state)}>
											{container.state}
										</Badge>
									</SelectItem>
								))}
								<SelectLabel>
									{t("settings.webServer.showModalLogs.containers")} (
									{data?.length})
								</SelectLabel>
							</SelectGroup>
						</SelectContent>
					</Select>
					<DockerLogsId
						containerId={containerId || ""}
						serverId={serverId}
						runType="native"
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};
