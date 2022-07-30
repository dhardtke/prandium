export async function sleep(timeInMs: number): Promise<void> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, timeInMs);
  });
}
