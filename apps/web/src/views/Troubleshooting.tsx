import React, { useState, useEffect } from "react";
import { Button } from "../components/button";
import { getVideoPublishJobStatus, retryVideoPublishJob } from "../lib/api"; // Import API functions

interface DisplayedError {
  code: string;
  message: string;
  cause: string;
  resolution: string;
  docLink?: string;
}

const allPossibleErrors: DisplayedError[] = [
  {
    code: "SEARCH-YT-QUOTA_EXCEEDED",
    message: "Le quota de l'API YouTube a été dépassé.",
    cause: "Appels excessifs à l'API YouTube dans une courte période.",
    resolution:
      "Attendez que le quota se réinitialise (généralement à minuit, heure du Pacifique) ou demandez une augmentation de quota sur la console Google Cloud.",
  },
  {
    code: "SEARCH-YT-API_KEY_MISSING",
    message: "La clé API YouTube est manquante ou invalide.",
    cause:
      "La clé API nécessaire pour les requêtes YouTube n'est pas configurée côté serveur.",
    resolution:
      "L'administrateur doit ajouter une clé API YouTube valide dans la configuration du serveur.",
  },
  {
    code: "PUBLISH-VIDEO-UNSUPPORTED_RATIO",
    message:
      "Le ratio de votre vidéo n’est pas supporté par un des réseaux ciblés.",
    cause:
      "Chaque réseau social a ses propres ratios vidéo recommandés (ex: 9:16 pour les Stories, 16:9 pour YouTube).",
    resolution:
      "Utilisez un éditeur vidéo pour recadrer votre vidéo aux dimensions recommandées pour le réseau cible avant de la publier.",
  },
  {
    code: "PUBLISH-VIDEO-UNSUPPORTED_DURATION",
    message: "La durée de votre vidéo dépasse la limite pour certains réseaux.",
    cause:
      "La vidéo est plus longue que la durée maximale autorisée par une des plateformes.",
    resolution:
      "Raccourcissez la vidéo pour qu'elle respecte les limites de toutes les plateformes ciblées.",
  },
  {
    code: "PUBLISH-VIDEO-FILE_TOO_LARGE",
    message:
      "La taille de votre vidéo dépasse la limite pour certains réseaux.",
    cause:
      "Le fichier vidéo est plus lourd que la taille maximale autorisée par une des plateformes.",
    resolution:
      "Compressez ou ré-encodez la vidéo à une résolution inférieure pour réduire sa taille.",
  },
  {
    code: "PUBLISH-VIDEO-FFMPEG_ERROR",
    message: "Une erreur est survenue lors du traitement vidéo (FFmpeg).",
    cause:
      "Une erreur inattendue s'est produite durant le re-encodage ou l'analyse de la vidéo.",
    resolution:
      "Vérifiez que le format de la vidéo est standard (ex: MP4 H.264). Si l'erreur persiste, contactez le support en joignant les logs.",
  },
  {
    code: "PUBLISH-VIDEO-MISSING_CREDENTIALS",
    message:
      "Identifiants de publication manquants ou invalides pour un réseau.",
    cause:
      "L'application n'a pas les permissions nécessaires pour publier sur un ou plusieurs des comptes sélectionnés.",
    resolution:
      "Allez dans les paramètres des comptes et reconnectez le ou les comptes posant problème pour rafraîchir les autorisations.",
  },
  {
    code: "AUTH-TOKEN-EXPIRED",
    message: "Votre session a expiré. Veuillez vous reconnecter.",
    cause:
      "La session de connexion sécurisée a expiré pour des raisons de sécurité.",
    resolution:
      "Reconnectez-vous à l'application pour démarrer une nouvelle session.",
  },
  {
    code: "GENERAL-UNKNOWN_ERROR",
    message: "Une erreur inattendue est survenue.",
    cause: "Une erreur non cataloguée s'est produite.",
    resolution:
      "Essayez de répéter l'action. Si l'erreur persiste, exportez les logs et contactez le support.",
  },
];

