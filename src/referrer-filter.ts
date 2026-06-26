/**
 * Decide whether a referer URL should be excluded from the public referrers list.
 * Filters out local/dev traffic, raw IP addresses, internal hostnames, and
 * throwaway preview/builder domains that aren't real referring sites.
 */
export function shouldExcludeReferrer(parsed: URL): boolean {
	const hostname = parsed.hostname.toLowerCase();

	// Explicit localhost / loopback / unspecified addresses
	if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1') {
		return true;
	}

	// Single-label hostnames (no dot) — e.g. "proxy", "absolute" — can't be real public sites
	if (!hostname.includes('.')) {
		return true;
	}

	// Internal / non-public TLDs and suffixes (.local, k8s cluster, mDNS, etc.)
	if (
		hostname.endsWith('.local') ||
		hostname.endsWith('.localhost') ||
		hostname.endsWith('.internal') ||
		hostname.endsWith('.lan') ||
		hostname.endsWith('.test') ||
		hostname.endsWith('.invalid') ||
		hostname.endsWith('.svc.cluster.local')
	) {
		return true;
	}

	// IPv6 literals (URL hostnames are wrapped in brackets)
	if (hostname.startsWith('[') || hostname.includes(':')) {
		return true;
	}

	// Raw IPv4 addresses (incl. private ranges like 10.x, 172.16-31.x, 192.168.x, 169.254.x)
	const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
	if (ipv4Match) {
		const octets = ipv4Match.slice(1).map(Number);
		if (octets.every((o) => o >= 0 && o <= 255)) {
			return true;
		}
	}

	// Throwaway preview / file-host / temp-site domains, including UUID-style subdomains
	// e.g. https://16f09f9b-15de-4ffc-99e6-753c7822af3c.filesusr.com/
	if (
		hostname.endsWith('.filesusr.com') ||
		hostname.endsWith('.mytemp.website') ||
		hostname.endsWith('.googleusercontent.com')
	) {
		return true;
	}

	// Any subdomain that is a bare UUID — auto-generated preview hosts
	const firstLabel = hostname.split('.')[0];
	if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(firstLabel)) {
		return true;
	}

	return false;
}
