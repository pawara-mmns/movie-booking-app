export const formatDuration = totalMinutes => {
    const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;
    if (!hours) return `${minutes}m`;
    if (!minutes) return `${hours}h`;
    return `${hours}h ${minutes}m`;
};
