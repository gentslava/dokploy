import { ShowClusterSettings } from "@/components/dashboard/application/advanced/cluster/show-cluster-settings";
import { AddCommand } from "@/components/dashboard/application/advanced/general/add-command";
import { ShowPorts } from "@/components/dashboard/application/advanced/ports/show-port";
import { ShowRedirects } from "@/components/dashboard/application/advanced/redirects/show-redirects";
import { ShowSecurity } from "@/components/dashboard/application/advanced/security/show-security";
import { ShowResources } from "@/components/dashboard/application/advanced/show-resources";
import { ShowTraefikConfig } from "@/components/dashboard/application/advanced/traefik/show-traefik-config";
import { ShowVolumes } from "@/components/dashboard/application/advanced/volumes/show-volumes";
import { ShowDeployments } from "@/components/dashboard/application/deployments/show-deployments";
import { ShowDomains } from "@/components/dashboard/application/domains/show-domains";
import { ShowEnvironment } from "@/components/dashboard/application/environment/show";
import { ShowGeneralApplication } from "@/components/dashboard/application/general/show";
import { ShowDockerLogs } from "@/components/dashboard/application/logs/show";
import { ShowPreviewDeployments } from "@/components/dashboard/application/preview-deployments/show-preview-deployments";
import { ShowSchedules } from "@/components/dashboard/application/schedules/show-schedules";
import { UpdateApplication } from "@/components/dashboard/application/update-application";
import { ShowVolumeBackups } from "@/components/dashboard/application/volume-backups/show-volume-backups";
import { DeleteService } from "@/components/dashboard/compose/delete-service";
import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring";
import { ContainerPaidMonitoring } from "@/components/dashboard/monitoring/paid/container/show-paid-container-monitoring";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { BreadcrumbSidebar } from "@/components/shared/breadcrumb-sidebar";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";
import { getLocale, serverSideTranslations } from "@/utils/i18n";
import { validateRequest } from "@dokploy/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import copy from "copy-to-clipboard";
import { GlobeIcon, HelpCircle, ServerOff } from "lucide-react";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement, useEffect, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";

type TabState =
	| "projects"
	| "settings"
	| "advanced"
	| "deployments"
	| "domains"
	| "monitoring"
	| "preview-deployments"
	| "volume-backups";

