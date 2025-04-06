const express = require('express');
const { connectToDatabase } = require('./db');
const session = require('express-session');
const app = express();
const { ObjectId } = require('mongodb');

app.use(express.json()); // Middleware to parse JSON in POST requests
app.use(session({
  secret: 'your-secret-key',  // Change this to a more secure secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Set to 'true' in production (when using https)
}));

// Test route for checking DB connection
app.get('/test-db', async (req, res) => {
  try {
    const db = await connectToDatabase();  // Connect to MongoDB
    const collection = db.collection('userlist');
    const result = await collection.findOne({});

    if (result) {
      res.json(result);  // Return the first document found in the collection
    } else {
      res.status(404).send("No documents found in the collection.");
    }
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.status(500).send("Database connection error.");
  }
});

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await connectToDatabase();
    const users = db.collection('userlist');

    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return res.status(400).send("❌ Username already exists");
    }

    await users.insertOne({ username, password, watchlist: [] });  // Initialize empty watchlist
    res.send("✅ User created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Signin route
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await connectToDatabase();
    const users = db.collection('userlist');

    const user = await users.findOne({ username, password });

    if (user) {
      req.session.user = { _id: user._id, username: user.username };  // Save the user to the session
      console.log('Session after login:', req.session);
      res.send("✅ Logged in!");
    } else {
      res.status(401).send("❌ Invalid username or password");
    } 
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("❌ Error logging out");
    }
    res.send("✅ Logged out successfully!");
  });
});

// Add to Watchlist
app.post('/add-to-watchlist', async (req, res) => {
  const { title, rating, status } = req.body;  // The movie/show title, rating, and status

  // Check if the user is logged in
  if (!req.session.user) {
    return res.status(401).send("❌ Please log in to add to your watchlist");
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection('userlist');
    const user = req.session.user;

    // Log user ID and title
    console.log("User ID:", user._id);  // Log the user ID
    console.log("Title being added:", title);  // Log the title

    // Ensure _id is an ObjectId
    const { ObjectId } = require('mongodb');  // Make sure ObjectId is imported
    const objectId = new ObjectId(user._id);  // Convert user._id to ObjectId

    // Check if the user exists in the database
    const existingUser = await users.findOne({ _id: objectId });
    if (!existingUser) {
      return res.status(404).send("❌ User not found");
    }

    // Check if the item already exists in the watchlist
    if (existingUser.watchlist.some(item => item.title === title)) {
      return res.status(400).send("❌ This item is already in your watchlist");
    }

    // Set default values for rating and status if not provided
    const movieRating = rating !== undefined ? rating : "Unrated";  // Default to "Unrated"
    const movieStatus = status !== undefined ? status : "Unspecified";  // Default to "Unspecified"

    // Add the item to the watchlist with rating and status
    const result = await users.updateOne(
      { _id: objectId },
      { $push: { watchlist: { title, rating: movieRating, status: movieStatus } } }
    );

    console.log("Update result:", result);  // Log the result of the update operation
    console.log(`${user.username} added "${title}" to their watchlist with rating "${movieRating}" and status "${movieStatus}"`);

    res.send("✅ Item added to your watchlist!");
  } catch (err) {
    console.error("Error adding to watchlist:", err);
    res.status(500).send("Server error");
  }
});


// Remove from Watchlist
app.post('/remove-from-watchlist', async (req, res) => {
  const { title } = req.body;  // The movie/show title or ID

  if (!req.session.user) {
    return res.status(401).send("❌ Please log in to remove from your watchlist");
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection('userlist');
    const user = req.session.user;

    // Log user session and ID before removing
    console.log(`Session User ID: ${user._id}`);
    
    // Ensure _id is an ObjectId
    const { ObjectId } = require('mongodb');
    const objectId = new ObjectId(user._id);  // Convert user._id to ObjectId

    // Check if the user exists in the database
    const existingUser = await users.findOne({ _id: objectId });
    
    // Log the result of the find query
    console.log('User found:', existingUser);
    
    if (!existingUser) {
      return res.status(404).send("❌ User not found");
    }

    // Log the current watchlist before removal
    console.log('Current Watchlist:', existingUser.watchlist);

    // Check if the movie exists in the watchlist by title
    const movieIndex = existingUser.watchlist.findIndex(movie => movie.title === title);
    if (movieIndex === -1) {
      return res.status(400).send("❌ This item is not in your watchlist");
    }

    // Perform the removal using $pull to remove the movie object by title
    const result = await users.updateOne(
      { _id: objectId },
      { $pull: { watchlist: { title } } }  // Remove the movie object by title
    );

    // Log the result of the update operation
    console.log(`Update result: ${JSON.stringify(result)}`);

    // Check if any document was modified
    if (result.modifiedCount > 0) {
      console.log(`${user.username} removed "${title}" from their watchlist.`);
      res.send("✅ Item removed from your watchlist!");
    } else {
      console.log(`No document modified for user ${user.username}`);
      res.status(400).send("❌ No changes made to the watchlist.");
    }
  } catch (err) {
    console.error('Error removing from watchlist:', err);
    res.status(500).send("Server error");
  }
});




// View Watchlist
app.get('/watchlist', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send("❌ Please log in to view your watchlist");
  }

  try {
    const db = await connectToDatabase();
    const users = db.collection('userlist');
    const user = req.session.user;

    // Retrieve the user's watchlist
    const existingUser = await users.findOne({ _id: new ObjectId(user._id) });
    if (!existingUser) {
      return res.status(404).send("❌ User not found");
    }

    res.json(existingUser.watchlist);  // Return the user's watchlist
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
