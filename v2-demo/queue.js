import Queue from 'bull';

console.log("Redis URL -> ",process.env.REDIS_URL)
const backgroundQueue = new Queue(
  "background-queue",
  process.env.REDIS_URL
);

export { backgroundQueue };