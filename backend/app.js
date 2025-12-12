const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');

const { attachUser } = require('./middleware/auth');
const mainRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

// Ensure all route files export the router instance
if (typeof mainRoutes !== 'function' || typeof adminRoutes !== 'function') {
  console.error('CRITICAL ERROR: Route files must export an Express router instance.');
  // Exit process to prevent further errors
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'minerva-hub-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' // Use secure cookies in production
  }
}));

// Flash messages
app.use(flash());

// Attach user to response locals
app.use(attachUser);

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.info = req.flash('info');
  next();
});

// Routes
app.use('/', mainRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: 'Page Not Found',
    error: [],
    success: []
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('pages/error', { 
    title: 'Error',
    error: ['An unexpected error occurred. Please try again later.'],
    success: []
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Minerva Metrics Hub is running!`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`👤 Admin: http://localhost:${PORT}/admin/login`);
  console.log(`\n💡 Default admin credentials:`);
  console.log(`   Email: admin@minerva.com`);
  console.log(`   Password: admin123`);
  console.log(`\n⚠️  Remember to run 'npm run init-db' and 'npm run seed' first!\n`);
});

module.exports = app;
