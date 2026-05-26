import * as dotenv from 'dotenv';
dotenv.config();


import mongoose from 'mongoose';
import { User } from '../models/User';
import { Record } from '../models/Record';
import { ActivityLog } from '../models/ActivityLog';
import { connectDatabase } from '../config/database';

const departments = ['Engineering', 'Design', 'Product', 'DevOps', 'QA', 'Marketing', 'Data Science'];
const categories = ['development', 'design', 'research', 'testing', 'deployment', 'maintenance', 'documentation'];
const statuses = ['active', 'pending', 'completed', 'cancelled'] as const;
const priorities = ['low', 'medium', 'high', 'critical'] as const;

const recordTitles = [
  'Migrate authentication to OAuth 2.0',
  'Refactor legacy payment module',
  'Implement real-time notifications',
  'Optimize database query performance',
  'Build responsive mobile navigation',
  'Integrate third-party analytics SDK',
  'Setup CI/CD pipeline for staging',
  'Conduct security audit for API endpoints',
  'Design new onboarding flow',
  'Implement rate limiting middleware',
  'Create unit test coverage for core modules',
  'Deploy microservice to AWS ECS',
  'Document REST API with Swagger',
  'Fix CORS configuration for production',
  'Implement search functionality with Elasticsearch',
  'Build admin reporting dashboard',
  'Migrate to TypeScript strict mode',
  'Performance profiling and optimization',
  'Setup Redis caching layer',
  'Implement file upload with S3 presigned URLs',
];

const seed = async () => {
  try {
    await connectDatabase();
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Record.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Seed Admin
    const admin = await User.create({
      userId: 'admin',
      email: 'admin@nexus.dev',
      password: 'Admin@123',
      firstName: 'Alex',
      lastName: 'Sterling',
      role: 'admin',
      department: 'Engineering',
      isActive: true,
    });
    console.log(`✅ Created admin: ${admin.userId}`);

    // Seed Users
    const usersData = [
      { userId: 'john.doe', email: 'john@nexus.dev', firstName: 'John', lastName: 'Doe', department: 'Engineering' },
      { userId: 'sarah.chen', email: 'sarah@nexus.dev', firstName: 'Sarah', lastName: 'Chen', department: 'Design' },
      { userId: 'marcus.r', email: 'marcus@nexus.dev', firstName: 'Marcus', lastName: 'Rivera', department: 'Product' },
      { userId: 'priya.k', email: 'priya@nexus.dev', firstName: 'Priya', lastName: 'Kumar', department: 'Data Science' },
      { userId: 'tom.w', email: 'tom@nexus.dev', firstName: 'Tom', lastName: 'Walsh', department: 'DevOps' },
      { userId: 'diana.p', email: 'diana@nexus.dev', firstName: 'Diana', lastName: 'Patel', department: 'QA' },
      { userId: 'ryan.k', email: 'ryan@nexus.dev', firstName: 'Ryan', lastName: 'Kato', department: 'Engineering' },
    ];

   const users = await Promise.all(
  usersData.map((u) =>
    User.create({ ...u, password: 'User@123', role: 'user', isActive: true })
  )
);

    console.log(`✅ Created ${users.length} users`);

    // Seed Records
    const allUsers = [admin, ...users];
    const records = [];

    for (let i = 0; i < 50; i++) {
      const assignedTo = allUsers[Math.floor(Math.random() * allUsers.length)];
      const createdBy = admin;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const dueDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);

      records.push({
        title: recordTitles[i % recordTitles.length] + (i >= recordTitles.length ? ` v${Math.floor(i / recordTitles.length) + 1}` : ''),
        description: `Detailed task requiring careful implementation and testing. This involves coordinating with multiple team members and ensuring all requirements are met per the project specifications.`,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        assignedTo: assignedTo._id,
        createdBy: createdBy._id,
        tags: ['sprint-' + (Math.floor(Math.random() * 5) + 1), departments[Math.floor(Math.random() * departments.length)].toLowerCase()],
        dueDate,
        completedAt: status === 'completed' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        metadata: {
          estimatedHours: Math.floor(Math.random() * 40) + 2,
          actualHours: status === 'completed' ? Math.floor(Math.random() * 50) + 2 : undefined,
          category: categories[Math.floor(Math.random() * categories.length)],
        },
      });
    }

    await Record.insertMany(records);
    console.log(`✅ Created ${records.length} records`);

    console.log('\n🚀 Seed complete! Login credentials:');
    console.log('   Admin  → userId: admin    | password: Admin@123 | role: admin');
    console.log('   User   → userId: john.doe | password: User@123  | role: user');
    console.log('\n');
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
 mongoose.connection.removeAllListeners();
    await mongoose.disconnect();
    process.exit(0);  }
};

seed();
