import { handleReport } from "@/lib/reports-server";

/** Development path only: deployed Workers answer /api/reports in worker/entry.ts. */
export { handleReport as POST };
