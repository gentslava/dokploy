import { cn } from "@/lib/utils";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import type React from "react";
import { GithubIcon } from "../icons/data-tools-icons";
import { Logo } from "../shared/logo";
import { Button } from "../ui/button";

interface Props {
	children: React.ReactNode;
}
export const OnboardingLayout = ({ children }: Props) => {
	const { t } = useTranslation("common");

	return (
		<div className="container relative min-h-svh flex-col items-center justify-center flex lg:max-w-none lg:grid lg:grid-cols-2 lg:px-0 w-full">
			<div className="relative hidden h-full flex-col  p-10 text-primary dark:border-r lg:flex">
				<div className="absolute inset-0 bg-muted" />
				<Link
					href="https://dokploy.com"
					className="relative z-20 flex items-center text-lg font-medium gap-4  text-primary"
				>
					<Logo className="size-10" />
					{t("common.brand.dokploy")}
				</Link>
				<div className="relative z-20 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-lg text-primary">{t("common.brand.tagline")}</p>
					</blockquote>
				</div>
			</div>
			<div className="w-full">
				<div className="flex w-full flex-col justify-center space-y-6 max-w-lg mx-auto">
					{children}
				</div>
				<div className="flex items-center gap-4 justify-center absolute bottom-4 right-4 text-muted-foreground">
					<Button variant="ghost" size="icon">
						<Link href="https://github.com/dokploy/dokploy">
							<GithubIcon />
						</Link>
					</Button>
					<Button variant="ghost" size="icon">
						<Link href="https://x.com/getdokploy">
							<svg
								stroke="currentColor"
								fill="currentColor"
								strokeWidth="0"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								className="size-5"
							>
								<path d="M10.4883 14.651L15.25 21H22.25L14.3917 10.5223L20.9308 3H18.2808L13.1643 8.88578L8.75 3H1.75L9.26086 13.0145L2.31915 21H4.96917L10.4883 14.651ZM16.25 19L5.75 5H7.75L18.25 19H16.25Z" />
							</svg>
						</Link>
					</Button>
					<Button variant="ghost" size="icon">
						<Link href="https://discord.com/invite/2tBnJ3jDJc">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 48 48"
								width="48px"
								height="48px"
								className={cn("size-6")}
							>
								<path
									fill="currentColor"
									d="M39.248,10.177c-2.804-1.287-5.812-2.235-8.956-2.778c-0.057-0.01-0.114,0.016-0.144,0.068	c-0.387,0.688-0.815,1.585-1.115,2.291c-3.382-0.506-6.747-0.506-10.059,0c-0.3-0.721-0.744-1.603-1.133-2.291	c-0.03-0.051-0.087-0.077-0.144-0.068c-3.143,0.541-6.15,1.489-8.956,2.778c-0.024,0.01-0.045,0.028-0.059,0.051	c-5.704,8.522-7.267,16.835-6.5,25.044c0.003,0.04,0.026,0.079,0.057,0.103c3.763,2.764,7.409,4.442,10.987,5.554	c0.057,0.017,0.118-0.003,0.154-0.051c0.846-1.156,1.601-2.374,2.248-3.656c0.038-0.075,0.002-0.164-0.076-0.194	c-1.197-0.454-2.336-1.007-3.432-1.636c-0.087-0.051-0.094-0.175-0.014-0.234c0.231-0.173,0.461-0.353,0.682-0.534	c0.04-0.033,0.095-0.04,0.142-0.019c7.201,3.288,14.997,3.288,22.113,0c0.047-0.023,0.102-0.016,0.144,0.017	c0.22,0.182,0.451,0.363,0.683,0.536c0.08,0.059,0.075,0.183-0.012,0.234c-1.096,0.641-2.236,1.182-3.434,1.634	c-0.078,0.03-0.113,0.12-0.075,0.196c0.661,1.28,1.415,2.498,2.246,3.654c0.035,0.049,0.097,0.07,0.154,0.052	c3.595-1.112,7.241-2.79,11.004-5.554c0.033-0.024,0.054-0.061,0.057-0.101c0.917-9.491-1.537-17.735-6.505-25.044	C39.293,10.205,39.272,10.187,39.248,10.177z M16.703,30.273c-2.168,0-3.954-1.99-3.954-4.435s1.752-4.435,3.954-4.435	c2.22,0,3.989,2.008,3.954,4.435C20.658,28.282,18.906,30.273,16.703,30.273z M31.324,30.273c-2.168,0-3.954-1.99-3.954-4.435	s1.752-4.435,3.954-4.435c2.22,0,3.989,2.008,3.954,4.435C35.278,28.282,33.544,30.273,31.324,30.273z"
								/>
							</svg>
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
};
