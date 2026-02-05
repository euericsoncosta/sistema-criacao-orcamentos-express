// require("dotenv").config();

// module.exports = {
//   dialect: "mysql",
//   host: process.env.DATABASE_HOST,
//   port: process.env.DATABASE_PORT,
//   username: process.env.DATABASE_USERNAME,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE,
//   define: {
//     timestamps: true,
//     underscored: true,
//     underscoredAll: true,
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   dialectOptions: {
//     timezone: "+00:00", // Usando o formato UTC
//   },
//   timezone: "+00:00", // Usando o formato UTC
// };
require("dotenv").config();

module.exports = {
  dialect: "mysql",
  host: "mysql-7a736f1-costaericson-119f.l.aivencloud.com",
  port: 19946,
  username: avnadmin,
  password: AVNS__DHmbBlah2p3KIPBHwr,
  database: orcamento,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    createdAt: "created_at",
    updated_at: "updated_at",
  },
  dialectOptions: {
    ssl: {
    require: true,
    rejectUnauthorized: false // ESSENCIAL para a Vercel conectar ao Aiven
  },
    timezone: "+00:00",
  },
  timezone: "+00:00",
};