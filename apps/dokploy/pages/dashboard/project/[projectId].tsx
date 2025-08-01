import { AddApplication } from "@/components/dashboard/project/add-application";
import { AddCompose } from "@/components/dashboard/project/add-compose";
import { AddDatabase } from "@/components/dashboard/project/add-database";
import { AddTemplate } from "@/components/dashboard/project/add-template";
import { ProjectEnvironment } from "@/components/dashboard/projects/project-environment";
import {
	MariadbIcon,
	MongodbIcon,
	MysqlIcon,
	PostgresqlIcon,
	RedisIcon,
} from "@/components/icons/data-tools-icons";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { BreadcrumbSidebar } from "@/components/shared/breadcrumb-sidebar";
import { DateTooltip } from "@/components/shared/date-tooltip";
import { DialogAction } from "@/components/shared/dialog-action";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import { Button } from "@/components/ui/button";

import { AddAiAssistant } from "@/components/dashboard/project/add-ai-assistant";
import { DuplicateProject } from "@/components/dashboard/project/duplicate-project";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";
import { getLocale, serverSideTranslations } from "@/utils/i18n";
import type { findProjectById } from "@dokploy/server";
import { validateRequest } from "@dokploy/server/lib/auth";
import { createServerSideHelpers } from "@trpc/react-query/server";
import {
	Ban,
	Check,
	CheckCircle2,
	ChevronsUpDown,
	CircuitBoard,
	FolderInput,
	GlobeIcon,
	Loader2,
	PlusIcon,
	Search,
	ServerIcon,
	Trash2,
	X,
} from "lucide-react";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import { useTranslation } from "next-i18next";
import Head from "next/head";
import { useRouter } from "next/router";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import superjson from "superjson";

export type Services = {
	appName: string;
	serverId?: string | null;
	name: string;
	type:
		| "mariadb"
		| "application"
		| "postgres"
		| "mysql"
		| "mongo"
		| "redis"
		| "compose";
	description?: string | null;
	id: string;
	createdAt: string;
	status?: "idle" | "running" | "done" | "error";
};

type Project = Awaited<ReturnType<typeof findProjectById>>;

