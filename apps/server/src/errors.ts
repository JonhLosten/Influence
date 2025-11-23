export enum AppErrorCodes {
  // YouTube Search Errors
  SEARCH_YT_NO_RESULTS = "SEARCH-YT-NO_RESULTS",
  SEARCH_YT_NETWORK_DOWN = "SEARCH-YT-NETWORK_DOWN",
  SEARCH_YT_QUOTA_EXCEEDED = "SEARCH-YT-QUOTA_EXCEEDED",
  SEARCH_YT_API_KEY_MISSING = "SEARCH-YT-API_KEY_MISSING",

  // Publish Video Errors
  PUBLISH_VIDEO_UNSUPPORTED_RATIO = "PUBLISH-VIDEO-UNSUPPORTED_RATIO",
  PUBLISH_VIDEO_UNSUPPORTED_DURATION = "PUBLISH-VIDEO-UNSUPPORTED_DURATION",
  PUBLISH_VIDEO_FILE_TOO_LARGE = "PUBLISH-VIDEO-FILE_TOO_LARGE",
  PUBLISH_VIDEO_FFMPEG_ERROR = "PUBLISH-VIDEO-FFMPEG_ERROR",
  PUBLISH_VIDEO_UPLOAD_FAILED = "PUBLISH-VIDEO-UPLOAD_FAILED",
  PUBLISH_VIDEO_NETWORK_ERROR = "PUBLISH-VIDEO-NETWORK_ERROR",
  PUBLISH_VIDEO_MISSING_CREDENTIALS = "PUBLISH-VIDEO-MISSING_CREDENTIALS",
  PUBLISH_VIDEO_AYRSHARE_ERROR = "PUBLISH-VIDEO-AYRSHARE_ERROR",

  // Authentication Errors
  AUTH_TOKEN_EXPIRED = "AUTH-TOKEN-EXPIRED",
  AUTH_INVALID_TOKEN = "AUTH-INVALID-TOKEN",
  AUTH_MISSING_TOKEN = "AUTH-TOKEN-MISSING",

  // General Errors
  GENERAL_UNKNOWN_ERROR = "GENERAL-UNKNOWN_ERROR",
  GENERAL_INVALID_PARAMS = "GENERAL-INVALID_PARAMS",
  GENERAL_NOT_FOUND = "GENERAL-NOT_FOUND",
}

export class AppError extends Error {
  code: AppErrorCodes;
  details?: Record<string, any>;

  constructor(
    message: string,
    code: AppErrorCodes,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }

