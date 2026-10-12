import { useEffect, useRef, useState } from "react";

export interface Route {
  page: string;
  id: string;
  query: URLSearchParams;
}

function currentRoute(): Route {
  const [path, query = ""] = window.location.hash.slice(1).split("?");
  const [page = "home", id = ""] = (path || "/home")
    .replace(/^\//, "")
    .split("/");
  return { page, id, query: new URLSearchParams(query) };
}

export function useRoute() {
  const [route, setRoute] = useState(currentRoute);
  const previousRoute = useRef(route);
  useEffect(() => {
    const handle = () => {
      const next = currentRoute();
      const previous = previousRoute.current;
      const localChange =
        previous.page === next.page &&
        previous.id === next.id &&
        (next.page === "review" ||
          next.page === "unit" ||
          next.page === "playlist" ||
          (next.page === "library" &&
            previous.query.get("subject") === next.query.get("subject")));
      previousRoute.current = next;
      setRoute(next);
      // Local tabs and filters retain their keyboard focus and scroll context.
      if (localChange) return;
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>("main h1")
          ?.focus({ preventScroll: true }),
      );
    };
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  return route;
}
