const publicSiteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || "https://mais-ctrl.vercel.app";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

export function getAuthRedirectUrl(path = "/") {
  const baseUrl = isLocalHost(window.location.hostname) ? publicSiteUrl : window.location.origin;

  return new URL(path, `${baseUrl.replace(/\/$/, "")}/`).toString();
}
