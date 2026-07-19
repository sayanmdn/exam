import { handlers } from "@/auth";

// Co-locate the OAuth callback (which writes users/sessions to Neon) with the DB.
export const preferredRegion = "sin1";

export const { GET, POST } = handlers;
