import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/kernel/identidad/auth";

export const { GET, POST } = toNextJsHandler(auth);
