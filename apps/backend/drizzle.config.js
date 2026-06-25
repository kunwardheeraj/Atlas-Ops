export default {
    schema: './src/db/schema.ts',
    out: './drizzle',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL ?? 'postgresql://atlas_admin:super_secret_password_123@localhost:5432/atlas_db',
    },
};
