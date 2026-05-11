require('dotenv').config()
const knex = require('./src/db/knex')

async function seed() {
  console.log('🌱 Seeding demo data...')

  // Bersihkan data lama
  await knex('time_entries').del()
  await knex('magic_link_tokens').del()
  await knex('tasks').del()
  await knex('projects').del()
  await knex('clients').del()
  console.log('  ✓ Cleared existing data')

  // ─── Clients ────────────────────────────────
  const [acme, startup, agency] = await knex('clients').insert([
    { name: 'Budi Santoso', email: 'budi@acmecorp.id', company: 'Acme Corp', status: 'active' },
    { name: 'Sari Dewi', email: 'sari@startupkita.io', company: 'Startup Kita', status: 'active' },
    { name: 'Reza Firmansyah', email: 'reza@digitalagency.co', company: 'Digital Agency', status: 'active' },
  ]).returning('*')
  console.log('  ✓ Created 3 clients')

  // ─── Projects ───────────────────────────────
  const [websiteRedesign, mobileApp, brandingKit, landingPage, ecommerce] = await knex('projects').insert([
    {
      client_id: acme.id,
      name: 'Website Redesign',
      description: 'Redesign landing page, dashboard, dan halaman pricing',
      status: 'active',
      deadline: '2026-06-30'
    },
    {
      client_id: acme.id,
      name: 'Mobile App MVP',
      description: 'Aplikasi mobile untuk manajemen inventori',
      status: 'active',
      deadline: '2026-08-15'
    },
    {
      client_id: startup.id,
      name: 'Branding Kit',
      description: 'Logo, color palette, typography, dan brand guidelines',
      status: 'completed',
      deadline: '2026-04-30'
    },
    {
      client_id: startup.id,
      name: 'Landing Page',
      description: 'Landing page untuk product launch bulan Juni',
      status: 'active',
      deadline: '2026-06-01'
    },
    {
      client_id: agency.id,
      name: 'E-Commerce Platform',
      description: 'Platform belanja online dengan payment gateway lokal',
      status: 'active',
      deadline: '2026-09-30'
    },
  ]).returning('*')
  console.log('  ✓ Created 5 projects')

  // ─── Tasks — Website Redesign ─────────────
  const websiteTasks = await knex('tasks').insert([
    { project_id: websiteRedesign.id, title: 'Riset & wireframe', status: 'done', priority: 'high', price: 500000, due_date: '2026-05-15' },
    { project_id: websiteRedesign.id, title: 'UI Design (Figma)', status: 'done', priority: 'high', price: 1500000, due_date: '2026-05-30' },
    { project_id: websiteRedesign.id, title: 'Frontend development', status: 'in_progress', priority: 'high', price: 3000000, due_date: '2026-06-20' },
    { project_id: websiteRedesign.id, title: 'Integrasi CMS', status: 'todo', priority: 'medium', price: 1000000, due_date: '2026-06-25' },
    { project_id: websiteRedesign.id, title: 'Testing & QA', status: 'todo', priority: 'medium', price: 500000, due_date: '2026-06-28' },
  ]).returning('*')

  // ─── Tasks — Mobile App MVP ───────────────
  await knex('tasks').insert([
    { project_id: mobileApp.id, title: 'Product discovery & spec', status: 'done', priority: 'high', price: 1000000 },
    { project_id: mobileApp.id, title: 'UI/UX design', status: 'in_progress', priority: 'high', price: 2000000 },
    { project_id: mobileApp.id, title: 'Backend API', status: 'todo', priority: 'high', price: 3500000 },
    { project_id: mobileApp.id, title: 'React Native development', status: 'todo', priority: 'high', price: 4000000 },
    { project_id: mobileApp.id, title: 'Testing & deployment', status: 'todo', priority: 'medium', price: 1000000 },
  ])

  // ─── Tasks — Branding Kit (completed project) ─
  await knex('tasks').insert([
    { project_id: brandingKit.id, title: 'Riset kompetitor & moodboard', status: 'done', priority: 'medium', price: 300000 },
    { project_id: brandingKit.id, title: 'Desain logo (3 konsep)', status: 'done', priority: 'high', price: 1500000 },
    { project_id: brandingKit.id, title: 'Color palette & typography', status: 'done', priority: 'medium', price: 500000 },
    { project_id: brandingKit.id, title: 'Brand guidelines document', status: 'done', priority: 'medium', price: 700000 },
  ])

  // ─── Tasks — Landing Page ─────────────────
  await knex('tasks').insert([
    { project_id: landingPage.id, title: 'Copywriting & struktur halaman', status: 'done', priority: 'high', price: 500000 },
    { project_id: landingPage.id, title: 'Desain UI', status: 'done', priority: 'high', price: 1200000 },
    { project_id: landingPage.id, title: 'Development (Next.js)', status: 'in_progress', priority: 'high', price: 2000000 },
    { project_id: landingPage.id, title: 'Optimasi SEO & analytics', status: 'todo', priority: 'medium', price: 500000 },
  ])

  // ─── Tasks — E-Commerce Platform ──────────
  await knex('tasks').insert([
    { project_id: ecommerce.id, title: 'Analisa kebutuhan & ERD', status: 'done', priority: 'high', price: 1500000 },
    { project_id: ecommerce.id, title: 'Desain sistem & arsitektur', status: 'done', priority: 'high', price: 2000000 },
    { project_id: ecommerce.id, title: 'Backend API (Node.js)', status: 'in_progress', priority: 'high', price: 6000000 },
    { project_id: ecommerce.id, title: 'Frontend (React)', status: 'todo', priority: 'high', price: 5000000 },
    { project_id: ecommerce.id, title: 'Integrasi Midtrans payment', status: 'todo', priority: 'high', price: 2000000 },
    { project_id: ecommerce.id, title: 'Testing & staging deployment', status: 'todo', priority: 'medium', price: 1500000 },
  ])

  console.log('  ✓ Created tasks for all projects')

  // ─── Time entries (timesheet demo) ────────
  const now = new Date()
  const daysAgo = (n) => new Date(now - n * 86400000)

  await knex('time_entries').insert([
    // Website Redesign entries
    { project_id: websiteRedesign.id, task_id: websiteTasks[0].id, description: 'Wireframe homepage & dashboard', started_at: daysAgo(10), stopped_at: daysAgo(10), duration_min: 180, billable: true },
    { project_id: websiteRedesign.id, task_id: websiteTasks[1].id, description: 'UI Design — hero section & navbar', started_at: daysAgo(7), stopped_at: daysAgo(7), duration_min: 240, billable: true },
    { project_id: websiteRedesign.id, task_id: websiteTasks[1].id, description: 'UI Design — pricing page & footer', started_at: daysAgo(6), stopped_at: daysAgo(6), duration_min: 210, billable: true },
    { project_id: websiteRedesign.id, task_id: websiteTasks[2].id, description: 'Setup Next.js project & component library', started_at: daysAgo(3), stopped_at: daysAgo(3), duration_min: 120, billable: true },
    // Mobile App entries
    { project_id: mobileApp.id, description: 'Kickoff meeting & requirements gathering', started_at: daysAgo(5), stopped_at: daysAgo(5), duration_min: 90, billable: false },
    { project_id: mobileApp.id, description: 'UI design — onboarding screens', started_at: daysAgo(2), stopped_at: daysAgo(2), duration_min: 300, billable: true },
  ])
  console.log('  ✓ Created time entries')

  // ─── Summary ────────────────────────────────
  const clientCount = await knex('clients').count('id as n').first()
  const projectCount = await knex('projects').count('id as n').first()
  const taskCount = await knex('tasks').count('id as n').first()
  const entryCount = await knex('time_entries').count('id as n').first()

  console.log('')
  console.log('✅ Seed selesai!')
  console.log(`   ${clientCount.n} clients · ${projectCount.n} projects · ${taskCount.n} tasks · ${entryCount.n} time entries`)
  console.log('')
  console.log('🎬 Demo accounts:')
  console.log('   Client portal — budi@acmecorp.id')
  console.log('   Client portal — sari@startupkita.io')
  console.log('   Client portal — reza@digitalagency.co')
  console.log('')
  console.log('🔗 URLs:')
  console.log('   Developer dashboard → http://localhost:3000/app')
  console.log('   Client portal       → http://localhost:3000/portal')

  await knex.destroy()
}

seed().catch(err => { console.error('❌ Seed error:', err.message); process.exit(1) })
