import { ShowBilling } from "@/components/dashboard/settings/billing/show-billing";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export const ShowWelcomeDokploy = () => {
	const { t } = useTranslation("settings");
	const { data } = api.user.get.useQuery();
	const [open, setOpen] = useState(false);

	const { data: isCloud, isLoading } = api.settings.isCloud.useQuery();

	if (!isCloud || data?.role !== "admin") {
		return null;
	}

	useEffect(() => {
		if (
			!isLoading &&
			isCloud &&
			!localStorage.getItem("hasSeenCloudWelcomeModal") &&
			data?.role === "owner"
		) {
			setOpen(true);
		}
	}, [isCloud, isLoading]);

	const handleClose = (isOpen: boolean) => {
		if (data?.role === "owner") {
			setOpen(isOpen);
			if (!isOpen) {
				localStorage.setItem("hasSeenCloudWelcomeModal", "true"); // Establece el flag al cerrar el modal
			}
		}
	};

	return (
		<>
			<Dialog open={open} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-xl">
					<DialogHeader>
						<DialogTitle className="text-2xl font-semibold text-center">
							{t("settings.billing.welcome.title")}
						</DialogTitle>
						<p className="text-center text-sm text-muted-foreground mt-2">
							{t("settings.billing.welcome.description")}
						</p>
					</DialogHeader>
					<div className="mt-4 space-y-3 text-sm text-primary ">
						<ShowBilling />
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
