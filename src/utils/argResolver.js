export const resolveArgs = (input) => {
  const [command, ...args] = input.trim().split(' ');
  return { command, args };
};