export function Troubleshooting() {
  const [failedJobs, setFailedJobs] = useState<any[]>([]);

  // In a real app, you would fetch failed jobs from the backend
  useEffect(() => {
    // Mock fetching failed jobs
    const mockFailedJobs: any[] = [
      {
        id: "job-fail-1",
        payload: {
          videoPath: "/tmp/video1.mp4",
          title: "My Failed Video 1",
          networks: ["YOUTUBE"],
        },
        status: "FAILED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduledFor: null,
        error: {
          code: "PUBLISH-VIDEO-UPLOAD_FAILED",
          message: "Simulated upload failure to YouTube",
        },
        retryCount: 3,
        lastAttempt: new Date().toISOString(),
      },
      {
        id: "job-fail-2",
        payload: {
          videoPath: "/tmp/video2.mp4",
          title: "My Failed Video 2",
          networks: ["INSTAGRAM", "FACEBOOK"],
        },
        status: "FAILED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scheduledFor: null,
        error: {
          code: "PUBLISH-VIDEO-UNSUPPORTED_RATIO",
          message: "Video ratio not supported for Instagram",
        },
        retryCount: 1,
        lastAttempt: new Date().toISOString(),
      },
    ];
    setFailedJobs(mockFailedJobs);
  }, []);

  const exportLogs = async () => {
    try {
      const res = await fetch("/api/logs/export");
      if (!res.ok) {
        throw new Error(`Failed to fetch logs: ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "influence_logs.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      alert("Logs téléchargés avec succès!");
    } catch (error: unknown) {
      console.error("Error exporting logs:", error);
      if (error instanceof Error) {
        alert(`Échec de l'exportation des logs: ${error.message}`);
      } else {
        alert("Échec de l'exportation des logs: une erreur inconnue est survenue.");
      }
    }
  };

  const replayFailedTask = async (jobId: string) => {
    try {
      const res = await retryVideoPublishJob(jobId);
      alert(res.message);
      // Update job status in UI if necessary, by refetching or updating state
      const updatedJobResponse = await getVideoPublishJobStatus(jobId);
      setFailedJobs((prevJobs) =>
        prevJobs.map((job) => (job.id === jobId ? updatedJobResponse.job : job))
      );
    } catch (error: unknown) {
      console.error(`Error replaying job ${jobId}:`, error);
      if (error instanceof Error) {
        alert(`Échec du rejeu de la tâche ${jobId}: ${error.message}`);
      } else {
        alert("Échec du rejeu de la tâche: une erreur inconnue est survenue.");
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dépannage</h1>

      <section className="mb-6 p-4 bg-white rounded shadow dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-3">
          Codes d&apos;erreur et résolutions
        </h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Si vous rencontrez des problèmes, consultez les codes d&apos;erreur
          ci-dessous pour trouver une solution. Si le problème persiste,
          exportez vos logs et contactez le support.
        </p>
        <div className="space-y-4">
          {allPossibleErrors.map((error, index) => (
            <div
              key={index}
              className="border-l-4 border-red-500 pl-3 py-2 bg-red-50 dark:bg-red-900/20"
            >
              <h3 className="font-mono text-red-700 dark:text-red-300">
                {error.code}
              </h3>
              <p className="text-gray-800 dark:text-gray-200">
                <strong>Message:</strong> {error.message}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Cause:</strong> {error.cause}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Résolution:</strong> {error.resolution}
              </p>
              {error.docLink && (
                <a
                  href={error.docLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-700 hover:underline dark:text-blue-300"
                >
                  Voir la documentation
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 p-4 bg-white rounded shadow dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-3">Actions de support</h2>
        <Button
          onClick={exportLogs}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 dark:bg-blue-600 dark:hover:bg-blue-800"
        >
          Exporter les logs (TXT)
        </Button>
      </section>

      <section className="mb-6 p-4 bg-white rounded shadow dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-3">
          Tâches de publication échouées
        </h2>
        {failedJobs.length === 0 ? (
          <p className="text-gray-500">Aucune tâche échouée.</p>
        ) : (
          <ul className="space-y-3">
            {failedJobs.map((job) => (
              <li
                key={job.id}
                className="border rounded-lg p-3 bg-red-50 dark:bg-red-900/20"
              >
                <p className="font-semibold">ID de la tâche: {job.id}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Titre vidéo: {job.payload.title}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Réseaux: {job.payload.networks.join(", ")}
                </p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Erreur: {job.error?.message || "Erreur inconnue"}
                </p>
                <Button
                  onClick={() => replayFailedTask(job.id)}
                  className="mt-2 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Rejouer cette tâche
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
