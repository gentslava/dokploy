import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { ShowStorageActions } from "./show-storage-actions";
import { ShowTraefikActions } from "./show-traefik-actions";
import { ToggleDockerCleanup } from "./toggle-docker-cleanup";
interface Props {
	serverId: string;
}

export const ShowServerActions = ({ serverId }: Props) => {
	const { t } = useTranslation("settings");
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer"
					onSelect={(e) => e.preventDefault()}
				>
					{t("settings.serverActions.viewActions")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-xl">
				<div className="flex flex-col gap-1">
					<DialogTitle className="text-xl">
						{t("settings.serverActions.webServerSettings")}
					</DialogTitle>
					<DialogDescription>
						{t("settings.serverActions.reloadOrCleanWebServer")}
					</DialogDescription>
				</div>

				<div className="grid grid-cols-2 w-full gap-4">
					<ShowTraefikActions serverId={serverId} />
					<ShowStorageActions serverId={serverId} />
					<ToggleDockerCleanup serverId={serverId} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
