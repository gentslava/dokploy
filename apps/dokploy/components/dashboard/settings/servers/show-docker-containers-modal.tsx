import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { ShowContainers } from "../../docker/show/show-containers";

interface Props {
	serverId: string;
}

export const ShowDockerContainersModal = ({ serverId }: Props) => {
	const { t } = useTranslation("settings");
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer "
					onSelect={(e) => e.preventDefault()}
				>
					{t("settings.dockerContainers.showDockerContainers")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-7xl  ">
				<div className="grid w-full gap-1">
					<ShowContainers serverId={serverId} />
				</div>
			</DialogContent>
		</Dialog>
	);
};
