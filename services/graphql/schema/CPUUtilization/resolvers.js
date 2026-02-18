const os = require("os");
const resolvers = {
  Query: {
    serverStats: async (self, params, context) => {
      const cpus = os.cpus();
      let cpuUsage = [];

      cpus.forEach((cpu, index) => {
        const { times } = cpu;
        const total = Object.values(times).reduce(
          (total, value) => total + value,
          0
        );
        const idle = times.idle;
        const usage = 100 - 100 * (idle / total);
        // cpuUsage.push(`CPU ${index + 1}: ${usage.toFixed(2)}%`);
        cpuUsage.push({
          cpu: index + 1,
          usage: usage.toFixed(2),
        });
      });

      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      return {
        cpuUsage,
        totalMemory: `${(totalMemory / (1024 * 1024)).toFixed(2)} MB`,
        usedMemory: `${(usedMemory / (1024 * 1024)).toFixed(2)} MB`,
        freeMemory: `${(freeMemory / (1024 * 1024)).toFixed(2)} MB`,
      };
    },
  },
};
exports.resolvers = resolvers;
