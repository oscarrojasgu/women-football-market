import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set([
  "images.fotmob.com",
  "www.soccerdonna.de",
  "commons.wikimedia.org",
  "www.racingloufc.com",
  "cdn.sanity.io",
  "images.mlssoccer.com",
  "www.kansascitycurrent.com",
  "www.topdrawersoccer.com",
  "www.denversummitfc.com",
  "images.squarespace-cdn.com",
  "images.sidearmdev.com",
  "chicagostars.com",
  "washingtonspirit.com",
  "images.nccourage.com",
  "ypdamswhioaoqbersxjk.supabase.co",
]);

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return new Response("Missing image URL", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid image URL", { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Image host not allowed", { status: 403 });
  }

  try {
    const response = await fetch(target.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WomensFootballMarket/1.0)",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return new Response("Image unavailable", { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new Response("Resource is not an image", { status: 415 });
    }

    return new Response(await response.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Unable to fetch image", { status: 502 });
  }
}
