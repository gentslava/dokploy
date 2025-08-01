import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { extractServices } from "@/pages/dashboard/project/[projectId]";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const addPermissions = z.object({
	accessedProjects: z.array(z.string()).optional(),
	accessedServices: z.array(z.string()).optional(),
	canCreateProjects: z.boolean().optional().default(false),
	canCreateServices: z.boolean().optional().default(false),
	canDeleteProjects: z.boolean().optional().default(false),
	canDeleteServices: z.boolean().optional().default(false),
	canAccessToTraefikFiles: z.boolean().optional().default(false),
	canAccessToDocker: z.boolean().optional().default(false),
	canAccessToAPI: z.boolean().optional().default(false),
	canAccessToSSHKeys: z.boolean().optional().default(false),
	canAccessToGitProviders: z.boolean().optional().default(false),
});

type AddPermissions = z.infer<typeof addPermissions>;

interface Props {
	userId: string;
}

export const AddUserPermissions = ({ userId }: Props) => {
	const { t } = useTranslation("settings");
	const { data: projects } = api.project.all.useQuery();

	const { data, refetch } = api.user.one.useQuery(
		{
			userId,
		},
		{
			enabled: !!userId,
		},
	);

	const { mutateAsync, isError, error, isLoading } =
		api.user.assignPermissions.useMutation();

	const form = useForm<AddPermissions>({
		defaultValues: {
			accessedProjects: [],
			accessedServices: [],
		},
		resolver: zodResolver(addPermissions),
	});

	useEffect(() => {
		if (data) {
			form.reset({
				accessedProjects: data.accessedProjects || [],
				accessedServices: data.accessedServices || [],
				canCreateProjects: data.canCreateProjects,
				canCreateServices: data.canCreateServices,
				canDeleteProjects: data.canDeleteProjects,
				canDeleteServices: data.canDeleteServices,
				canAccessToTraefikFiles: data.canAccessToTraefikFiles,
				canAccessToDocker: data.canAccessToDocker,
				canAccessToAPI: data.canAccessToAPI,
				canAccessToSSHKeys: data.canAccessToSSHKeys,
				canAccessToGitProviders: data.canAccessToGitProviders,
			});
		}
	}, [form, form.formState.isSubmitSuccessful, form.reset, data]);

	const onSubmit = async (data: AddPermissions) => {
		await mutateAsync({
			id: userId,
			canCreateServices: data.canCreateServices,
			canCreateProjects: data.canCreateProjects,
			canDeleteServices: data.canDeleteServices,
			canDeleteProjects: data.canDeleteProjects,
			canAccessToTraefikFiles: data.canAccessToTraefikFiles,
			accessedProjects: data.accessedProjects || [],
			accessedServices: data.accessedServices || [],
			canAccessToDocker: data.canAccessToDocker,
			canAccessToAPI: data.canAccessToAPI,
			canAccessToSSHKeys: data.canAccessToSSHKeys,
			canAccessToGitProviders: data.canAccessToGitProviders,
		})
			.then(async () => {
				toast.success(t("settings.permissions.permissionsUpdated"));
				refetch();
			})
			.catch(() => {
				toast.error(t("settings.permissions.errorUpdatingPermissions"));
			});
	};
	return (
		<Dialog>
			<DialogTrigger className="" asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer"
					onSelect={(e) => e.preventDefault()}
				>
					{t("settings.permissions.addPermissions")}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="max-h-[85vh]  sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>{t("settings.permissions.permissions")}</DialogTitle>
					<DialogDescription>
						{t("settings.permissions.addOrRemovePermissions")}
					</DialogDescription>
				</DialogHeader>
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}

				<Form {...form}>
					<form
						id="hook-form-add-permissions"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid  grid-cols-1 md:grid-cols-2  w-full gap-4"
					>
						<FormField
							control={form.control}
							name="canCreateProjects"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.createProjects")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.createProjectsDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canDeleteProjects"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.deleteProjects")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.deleteProjectsDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canCreateServices"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.createServices")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.createServicesDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canDeleteServices"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.deleteServices")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.deleteServicesDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canAccessToTraefikFiles"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.accessToTraefikFiles")}
										</FormLabel>
										<FormDescription>
											{t(
												"settings.permissions.accessToTraefikFilesDescription",
											)}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canAccessToDocker"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.accessToDocker")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.accessToDockerDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canAccessToAPI"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.accessToApiCli")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.accessToApiCliDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canAccessToSSHKeys"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.accessToSshKeys")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.accessToSshKeysDescription")}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="canAccessToGitProviders"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>
											{t("settings.permissions.accessToGitProviders")}
										</FormLabel>
										<FormDescription>
											{t(
												"settings.permissions.accessToGitProvidersDescription",
											)}
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="accessedProjects"
							render={() => (
								<FormItem className="md:col-span-2">
									<div className="mb-4">
										<FormLabel className="text-base">
											{t("settings.permissions.projects")}
										</FormLabel>
										<FormDescription>
											{t("settings.permissions.projectsDescription")}
										</FormDescription>
									</div>
									{projects?.length === 0 && (
										<p className="text-sm text-muted-foreground">
											{t("settings.permissions.noProjectsFound")}
										</p>
									)}
									<div className="grid md:grid-cols-2  gap-4">
										{projects?.map((item, index) => {
											const applications = extractServices(item);
											return (
												<FormField
													key={`project-${index}`}
													control={form.control}
													name="accessedProjects"
													render={({ field }) => {
														return (
															<FormItem
																key={item.projectId}
																className="flex flex-col items-start space-x-4 rounded-lg p-4 border"
															>
																<div className="flex flex-row gap-4">
																	<FormControl>
																		<Checkbox
																			checked={field.value?.includes(
																				item.projectId,
																			)}
																			onCheckedChange={(checked) => {
																				return checked
																					? field.onChange([
																							...(field.value || []),
																							item.projectId,
																						])
																					: field.onChange(
																							field.value?.filter(
																								(value) =>
																									value !== item.projectId,
																							),
																						);
																			}}
																		/>
																	</FormControl>
																	<FormLabel className="text-sm font-medium text-primary">
																		{item.name}
																	</FormLabel>
																</div>
																{applications.length === 0 && (
																	<p className="text-sm text-muted-foreground">
																		{t("settings.permissions.noServicesFound")}
																	</p>
																)}
																{applications?.map((item, index) => (
																	<FormField
																		key={`project-${index}`}
																		control={form.control}
																		name="accessedServices"
																		render={({ field }) => {
																			return (
																				<FormItem
																					key={item.id}
																					className="flex flex-row items-start space-x-3 space-y-0"
																				>
																					<FormControl>
																						<Checkbox
																							checked={field.value?.includes(
																								item.id,
																							)}
																							onCheckedChange={(checked) => {
																								return checked
																									? field.onChange([
																											...(field.value || []),
																											item.id,
																										])
																									: field.onChange(
																											field.value?.filter(
																												(value) =>
																													value !== item.id,
																											),
																										);
																							}}
																						/>
																					</FormControl>
																					<FormLabel className="text-sm text-muted-foreground">
																						{item.name}
																					</FormLabel>
																				</FormItem>
																			);
																		}}
																	/>
																))}
															</FormItem>
														);
													}}
												/>
											);
										})}
									</div>

									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className="flex w-full flex-row justify-end md:col-span-2">
							<Button
								isLoading={isLoading}
								form="hook-form-add-permissions"
								type="submit"
							>
								{t("settings.permissions.update")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