export const extractServices = (data: Project | undefined) => {
	const applications: Services[] =
		data?.applications.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "application",
			id: item.applicationId,
			createdAt: item.createdAt,
			status: item.applicationStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	const mariadb: Services[] =
		data?.mariadb.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "mariadb",
			id: item.mariadbId,
			createdAt: item.createdAt,
			status: item.applicationStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	const postgres: Services[] =
		data?.postgres.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "postgres",
			id: item.postgresId,
			createdAt: item.createdAt,
			status: item.applicationStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	const mongo: Services[] =
		data?.mongo.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "mongo",
			id: item.mongoId,
			createdAt: item.createdAt,
			status: item.applicationStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	const redis: Services[] =
		data?.redis.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "redis",
			id: item.redisId,
			createdAt: item.createdAt,
			status: item.applicationStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	const mysql: Services[] =
		data?.mysql.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "mysql",
			id: item.mysqlId,
			createdAt: item.createdAt,
			status: item.applicationStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	const compose: Services[] =
		data?.compose.map((item) => ({
			appName: item.appName,
			name: item.name,
			type: "compose",
			id: item.composeId,
			createdAt: item.createdAt,
			status: item.composeStatus,
			description: item.description,
			serverId: item.serverId,
		})) || [];

	applications.push(
		...mysql,
		...redis,
		...mongo,
		...postgres,
		...mariadb,
		...compose,
	);

	applications.sort((a, b) => {
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	return applications;
};

const Project = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const { t } = useTranslation("dashboard");
	const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
	const { projectId } = props;
	const { data: auth } = api.user.get.useQuery();
	const [sortBy, setSortBy] = useState<string>(() => {
		if (typeof window !== "undefined") {
			return localStorage.getItem("servicesSort") || "createdAt-desc";
		}
		return "createdAt-desc";
	});

	useEffect(() => {
		localStorage.setItem("servicesSort", sortBy);
	}, [sortBy]);

	const sortServices = (services: Services[]) => {
		const [field, direction] = sortBy.split("-");
		return [...services].sort((a, b) => {
			let comparison = 0;
			switch (field) {
				case "name":
					comparison = a.name.localeCompare(b.name);
					break;
				case "type":
					comparison = a.type.localeCompare(b.type);
					break;
				case "createdAt":
					comparison =
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
					break;
				default:
					comparison = 0;
			}
			return direction === "asc" ? comparison : -comparison;
		});
	};

	const { data, isLoading, refetch } = api.project.one.useQuery({ projectId });
	const { data: allProjects } = api.project.all.useQuery();
	const router = useRouter();

	const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
	const [selectedTargetProject, setSelectedTargetProject] =
		useState<string>("");

	const emptyServices =
		data?.mariadb?.length === 0 &&
		data?.mongo?.length === 0 &&
		data?.mysql?.length === 0 &&
		data?.postgres?.length === 0 &&
		data?.redis?.length === 0 &&
		data?.applications?.length === 0 &&
		data?.compose?.length === 0;

	const applications = extractServices(data);

	const [searchQuery, setSearchQuery] = useState("");
	const serviceTypes = [
		{
			value: "application",
			label: t("dashboard.project.application"),
			icon: GlobeIcon,
		},
		{
			value: "postgres",
			label: t("dashboard.project.addDatabase.databasesMap.postgres"),
			icon: PostgresqlIcon,
		},
		{
			value: "mariadb",
			label: t("dashboard.project.addDatabase.databasesMap.mariadb"),
			icon: MariadbIcon,
		},
		{
			value: "mongo",
			label: t("dashboard.project.addDatabase.databasesMap.mongo"),
			icon: MongodbIcon,
		},
		{
			value: "mysql",
			label: t("dashboard.project.addDatabase.databasesMap.mysql"),
			icon: MysqlIcon,
		},
		{
			value: "redis",
			label: t("dashboard.project.addDatabase.databasesMap.redis"),
			icon: RedisIcon,
		},
		{
			value: "compose",
			label: t("dashboard.compose.compose"),
			icon: CircuitBoard,
		},
	];

	const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
	const [openCombobox, setOpenCombobox] = useState(false);
	const [selectedServices, setSelectedServices] = useState<string[]>([]);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleSelectAll = () => {
		if (selectedServices.length === filteredServices.length) {
			setSelectedServices([]);
		} else {
			setSelectedServices(filteredServices.map((service) => service.id));
		}
	};

	const handleServiceSelect = (serviceId: string, event: React.MouseEvent) => {
		event.stopPropagation();
		setSelectedServices((prev) =>
			prev.includes(serviceId)
				? prev.filter((id) => id !== serviceId)
				: [...prev, serviceId],
		);
	};

	const composeActions = {
		start: api.compose.start.useMutation(),
		stop: api.compose.stop.useMutation(),
		move: api.compose.move.useMutation(),
		delete: api.compose.delete.useMutation(),
	};

	const applicationActions = {
		start: api.application.start.useMutation(),
		stop: api.application.stop.useMutation(),
		move: api.application.move.useMutation(),
		delete: api.application.delete.useMutation(),
	};

	const postgresActions = {
		start: api.postgres.start.useMutation(),
		stop: api.postgres.stop.useMutation(),
		move: api.postgres.move.useMutation(),
		delete: api.postgres.remove.useMutation(),
	};

	const mysqlActions = {
		start: api.mysql.start.useMutation(),
		stop: api.mysql.stop.useMutation(),
		move: api.mysql.move.useMutation(),
		delete: api.mysql.remove.useMutation(),
	};

	const mariadbActions = {
		start: api.mariadb.start.useMutation(),
		stop: api.mariadb.stop.useMutation(),
		move: api.mariadb.move.useMutation(),
		delete: api.mariadb.remove.useMutation(),
	};

	const redisActions = {
		start: api.redis.start.useMutation(),
		stop: api.redis.stop.useMutation(),
		move: api.redis.move.useMutation(),
		delete: api.redis.remove.useMutation(),
	};

	const mongoActions = {
		start: api.mongo.start.useMutation(),
		stop: api.mongo.stop.useMutation(),
		move: api.mongo.move.useMutation(),
		delete: api.mongo.remove.useMutation(),
	};

	const handleBulkStart = async () => {
		let success = 0;
		setIsBulkActionLoading(true);
		for (const serviceId of selectedServices) {
			try {
				const service = filteredServices.find((s) => s.id === serviceId);
				if (!service) continue;

				switch (service.type) {
					case "application":
						await applicationActions.start.mutateAsync({
							applicationId: serviceId,
						});
						break;
					case "compose":
						await composeActions.start.mutateAsync({ composeId: serviceId });
						break;
					case "postgres":
						await postgresActions.start.mutateAsync({ postgresId: serviceId });
						break;
					case "mysql":
						await mysqlActions.start.mutateAsync({ mysqlId: serviceId });
						break;
					case "mariadb":
						await mariadbActions.start.mutateAsync({ mariadbId: serviceId });
						break;
					case "redis":
						await redisActions.start.mutateAsync({ redisId: serviceId });
						break;
					case "mongo":
						await mongoActions.start.mutateAsync({ mongoId: serviceId });
						break;
				}
				success++;
			} catch {
				toast.error(t("dashboard.project.errorStartingService", { serviceId }));
			}
		}
		if (success > 0) {
			toast.success(
				t("dashboard.project.servicesStartedSuccess", { count: success }),
			);
			refetch();
		}
		setIsBulkActionLoading(false);
		setSelectedServices([]);
		setIsDropdownOpen(false);
	};

	const handleBulkStop = async () => {
		let success = 0;
		setIsBulkActionLoading(true);
		for (const serviceId of selectedServices) {
			try {
				const service = filteredServices.find((s) => s.id === serviceId);
				if (!service) continue;

				switch (service.type) {
					case "application":
						await applicationActions.stop.mutateAsync({
							applicationId: serviceId,
						});
						break;
					case "compose":
						await composeActions.stop.mutateAsync({ composeId: serviceId });
						break;
					case "postgres":
						await postgresActions.stop.mutateAsync({ postgresId: serviceId });
						break;
					case "mysql":
						await mysqlActions.stop.mutateAsync({ mysqlId: serviceId });
						break;
					case "mariadb":
						await mariadbActions.stop.mutateAsync({ mariadbId: serviceId });
						break;
					case "redis":
						await redisActions.stop.mutateAsync({ redisId: serviceId });
						break;
					case "mongo":
						await mongoActions.stop.mutateAsync({ mongoId: serviceId });
						break;
				}
				success++;
			} catch {
				toast.error(t("dashboard.project.errorStoppingService", { serviceId }));
			}
		}
		if (success > 0) {
			toast.success(
				t("dashboard.project.servicesStoppedSuccess", { count: success }),
			);
			refetch();
		}
		setSelectedServices([]);
		setIsDropdownOpen(false);
		setIsBulkActionLoading(false);
	};

	const handleBulkMove = async () => {
		if (!selectedTargetProject) {
			toast.error(t("dashboard.project.selectTargetProject"));
			return;
		}

		let success = 0;
		setIsBulkActionLoading(true);
		for (const serviceId of selectedServices) {
			try {
				const service = filteredServices.find((s) => s.id === serviceId);
				if (!service) continue;

				switch (service.type) {
					case "application":
						await applicationActions.move.mutateAsync({
							applicationId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
					case "compose":
						await composeActions.move.mutateAsync({
							composeId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
					case "postgres":
						await postgresActions.move.mutateAsync({
							postgresId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
					case "mysql":
						await mysqlActions.move.mutateAsync({
							mysqlId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
					case "mariadb":
						await mariadbActions.move.mutateAsync({
							mariadbId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
					case "redis":
						await redisActions.move.mutateAsync({
							redisId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
					case "mongo":
						await mongoActions.move.mutateAsync({
							mongoId: serviceId,
							targetProjectId: selectedTargetProject,
						});
						break;
				}
				success++;
			} catch (_error) {
				toast.error(t("dashboard.project.errorMovingService", { serviceId }));
			}
		}
		if (success > 0) {
			toast.success(
				t("dashboard.project.servicesMovedSuccess", { count: success }),
			);
			refetch();
		}
		setSelectedServices([]);
		setIsDropdownOpen(false);
		setIsMoveDialogOpen(false);
		setIsBulkActionLoading(false);
	};

	const handleBulkDelete = async () => {
		let success = 0;
		setIsBulkActionLoading(true);
		for (const serviceId of selectedServices) {
			try {
				const service = filteredServices.find((s) => s.id === serviceId);
				if (!service) continue;

				switch (service.type) {
					case "application":
						await applicationActions.delete.mutateAsync({
							applicationId: serviceId,
						});
						break;
					case "compose":
						await composeActions.delete.mutateAsync({
							composeId: serviceId,
							deleteVolumes: false,
						});
						break;
					case "postgres":
						await postgresActions.delete.mutateAsync({
							postgresId: serviceId,
						});
						break;
					case "mysql":
						await mysqlActions.delete.mutateAsync({
							mysqlId: serviceId,
						});
						break;
					case "mariadb":
						await mariadbActions.delete.mutateAsync({
							mariadbId: serviceId,
						});
						break;
					case "redis":
						await redisActions.delete.mutateAsync({
							redisId: serviceId,
						});
						break;
					case "mongo":
						await mongoActions.delete.mutateAsync({
							mongoId: serviceId,
						});
						break;
				}
				success++;
			} catch (_error) {
				toast.error(t("dashboard.project.errorDeletingService", { serviceId }));
			}
		}
		if (success > 0) {
			toast.success(
				t("dashboard.project.servicesDeletedSuccess", { count: success }),
			);
			refetch();
		}
		setSelectedServices([]);
		setIsDropdownOpen(false);
		setIsBulkActionLoading(false);
	};

	const filteredServices = useMemo(() => {
		if (!applications) return [];
		const filtered = applications.filter(
			(service) =>
				(service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					service.description
						?.toLowerCase()
						.includes(searchQuery.toLowerCase())) &&
				(selectedTypes.length === 0 || selectedTypes.includes(service.type)),
		);
		return sortServices(filtered);
	}, [applications, searchQuery, selectedTypes, sortBy]);

	return (
		<div>
			<BreadcrumbSidebar
				list={[
					{
						name: t("dashboard.project.projects"),
						href: "/dashboard/projects",
					},
					{ name: data?.name || "", href: `/dashboard/project/${projectId}` },
				]}
			/>
			<Head>
				<title>Project: {data?.name} | Dokploy</title>
			</Head>
			<div className="w-full">
				<Card className="h-full bg-sidebar  p-2.5 rounded-xl  ">
					<div className="rounded-xl bg-background shadow-md ">
						<div className="flex justify-between gap-4 w-full items-center  flex-wrap p-6">
							<CardHeader className="p-0">
								<CardTitle className="text-xl flex flex-row gap-2">
									<FolderInput className="size-6 text-muted-foreground self-center" />
									{data?.name}
								</CardTitle>
								<CardDescription>{data?.description}</CardDescription>
							</CardHeader>
							<div className="flex flex-row gap-4 flex-wrap justify-between items-center">
								<div className="flex flex-row gap-4 flex-wrap">
									<ProjectEnvironment projectId={projectId}>
										<Button variant="outline">
											{t("dashboard.project.projectEnvironment")}
										</Button>
									</ProjectEnvironment>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button>
												<PlusIcon className="h-4 w-4" />
												{t("dashboard.project.createService")}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											className="w-[200px] space-y-2"
											align="end"
										>
											<DropdownMenuLabel className="text-sm font-normal">
												{t("dashboard.project.actions")}
											</DropdownMenuLabel>
											<DropdownMenuSeparator />
											<AddApplication
												projectId={projectId}
												projectName={data?.name}
											/>
											<AddDatabase
												projectId={projectId}
												projectName={data?.name}
											/>
											<AddCompose
												projectId={projectId}
												projectName={data?.name}
											/>
											<AddTemplate projectId={projectId} />
											<AddAiAssistant
												projectId={projectId}
												projectName={data?.name}
											/>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
						</div>
						<CardContent className="space-y-2 py-8 border-t gap-4 flex flex-col min-h-[60vh]">
							{isLoading ? (
								<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[60vh]">
									<span>{t("dashboard.project.loading")}</span>
									<Loader2 className="animate-spin size-4" />
								</div>
							) : (
								<>
									<div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
										<div className="flex items-center gap-4">
											<div className="flex items-center gap-2">
												<Checkbox
													checked={selectedServices.length > 0}
													className={cn(
														"data-[state=checked]:bg-primary",
														selectedServices.length > 0 &&
															selectedServices.length <
																filteredServices.length &&
															"bg-primary/50",
													)}
													onCheckedChange={handleSelectAll}
												/>
												<span className="text-sm">
													{t("dashboard.project.selectAll")}{" "}
													{selectedServices.length > 0 &&
														`(${selectedServices.length}/${filteredServices.length})`}
												</span>
											</div>

											<DropdownMenu
												open={isDropdownOpen}
												onOpenChange={setIsDropdownOpen}
											>
												<DropdownMenuTrigger asChild>
													<Button
														variant="outline"
														disabled={selectedServices.length === 0}
														isLoading={isBulkActionLoading}
													>
														{t("dashboard.project.bulkActions")}
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuLabel>
														{t("dashboard.project.actions")}
													</DropdownMenuLabel>
													<DropdownMenuSeparator />
													<DialogAction
														title={t("dashboard.project.startServices")}
														description={t(
															"dashboard.project.startServicesDescription",
															{ count: selectedServices.length },
														)}
														type="default"
														onClick={handleBulkStart}
													>
														<Button
															variant="ghost"
															className="w-full justify-start"
														>
															<CheckCircle2 className="mr-2 h-4 w-4" />
															{t("dashboard.project.start")}
														</Button>
													</DialogAction>
													<DialogAction
														title={t("dashboard.project.stopServices")}
														description={t(
															"dashboard.project.stopServicesDescription",
															{ count: selectedServices.length },
														)}
														type="destructive"
														onClick={handleBulkStop}
													>
														<Button
															variant="ghost"
															className="w-full justify-start text-destructive"
														>
															<Ban className="mr-2 h-4 w-4" />
															{t("dashboard.project.stop")}
														</Button>
													</DialogAction>
													{(auth?.role === "owner" ||
														auth?.canDeleteServices) && (
														<>
															<DialogAction
																title={t("dashboard.project.deleteServices")}
																description={t(
																	"dashboard.project.deleteServicesDescription",
																	{ count: selectedServices.length },
																)}
																type="destructive"
																onClick={handleBulkDelete}
															>
																<Button
																	variant="ghost"
																	className="w-full justify-start text-destructive"
																>
																	<Trash2 className="mr-2 h-4 w-4" />
																	{t("dashboard.project.delete")}
																</Button>
															</DialogAction>
															<DuplicateProject
																projectId={projectId}
																services={applications}
																selectedServiceIds={selectedServices}
															/>
														</>
													)}

													<Dialog
														open={isMoveDialogOpen}
														onOpenChange={setIsMoveDialogOpen}
													>
														<DialogTrigger asChild>
															<Button
																variant="ghost"
																className="w-full justify-start"
															>
																<FolderInput className="mr-2 h-4 w-4" />
																{t("dashboard.project.move")}
															</Button>
														</DialogTrigger>
														<DialogContent>
															<DialogHeader>
																<DialogTitle>
																	{t("dashboard.project.moveServices")}
																</DialogTitle>
																<DialogDescription>
																	{t(
																		"dashboard.project.moveServicesDescription",
																		{ count: selectedServices.length },
																	)}
																</DialogDescription>
															</DialogHeader>
															<div className="flex flex-col gap-4">
																{allProjects?.filter(
																	(p) => p.projectId !== projectId,
																).length === 0 ? (
																	<div className="flex flex-col items-center justify-center gap-2 py-4">
																		<FolderInput className="h-8 w-8 text-muted-foreground" />
																		<p className="text-sm text-muted-foreground text-center">
																			{t(
																				"dashboard.project.noOtherProjectsAvailable",
																			)}
																		</p>
																	</div>
																) : (
																	<Select
																		value={selectedTargetProject}
																		onValueChange={setSelectedTargetProject}
																	>
																		<SelectTrigger>
																			<SelectValue
																				placeholder={t(
																					"dashboard.project.selectTargetProject",
																				)}
																			/>
																		</SelectTrigger>
																		<SelectContent>
																			{allProjects
																				?.filter(
																					(p) => p.projectId !== projectId,
																				)
																				.map((project) => (
																					<SelectItem
																						key={project.projectId}
																						value={project.projectId}
																					>
																						{project.name}
																					</SelectItem>
																				))}
																		</SelectContent>
																	</Select>
																)}
															</div>
															<DialogFooter>
																<Button
																	variant="outline"
																	onClick={() => setIsMoveDialogOpen(false)}
																>
																	{t("dashboard.project.cancel")}
																</Button>
																<Button
																	onClick={handleBulkMove}
																	isLoading={isBulkActionLoading}
																	disabled={
																		allProjects?.filter(
																			(p) => p.projectId !== projectId,
																		).length === 0
																	}
																>
																	{t("dashboard.project.moveServicesAction")}
																</Button>
															</DialogFooter>
														</DialogContent>
													</Dialog>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>

										<div className="flex flex-col gap-2 lg:flex-row lg:gap-4 lg:items-center">
											<div className="w-full relative">
												<Input
													placeholder={t("dashboard.project.filterServices")}
													value={searchQuery}
													onChange={(e) => setSearchQuery(e.target.value)}
													className="pr-10"
												/>
												<Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
											</div>
											<Select value={sortBy} onValueChange={setSortBy}>
												<SelectTrigger className="lg:w-[280px]">
													<SelectValue
														placeholder={t("dashboard.project.sortBy")}
													/>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="createdAt-desc">
														{t("dashboard.project.newestFirst")}
													</SelectItem>
													<SelectItem value="createdAt-asc">
														{t("dashboard.project.oldestFirst")}
													</SelectItem>
													<SelectItem value="name-asc">
														{t("dashboard.project.nameAZ")}
													</SelectItem>
													<SelectItem value="name-desc">
														{t("dashboard.project.nameZA")}
													</SelectItem>
													<SelectItem value="type-asc">
														{t("dashboard.project.typeAZ")}
													</SelectItem>
													<SelectItem value="type-desc">
														{t("dashboard.project.typeZA")}
													</SelectItem>
												</SelectContent>
											</Select>
											<Popover
												open={openCombobox}
												onOpenChange={setOpenCombobox}
											>
												<PopoverTrigger asChild>
													<Button
														variant="outline"
														aria-expanded={openCombobox}
														className="min-w-[200px] justify-between"
													>
														{selectedTypes.length === 0
															? t("dashboard.project.selectTypes")
															: t("dashboard.project.selected", {
																	count: selectedTypes.length,
																})}
														<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
													</Button>
												</PopoverTrigger>
												<PopoverContent className="w-[200px] p-0">
													<Command>
														<CommandInput
															placeholder={t("dashboard.project.searchType")}
														/>
														<CommandEmpty>
															{t("dashboard.project.noTypeFound")}
														</CommandEmpty>
														<CommandGroup>
															{serviceTypes.map((type) => (
																<CommandItem
																	key={type.value}
																	onSelect={() => {
																		setSelectedTypes((prev) =>
																			prev.includes(type.value)
																				? prev.filter((t) => t !== type.value)
																				: [...prev, type.value],
																		);
																		setOpenCombobox(false);
																	}}
																>
																	<div className="flex flex-row">
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				selectedTypes.includes(type.value)
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		{type.icon && (
																			<type.icon className="mr-2 h-4 w-4" />
																		)}
																		{type.label}
																	</div>
																</CommandItem>
															))}
															<CommandItem
																onSelect={() => {
																	setSelectedTypes([]);
																	setOpenCombobox(false);
																}}
																className="border-t"
															>
																<div className="flex flex-row items-center">
																	<X className="mr-2 h-4 w-4" />
																	{t("dashboard.project.clearFilters")}
																</div>
															</CommandItem>
														</CommandGroup>
													</Command>
												</PopoverContent>
											</Popover>
										</div>
									</div>

									<div className="flex w-full gap-8">
										{emptyServices ? (
											<div className="flex h-[70vh] w-full flex-col items-center justify-center">
												<FolderInput className="size-8 self-center text-muted-foreground" />
												<span className="text-center font-medium  text-muted-foreground">
													{t("dashboard.project.noServicesAdded")}
												</span>
											</div>
										) : filteredServices.length === 0 ? (
											<div className="flex h-[70vh] w-full flex-col items-center justify-center">
												<Search className="size-8 self-center text-muted-foreground" />
												<span className="text-center font-medium text-muted-foreground">
													{t("dashboard.project.noServicesFound")}
												</span>
												<span className="text-sm text-muted-foreground">
													{t("dashboard.project.adjustFilters")}
												</span>
											</div>
										) : (
											<div className="flex w-full flex-col gap-4">
												<div className="gap-5 pb-10  grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
													{filteredServices?.map((service) => (
														<Card
															key={service.id}
															onClick={() => {
																router.push(
																	`/dashboard/project/${projectId}/services/${service.type}/${service.id}`,
																);
															}}
															className="flex flex-col group relative cursor-pointer bg-transparent transition-colors hover:bg-border"
														>
															{service.serverId && (
																<div className="absolute -left-1 -top-2">
																	<ServerIcon className="size-4 text-muted-foreground" />
																</div>
															)}
															<div className="absolute -right-1 -top-2">
																<StatusTooltip status={service.status} />
															</div>

															<div
																className={cn(
																	"absolute -left-3 -bottom-3 size-9 translate-y-1 rounded-full p-0 transition-all duration-200 z-10 bg-background border",
																	selectedServices.includes(service.id)
																		? "opacity-100 translate-y-0"
																		: "opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
																)}
																onClick={(e) =>
																	handleServiceSelect(service.id, e)
																}
															>
																<div className="h-full w-full flex items-center justify-center">
																	<Checkbox
																		checked={selectedServices.includes(
																			service.id,
																		)}
																		className="data-[state=checked]:bg-primary"
																	/>
																</div>
															</div>

															<CardHeader>
																<CardTitle className="flex items-center justify-between">
																	<div className="flex flex-row items-center gap-2 justify-between w-full">
																		<div className="flex flex-col gap-2">
																			<span className="text-base flex items-center gap-2 font-medium leading-none flex-wrap">
																				{service.name}
																			</span>
																			{service.description && (
																				<span className="text-sm font-medium text-muted-foreground">
																					{service.description}
																				</span>
																			)}
																		</div>

																		<span className="text-sm font-medium text-muted-foreground self-start">
																			{service.type === "postgres" && (
																				<PostgresqlIcon className="h-7 w-7" />
																			)}
																			{service.type === "redis" && (
																				<RedisIcon className="h-7 w-7" />
																			)}
																			{service.type === "mariadb" && (
																				<MariadbIcon className="h-7 w-7" />
																			)}
																			{service.type === "mongo" && (
																				<MongodbIcon className="h-7 w-7" />
																			)}
																			{service.type === "mysql" && (
																				<MysqlIcon className="h-7 w-7" />
																			)}
																			{service.type === "application" && (
																				<GlobeIcon className="h-6 w-6" />
																			)}
																			{service.type === "compose" && (
																				<CircuitBoard className="h-6 w-6" />
																			)}
																		</span>
																	</div>
																</CardTitle>
															</CardHeader>
															<CardFooter className="mt-auto">
																<div className="space-y-1 text-sm">
																	<DateTooltip date={service.createdAt}>
																		{t("dashboard.project.created")}
																	</DateTooltip>
																</div>
															</CardFooter>
														</Card>
													))}
												</div>
											</div>
										)}
									</div>
								</>
							)}
						</CardContent>
					</div>
				</Card>
			</div>
		</div>
	);
};

export default Project;
Project.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ projectId: string }>,
) {
	const locale = getLocale(ctx.req.cookies);
	const { params } = ctx;

	const { req, res } = ctx;
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
	if (typeof params?.projectId === "string") {
		try {
			await helpers.project.one.fetch({
				projectId: params?.projectId,
			});
			return {
				props: {
					trpcState: helpers.dehydrate(),
					projectId: params?.projectId,
					...(await serverSideTranslations(locale, ["common", "dashboard"])),
				},
			};
		} catch {
			return {
				redirect: {
					permanent: false,
					destination: "/",
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
