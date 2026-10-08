import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	const where = vi.fn().mockResolvedValue(undefined);
	const set = vi.fn(() => ({ where }));
	return {
		findMany: vi.fn(),
		update: vi.fn(() => ({ set })),
		set,
		scheduleJob: vi.fn(),
		getPublicIp: vi.fn().mockResolvedValue("203.0.113.1"),
	};
});

vi.mock("@dokploy/server/db/index", () => ({
	db: {
		query: { user: { findMany: mocks.findMany } },
		update: mocks.update,
	},
}));

vi.mock("@dokploy/server/db/schema/user", () => ({
	user: {
		id: "id",
		licenseKey: "licenseKey",
		enableEnterpriseFeatures: "enableEnterpriseFeatures",
		isValidEnterpriseLicense: "isValidEnterpriseLicense",
	},
}));

vi.mock("node-schedule", () => ({ scheduleJob: mocks.scheduleJob }));

vi.mock("@dokploy/server/wss/utils", () => ({
	getPublicIpWithFallback: mocks.getPublicIp,
}));

const shared = await import("@dokploy/server/utils/enterprise");
const app = await import("@/server/utils/enterprise");
const { initEnterpriseBackupCronJobs, validateLicenseKey: cronValidate } =
	await import("@dokploy/server/utils/crons/enterprise");

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("local enterprise licenses", () => {
	it("uses the same local validator in the app and scheduled checks", () => {
		expect(app.validateLicenseKey).toBe(shared.validateLicenseKey);
		expect(cronValidate).toBe(shared.validateLicenseKey);
		expect(app.activateLicenseKey).toBe(shared.activateLicenseKey);
		expect(app.deactivateLicenseKey).toBe(shared.deactivateLicenseKey);
	});

	it.each(["", " ", "local-license", "not-issued-by-server"])(
		"returns true unconditionally for %j without network access",
		async (licenseKey) => {
			const fetchMock = vi.fn().mockRejectedValue(new Error("fetch failed"));
			vi.stubGlobal("fetch", fetchMock);

			const results = await Promise.all([
				shared.validateLicenseKey(licenseKey),
				shared.activateLicenseKey(licenseKey),
				shared.deactivateLicenseKey(licenseKey),
			]);

			expect(results).toEqual([true, true, true]);
			expect(fetchMock).not.toHaveBeenCalled();
			expect(mocks.getPublicIp).not.toHaveBeenCalled();
		},
	);

	it("keeps an activated license during the scheduled check without network access", async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error("fetch failed"));
		vi.stubGlobal("fetch", fetchMock);
		mocks.findMany.mockResolvedValue([
			{
				id: "owner-1",
				firstName: "Owner",
				lastName: "",
				licenseKey: "local-license",
				enableEnterpriseFeatures: true,
				isValidEnterpriseLicense: true,
			},
		]);

		await initEnterpriseBackupCronJobs();
		const callback = mocks.scheduleJob.mock
			.calls[0]?.[2] as () => Promise<void>;
		await callback();

		expect(mocks.update).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
		expect(mocks.getPublicIp).not.toHaveBeenCalled();
	});
});
