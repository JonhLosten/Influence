import React, { useState } from "react";
import { createVideoPublishJob, getVideoPublishJobStatus } from "../lib/api";
import { useLanguage } from "../i18n";
import { Button } from "../components/button";
import { Input } from "../components/Input";

export function VideoPublisher() {
  const { t } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPath, setVideoPath] = useState<string>(""); // This will store the path on the server for mock/Electron
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableNetworks: string[] = [
    "YOUTUBE",
    "INSTAGRAM",
    "TIKTOK",
    "FACEBOOK",
    "X",
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setVideoFile(file);
      // In a real Electron app, you'd send the file to the main process
      // which would then save it to a temporary server-accessible location.
      // For this mock, we'll just use a placeholder path.
      setVideoPath(`/tmp/uploads/${file.name}`); // Mock server path
    }
  };

  const handleNetworkChange = (network: string) => {
    setSelectedNetworks((prev) =>
      prev.includes(network)
        ? prev.filter((n) => n !== network)
        : [...prev, network]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!videoPath || !title || selectedNetworks.length === 0) {
      alert(
        "Please fill in all required fields: video file, title, and select at least one network."
      );
      return;
    }

    setLoading(true);
    setJobError(null);
    setJobId(null);
    setJobStatus(null);

    const payload: any = {
      videoPath,
      title,
      description,
      networks: selectedNetworks,
      scheduleTime: scheduleTime || undefined,
    };

    try {
      const response = await createVideoPublishJob(payload);
      setJobId(response.jobId);
      setJobStatus(response.status);
      // Start polling for job status
      const interval = setInterval(async () => {
        try {
          const statusResponse = await getVideoPublishJobStatus(response.jobId);
          setJobStatus(statusResponse.job.status);
          if (
            statusResponse.job.status === "PUBLISHED" ||
            statusResponse.job.status === "FAILED"
          ) {
            clearInterval(interval);
            if (statusResponse.job.error) {
              setJobError(statusResponse.job.error.message);
            }
            setLoading(false);
          }
        } catch (statusError) {
          console.error("Failed to fetch job status:", statusError);
          clearInterval(interval);
          setJobError("Failed to monitor job status.");
          setLoading(false);
        }
      }, 5000); // Poll every 5 seconds
    } catch (error) {
      console.error("Failed to create publish job:", error);
      setJobError(
        error.message ||
          "An unknown error occurred while creating the publishing job."
      );
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto">
      <h2 className="text-2xl font-bold mb-4">{t("videoPublisher.title")}</h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div>
          <label
            htmlFor="videoFile"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("videoPublisher.selectVideo")}
          </label>
          <input
            type="file"
            id="videoFile"
            accept="video/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
          />
          {videoFile && (
            <p className="mt-2 text-sm text-gray-500">
              Fichier sélectionné: {videoFile.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("videoPublisher.videoTitle")}
          </label>
          <Input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("videoPublisher.videoTitlePlaceholder")}
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("videoPublisher.videoDescription")}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder={t("videoPublisher.videoDescriptionPlaceholder")}
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("videoPublisher.selectNetworks")}
          </label>
          <div className="flex flex-wrap gap-3">
            {availableNetworks.map((network) => (
              <label key={network} className="inline-flex items-center">
                <input
                  type="checkbox"
                  value={network}
                  checked={selectedNetworks.includes(network)}
                  onChange={() => handleNetworkChange(network)}
                  className="form-checkbox h-5 w-5 text-blue-600 rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="ml-2 text-gray-700 capitalize dark:text-gray-300">
                  {network}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="scheduleTime"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t("videoPublisher.scheduleTime")}
          </label>
          <Input
            type="datetime-local"
            id="scheduleTime"
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("videoPublisher.scheduleTimeHint")}
          </p>
        </div>

        <Button type="submit" disabled={loading}>
          {loading
            ? t("videoPublisher.publishing")
            : t("videoPublisher.publishButton")}
        </Button>
      </form>

      {jobId && ( // Display job status
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">
            {t("videoPublisher.jobStatus")}
          </h3>
          <p>
            <strong>Job ID:</strong> {jobId}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`font-semibold ${jobStatus === "PUBLISHED" ? "text-green-600" : jobStatus === "FAILED" ? "text-red-600" : "text-blue-600"}`}
            >
              {jobStatus}
            </span>
          </p>
          {jobError && (
            <p className="text-red-500 mt-2">
              <strong>Error:</strong> {jobError}
            </p>
          )}
          {jobStatus !== "PUBLISHED" && jobStatus !== "FAILED" && (
            <p className="mt-2 text-sm text-gray-500">
              {t("videoPublisher.statusMonitoring")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
