import { ShowEnvironment } from "@/components/dashboard/application/environment/show-enviroment";
import { ShowDockerLogs } from "@/components/dashboard/application/logs/show";
import { DeleteService } from "@/components/dashboard/compose/delete-service";
import { ShowBackups } from "@/components/dashboard/database/backups/show-backups";
import { ContainerFreeMonitoring } from "@/components/dashboard/monitoring/free/container/show-free-container-monitoring";
import { ContainerPaidMonitoring } from "@/components/dashboard/monitoring/paid/container/show-paid-container-monitoring";
import { ShowExternalPostgresCredentials } from "@/components/dashboard/postgres/general/show-external-postgres-credentials";
import { ShowGeneralPostgres } from "@/components/dashboard/postgres/general/show-general-postgres";
import { ShowInternalPostgresCredentials } from "@/components/dashboard/postgres/general/show-internal-postgres-credentials";
import { UpdatePostgres } from "@/components/dashboard/postgres/update-postgres";
import { ShowDatabaseAdvancedSettings } from "@/components/dashboard/shared/show-database-advanced-settings";
import { PostgresqlIcon } from "@/components/icons/data-tools-icons";
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
import { cn } from "@/lib/utils";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";
import { getLocale, serverSideTranslations } from "@/utils/i18n";
import { validateRequest } from "@dokploy/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { HelpCircle, ServerOff } from "lucide-react";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement, useState } from "react";
import superjson from "superjson";

type TabState = "projects" | "monitoring" | "settings" | "backups" | "advanced";

const Postgresql = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const { t } = useTranslation("dashboard");
	const [_toggleMonitoring, _setToggleMonitoring] = useState(false);
	const { postgresId, activeTab } = props;
	const router = useRouter();
	const { projectId } = router.query;
	const [tab, setSab] = useState<TabState>(activeTab);
	const { data } = api.postgres.one.useQuery({ postgresId });
	const { data: auth } = api.user.get.useQuery();

	const { data: isCloud } = api.settings.isCloud.useQuery();

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
						href: `/dashboard/project/${projectId}/services/postgres/${postgresId}`,
					},
				]}
			/>
			<Head>
				<title>
					{t("dashboard.services.database")}: {data?.name} -{" "}
					{data?.project.name} | Dokploy
				</title>
			</Head>
			<div className="w-full">
				<Card className="h-full bg-sidebar  p-2.5 rounded-xl w-full">
					<div className="rounded-xl bg-background shadow-md ">
						<CardHeader className="flex flex-row justify-between items-center">
							<div className="flex flex-col">
								<CardTitle className="text-xl flex flex-row gap-2">
									<div className="relative flex flex-row gap-4">
										<div className="absolute -right-1  -top-2">
											<StatusTooltip status={data?.applicationStatus} />
										</div>

										<PostgresqlIcon className="h-6 w-6 text-muted-foreground" />
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
									<UpdatePostgres postgresId={postgresId} />
									{(auth?.role === "owner" || auth?.canDeleteServices) && (
										<DeleteService id={postgresId} type="postgres" />
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
										setSab(e as TabState);
										const newPath = `/dashboard/project/${projectId}/services/postgres/${postgresId}?tab=${e}`;

										router.push(newPath, undefined, { shallow: true });
									}}
								>
									<div className="flex flex-row items-center justify-between w-full gap-4 overflow-x-scroll">
										<TabsList
											className={cn(
												"md:grid md:w-fit max-md:overflow-y-scroll justify-start",
												isCloud && data?.serverId
													? "md:grid-cols-6"
													: data?.serverId
														? "md:grid-cols-5"
														: "md:grid-cols-6",
											)}
										>
											<TabsTrigger value="general">
												{t("dashboard.services.general")}
											</TabsTrigger>
											<TabsTrigger value="environment">
												{t("dashboard.services.environment")}
											</TabsTrigger>
											<TabsTrigger value="logs">
												{t("dashboard.services.logs")}
											</TabsTrigger>
											{((data?.serverId && isCloud) || !data?.server) && (
												<TabsTrigger value="monitoring">
													{t("dashboard.services.monitoring")}
												</TabsTrigger>
											)}
											<TabsTrigger value="backups">
												{t("dashboard.services.backups")}
											</TabsTrigger>
											<TabsTrigger value="advanced">
												{t("dashboard.services.advanced")}
											</TabsTrigger>
										</TabsList>
									</div>

									<TabsContent value="general">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowGeneralPostgres postgresId={postgresId} />
											<ShowInternalPostgresCredentials
												postgresId={postgresId}
											/>
											<ShowExternalPostgresCredentials
												postgresId={postgresId}
											/>
										</div>
									</TabsContent>
									<TabsContent value="environment">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowEnvironment id={postgresId} type="postgres" />
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
														<ContainerFreeMonitoring
															appName={data?.appName || ""}
														/>
													</>
												)}
											</div>
										</div>
									</TabsContent>
									<TabsContent value="logs">
										<div className="flex flex-col gap-4  pt-2.5">
											<ShowDockerLogs
												serverId={data?.serverId || ""}
												appName={data?.appName || ""}
											/>
										</div>
									</TabsContent>
									<TabsContent value="backups">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowBackups
												id={postgresId}
												databaseType="postgres"
												backupType="database"
											/>
										</div>
									</TabsContent>
									<TabsContent value="advanced">
										<div className="flex flex-col gap-4 pt-2.5">
											<ShowDatabaseAdvancedSettings
												id={postgresId}
												type="postgres"
											/>
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

export default Postgresql;
Postgresql.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ postgresId: string; activeTab: TabState }>,
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

	if (typeof params?.postgresId === "string") {
		try {
			await helpers.postgres.one.fetch({
				postgresId: params?.postgresId,
			});
			await helpers.settings.isCloud.prefetch();
			return {
				props: {
					trpcState: helpers.dehydrate(),
					postgresId: params?.postgresId,
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