const Service = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const { t } = useTranslation("dashboard");
	const [_toggleMonitoring, _setToggleMonitoring] = useState(false);
	const { applicationId, activeTab } = props;
	const router = useRouter();
	const { projectId } = router.query;
	const [tab, setTab] = useState<TabState>(activeTab);

	useEffect(() => {
		if (router.query.tab) {
			setTab(router.query.tab as TabState);
		}
	}, [router.query.tab]);

	const { data } = api.application.one.useQuery(
		{ applicationId },
		{
			refetchInterval: 5000,
		},
	);

	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: auth } = api.user.get.useQuery();

	return (
		<div className="pb-10">
			<BreadcrumbSidebar
				list={[
					{
						name: t("dashboard.project.projects"),
						href: "/dashboard/projects",
					},
					{
						name: data?.project?.name || "",
						href: `/dashboard/project/${projectId}`,
					},
					{
						name: data?.name || "",
						href: `/dashboard/project/${projectId}/services/application/${applicationId}`,
					},
				]}
			/>
			<Head>
				<title>
					{t("dashboard.services.application")}: {data?.name} -{" "}
					{data?.project.name} | Dokploy
				</title>
			</Head>
			<div className="w-full">
				<Card className="h-full bg-sidebar p-2.5 rounded-xl w-full">
					<div className="rounded-xl bg-background shadow-md ">
						<CardHeader className="flex flex-row justify-between items-center">
							<div className="flex flex-col">
								<CardTitle className="text-xl flex flex-row gap-2">
									<div className="relative flex flex-row gap-4">
										<div className="absolute -right-1 -top-2">
											<StatusTooltip status={data?.applicationStatus} />
										</div>

										<GlobeIcon className="h-6 w-6 text-muted-foreground" />
									</div>
									{data?.name}
								</CardTitle>
								{data?.description && (
									<CardDescription>{data?.description}</CardDescription>
								)}

								<span className="text-sm text-muted-foreground">
									{data?.appName}
								</span>
							</div>
							<div className="flex flex-col h-fit w-fit gap-2">
								<div className="flex flex-row h-fit w-fit gap-2">
									<Badge
										className="cursor-pointer"
										onClick={() => {
											if (data?.server?.ipAddress) {
												copy(data.server.ipAddress);
												toast.success(t("dashboard.services.ipAddressCopied"));
											}
										}}
										variant={
											!data?.serverId
												? "default"
												: data?.server?.serverStatus === "active"
													? "default"
													: "destructive"
										}
									>
										{data?.server?.name ||
											t("dashboard.services.dokployServer")}
									</Badge>
									{data?.server?.serverStatus === "inactive" && (
										<TooltipProvider delayDuration={0}>
											<Tooltip>
												<TooltipTrigger asChild>
													<Label className="break-all w-fit flex flex-row gap-1 items-center">
														<HelpCircle className="size-4 text-muted-foreground" />
													</Label>
												</TooltipTrigger>
												<TooltipContent
													className="z-[999] w-[300px]"
													align="start"
													side="top"
												>
													<span>
														{t("dashboard.services.serverInactiveTooltip")}
													</span>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									)}
								</div>

								<div className="flex flex-row gap-2 justify-end">
									<UpdateApplication applicationId={applicationId} />
									{(auth?.role === "owner" || auth?.canDeleteServices) && (
										<DeleteService id={applicationId} type="application" />
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-2 py-8 border-t">
							{data?.server?.serverStatus === "inactive" ? (
								<div className="flex h-[55vh] border-2 rounded-xl border-dashed p-4">
									<div className="max-w-3xl mx-auto flex flex-col items-center justify-center self-center gap-3">
										<ServerOff className="size-10 text-muted-foreground self-center" />
										<span className="text-center text-base text-muted-foreground">
											{t("dashboard.services.serverInactiveMessage", {
												serverName: data.server.name,
											})}
										</span>
										<span className="text-center text-base text-muted-foreground">
											{t("dashboard.services.goToBilling")}{" "}
											<Link
												href="/dashboard/settings/billing"
												className="text-primary"
											>
												{t("dashboard.services.billing")}
											</Link>
										</span>
									</div>
								</div>
							) : (
								<Tabs
									value={tab}
									defaultValue="general"
									className="w-full"
									onValueChange={(e) => {
										setTab(e as TabState);
										const newPath = `/dashboard/project/${projectId}/services/application/${applicationId}?tab=${e}`;
										router.push(newPath);
									}}
								>
									<div className="flex flex-row items-center justify-between w-full overflow-auto">
										<TabsList className="flex gap-8 max-md:gap-4 justify-start">
											<TabsTrigger value="general">
												{t("dashboard.services.general")}
                      </TabsTrigger>
											<TabsTrigger value="environment">
												{t("dashboard.services.environment")}
                      </TabsTrigger>
											<TabsTrigger value="domains">
												{t("dashboard.services.domains")}
                      </TabsTrigger>
											<TabsTrigger value="preview-deployments">
												{t("dashboard.services.previewDeployments")}
											</TabsTrigger>
											<TabsTrigger value="schedules">
												{t("dashboard.services.schedules")}
											</TabsTrigger>
											<TabsTrigger value="volume-backups">
												{t("dashboard.services.volumeBackups")}
											</TabsTrigger>
											<TabsTrigger value="deployments">
												{t("dashboard.services.deployments")}
											</TabsTrigger>
											<TabsTrigger value="logs">
												{t("dashboard.services.logs")}
											</TabsTrigger>
											{((data?.serverId && isCloud) || !data?.server) && (
												<TabsTrigger value="monitoring">
													{t("dashboard.services.monitoring")}
												</TabsTrigger>
											)}
											<TabsTrigger value="advanced">
												{t("dashboard.services.advanced")}
											</TabsTrigger>
										</TabsList>
									</div>

									<TabsContent value="general">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowGeneralApplication applicationId={applicationId} />
										</div>
									</TabsContent>
									<TabsContent value="environment">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowEnvironment applicationId={applicationId} />
										</div>
									</TabsContent>

									<TabsContent value="monitoring">
										<div className="pt-2.5">
											<div className="flex flex-col gap-4 border rounded-lg p-6">
												{data?.serverId && isCloud ? (
													<ContainerPaidMonitoring
														appName={data?.appName || ""}
														baseUrl={`${
															data?.serverId
																? `http://${data?.server?.ipAddress}:${data?.server?.metricsConfig?.server?.port}`
																: "http://localhost:4500"
														}`}
														token={
															data?.server?.metricsConfig?.server?.token || ""
														}
													/>
												) : (
													<>
														{/* {monitoring?.enabledFeatures &&
															isCloud &&
															data?.serverId && (
																<div className="flex flex-row border w-fit p-4 rounded-lg items-center gap-2">
																	<Label className="text-muted-foreground">
																		Change Monitoring
																	</Label>
																	<Switch
																		checked={toggleMonitoring}
																		onCheckedChange={setToggleMonitoring}
																	/>
																</div>
															)} */}

														{/* {toggleMonitoring ? (
															<ContainerPaidMonitoring
																appName={data?.appName || ""}
																baseUrl={`http://${monitoring?.serverIp}:${monitoring?.metricsConfig?.server?.port}`}
																token={
																	monitoring?.metricsConfig?.server?.token || ""
																}
															/>
														) : ( */}
														<div>
															<ContainerFreeMonitoring
																appName={data?.appName || ""}
															/>
														</div>
														{/* )} */}
													</>
												)}
											</div>
										</div>
									</TabsContent>

									<TabsContent value="logs">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowDockerLogs
												appName={data?.appName || ""}
												serverId={data?.serverId || ""}
											/>
										</div>
									</TabsContent>
									<TabsContent value="schedules">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowSchedules
												id={applicationId}
												scheduleType="application"
											/>
										</div>
									</TabsContent>
									<TabsContent value="deployments" className="w-full pt-2.5">
										<div className="flex flex-col gap-4 border rounded-lg">
											<ShowDeployments
												id={applicationId}
												type="application"
												serverId={data?.serverId || ""}
												refreshToken={data?.refreshToken || ""}
											/>
										</div>
									</TabsContent>
									<TabsContent value="volume-backups" className="w-full pt-2.5">
										<div className="flex flex-col gap-4 border rounded-lg">
											<ShowVolumeBackups
												id={applicationId}
												type="application"
												serverId={data?.serverId || ""}
											/>
										</div>
									</TabsContent>
									<TabsContent value="preview-deployments" className="w-full">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowPreviewDeployments applicationId={applicationId} />
										</div>
									</TabsContent>
									<TabsContent value="domains" className="w-full">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowDomains id={applicationId} type="application" />
										</div>
									</TabsContent>
									<TabsContent value="advanced">
										<div className="flex flex-col gap-4 pt-2.5">
											<AddCommand applicationId={applicationId} />
											<ShowClusterSettings applicationId={applicationId} />

											<ShowResources id={applicationId} type="application" />
											<ShowVolumes id={applicationId} type="application" />
											<ShowRedirects applicationId={applicationId} />
											<ShowSecurity applicationId={applicationId} />
											<ShowPorts applicationId={applicationId} />
											<ShowTraefikConfig applicationId={applicationId} />
										</div>
									</TabsContent>
								</Tabs>
							)}
						</CardContent>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default Service;
Service.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{
		applicationId: string;
		activeTab: TabState;
	}>,
) {
	const locale = getLocale(ctx.req.cookies);
	const { query, params, req, res } = ctx;

	const activeTab = query.tab;
	const { user, session } = await validateRequest(req);
	if (!user) {
		return {
			redirect: {
				permanent: true,
				destination: "/",
			},
		};
	}
	// Fetch data from external API
	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: req as any,
			res: res as any,
			db: null as any,
			session: session as any,
			user: user as any,
		},
		transformer: superjson,
	});

	// Valid project, if not return to initial homepage....
	if (typeof params?.applicationId === "string") {
		try {
			await helpers.application.one.fetch({
				applicationId: params?.applicationId,
			});

			await helpers.settings.isCloud.prefetch();

			return {
				props: {
					trpcState: helpers.dehydrate(),
					applicationId: params?.applicationId,
					activeTab: (activeTab || "general") as TabState,
					...(await serverSideTranslations(locale, ["common", "dashboard"])),
				},
			};
		} catch {
			return {
				redirect: {
					permanent: false,
					destination: "/dashboard/projects",
				},
			};
		}
	}

	return {
		redirect: {
			permanent: false,
			destination: "/",
		},
	};
}
