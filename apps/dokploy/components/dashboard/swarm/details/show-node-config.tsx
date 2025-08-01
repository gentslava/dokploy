import { CodeEditor } from "@/components/shared/code-editor";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import { Settings } from "lucide-react";
import { useTranslation } from "next-i18next";

interface Props {
	nodeId: string;
	serverId?: string;
}

export const ShowNodeConfig = ({ nodeId, serverId }: Props) => {
	const { t } = useTranslation("dashboard");
	const { data } = api.swarm.getNodeInfo.useQuery({
		nodeId,
		serverId,
	});
	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="w-full">
					<Settings className="h-4 w-4 mr-2" />
					{t("dashboard.swarm.config")}
				</Button>
			</DialogTrigger>
			<DialogContent className={"sm:max-w-5xl"}>
				<DialogHeader>
					<DialogTitle>{t("dashboard.swarm.nodeConfig")}</DialogTitle>
					<DialogDescription>
						{t("dashboard.swarm.nodeConfigDescription")}
					</DialogDescription>
				</DialogHeader>
				<div className="text-wrap rounded-lg border p-4 text-sm sm:max-w-[59rem] bg-card max-h-[70vh] overflow-auto ">
					<code>
						<pre className="whitespace-pre-wrap break-words items-center justify-center">
							{/* {JSON.stringify(data, null, 2)} */}
							<CodeEditor
								language="json"
								lineWrapping={false}
								lineNumbers={false}
								readOnly
								value={JSON.stringify(data, null, 2)}
							/>
						</pre>
					</code>
				</div>
			</DialogContent>
		</Dialog>
	);
};
