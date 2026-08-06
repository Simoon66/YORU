export async function onRequestPost({ request }: any) {
  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
      }
    });

    if (response.status === 404) {
      return new Response(JSON.stringify({ status: "dead", reason: "Status 404" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    const html = await response.text();
    const errorStrings = [
      "Oops! Something went wrong",
      "Error Code: 404",
      "error - megaplay"
    ];

    for (const errStr of errorStrings) {
      if (html.includes(errStr)) {
        return new Response(JSON.stringify({ status: "dead", reason: `Found string: ${errStr}` }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ status: "alive" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ status: "dead", reason: error.message }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}
