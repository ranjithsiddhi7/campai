export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(arr?: string[] | null): string {
  return (arr || []).join("\n");
}

export function formatCurrency(amount: number, currency: string = "SGD"): string {
  const formattedNumber = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(amount);

  const code = (currency || "SGD").trim().toUpperCase();

  switch (code) {
    case "SGD":
      return `S$${formattedNumber}`;
    case "USD":
      return `US$${formattedNumber}`;
    case "EUR":
      return `€${formattedNumber}`;
    case "GBP":
      return `£${formattedNumber}`;
    case "AUD":
      return `A$${formattedNumber}`;
    case "CAD":
      return `C$${formattedNumber}`;
    default:
      return `${code} ${formattedNumber}`;
  }
}
