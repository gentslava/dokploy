import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { type TFunction, useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const buildConcurrencySchema = (t: TFunction) => z.object({
  concurrency: z
    .string()
    .min(1, t("settings.buildConcurrency.concurrencyRequired"))
    .refine((val) => {
      const num = Number.parseInt(val, 10);
      return !Number.isNaN(num) && num >= 1;
    }, t("settings.buildConcurrency.concurrencyMustBeAtLeast1"))
    .refine((val) => {
      const num = Number.parseInt(val, 10);
      return !Number.isNaN(num) && num <= 20;
    }, t("settings.buildConcurrency.concurrencyCannotExceed20")),
});

type BuildConcurrencyForm = ReturnType<typeof buildConcurrencySchema>["_type"];

export const BuildConcurrencyModal = ({ serverId }: { serverId?: string }) => {
	const { t } = useTranslation("settings");
	const [isOpen, setIsOpen] = useState(false);
	const { data: buildsConcurrency, refetch } =
		api.settings.getBuildsConcurrency.useQuery({ serverId });
	const { mutateAsync: changeBuildsConcurrency, isLoading } =
		api.settings.changeBuildsConcurrency.useMutation();

	const form = useForm<BuildConcurrencyForm>({
		resolver: zodResolver(buildConcurrencySchema(t)),
		defaultValues: {
			concurrency: (buildsConcurrency || 1).toString(),
		},
	});

	useEffect(() => {
		form.reset({
			concurrency: (buildsConcurrency || 1).toString(),
		});
	}, [buildsConcurrency]);

	const onSubmit = async (data: BuildConcurrencyForm) => {
		try {
			const concurrency = Number.parseInt(data.concurrency, 10);
			await changeBuildsConcurrency({ concurrency, serverId });
			toast.success(
				t("settings.buildConcurrency.buildConcurrencyUpdatedSuccessfully"),
			);
			setIsOpen(false);
			form.reset({
				concurrency: (concurrency || 1).toString(),
			});
			refetch();
		} catch {
			toast.error(
				t("settings.buildConcurrency.failedToUpdateBuildConcurrency"),
			);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer"
					onSelect={(e) => e.preventDefault()}
				>
					<span>{t("settings.buildConcurrency.changeBuildsConcurrency")}</span>
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t("settings.buildConcurrency.changeBuildConcurrency")}
					</DialogTitle>
					<DialogDescription>
						{t("settings.buildConcurrency.setConcurrentBuilds")}
					</DialogDescription>
				</DialogHeader>

				<AlertBlock type="warning">
					<div className="font-medium mb-2">
						{t("settings.buildConcurrency.resourceRequirements")}
					</div>
					<div className="text-sm space-y-1">
						<p>{t("settings.buildConcurrency.eachConcurrentBuild")}</p>
						<ul className="list-disc list-inside ml-2">
							<li>{t("settings.buildConcurrency.twoVcpus")}</li>
							<li>{t("settings.buildConcurrency.fourGbRam")}</li>
						</ul>
						<p className="mt-2">
							{t("settings.buildConcurrency.makeSureServer")}
						</p>
					</div>
				</AlertBlock>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="concurrency"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{t("settings.buildConcurrency.concurrentBuilds")}
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder={t(
												"settings.buildConcurrency.concurrencyPlaceholder",
											)}
											{...field}
											value={field.value || ""}
											onChange={(e) => {
												const value = e.target.value;
												// Allow empty input or valid numbers
												if (value === "" || /^\d+$/.test(value)) {
													field.onChange(value);
												}
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
							>
								{t("settings.buildConcurrency.cancel")}
							</Button>
							<Button type="submit" isLoading={isLoading}>
								{t("settings.buildConcurrency.updateConcurrency")}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
