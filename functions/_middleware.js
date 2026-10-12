// Send visitors on the old pages.dev address to the game's home, passpmp.wesimai.com,
// so every play is counted in one place. Preview deployments (<hash>.pass-the-pmp.pages.dev) are left alone.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === "pass-the-pmp.pages.dev") {
    url.hostname = "passpmp.wesimai.com";
    return Response.redirect(url.toString(), 301);
  }
  return next();
}
