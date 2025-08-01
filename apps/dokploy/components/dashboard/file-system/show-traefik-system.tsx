import { AlertBlock } from "@/components/shared/alert-block";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tree } from "@/components/ui/file-tree";
import { api } from "@/utils/api";
import { FileIcon, Folder, Loader2, Workflow } from "lucide-react";
import { useTranslation } from "next-i18next";
import React from "react";
import { ShowTraefikFile } from "./show-traefik-file";

interface Props {
	serverId?: string;
}
export const ShowTraefikSystem = ({ serverId }: Props) => {
	const { t } = useTranslation("dashboard");
	const [file, setFile] = React.useState<null | string>(null);

	const {
		data: directories,
		isLoading,
		error,
		isError,
	} = api.settings.readDirectories.useQuery(
		{
			serverId,
		},
		{
			retry: 2,
		},
	);

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar p-2.5 rounded-xl">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="">
						<CardTitle className="text-xl flex flex-row gap-2">
							<FileIcon className="size-6 text-muted-foreground self-center" />
							{t("dashboard.traefik.fileSystem")}
						</CardTitle>
						<CardDescription>
							{t("dashboard.traefik.fileSystemDescription")}
						</CardDescription>

						<AlertBlock type="warning">
							{t("dashboard.traefik.warningMessage")}
						</AlertBlock>
					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						<div>
							<div className="flex flex-col lg:flex-row gap-4 md:gap-10 w-full">
								{isError && (
									<AlertBlock type="error" className="w-full">
										{error?.message}
									</AlertBlock>
								)}
								{isLoading && (
									<div className="w-full flex-col gap-2 flex items-center justify-center h-[55vh]">
										<span className="text-muted-foreground text-lg font-medium">
											{t("common.loading")}
										</span>
										<Loader2 className="animate-spin size-8 text-muted-foreground" />
									</div>
								)}
								{directories?.length === 0 && (
									<div className="w-full flex-col gap-2 flex items-center justify-center h-[55vh]">
										<span className="text-muted-foreground text-lg font-medium">
											{t("dashboard.traefik.noDirectoriesFound")}
										</span>
										<Folder className="size-8 text-muted-foreground" />
									</div>
								)}
								{directories && directories?.length > 0 && (
									<>
										<Tree
											data={directories}
											className="lg:max-w-[19rem] w-full lg:h-[660px] border rounded-lg"
											onSelectChange={(item) => setFile(item?.id || null)}
											folderIcon={Folder}
											itemIcon={Workflow}
										/>
										<div className="w-full">
											{file ? (
												<ShowTraefikFile path={file} serverId={serverId} />
											) : (
												<div className="h-full w-full flex-col gap-2 flex items-center justify-center">
													<span className="text-muted-foreground text-lg font-medium">
														{t("dashboard.traefik.noFileSelected")}
													</span>
													<FileIcon className="size-8 text-muted-foreground" />
												</div>
											)}
										</div>
									</>
								)}
							</div>
						</div>
					</CardContent>
				</div>
			</Card>
		</div>
	);
};
