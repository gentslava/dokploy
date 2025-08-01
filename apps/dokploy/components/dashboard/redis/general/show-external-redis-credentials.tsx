import { AlertBlock } from "@/components/shared/alert-block";
import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const createDockerProviderSchema = (t: any) =>
	z.object({
		externalPort: z.preprocess((a) => {
			if (a !== null) {
				const parsed = Number.parseInt(z.string().parse(a), 10);
				return Number.isNaN(parsed) ? null : parsed;
			}
			return null;
		}, z
			.number()
			.gte(0, t("dashboard.redis.portRangeError"))
			.lte(65535, t("dashboard.redis.portRangeError"))
			.nullable()),
	});

type DockerProvider = z.infer<ReturnType<typeof createDockerProviderSchema>>;

interface Props {
	redisId: string;
}
export const ShowExternalRedisCredentials = ({ redisId }: Props) => {
	const { t } = useTranslation("dashboard");
	const { data: ip } = api.settings.getIp.useQuery();
	const { data, refetch } = api.redis.one.useQuery({ redisId });
	const { mutateAsync, isLoading } = api.redis.saveExternalPort.useMutation();
	const [connectionUrl, setConnectionUrl] = useState("");
	const getIp = data?.server?.ipAddress || ip;

	const form = useForm<DockerProvider>({
		defaultValues: {},
		resolver: zodResolver(createDockerProviderSchema(t)),
	});

	useEffect(() => {
		if (data?.externalPort) {
			form.reset({
				externalPort: data.externalPort,
			});
		}
	}, [form.reset, data, form]);

	const onSubmit = async (values: DockerProvider) => {
		await mutateAsync({
			externalPort: values.externalPort,
			redisId,
		})
			.then(async () => {
				toast.success(t("dashboard.redis.externalPortUpdated"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("dashboard.redis.errorSavingExternalPort"));
			});
	};

	useEffect(() => {
		const buildConnectionUrl = () => {
			const _hostname = window.location.hostname;
			const port = form.watch("externalPort") || data?.externalPort;

			return `redis://default:${data?.databasePassword}@${getIp}:${port}`;
		};

		setConnectionUrl(buildConnectionUrl());
	}, [data?.appName, data?.externalPort, data?.databasePassword, form, getIp]);
	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">
							{t("dashboard.redis.externalCredentials")}
						</CardTitle>
						<CardDescription>
							{t("dashboard.redis.externalCredentialsDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex w-full flex-col gap-4">
						{!getIp && (
							<AlertBlock type="warning">
								{t("dashboard.redis.ipAddressWarning")}{" "}
								<Link
									href="/dashboard/settings/server"
									className="text-primary"
								>
									{data?.serverId
										? t("dashboard.redis.remoteServersPath")
										: t("dashboard.redis.webServerPath")}
								</Link>{" "}
								{t("dashboard.redis.ipAddressWarningEnd")}
							</AlertBlock>
						)}
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
							>
								<div className="grid grid-cols-2 gap-4 ">
									<div className="col-span-2 space-y-4">
										<FormField
											control={form.control}
											name="externalPort"
											render={({ field }) => {
												return (
													<FormItem>
														<FormLabel>
															{t("dashboard.redis.externalPort")}
														</FormLabel>
														<FormControl>
															<Input
																placeholder="6379"
																{...field}
																value={field.value || ""}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								</div>
								{!!data?.externalPort && (
									<div className="grid w-full gap-8">
										<div className="flex flex-col gap-3">
											<Label>{t("dashboard.redis.externalHost")}</Label>
											<ToggleVisibilityInput value={connectionUrl} disabled />
										</div>
									</div>
								)}

								<div className="flex justify-end">
									<Button type="submit" isLoading={isLoading}>
										{t("dashboard.redis.save")}
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</>
	);
};
