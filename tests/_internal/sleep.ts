export async function sleep(timeInMs): Promise<void> {
  await new Promise<void>(resolve => {
    setTimeout(resolve, timeInMs);
  });
}
