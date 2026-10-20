// Invite links: /j/K7Q2AB opens the game and joins that Round Table.
export function onRequest({ request, params }) {
  const code = String(params.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const url = new URL(request.url);
  return Response.redirect(`${url.origin}/?t=${code}`, 302);
}
