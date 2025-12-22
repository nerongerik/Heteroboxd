export function formatCount(n) {
    if (n < 1000) return n.toString();
    if (n < 1_000_000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
    return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M';
};

export function round1(n) {
    return (Math.round(round2(n) * 10) / 10).toFixed(1);
}

export function round2(n) {
    return Math.round(n * 100) / 100;
}

export function parseDate(date) {
    if (!date) return date;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const nums = date.split(" ")[0].split("/");
    const day = nums[0]; const year = nums[2];
    const month = months[parseInt(nums[1] - 1)];
    return `${month} ${day}, ${year}`;
}