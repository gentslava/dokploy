import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationsDirectory = fileURLToPath(
	new URL("../../drizzle/", import.meta.url),
);

describe("Drizzle migrations", () => {
	it("makes the domain.enabled migration safe to replay", async () => {
		const sql = (
			await readFile(
				`${migrationsDirectory}/0175_rare_omega_flight.sql`,
				"utf8",
			)
		).trim();

		expect(sql).toBe(
			'ALTER TABLE "domain" ADD COLUMN IF NOT EXISTS "enabled" boolean DEFAULT true NOT NULL;',
		);
	});
});
