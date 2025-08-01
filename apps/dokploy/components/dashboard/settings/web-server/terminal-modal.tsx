import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { api } from "@/utils/api";
import { useTranslation } from "next-i18next";
import dynamic from "next/dynamic";
import type React from "react";
import { useState } from "react";
import LocalServerConfig from "./local-server-config";

const Terminal = dynamic(() => import("./terminal").then((e) => e.Terminal), {
	ssr: false,
});

const getTerminalKey = () => {
	return `terminal-${Date.now()}`;
};

interface Props {
	children?: React.ReactNode;
	serverId: string;
}

export const TerminalModal = ({ children, serverId }: Props) => {
	const { t } = useTranslation("settings");
	const [terminalKey, setTerminalKey] = useState<string>(getTerminalKey());
	const isLocalServer = serverId === "local";

	const { data } = api.server.one.useQuery(
		{
			serverId,
		},
		{ enabled: !!serverId && !isLocalServer },
	);

	const handleLocalServerConfigSave = () => {
		// Rerender Terminal component to reconnect using new component key when saving local server config
		setTerminalKey(getTerminalKey());
	};

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
			<DialogContent
				className="sm:max-w-7xl"
				onEscapeKeyDown={(event) => event.preventDefault()}
			>
				<DialogHeader className="flex flex-col gap-1">
					<DialogTitle>
						{t("settings.webServer.terminal.title")} ({data?.name ?? serverId})
					</DialogTitle>
					<DialogDescription>
						{t("settings.webServer.terminal.description")}
					</DialogDescription>
				</DialogHeader>

				{isLocalServer && (
					<LocalServerConfig onSave={handleLocalServerConfigSave} />
				)}

				<div className="flex flex-col gap-4 h-[552px]">
					<Terminal id="terminal" key={terminalKey} serverId={serverId} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
