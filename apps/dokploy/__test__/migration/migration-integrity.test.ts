import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationsDirectory = fileURLToPath(
	new URL("../../drizzle/", import.meta.url),
);

describe("Drizzle migrations", () => {
	it("makes the domain.enabled migration safe to replay", async () => {
		const sql = (
			await readFile(`${migrationsDirectory}/0183_tearful_groot.sql`, "utf8")
		).trim();

		expect(sql).toBe(
			'ALTER TABLE "domain" ADD COLUMN IF NOT EXISTS "enabled" boolean DEFAULT true NOT NULL;',
		);
	});

	// The fork applies this column before upstream ships its own migration for
	// it, so the upstream one must be able to run on top of it and vice versa.
	it("makes the previewStackedPullRequests migration safe to replay", async () => {
		const sql = (
			await readFile(
				`${migrationsDirectory}/0206_wealthy_doctor_spectrum.sql`,
				"utf8",
			)
		).trim();

		expect(sql).toBe(
			'ALTER TABLE "application" ADD COLUMN IF NOT EXISTS "previewStackedPullRequests" boolean DEFAULT false NOT NULL;',
		);
	});
});
