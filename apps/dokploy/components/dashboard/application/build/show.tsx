import { AlertBlock } from "@/components/shared/alert-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cog } from "lucide-react";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export enum BuildType {
	dockerfile = "dockerfile",
	heroku_buildpacks = "heroku_buildpacks",
	paketo_buildpacks = "paketo_buildpacks",
	nixpacks = "nixpacks",
	static = "static",
	railpack = "railpack",
}

const buildTypeDisplayMap: Record<BuildType, string> = {
	[BuildType.dockerfile]: "Dockerfile",
	[BuildType.railpack]: "Railpack",
	[BuildType.nixpacks]: "Nixpacks",
	[BuildType.heroku_buildpacks]: "Heroku Buildpacks",
	[BuildType.paketo_buildpacks]: "Paketo Buildpacks",
	[BuildType.static]: "Static",
};

const mySchema = z.discriminatedUnion("buildType", [
	z.object({
		buildType: z.literal(BuildType.dockerfile),
		dockerfile: z
			.string({
				required_error: "Dockerfile path is required",
				invalid_type_error: "Dockerfile path is required",
			})
			.min(1, "Dockerfile required"),
		dockerContextPath: z.string().nullable().default(""),
		dockerBuildStage: z.string().nullable().default(""),
	}),
	z.object({
		buildType: z.literal(BuildType.heroku_buildpacks),
		herokuVersion: z.string().nullable().default(""),
	}),
	z.object({
		buildType: z.literal(BuildType.paketo_buildpacks),
	}),
	z.object({
		buildType: z.literal(BuildType.nixpacks),
		publishDirectory: z.string().optional(),
	}),
	z.object({
		buildType: z.literal(BuildType.railpack),
	}),
	z.object({
		buildType: z.literal(BuildType.static),
		isStaticSpa: z.boolean().default(false),
	}),
]);

type AddTemplate = z.infer<typeof mySchema>;

interface Props {
	applicationId: string;
}

interface ApplicationData {
	buildType: BuildType;
	dockerfile?: string | null;
	dockerContextPath?: string | null;
	dockerBuildStage?: string | null;
	herokuVersion?: string | null;
	publishDirectory?: string | null;
	isStaticSpa?: boolean | null;
}

function isValidBuildType(value: string): value is BuildType {
	return Object.values(BuildType).includes(value as BuildType);
}

const resetData = (data: ApplicationData): AddTemplate => {
	switch (data.buildType) {
		case BuildType.dockerfile:
			return {
				buildType: BuildType.dockerfile,
				dockerfile: data.dockerfile || "",
				dockerContextPath: data.dockerContextPath || "",
				dockerBuildStage: data.dockerBuildStage || "",
			};
		case BuildType.heroku_buildpacks:
			return {
				buildType: BuildType.heroku_buildpacks,
				herokuVersion: data.herokuVersion || "",
			};
		case BuildType.nixpacks:
			return {
				buildType: BuildType.nixpacks,
				publishDirectory: data.publishDirectory || undefined,
			};
		case BuildType.paketo_buildpacks:
			return {
				buildType: BuildType.paketo_buildpacks,
			};
		case BuildType.static:
			return {
				buildType: BuildType.static,
				isStaticSpa: data.isStaticSpa ?? false,
			};
		case BuildType.railpack:
			return {
				buildType: BuildType.railpack,
			};
		default: {
			const buildType = data.buildType as BuildType;
			return {
				buildType,
			} as AddTemplate;
		}
	}
};

