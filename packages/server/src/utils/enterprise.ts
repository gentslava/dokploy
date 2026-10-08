export const LICENSE_KEY_URL = "https://licenses-api.dokploy.com";

// This fork handles enterprise activation locally. Keep the API and cron on
// the same implementation so a remote check cannot invalidate local activation.
export const validateLicenseKey = async (_licenseKey: string) => true;

export const activateLicenseKey = async (_licenseKey: string) => true;

export const deactivateLicenseKey = async (_licenseKey: string) => true;
