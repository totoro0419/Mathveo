import { useEffect, useState } from "react";

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
  useEffect(() => {
    const handle = () => {
      setRoute(currentRoute());
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
