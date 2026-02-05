module.exports = {
  dialect: "mysql",
  host: "mysql-7a736f1-costaericson-119f.l.aivencloud.com",
  port: 19946,
  username: "avnadmin",
  password: "AVNS__DHmbBlah2p3KIPBHwr",
  database: "orcamento",
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    },
    timezone: "+00:00",
  },
  timezone: "+00:00",
};