  toUserMessage(): {
    message: string;
    cause: string;
    resolution: string;
    docLink?: string;
  } {
    switch (this.code) {
      case AppErrorCodes.SEARCH_YT_NO_RESULTS:
        return {
          message: "Aucun résultat trouvé pour votre recherche YouTube.",
          cause: "La requête n'a retourné aucune chaîne correspondante.",
          resolution:
            "Essayez une recherche avec des mots-clés différents ou plus génériques.",
        };
      case AppErrorCodes.SEARCH_YT_NETWORK_DOWN:
        return {
          message:
            "Impossible de se connecter à YouTube. Vérifiez votre connexion internet.",
          cause:
            "Problème de connectivité réseau ou serveur YouTube indisponible.",
          resolution:
            "Vérifiez votre connexion internet et réessayez. Si le problème persiste, le service YouTube peut être temporairement en panne.",
        };
      case AppErrorCodes.SEARCH_YT_QUOTA_EXCEEDED:
        return {
          message: "Le quota de l'API YouTube a été dépassé.",
          cause:
            "L'application a effectué trop de requêtes à l'API YouTube en peu de temps.",
          resolution:
            "Veuillez attendre un moment et réessayez. Si vous êtes développeur, vérifiez votre quota API YouTube.",
        };
      case AppErrorCodes.SEARCH_YT_API_KEY_MISSING:
        return {
          message: "La clé API YouTube est manquante ou invalide.",
          cause:
            "L'application n'est pas configurée avec une clé API YouTube valide.",
          resolution:
            "Contactez l'administrateur ou vérifiez la configuration de l'application.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_UNSUPPORTED_RATIO:
        return {
          message:
            "Le ratio de votre vidéo n'est pas supporté par un des réseaux ciblés.",
          cause:
            "La résolution de la vidéo ne correspond pas aux exigences du réseau social (ex: 9:16 pour TikTok, 16:9 pour YouTube).",
          resolution:
            "L'application tentera un re-encodage automatique. Si cela échoue, veuillez ajuster le ratio manuellement.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_UNSUPPORTED_DURATION:
        return {
          message:
            "La durée de votre vidéo dépasse la limite pour certains réseaux.",
          cause:
            "La vidéo est trop longue ou trop courte pour être publiée sur une ou plusieurs plateformes sélectionnées.",
          resolution:
            "L'application tentera un re-encodage si possible. Sinon, veuillez réduire ou augmenter la durée de votre vidéo.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_FILE_TOO_LARGE:
        return {
          message:
            "La taille de votre vidéo dépasse la limite pour certains réseaux.",
          cause:
            "Le fichier vidéo est trop volumineux pour être uploadé sur une ou plusieurs plateformes sélectionnées.",
          resolution:
            "L'application tentera une compression automatique. Si cela échoue, veuillez réduire la taille du fichier vidéo.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_FFMPEG_ERROR:
        return {
          message: "Une erreur est survenue lors du traitement vidéo (FFmpeg).",
          cause:
            "Problème lors du re-encodage ou de la vérification de la vidéo.",
          resolution:
            "Vérifiez que FFmpeg est correctement installé et accessible. Réessayez avec un autre fichier vidéo.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_UPLOAD_FAILED:
        return {
          message: "Échec de l'upload de la vidéo.",
          cause:
            "Un problème est survenu pendant le téléchargement de la vidéo vers la plateforme sociale.",
          resolution:
            "Vérifiez votre connexion internet et réessayez. Si le problème persiste, vérifiez l'état du service cible.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_NETWORK_ERROR:
        return {
          message: "Erreur réseau lors de la publication de la vidéo.",
          cause:
            "Problème de connectivité entre l'application et le service de publication ou l'API sociale.",
          resolution:
            "Vérifiez votre connexion internet et réessayez. Si le problème persiste, le service peut être temporairement indisponible.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_MISSING_CREDENTIALS:
        return {
          message:
            "Identifiants de publication manquants ou invalides pour un réseau.",
          cause:
            "Les informations d'authentification pour une plateforme sélectionnée ne sont pas configurées ou sont obsolètes.",
          resolution:
            "Veuillez re-connecter votre compte pour le réseau social concerné dans les paramètres.",
        };
      case AppErrorCodes.PUBLISH_VIDEO_AYRSHARE_ERROR:
        return {
          message: "Une erreur est survenue avec le service Ayrshare.",
          cause:
            "Ayrshare a retourné une erreur lors de la tentative de publication.",
          resolution:
            "Consultez les détails de l'erreur pour plus d'informations. Il peut s'agir d'un problème avec vos identifiants Ayrshare ou les limites de leur API.",
        };
      case AppErrorCodes.AUTH_TOKEN_EXPIRED:
        return {
          message: "Votre session a expiré. Veuillez vous reconnecter.",
          cause: "Le jeton d'authentification a expiré et n'est plus valide.",
          resolution:
            "Redémarrez l'application ou reconnectez-vous pour obtenir un nouveau jeton.",
        };
      case AppErrorCodes.AUTH_INVALID_TOKEN:
        return {
          message: "Jeton d'authentification invalide.",
          cause: "Le jeton fourni n'est pas reconnu ou est corrompu.",
          resolution:
            "Redémarrez l'application ou reconnectez-vous. Si le problème persiste, contactez le support.",
        };
      case AppErrorCodes.AUTH_MISSING_TOKEN:
        return {
          message: "Jeton d'authentification manquant.",
          cause:
            "Aucun jeton d'authentification n'a été fourni pour l'opération.",
          resolution:
            "Assurez-vous d'être connecté avant d'effectuer cette action.",
        };
      case AppErrorCodes.GENERAL_INVALID_PARAMS:
        return {
          message: "Paramètres de la requête invalides.",
          cause:
            "Les données envoyées à l'application ne sont pas conformes au format attendu.",
          resolution:
            "Vérifiez les données fournies et réessayez. Si le problème persiste, contactez le support technique.",
        };
      case AppErrorCodes.GENERAL_NOT_FOUND:
        return {
          message: "Ressource non trouvée.",
          cause: "L'élément ou le chemin que vous avez demandé n'existe pas.",
          resolution:
            "Vérifiez l'URL ou l'identifiant de la ressource. Si le problème persiste, contactez le support technique.",
        };
      case AppErrorCodes.GENERAL_UNKNOWN_ERROR:
      default:
        return {
          message: "Une erreur inattendue est survenue.",
          cause:
            "Une condition imprévue a déclenché une erreur non gérée par l'application.",
          resolution:
            "Veuillez réessayer l'opération. Si le problème persiste, redémarrez l'application et contactez le support avec les logs.",
          docLink: "/docs/troubleshooting#general-unknown-error",
        };
    }
  }
}
