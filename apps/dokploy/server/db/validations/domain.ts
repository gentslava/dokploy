import { z } from "zod";

export const domain = z
	.object({
		host: z.string().min(1, { error: "Add a hostname" }),
		path: z.string().min(1).optional(),
		port: z
			.number()
			.min(1, { error: "Port must be at least 1" })
			.max(65535, { error: "Port must be 65535 or below" })
			.optional(),
		https: z.boolean().optional(),
		certificateType: z.enum(["letsencrypt", "none", "custom"]).optional(),
		customCertResolver: z.string().optional(),
	})
	.superRefine((input, ctx) => {
		if (input.https && !input.certificateType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["certificateType"],
				message: "Required",
			});
		}

		if (input.certificateType === "custom" && !input.customCertResolver) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["customCertResolver"],
				message: "Required",
			});
		}
	});

export const domainCompose = z
	.object({
		host: z.string().min(1, { error: "Host is required" }),
		path: z.string().min(1).optional(),
		port: z
			.number()
			.min(1, { error: "Port must be at least 1" })
			.max(65535, { error: "Port must be 65535 or below" })
			.optional(),
		https: z.boolean().optional(),
		certificateType: z.enum(["letsencrypt", "none", "custom"]).optional(),
		customCertResolver: z.string().optional(),
		serviceName: z.string().min(1, { error: "Service name is required" }),
	})
	.superRefine((input, ctx) => {
		if (input.https && !input.certificateType) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["certificateType"],
				message: "Required",
			});
		}

		if (input.certificateType === "custom" && !input.customCertResolver) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["customCertResolver"],
				message: "Required",
			});
		}
	});