export const ShowBuildChooseForm = ({ applicationId }: Props) => {
	const { t } = useTranslation("dashboard");
	const { mutateAsync, isLoading } =
		api.application.saveBuildType.useMutation();
	const { data, refetch } = api.application.one.useQuery(
		{ applicationId },
		{ enabled: !!applicationId },
	);

	const form = useForm<AddTemplate>({
		defaultValues: {
			buildType: BuildType.nixpacks,
		},
		resolver: zodResolver(mySchema),
	});

	const buildType = form.watch("buildType");

	useEffect(() => {
		if (data) {
			const typedData: ApplicationData = {
				...data,
				buildType: isValidBuildType(data.buildType)
					? (data.buildType as BuildType)
					: BuildType.nixpacks, // fallback
			};

			form.reset(resetData(typedData));
		}
	}, [data, form]);

	const onSubmit = async (data: AddTemplate) => {
		await mutateAsync({
			applicationId,
			buildType: data.buildType,
			publishDirectory:
				data.buildType === BuildType.nixpacks ? data.publishDirectory : null,
			dockerfile:
				data.buildType === BuildType.dockerfile ? data.dockerfile : null,
			dockerContextPath:
				data.buildType === BuildType.dockerfile ? data.dockerContextPath : null,
			dockerBuildStage:
				data.buildType === BuildType.dockerfile ? data.dockerBuildStage : null,
			herokuVersion:
				data.buildType === BuildType.heroku_buildpacks
					? data.herokuVersion
					: null,
			isStaticSpa:
				data.buildType === BuildType.static ? data.isStaticSpa : null,
		})
			.then(async () => {
				toast.success(t("dashboard.application.build.buildTypeSaved"));
				await refetch();
			})
			.catch(() => {
				toast.error(t("dashboard.application.build.errorSavingBuildType"));
			});
	};

	return (
		<Card className="group relative w-full bg-transparent">
			<CardHeader>
				<CardTitle className="flex items-start justify-between">
					<div className="flex flex-col gap-2">
						<span className="flex flex-col space-y-0.5">
							{t("dashboard.application.build.buildType")}
						</span>
						<p className="flex items-center text-sm font-normal text-muted-foreground">
							{t("dashboard.application.build.buildTypeDescription")}
						</p>
					</div>
					<div className="hidden space-y-1 text-sm font-normal md:block">
						<Cog className="size-6 text-muted-foreground" />
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<AlertBlock>
						{t("dashboard.application.build.resourceWarning")}{" "}
						<a
							href="https://docs.dokploy.com/docs/core/applications/going-production"
							target="_blank"
							rel="noreferrer"
							className="font-medium underline underline-offset-4"
						>
							{t("dashboard.application.build.productionGuide")}
						</a>{" "}
						{t("dashboard.application.build.resourceWarningEnd")}
					</AlertBlock>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4 p-2"
					>
						<FormField
							control={form.control}
							name="buildType"
							defaultValue={form.control._defaultValues.buildType}
							render={({ field }) => (
								<FormItem className="space-y-3">
									<FormLabel>
										{t("dashboard.application.build.buildType")}
									</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											value={field.value}
											className="flex flex-col space-y-1"
										>
											{Object.entries(buildTypeDisplayMap).map(([value]) => (
												<FormItem
													key={value}
													className="flex items-center space-x-3 space-y-0"
												>
													<FormControl>
														<RadioGroupItem value={value} />
													</FormControl>
													<FormLabel className="font-normal">
														{t(
															`dashboard.application.build.buildTypes.${value}`,
														)}
														{value === BuildType.railpack && (
															<Badge className="ml-2 px-1 text-xs">
																{t("dashboard.application.build.new")}
															</Badge>
														)}
													</FormLabel>
												</FormItem>
											))}
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{buildType === BuildType.heroku_buildpacks && (
							<FormField
								control={form.control}
								name="herokuVersion"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{t("dashboard.application.build.herokuVersion")}
										</FormLabel>
										<FormControl>
											<Input
												placeholder={t(
													"dashboard.application.build.herokuVersionPlaceholder",
												)}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{buildType === BuildType.dockerfile && (
							<>
								<FormField
									control={form.control}
									name="dockerfile"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("dashboard.application.build.dockerFile")}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"dashboard.application.build.dockerFilePlaceholder",
													)}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="dockerContextPath"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												{t("dashboard.application.build.dockerContextPath")}
											</FormLabel>
											<FormControl>
												<Input
													placeholder={t(
														"dashboard.application.build.dockerContextPathPlaceholder",
													)}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="dockerBuildStage"
									render={({ field }) => (
										<FormItem>
											<div className="space-y-0.5">
												<FormLabel>
													{t("dashboard.application.build.dockerBuildStage")}
												</FormLabel>
												<FormDescription>
													{t(
														"dashboard.application.build.dockerBuildStageDescription",
													)}
												</FormDescription>
											</div>
											<FormControl>
												<Input
													placeholder={t(
														"dashboard.application.build.dockerBuildStagePlaceholder",
													)}
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
										</FormItem>
									)}
								/>
							</>
						)}
						{buildType === BuildType.nixpacks && (
							<FormField
								control={form.control}
								name="publishDirectory"
								render={({ field }) => (
									<FormItem>
										<div className="space-y-0.5">
											<FormLabel>
												{t("dashboard.application.build.publishDirectory")}
											</FormLabel>
											<FormDescription>
												{t(
													"dashboard.application.build.publishDirectoryDescription",
												)}
											</FormDescription>
										</div>
										<FormControl>
											<Input
												placeholder={t(
													"dashboard.application.build.publishDirectoryPlaceholder",
												)}
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{buildType === BuildType.static && (
							<FormField
								control={form.control}
								name="isStaticSpa"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<div className="flex items-center gap-x-2 p-2">
												<Checkbox
													id="checkboxIsStaticSpa"
													value={String(field.value)}
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
												<FormLabel htmlFor="checkboxIsStaticSpa">
													{t(
														"dashboard.application.build.singlePageApplication",
													)}
												</FormLabel>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						<div className="flex w-full justify-end">
							<Button isLoading={isLoading} type="submit">
								{t("dashboard.application.build.save")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};
