export function getRandomItem<T> (data: Array<T>): T {
  return data[Math.floor(Math.random() * data.length)];
}
