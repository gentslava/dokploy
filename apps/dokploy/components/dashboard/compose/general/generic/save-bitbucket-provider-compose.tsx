import { BitbucketIcon } from "@/components/icons/data-tools-icons";
import { AlertBlock } from "@/components/shared/alert-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, ChevronsUpDown, X } from "lucide-react";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const createBitbucketProviderSchema = (t: any) =>
	z.object({
		composePath: z.string().min(1),
		repository: z
			.object({
				repo: z.string().min(1, t("dashboard.compose.repoRequired")),
				owner: z.string().min(1, t("dashboard.compose.ownerRequired")),
			})
			.required(),
		branch: z.string().min(1, t("dashboard.compose.branchRequired")),
		bitbucketId: z
			.string()
			.min(1, t("dashboard.compose.bitbucketProviderRequired")),
		watchPaths: z.array(z.string()).optional(),
		enableSubmodules: z.boolean().default(false),
	});

type BitbucketProvider = z.infer<
	ReturnType<typeof createBitbucketProviderSchema>
>;

interface Props {
	composeId: string;
}

export const SaveBitbucketProviderCompose = ({ composeId }: Props) => {
	const { t } = useTranslation("dashboard");
	const { data: bitbucketProviders } =
		api.bitbucket.bitbucketProviders.useQuery();
	const { data, refetch } = api.compose.one.useQuery({ composeId });

	const { mutateAsync, isLoading: isSavingBitbucketProvider } =
		api.compose.update.useMutation();

	const form = useForm<BitbucketProvider>({
		defaultValues: {
			composePath: "./docker-compose.yml",
			repository: {
				owner: "",
				repo: "",
			},
			bitbucketId: "",
			branch: "",
			watchPaths: [],
			enableSubmodules: false,
		},
		resolver: zodResolver(createBitbucketProviderSchema(t)),
	});

	const repository = form.watch("repository");
	const bitbucketId = form.watch("bitbucketId");

	const {
		data: repositories,
		isLoading: isLoadingRepositories,
		error,
	} = api.bitbucket.getBitbucketRepositories.useQuery(
		{
			bitbucketId,
		},
		{
			enabled: !!bitbucketId,
		},
	);

	const {
		data: branches,
		fetchStatus,
		status,
	} = api.bitbucket.getBitbucketBranches.useQuery(
		{
			owner: repository?.owner,
			repo: repository?.repo,
			bitbucketId,
		},
		{
			enabled: !!repository?.owner && !!repository?.repo && !!bitbucketId,
		},
	);

	useEffect(() => {
		if (data) {
			form.reset({
				branch: data.bitbucketBranch || "",
				repository: {
					repo: data.bitbucketRepository || "",
					owner: data.bitbucketOwner || "",
				},
				composePath: data.composePath,
				bitbucketId: data.bitbucketId || "",
				watchPaths: data.watchPaths || [],
				enableSubmodules: data.enableSubmodules ?? false,
			});
		}
	}, [form.reset, data?.composeId, form]);

	const onSubmit = async (data: BitbucketProvider) => {
		await mutateAsync({
			bitbucketBranch: data.branch,
			bitbucketRepository: data.repository.repo,
			bitbucketOwner: data.repository.owner,
			bitbucketId: data.bitbucketId,
			composePath: data.composePath,
			composeId,
			sourceType: "bitbucket",
			composeStatus: "idle",
			watchPaths: data.watchPaths,
			enableSubmodules: data.enableSubmodules,
		})
			.then(async () => {
				toast.success(t("dashboard.compose.bitbucketProviderSaved"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("dashboard.compose.errorSavingBitbucketProvider"));
			});
	};

	return (
		<div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid w-full gap-4 py-3"
				>
					{error && (
						<AlertBlock type="error">
							{t("dashboard.compose.repositories")}: {error.message}
						</AlertBlock>
					)}
					<div className="grid md:grid-cols-2 gap-4">
						<FormField
							control={form.control}
							name="bitbucketId"
							render={({ field }) => (
								<FormItem className="md:col-span-2 flex flex-col">
									<FormLabel>
										{t("dashboard.compose.bitbucketAccount")}
									</FormLabel>
									<Select
										onValueChange={(value) => {
											field.onChange(value);
											form.setValue("repository", {
												owner: "",
												repo: "",
											});
											form.setValue("branch", "");
										}}
										defaultValue={field.value}
										value={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={t(
														"dashboard.compose.selectBitbucketAccount",
													)}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{bitbucketProviders?.map((bitbucketProvider) => (
												<SelectItem
													key={bitbucketProvider.bitbucketId}
													value={bitbucketProvider.bitbucketId}
												>
													{bitbucketProvider.gitProvider.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="repository"
							render={({ field }) => (
								<FormItem className="md:col-span-2 flex flex-col">
									<div className="flex items-center justify-between">
										<FormLabel>{t("dashboard.compose.repository")}</FormLabel>
										{field.value.owner && field.value.repo && (
											<Link
												href={`https://bitbucket.org/${field.value.owner}/${field.value.repo}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
											>
												<BitbucketIcon className="h-4 w-4" />
												<span>{t("dashboard.compose.viewRepository")}</span>
											</Link>
										)}
									</div>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-between !bg-input",
														!field.value && "text-muted-foreground",
													)}
												>
													{isLoadingRepositories
														? t("dashboard.compose.loading")
														: field.value.owner
															? repositories?.find(
																	(repo) => repo.name === field.value.repo,
																)?.name
															: t("dashboard.compose.selectRepository")}

													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="p-0" align="start">
											<Command>
												<CommandInput
													placeholder={t("dashboard.compose.searchRepository")}
													className="h-9"
												/>
												{isLoadingRepositories && (
													<span className="py-6 text-center text-sm">
														{t("dashboard.compose.loadingRepositories")}
													</span>
												)}
												<CommandEmpty>
													{t("dashboard.compose.noRepositoriesFound")}
												</CommandEmpty>
												<ScrollArea className="h-96">
													<CommandGroup>
														{repositories?.map((repo) => (
															<CommandItem
																value={repo.name}
																key={repo.url}
																onSelect={() => {
																	form.setValue("repository", {
																		owner: repo.owner.username as string,
																		repo: repo.name,
																	});
																	form.setValue("branch", "");
																}}
															>
																<span className="flex items-center gap-2">
																	<span>{repo.name}</span>
																	<span className="text-muted-foreground text-xs">
																		{repo.owner.username}
																	</span>
																</span>
																<CheckIcon
																	className={cn(
																		"ml-auto h-4 w-4",
																		repo.name === field.value.repo
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
															</CommandItem>
														))}
													</CommandGroup>
												</ScrollArea>
											</Command>
										</PopoverContent>
									</Popover>
									{form.formState.errors.repository && (
										<p className={cn("text-sm font-medium text-destructive")}>
											{t("dashboard.compose.repositoryRequired")}
										</p>
									)}
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="branch"
							render={({ field }) => (
								<FormItem className="block w-full">
									<FormLabel>{t("dashboard.compose.branch")}</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														" w-full justify-between !bg-input",
														!field.value && "text-muted-foreground",
													)}
												>
													{status === "loading" && fetchStatus === "fetching"
														? t("dashboard.compose.loading")
														: field.value
															? branches?.find(
																	(branch) => branch.name === field.value,
																)?.name
															: t("dashboard.compose.selectBranch")}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="p-0" align="start">
											<Command>
												<CommandInput
													placeholder={t("dashboard.compose.searchBranch")}
													className="h-9"
												/>
												{status === "loading" && fetchStatus === "fetching" && (
													<span className="py-6 text-center text-sm text-muted-foreground">
														{t("dashboard.compose.loadingBranches")}
													</span>
												)}
												{!repository?.owner && (
													<span className="py-6 text-center text-sm text-muted-foreground">
														{t("dashboard.compose.selectARepository")}
													</span>
												)}
												<ScrollArea className="h-96">
													<CommandEmpty>
														{t("dashboard.compose.noBranchFound")}
													</CommandEmpty>

													<CommandGroup>
														{branches?.map((branch) => (
															<CommandItem
																value={branch.name}
																key={branch.commit.sha}
																onSelect={() => {
																	form.setValue("branch", branch.name);
																}}
															>
																{branch.name}
																<CheckIcon
																	className={cn(
																		"ml-auto h-4 w-4",
																		branch.name === field.value
																			? "opacity-100"
																			: "opacity-0",
																	)}
																/>
															</CommandItem>
														))}
													</CommandGroup>
												</ScrollArea>
											</Command>
										</PopoverContent>

										<FormMessage />
									</Popover>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="composePath"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("dashboard.compose.composePath")}</FormLabel>
									<FormControl>
										<Input placeholder="docker-compose.yml" {...field} />
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="watchPaths"
							render={({ field }) => (
								<FormItem className="md:col-span-2">
									<div className="flex items-center gap-2">
										<FormLabel>{t("dashboard.compose.watchPaths")}</FormLabel>
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger>
													<div className="size-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
														?
													</div>
												</TooltipTrigger>
												<TooltipContent>
													<p>{t("dashboard.compose.watchPathsTooltip")}</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</div>
									<div className="flex flex-wrap gap-2 mb-2">
										{field.value?.map((path, index) => (
											<Badge key={index} variant="secondary">
												{path}
												<X
													className="ml-1 size-3 cursor-pointer"
													onClick={() => {
														const newPaths = [...(field.value || [])];
														newPaths.splice(index, 1);
														form.setValue("watchPaths", newPaths);
													}}
												/>
											</Badge>
										))}
									</div>
									<FormControl>
										<div className="flex gap-2">
											<Input
												placeholder={t(
													"dashboard.compose.watchPathsInputPlaceholder",
												)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const input = e.currentTarget;
														const value = input.value.trim();
														if (value) {
															const newPaths = [...(field.value || []), value];
															form.setValue("watchPaths", newPaths);
															input.value = "";
														}
													}
												}}
											/>
											<Button
												type="button"
												variant="secondary"
												onClick={() => {
													const input = document.querySelector(
														`input[placeholder="${t(
															"dashboard.compose.watchPathsInputPlaceholder",
														)}"]`,
													) as HTMLInputElement;
													const value = input.value.trim();
													if (value) {
														const newPaths = [...(field.value || []), value];
														form.setValue("watchPaths", newPaths);
														input.value = "";
													}
												}}
											>
												{t("dashboard.compose.add")}
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="enableSubmodules"
							render={({ field }) => (
								<FormItem className="flex items-center space-x-2">
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormLabel className="!mt-0">
										{t("dashboard.compose.enableSubmodules")}
									</FormLabel>
								</FormItem>
							)}
						/>
					</div>
					<div className="flex w-full justify-end">
						<Button
							isLoading={isSavingBitbucketProvider}
							type="submit"
							className="w-fit"
						>
							{t("dashboard.compose.save")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};
