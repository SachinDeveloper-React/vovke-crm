
export const consoleDebugger = (
  data: unknown,
  status?: string
): void => {
  if (process.env.NODE_ENV === 'development' && status !== 'done') {
    console.log(data);
  }
};