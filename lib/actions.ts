import { revalidatePath } from "next/cache";

export function refreshAppRoutes() {
  ["/", "/entry", "/goals", "/recommendations", "/settings"].forEach((path) =>
    revalidatePath(path)
  );
}
