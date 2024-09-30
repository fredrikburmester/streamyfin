import { itemRouter } from "@/components/common/TouchableItemRouter";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client";
import axios from "axios";

interface IJobInput {
  deviceId: string;
  authHeader: string;
  url: string;
}

export interface JobStatus {
  id: string;
  status:
    | "queued"
    | "optimizing"
    | "completed"
    | "failed"
    | "cancelled"
    | "downloading";
  progress: number;
  outputPath: string;
  inputUrl: string;
  deviceId: string;
  itemId: string;
  item: Partial<BaseItemDto>;
  speed?: number;
  timestamp: Date;
}

/**
 * Fetches all jobs for a specific device.
 *
 * @param {IGetAllDeviceJobs} params - The parameters for the API request.
 * @param {string} params.deviceId - The ID of the device to fetch jobs for.
 * @param {string} params.authHeader - The authorization header for the API request.
 * @param {string} params.url - The base URL for the API endpoint.
 *
 * @returns {Promise<JobStatus[]>} A promise that resolves to an array of job statuses.
 *
 * @throws {Error} Throws an error if the API request fails or returns a non-200 status code.
 */
export async function getAllJobsByDeviceId({
  deviceId,
  authHeader,
  url,
}: IJobInput): Promise<JobStatus[]> {
  const statusResponse = await axios.get(`${url}all-jobs`, {
    headers: {
      Authorization: authHeader,
    },
    params: {
      deviceId,
    },
  });
  if (statusResponse.status !== 200) {
    throw new Error("Failed to fetch job status");
  }

  return statusResponse.data;
}

interface ICancelJob {
  authHeader: string;
  url: string;
  id: string;
}

export async function cancelJobById({
  authHeader,
  url,
  id,
}: ICancelJob): Promise<boolean> {
  const statusResponse = await axios.delete(`${url}cancel-job/${id}`, {
    headers: {
      Authorization: authHeader,
    },
  });
  if (statusResponse.status !== 200) {
    throw new Error("Failed to cancel process");
  }

  return true;
}

export async function cancelAllJobs({ authHeader, url, deviceId }: IJobInput) {
  try {
    await getAllJobsByDeviceId({
      deviceId,
      authHeader,
      url,
    }).then((jobs) => {
      jobs.forEach((job) => {
        cancelJobById({
          authHeader,
          url,
          id: job.id,
        });
      });
    });
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
}
