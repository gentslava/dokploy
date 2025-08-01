import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { type UploadFile, uploadFileSchema } from "@/utils/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrashIcon } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
	applicationId: string;
}

export const SaveDragNDrop = ({ applicationId }: Props) => {
	const { t } = useTranslation("dashboard");
	const { data, refetch } = api.application.one.useQuery({ applicationId });

	const { mutateAsync, isLoading } =
		api.application.dropDeployment.useMutation();

	const form = useForm<UploadFile>({
		defaultValues: {},
		resolver: zodResolver(uploadFileSchema),
	});

	useEffect(() => {
		if (data) {
			form.reset({
				dropBuildPath: data.dropBuildPath || "",
			});
		}
	}, [data, form, form.reset, form.formState.isSubmitSuccessful]);
	const zip = form.watch("zip");

	const onSubmit = async (values: UploadFile) => {
		const formData = new FormData();

		formData.append("zip", values.zip);
		formData.append("applicationId", applicationId);
		if (values.dropBuildPath) {
			formData.append("dropBuildPath", values.dropBuildPath);
		}

		await mutateAsync(formData)
			.then(async () => {
				toast.success(t("dashboard.dragNDrop.deploymentSaved"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("dashboard.dragNDrop.errorSavingDeployment"));
			});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<div className="grid md:grid-cols-2 gap-4 ">
					<div className="md:col-span-2 space-y-4">
						<FormField
							control={form.control}
							name="dropBuildPath"
							render={({ field }) => (
								<FormItem className="w-full ">
									<FormLabel>{t("dashboard.dragNDrop.buildPath")}</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder={t(
												"dashboard.dragNDrop.buildPathPlaceholder",
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="zip"
							render={({ field }) => (
								<FormItem className="w-full ">
									<FormLabel>{t("dashboard.dragNDrop.zipFile")}</FormLabel>
									<FormControl>
										<Dropzone
											{...field}
											dropMessage={t("dashboard.dragNDrop.dropFilesOrClick")}
											accept=".zip"
											onChange={(e) => {
												if (e instanceof FileList) {
													field.onChange(e[0]);
												} else {
													field.onChange(e);
												}
											}}
										/>
									</FormControl>
									<FormMessage />
									{zip instanceof File && (
										<div className="flex flex-row gap-4 items-center">
											<span className="text-sm text-muted-foreground">
												{zip.name} ({zip.size} {t("dashboard.dragNDrop.bytes")})
											</span>
											<Button
												type="button"
												className="w-fit"
												variant="ghost"
												onClick={() => {
													field.onChange(null);
												}}
											>
												<TrashIcon className="w-4 h-4 text-muted-foreground" />
											</Button>
										</div>
									)}
								</FormItem>
							)}
						/>
					</div>
				</div>

				<div className="flex flex-row justify-end">
					<Button
						type="submit"
						className="w-fit"
						isLoading={isLoading}
						disabled={!zip || isLoading}
					>
						{t("dashboard.dragNDrop.deploy")}
					</Button>
				</div>
			</form>
		</Form>
	);
};
