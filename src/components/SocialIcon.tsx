import React from "react";

type Props = {
    name: string;
    size?: number;
};

export const SocialIcon: React.FC<Props> = ({ name, size = 24 }) => {
    // Si le logo n'existe pas, fallback sur "default.svg"
    let path: string;
    try {
        path = new URL(`../logos/${name}.svg`, import.meta.url).href;
    } catch {
        path = new URL(`../logos/default.svg`, import.meta.url).href;
    }

    console.log("Logo chargé :", path);

    return (
        <img
            src={path}
            alt={name}
            width={size}
            height={size}
            onError={(e) => {
                console.warn(`Logo manquant pour ${name}, fallback appliqué`);
                (e.currentTarget as HTMLImageElement).src = new URL(
                    `../logos/default.svg`,
                    import.meta.url
                ).href;
            }}
            className="object-contain"
        />
    );
};
