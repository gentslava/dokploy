import { DialogAction } from "@/components/shared/dialog-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";
import { api } from "@/utils/api";
import { format } from "date-fns";
import { MoreHorizontal, Users } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "next-i18next";
import { toast } from "sonner";
import { AddUserPermissions } from "./add-permissions";

export const ShowUsers = () => {
	const { t } = useTranslation("settings");
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data, isLoading, refetch } = api.user.all.useQuery();
	const { mutateAsync } = api.user.remove.useMutation();
	const utils = api.useUtils();

	return (
		<div className="w-full">
			<Card className="h-full bg-sidebar  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="">
						<CardTitle className="text-xl flex flex-row gap-2">
							<Users className="size-6 text-muted-foreground self-center" />
							{t("settings.users.title")}
						</CardTitle>
						<CardDescription>{t("settings.users.description")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						{isLoading ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
								<span>{t("settings.users.loading")}</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								{data?.length === 0 ? (
									<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
										<Users className="size-8 self-center text-muted-foreground" />
										<span className="text-base text-muted-foreground">
											{t("settings.users.inviteUsers")}
										</span>
									</div>
								) : (
									<div className="flex flex-col gap-4  min-h-[25vh]">
										<Table>
											<TableCaption>
												{t("settings.users.tableCaption")}
											</TableCaption>
											<TableHeader>
												<TableRow>
													<TableHead className="w-[100px]">
														{t("settings.users.email")}
													</TableHead>
													<TableHead className="text-center">
														{t("settings.users.role")}
													</TableHead>
													<TableHead className="text-center">
														{t("settings.users.twoFactor")}
													</TableHead>

													<TableHead className="text-center">
														{t("settings.users.createdAt")}
													</TableHead>
													<TableHead className="text-right">
														{t("settings.users.actions")}
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{data?.map((member) => {
													return (
														<TableRow key={member.id}>
															<TableCell className="w-[100px]">
																{member.user.email}
															</TableCell>
															<TableCell className="text-center">
																<Badge
																	variant={
																		member.role === "owner"
																			? "default"
																			: "secondary"
																	}
																>
																	{member.role}
																</Badge>
															</TableCell>
															<TableCell className="text-center">
																{member.user.twoFactorEnabled
																	? t("settings.users.enabled")
																	: t("settings.users.disabled")}
															</TableCell>
															<TableCell className="text-center">
																<span className="text-sm text-muted-foreground">
																	{format(new Date(member.createdAt), "PPpp")}
																</span>
															</TableCell>

															<TableCell className="text-right flex justify-end">
																<DropdownMenu>
																	<DropdownMenuTrigger asChild>
																		<Button
																			variant="ghost"
																			className="h-8 w-8 p-0"
																		>
																			<span className="sr-only">Open menu</span>
																			<MoreHorizontal className="h-4 w-4" />
																		</Button>
																	</DropdownMenuTrigger>
																	<DropdownMenuContent align="end">
																		<DropdownMenuLabel>
																			{t("settings.users.actions")}
																		</DropdownMenuLabel>

																		{member.role !== "owner" && (
																			<AddUserPermissions
																				userId={member.user.id}
																			/>
																		)}

																		{member.role !== "owner" && (
																			<>
																				{!isCloud && (
																					<DialogAction
																						title={t(
																							"settings.users.deleteUser",
																						)}
																						description={t(
																							"settings.users.deleteUserDescription",
																						)}
																						type="destructive"
																						onClick={async () => {
																							await mutateAsync({
																								userId: member.user.id,
																							})
																								.then(() => {
																									toast.success(
																										t(
																											"settings.users.userDeletedSuccessfully",
																										),
																									);
																									refetch();
																								})
																								.catch(() => {
																									toast.error(
																										t(
																											"settings.users.errorDeletingDestination",
																										),
																									);
																								});
																						}}
																					>
																						<DropdownMenuItem
																							className="w-full cursor-pointer text-red-500 hover:!text-red-600"
																							onSelect={(e) =>
																								e.preventDefault()
																							}
																						>
																							{t("settings.users.deleteUser")}
																						</DropdownMenuItem>
																					</DialogAction>
																				)}

																				<DialogAction
																					title={t("settings.users.unlinkUser")}
																					description={t(
																						"settings.users.unlinkUserDescription",
																					)}
																					type="destructive"
																					onClick={async () => {
																						if (!isCloud) {
																							const orgCount =
																								await utils.user.checkUserOrganizations.fetch(
																									{
																										userId: member.user.id,
																									},
																								);

																							console.log(orgCount);

																							if (orgCount === 1) {
																								await mutateAsync({
																									userId: member.user.id,
																								})
																									.then(() => {
																										toast.success(
																											t(
																												"settings.users.userDeletedSuccessfully",
																											),
																										);
																										refetch();
																									})
																									.catch(() => {
																										toast.error(
																											t(
																												"settings.users.errorDeletingUser",
																											),
																										);
																									});
																								return;
																							}
																						}

																						const { error } =
																							await authClient.organization.removeMember(
																								{
																									memberIdOrEmail: member.id,
																								},
																							);

																						if (!error) {
																							toast.success(
																								t(
																									"settings.users.userUnlinkedSuccessfully",
																								),
																							);
																							refetch();
																						} else {
																							toast.error(
																								t(
																									"settings.users.errorUnlinkingUser",
																								),
																							);
																						}
																					}}
																				>
																					<DropdownMenuItem
																						className="w-full cursor-pointer text-red-500 hover:!text-red-600"
																						onSelect={(e) => e.preventDefault()}
																					>
																						{t("settings.users.unlinkUser")}
																					</DropdownMenuItem>
																				</DialogAction>
																			</>
																		)}
																	</DropdownMenuContent>
																</DropdownMenu>
															</TableCell>
														</TableRow>
													);
												})}
											</TableBody>
										</Table>
									</div>
								)}
							</>
						)}
					</CardContent>
				</div>
			</Card>
		</div>
	);
};
