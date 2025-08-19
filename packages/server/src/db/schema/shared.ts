import { pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod";

export const applicationStatus = pgEnum("applicationStatus", [
	"idle",
	"running",
	"done",
	"error",
]);

export const certificateType = pgEnum("certificateType", [
	"letsencrypt",
	"none",
	"custom",
]);

export const triggerType = pgEnum("triggerType", ["push", "tag"]);

export interface HealthCheckSwarm {
	Test?: string[] | undefined;
	Interval?: number | undefined;
	Timeout?: number | undefined;
	StartPeriod?: number | undefined;
	Retries?: number | undefined;
}

export interface RestartPolicySwarm {
	Condition?: string | undefined;
	Delay?: number | undefined;
	MaxAttempts?: number | undefined;
	Window?: number | undefined;
}

export interface PlacementSwarm {
	Constraints?: string[] | undefined;
	Preferences?: Array<{ Spread: { SpreadDescriptor: string } }> | undefined;
	MaxReplicas?: number | undefined;
	Platforms?:
		| Array<{
				Architecture: string;
				OS: string;
		  }>
		| undefined;
}

export interface UpdateConfigSwarm {
	Parallelism: number;
	Delay?: number | undefined;
	FailureAction?: string | undefined;
	Monitor?: number | undefined;
	MaxFailureRatio?: number | undefined;
	Order: string;
}

export interface ServiceModeSwarm {
	Replicated?: { Replicas?: number | undefined } | undefined;
	Global?: {} | undefined;
	ReplicatedJob?:
		| {
				MaxConcurrent?: number | undefined;
				TotalCompletions?: number | undefined;
		  }
		| undefined;
	GlobalJob?: {} | undefined;
}

export interface NetworkSwarm {
	Target?: string | undefined;
	Aliases?: string[] | undefined;
	DriverOpts?: { [key: string]: string } | undefined;
}

export interface LabelsSwarm {
	[name: string]: string;
}

export const HealthCheckSwarmSchema = z.strictObject({
	Test: z.array(z.string()).optional(),
	Interval: z.number().optional(),
	Timeout: z.number().optional(),
	StartPeriod: z.number().optional(),
	Retries: z.number().optional(),
});

export const RestartPolicySwarmSchema = z.strictObject({
	Condition: z.string().optional(),
	Delay: z.number().optional(),
	MaxAttempts: z.number().optional(),
	Window: z.number().optional(),
});

export const PreferenceSchema = z.strictObject({
	Spread: z.strictObject({
		SpreadDescriptor: z.string(),
	}),
});

export const PlatformSchema = z.strictObject({
	Architecture: z.string(),
	OS: z.string(),
});

export const PlacementSwarmSchema = z.strictObject({
	Constraints: z.array(z.string()).optional(),
	Preferences: z.array(PreferenceSchema).optional(),
	MaxReplicas: z.number().optional(),
	Platforms: z.array(PlatformSchema).optional(),
});

export const UpdateConfigSwarmSchema = z.strictObject({
	Parallelism: z.number(),
	Delay: z.number().optional(),
	FailureAction: z.string().optional(),
	Monitor: z.number().optional(),
	MaxFailureRatio: z.number().optional(),
	Order: z.string(),
});

export const ReplicatedSchema = z.strictObject({
	Replicas: z.number().optional(),
});

export const ReplicatedJobSchema = z.strictObject({
	MaxConcurrent: z.number().optional(),
	TotalCompletions: z.number().optional(),
});

export const ServiceModeSwarmSchema = z.strictObject({
	Replicated: ReplicatedSchema.optional(),
	Global: z.strictObject({}).optional(),
	ReplicatedJob: ReplicatedJobSchema.optional(),
	GlobalJob: z.strictObject({}).optional(),
});

export const NetworkSwarmSchema = z.array(
	z.strictObject({
		Target: z.string().optional(),
		Aliases: z.array(z.string()).optional(),
		DriverOpts: z.strictObject({}).optional(),
	}),
);

export const LabelsSwarmSchema = z.record(z.string(), z.string());
