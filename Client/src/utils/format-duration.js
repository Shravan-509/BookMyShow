export const formatDuration = (minutes) => {
    if(!minutes || isNaN(minutes)) return "N/A";

    const hours = Math.floor(minutes /60);
    const mins = minutes % 60;

    if(hours === 0)
    {
        return `${mins}m`
    }
    else if(mins === 0)
    {
        return `${hours}h`;
    }
    else{
        return `${hours}h ${mins}m`
    }
}