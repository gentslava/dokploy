import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import type React from "react";
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
	containerId: string;
	children?: React.ReactNode;
	serverId?: string | null;
}

export const ShowDockerModalLogs = ({
	containerId,
	children,
	serverId,
}: Props) => {
	const { t } = useTranslation("dashboard");

	return (
		<Dialog>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer space-x-3"
					onSelect={(e) => e.preventDefault()}
				>
					{children}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-7xl">
				<DialogHeader>
					<DialogTitle>{t("dashboard.docker.logs.viewLogs")}</DialogTitle>
					<DialogDescription>
						{t("dashboard.docker.logs.viewLogsDescription", { containerId })}
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4 pt-2.5">
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
