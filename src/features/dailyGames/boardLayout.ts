/** Fit every card without shrinking child touch targets below 56px. */
export function memoryCardSize(width: number, height: number) {
  let best = { columns: 2, size: 56 };
  for (let columns = 2; columns <= 5; columns++) {
    const rows = Math.ceil(10 / columns);
    const size = Math.floor(
      Math.min(180, (width - (columns - 1) * 8) / columns, (height - (rows - 1) * 8) / rows)
    );
    if (size > best.size) best = { columns, size };
  }
  return best;
}
