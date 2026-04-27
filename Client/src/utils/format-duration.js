export const formatDuration = (minutes) => {
     if (!Number.isFinite(minutes) || minutes <= 0) return "N/A";

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return [
        hours ? `${hours}h` : null,
        mins ? `${mins}m` : null,
    ]
    .filter(Boolean)
    .join(" ");
}