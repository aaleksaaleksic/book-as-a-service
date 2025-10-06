import { AxiosInstance } from "axios";
import type { BulkEmailRequest, BulkEmailResponse } from "./types/email.types";

export const emailApi = {
    // Send bulk email
    sendBulkEmail: (client: AxiosInstance, data: BulkEmailRequest) =>
        client.post<BulkEmailResponse>("/api/v1/admin/email/send-bulk", data),
};
