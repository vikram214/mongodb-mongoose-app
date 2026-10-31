import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
const app = express();
app.use(express.json());
const mongoUrl = "mongodb://admin:admin123@localhost:27017/?authSource=admin";
const dbName = "booksDB";
const client = new MongoClient(mongoUrl);
let db;
// Connect to MongoDB
client.connect()
.then(() => {
    console.log("Connected to MongoDB");
    db = client.db(dbName);
})
.catch((err) => {
    console.log("Problem in connecting MongoDB:", err);
});
// CREATE BOOK - POST
app.post("/api/v1/books", (req, res) => {
    const newBook = req.body;
    db.collection("books").insertOne(newBook)
    .then((result) => {
        res.status(201).json({
            message: "Book created successfully",
            data: { _id: result.insertedId, ...newBook }
        });
    })
    .catch((err) => {
        err.message = "Failed to create book";
        throw err;
    });
});
//READ GET
// READ BOOKS BY CATEGORY - GET
app.get("/api/v1/books", (req, res) => {
    const { category } = req.query;
    const query = category ? { category: category } : {};
    db.collection("books").find(query).toArray()
    .then((result) => {
        res.status(200).json({
            message: "Books retrieved successfully",
            data: result
        });
    })
    .catch((err) => {
        err.message = "Failed to retrieve books";
        throw err;
    });
});
// READ BOOK BY ID - GET
app.get("/api/v1/books/:id", (req, res) => {
    const { id } = req.params;
    db.collection("books").findOne({
        _id: new ObjectId(id)
    })
    .then((result) => {
        if (result) {
            res.status(200).json({
                message: "Book retrieved successfully",
                data: result,
            });
        } else {
            //res.status(404).json({message: "book not found"});
            const error = new Error("Book not found");
            error.status = 404;
            throw error;
        }
    })
    .catch((err) => {
        err.message = "Failed to retrieve book";
        throw err;
    });
});
// UPDATE BOOK BY ID - PUT
app.put("/api/v1/books/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const id = new ObjectId(req.params.id);
    const result = await db.collection("books").updateOne(
      { _id: id },
      { $set: req.body }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    const updatedBook = await db.collection("books").findOne({ _id: id });

    return res.status(200).json({
      message: "Book updated successfully",
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
});
// DELETE BOOK BY ID - DELETE
app.delete("/api/v1/books/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const id = new ObjectId(req.params.id);
    const result = await db.collection("books").deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});
// 404 Middleware
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});
// Error Handling Middleware
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({
        message: message
    });
});
// Start Server
const PORT = 7000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});